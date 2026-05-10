import YahooFinance from "yahoo-finance2";
import { fetchNews, calcNewsSentimentScore, type NewsArticle } from "./news";
import { generateSummary } from "./summary";

export const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export type Period = "1D" | "1W" | "1M" | "3M";

export type HistoricalPoint = {
  date: string;
  close: number;
  volume?: number;
};

export type StockScore = {
  total: number;
  rsi: number;
  rsiScore: number;
  momentum: number;
  momentumScore: number;
  trend: "above" | "below" | "no_data";
  trendScore: number;
  analystScore: number;
  newsScore: number;
  newsPoints: number;
};

export type StockFullData = {
  symbol: string;
  price: number;
  changePercent: number;
  peRatio: number | null;
  eps: number | null;
  marketCap: number | null;
  sector: string | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  dividendYield: number | null;
  analystRating: string | null;
  score: StockScore | null;
  news: NewsArticle[];
  summary: string;
  error?: boolean;
};

function periodToRange(period: Period) {
  const now = new Date();
  switch (period) {
    case "1D": return { period1: new Date(now.getTime() - 86400000),      interval: "1h" as const };
    case "1W": return { period1: new Date(now.getTime() - 7 * 86400000),  interval: "1d" as const };
    case "1M": return { period1: new Date(now.getTime() - 30 * 86400000), interval: "1d" as const };
    case "3M": return { period1: new Date(now.getTime() - 90 * 86400000), interval: "1d" as const };
  }
}

function calcRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  const recent = closes.slice(-(period + 1));
  let gains = 0, losses = 0;
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i] - recent[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return Math.round(100 - 100 / (1 + avgGain / avgLoss));
}

function calcMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  return closes.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calcScore(
  closes: number[],
  currentPrice: number,
  analystRating: string | null,
  newsScore: number
): StockScore {
  const rsi  = calcRSI(closes);
  const ma50 = calcMA(closes, 50);
  const price30dAgo = closes.length >= 30 ? closes[closes.length - 30] : null;

  let rsiScore = 0;
  if (rsi != null) {
    if (rsi >= 40 && rsi <= 60)      rsiScore = 25;
    else if (rsi >= 30 && rsi < 40)  rsiScore = 18;
    else if (rsi > 60 && rsi <= 70)  rsiScore = 18;
    else if (rsi >= 20 && rsi < 30)  rsiScore = 8;
    else if (rsi > 70 && rsi <= 80)  rsiScore = 8;
    else                              rsiScore = 2;
  }

  let momentum = 0, momentumScore = 0;
  if (price30dAgo != null && price30dAgo > 0) {
    momentum = ((currentPrice - price30dAgo) / price30dAgo) * 100;
    if (momentum > 15)      momentumScore = 30;
    else if (momentum > 8)  momentumScore = 24;
    else if (momentum > 3)  momentumScore = 17;
    else if (momentum > 0)  momentumScore = 11;
    else if (momentum > -5) momentumScore = 5;
    else                    momentumScore = 1;
  }

  let trend: StockScore["trend"] = "no_data";
  let trendScore = 0;
  if (ma50 != null) {
    trend = currentPrice > ma50 ? "above" : "below";
    trendScore = trend === "above" ? 20 : 4;
  }

  const analystMap: Record<string, number> = {
    strongBuy: 10, buy: 8, hold: 5, sell: 2, strongSell: 0,
  };
  const analystScore = analystRating ? (analystMap[analystRating] ?? 5) : 5;
  const newsPoints   = Math.round((newsScore / 100) * 15);
  const total        = Math.min(100, rsiScore + momentumScore + trendScore + analystScore + newsPoints);

  return {
    total, rsi: rsi ?? 0, rsiScore,
    momentum: Math.round(momentum * 100) / 100, momentumScore,
    trend, trendScore, analystScore, newsScore, newsPoints,
  };
}

export async function fetchHistorical(symbol: string, period: Period): Promise<HistoricalPoint[]> {
  const { period1, interval } = periodToRange(period);
  try {
    const result = await yf.chart(symbol, { period1, interval });
    return (result?.quotes ?? [])
      .filter((q) => q.close != null)
      .map((q) => ({ date: new Date(q.date).toISOString(), close: q.close!, volume: q.volume ?? undefined }));
  } catch { return []; }
}

export async function fetchStockFullData(symbol: string): Promise<StockFullData> {
  try {
    const [quote, summary, chart90, news] = await Promise.all([
      yf.quote(symbol),
      yf.quoteSummary(symbol, {
        modules: ["summaryDetail", "defaultKeyStatistics", "financialData", "assetProfile"],
      }),
      fetchHistorical(symbol, "3M"),
      fetchNews(symbol),
    ]);

    const detail    = summary.summaryDetail;
    const stats     = summary.defaultKeyStatistics;
    const financial = summary.financialData;
    const profile   = summary.assetProfile;

    const analystRating = financial?.recommendationKey ?? null;
    const closes        = chart90.map((p) => p.close);
    const price         = quote.regularMarketPrice ?? 0;
    const newsSentiment = calcNewsSentimentScore(news);
    const score         = closes.length > 0 ? calcScore(closes, price, analystRating, newsSentiment) : null;
    const peRatio       = detail?.trailingPE ?? null;
    const sector        = (profile as any)?.sector ?? null;

    const autoSummary = score
      ? generateSummary({
          symbol: quote.symbol ?? symbol,
          price,
          changePercent: quote.regularMarketChangePercent ?? 0,
          score, newsSentiment, analystRating, sector, peRatio,
        })
      : "";

    return {
      symbol:           quote.symbol ?? symbol.toUpperCase(),
      price,
      changePercent:    quote.regularMarketChangePercent ?? 0,
      peRatio,
      eps:              stats?.trailingEps ?? null,
      marketCap:        detail?.marketCap ?? null,
      sector,
      fiftyTwoWeekHigh: detail?.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow:  detail?.fiftyTwoWeekLow ?? null,
      dividendYield:    detail?.dividendYield ?? null,
      analystRating, score, news, summary: autoSummary,
    };
  } catch (err) {
    console.error(`[${symbol}] error:`, err);
    return {
      symbol: symbol.toUpperCase(), price: 0, changePercent: 0,
      peRatio: null, eps: null, marketCap: null, sector: null,
      fiftyTwoWeekHigh: null, fiftyTwoWeekLow: null,
      dividendYield: null, analystRating: null,
      score: null, news: [], summary: "", error: true,
    };
  }
}
