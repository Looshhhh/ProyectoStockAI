type Props = {
  peRatio: number | null;
  eps: number | null;
  marketCap: number | null;
  sector: string | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  dividendYield: number | null;
  analystRating: string | null;
};

function fmt(v: number | null, prefix = "", suffix = "", decimals = 2) {
  if (v == null) return "—";
  return `${prefix}${v.toFixed(decimals)}${suffix}`;
}

function formatCap(v: number | null) {
  if (v == null) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(2)}B`;
  return `$${(v / 1e6).toFixed(2)}M`;
}

const RATING_LABEL: Record<string, string> = {
  strongBuy: "Compra fuerte", buy: "Compra",
  hold: "Mantener", sell: "Venta", strongSell: "Venta fuerte",
};

function ratingColor(r: string | null) {
  if (!r) return "text-zinc-400";
  if (r === "strongBuy" || r === "buy") return "text-green-400";
  if (r === "sell" || r === "strongSell") return "text-red-400";
  return "text-yellow-400";
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-yellow-400" : "text-zinc-100"}`}>{value}</span>
    </div>
  );
}

export default function Fundamentals(props: Props) {
  const { peRatio, eps, marketCap, sector, fiftyTwoWeekHigh, fiftyTwoWeekLow, dividendYield, analystRating } = props;
  return (
    <div className="mt-4 pt-4 border-t border-zinc-800">
      {sector && (
        <span className="inline-block mb-4 text-xs px-2 py-1 rounded-md bg-zinc-800 text-zinc-400">{sector}</span>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        <Metric label="P/E Ratio" value={fmt(peRatio)} highlight={peRatio != null && peRatio < 20} />
        <Metric label="EPS" value={fmt(eps, "$")} />
        <Metric label="Market Cap" value={formatCap(marketCap)} />
        <Metric label="Div. Yield" value={dividendYield != null ? `${(dividendYield * 100).toFixed(2)}%` : "—"} />
        <Metric label="Máx. 52 sem." value={fmt(fiftyTwoWeekHigh, "$")} />
        <Metric label="Mín. 52 sem." value={fmt(fiftyTwoWeekLow, "$")} />
      </div>
      {analystRating && (
        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Consenso analistas</span>
          <span className={`text-sm font-semibold ${ratingColor(analystRating)}`}>
            {RATING_LABEL[analystRating] ?? analystRating}
          </span>
        </div>
      )}
    </div>
  );
}
