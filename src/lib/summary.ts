import type { StockScore } from "./yahooFinance";

type SummaryInput = {
  symbol: string;
  price: number;
  changePercent: number;
  score: StockScore;
  newsSentiment: number; // 0–100
  analystRating: string | null;
  sector: string | null;
  peRatio: number | null;
};

const RATING_ES: Record<string, string> = {
  strongBuy: "compra fuerte",
  buy: "compra",
  hold: "mantener",
  sell: "venta",
  strongSell: "venta fuerte",
};

export function generateSummary(input: SummaryInput): string {
  const { symbol, price, changePercent, score, newsSentiment, analystRating, sector, peRatio } = input;
  const parts: string[] = [];

  // — Momentum
  if (score.momentum > 8) {
    parts.push(`${symbol} muestra momentum fuerte (+${score.momentum.toFixed(1)}% en 30 días)`);
  } else if (score.momentum > 0) {
    parts.push(`${symbol} muestra momentum positivo moderado (+${score.momentum.toFixed(1)}% en 30 días)`);
  } else {
    parts.push(`${symbol} ha perdido terreno en los últimos 30 días (${score.momentum.toFixed(1)}%)`);
  }

  // — RSI
  if (score.rsi >= 70) {
    parts.push(`RSI en ${score.rsi} indica sobrecompra — posible corrección a corto plazo`);
  } else if (score.rsi <= 30) {
    parts.push(`RSI en ${score.rsi} indica sobreventa — posible rebote`);
  } else if (score.rsi >= 50) {
    parts.push(`RSI en zona alcista (${score.rsi})`);
  } else {
    parts.push(`RSI neutral (${score.rsi})`);
  }

  // — Tendencia MA50
  if (score.trend === "above") {
    parts.push(`el precio se mantiene por encima de la media móvil de 50 días, confirmando tendencia alcista`);
  } else if (score.trend === "below") {
    parts.push(`el precio cotiza por debajo de la media móvil de 50 días, señal de debilidad técnica`);
  }

  // — Sentimiento de noticias
  if (newsSentiment >= 65) {
    parts.push(`el sentimiento en noticias recientes es positivo`);
  } else if (newsSentiment <= 35) {
    parts.push(`las noticias recientes reflejan un tono negativo`);
  } else {
    parts.push(`el tono de las noticias recientes es neutro`);
  }

  // — Analistas
  if (analystRating) {
    parts.push(`consenso de analistas: ${RATING_ES[analystRating] ?? analystRating}`);
  }

  // — PE
  if (peRatio != null) {
    if (peRatio < 15) parts.push(`P/E de ${peRatio.toFixed(1)} sugiere valuación atractiva`);
    else if (peRatio > 40) parts.push(`P/E de ${peRatio.toFixed(1)} refleja valoración exigente`);
  }

  // — Conclusión según score total
  let conclusion = "";
  if (score.total >= 75) conclusion = `Score general de ${score.total}/100 — perspectiva favorable para el inversor de mediano plazo.`;
  else if (score.total >= 55) conclusion = `Score general de ${score.total}/100 — perfil balanceado, monitorear de cerca.`;
  else if (score.total >= 35) conclusion = `Score general de ${score.total}/100 — señales mixtas, mayor cautela recomendada.`;
  else conclusion = `Score general de ${score.total}/100 — señales predominantemente negativas.`;

  // Unir todo
  const body = parts
    .map((p, i) => (i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join("; ");

  return `${body}. ${conclusion}`;
}
