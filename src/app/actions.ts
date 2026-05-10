"use server";

import YahooFinance from "yahoo-finance2";
import type { HistoricalPoint } from "./PriceChart";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type Period = "1D" | "1W" | "1M" | "3M";

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
  error?: boolean;
};

function periodToRange(period: Period) {
  const now = new Date();
  switch (period) {
    case "1D": return { period1: new Date(now.getTime() - 86400000), interval: "1h" as const };
    case "1W": return { period1: new Date(now.getTime() - 7 * 86400000), interval: "1d" as const };
    case "1M": return { period1: new Date(now.getTime() - 30 * 86400000), interval: "1d" as const };
    case "3M": return { period1: new Date(now.getTime() - 90 * 86400000), interval: "1d" as const };
  }
}

export async function getHistoricalData(
  symbol: string,
  period: Period
): Promise<HistoricalPoint[]> {
  const { period1, interval } = periodToRange(period);
  try {
    const result = await yf.chart(symbol, { period1, interval });
    return (result?.quotes ?? [])
      .filter((q) => q.close != null)
      .map((q) => ({ date: new Date(q.date).toISOString(), close: q.close! }));
  } catch {
    return [];
  }
}

export async function getStockFullData(symbol: string): Promise<StockFullData> {
  try {
    const [quote, summary, historical] = await Promise.all([
      yf.quote(symbol),
      yf.quoteSummary(symbol, {
        modules: ["summaryDetail", "defaultKeyStatistics", "financialData", "assetProfile"],
      }),
      // validate symbol exists — throws if not found
      yf.chart(symbol, { period1: new Date(Date.now() - 86400000), interval: "1d" }),
    ]);

    const detail = summary.summaryDetail;
    const stats = summary.defaultKeyStatistics;
    const financial = summary.financialData;
    const profile = summary.assetProfile;

    return {
      symbol: quote.symbol ?? symbol.toUpperCase(),
      price: quote.regularMarketPrice ?? 0,
      changePercent: quote.regularMarketChangePercent ?? 0,
      peRatio: detail?.trailingPE ?? null,
      eps: stats?.trailingEps ?? null,
      marketCap: detail?.marketCap ?? null,
      sector: (profile as any)?.sector ?? null,
      fiftyTwoWeekHigh: detail?.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: detail?.fiftyTwoWeekLow ?? null,
      dividendYield: detail?.dividendYield ?? null,
      analystRating: financial?.recommendationKey ?? null,
    };
  } catch {
    return {
      symbol: symbol.toUpperCase(),
      price: 0,
      changePercent: 0,
      peRatio: null,
      eps: null,
      marketCap: null,
      sector: null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
      dividendYield: null,
      analystRating: null,
      error: true,
    };
  }
}
