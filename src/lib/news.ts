export type NewsArticle = {
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
  source: string;
  sentimentScore: number;
};

const BULLISH_WORDS = [
  "surge", "soar", "rally", "beat", "record", "growth", "profit",
  "upgrade", "buy", "bullish", "gain", "rise", "strong", "positive",
  "exceed", "outperform", "boom", "revenue", "partnership", "deal",
  "sube", "gana", "récord", "crecimiento", "supera", "alcista",
];

const BEARISH_WORDS = [
  "drop", "fall", "miss", "loss", "downgrade", "sell", "bearish",
  "decline", "weak", "negative", "cut", "layoff", "lawsuit", "risk",
  "crash", "plunge", "concern", "warning", "investigation", "fine",
  "baja", "pierde", "cae", "bajista", "riesgo", "demanda",
];

function scoreSentiment(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  BULLISH_WORDS.forEach((w) => { if (lower.includes(w)) score += 1; });
  BEARISH_WORDS.forEach((w) => { if (lower.includes(w)) score -= 1; });
  return Math.max(-1, Math.min(1, score / 3));
}

export async function fetchNews(symbol: string): Promise<NewsArticle[]> {
  const key = process.env.NEWSAPI_KEY;

  console.log(`[NewsAPI] key presente: ${!!key}`);
  console.log(`[NewsAPI] buscando noticias para: ${symbol}`);

  if (!key) {
    console.warn("[NewsAPI] NEWSAPI_KEY no encontrada en variables de entorno");
    return [];
  }

  const query = encodeURIComponent(`${symbol} stock`);
  const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${key}`;

  try {
    const res = await fetch(url, { cache: "no-store" }); // sin cache para debug

    console.log(`[NewsAPI] status: ${res.status}`);

    if (!res.ok) {
      const text = await res.text();
      console.error(`[NewsAPI] error ${res.status}:`, text);
      return [];
    }

    const data = await res.json();
    console.log(`[NewsAPI] status respuesta: ${data?.status}, artículos: ${data?.articles?.length ?? "ninguno"}`);

    if (!Array.isArray(data?.articles)) {
      console.warn(`[NewsAPI] sin artículos:`, data?.message ?? data?.status);
      return [];
    }

    return data.articles.map((a: any) => ({
      title: a.title ?? "",
      description: a.description ?? null,
      url: a.url ?? "#",
      publishedAt: a.publishedAt ?? new Date().toISOString(),
      source: a.source?.name ?? "",
      sentimentScore: scoreSentiment(`${a.title ?? ""} ${a.description ?? ""}`),
    }));
  } catch (err) {
    console.error(`[NewsAPI] excepción para ${symbol}:`, err);
    return [];
  }
}

export function calcNewsSentimentScore(articles: NewsArticle[]): number {
  if (articles.length === 0) return 50;
  const avg = articles.reduce((sum, a) => sum + a.sentimentScore, 0) / articles.length;
  return Math.round((avg + 1) * 50);
}