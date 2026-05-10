import type { StockScore } from "@/lib/yahooFinance";

type Props = { score: StockScore };

function scoreColor(total: number) {
  if (total >= 70) return { text: "text-green-400", bg: "bg-green-400" };
  if (total >= 45) return { text: "text-yellow-400", bg: "bg-yellow-400" };
  return { text: "text-red-400", bg: "bg-red-400" };
}

function scoreLabel(total: number) {
  if (total >= 75) return "Oportunidad fuerte";
  if (total >= 60) return "Positivo";
  if (total >= 45) return "Neutral";
  if (total >= 30) return "Precaución";
  return "Señal negativa";
}

function trendLabel(trend: StockScore["trend"]) {
  if (trend === "above") return "↑ Sobre MA50";
  if (trend === "below") return "↓ Bajo MA50";
  return "Sin datos";
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500`}
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

export default function ScoreCard({ score }: Props) {
  const { text, bg } = scoreColor(score.total);
  return (
    <div className="mt-4 pt-4 border-t border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Score de inversión</p>
          <p className="text-xs text-zinc-600">{scoreLabel(score.total)}</p>
        </div>
        <div className={`text-4xl font-bold tabular-nums ${text}`}>
          {score.total}<span className="text-lg text-zinc-600">/100</span>
        </div>
      </div>

      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-5">
        <div className={`h-full rounded-full ${bg} transition-all duration-700`}
          style={{ width: `${score.total}%` }} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 w-24 shrink-0">RSI {score.rsi}</span>
          <Bar value={score.rsiScore} max={25} color="bg-blue-400" />
          <span className="text-xs text-zinc-400 w-8 text-right">{score.rsiScore}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 w-24 shrink-0">
            Mom. {score.momentum > 0 ? "+" : ""}{score.momentum.toFixed(1)}%
          </span>
          <Bar value={score.momentumScore} max={30} color="bg-purple-400" />
          <span className="text-xs text-zinc-400 w-8 text-right">{score.momentumScore}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 w-24 shrink-0">{trendLabel(score.trend)}</span>
          <Bar value={score.trendScore} max={20} color="bg-orange-400" />
          <span className="text-xs text-zinc-400 w-8 text-right">{score.trendScore}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 w-24 shrink-0">Analistas</span>
          <Bar value={score.analystScore} max={10} color="bg-cyan-400" />
          <span className="text-xs text-zinc-400 w-8 text-right">{score.analystScore}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 w-24 shrink-0">Noticias</span>
          <Bar value={score.newsPoints} max={15} color="bg-pink-400" />
          <span className="text-xs text-zinc-400 w-8 text-right">{score.newsPoints}</span>
        </div>
      </div>
    </div>
  );
}
