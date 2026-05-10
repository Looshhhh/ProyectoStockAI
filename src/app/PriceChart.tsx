"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

export type HistoricalPoint = { date: string; close: number };
type Period = "1D" | "1W" | "1M" | "3M";
const PERIODS: Period[] = ["1D", "1W", "1M", "3M"];

function formatLabel(iso: string, period: Period): string {
  const d = new Date(iso);
  if (period === "1D") return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  if (period === "1W") return d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" });
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

type Props = {
  symbol: string;
  data: HistoricalPoint[];
  currentPrice: number;
  changePercent: number;
  onPeriodChange: (p: Period) => Promise<HistoricalPoint[]>;
};

export default function PriceChart({ symbol, data: init, currentPrice, changePercent, onPeriodChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [period, setPeriod] = useState<Period>("1M");
  const [data, setData] = useState(init);
  const [loading, setLoading] = useState(false);

  const isPositive = changePercent >= 0;
  const lineColor = isPositive ? "#22c55e" : "#ef4444";
  const fillColor = isPositive ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)";

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const labels = data.map((p) => formatLabel(p.date, period));
    const values = data.map((p) => p.close);

    if (chartRef.current) {
      chartRef.current.data.labels = labels;
      chartRef.current.data.datasets[0].data = values;
      chartRef.current.data.datasets[0].borderColor = lineColor;
      (chartRef.current.data.datasets[0] as any).backgroundColor = fillColor;
      chartRef.current.update("active");
      return;
    }

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: lineColor,
          backgroundColor: fillColor,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: lineColor,
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#18181b",
            titleColor: "#a1a1aa",
            bodyColor: "#fff",
            padding: 10,
            displayColors: false,
            callbacks: { label: (i) => `$${(i.parsed.y as number).toFixed(2)}` },
          },
        },
        scales: {
          x: {
            type: "category",
            grid: { display: false },
            border: { display: false },
            ticks: { color: "#71717a", font: { size: 11 }, maxTicksLimit: 6, maxRotation: 0 },
          },
          y: {
            position: "right",
            grid: { color: "rgba(255,255,255,0.04)" },
            border: { display: false },
            ticks: { color: "#71717a", font: { size: 11 }, callback: (v) => `$${(v as number).toFixed(0)}` },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [data, lineColor, fillColor, period]);

  async function handlePeriod(p: Period) {
    if (p === period || loading) return;
    setLoading(true);
    setPeriod(p);
    try { setData(await onPeriodChange(p)); }
    finally { setLoading(false); }
  }

  const absoluteChange = currentPrice - (data[0]?.close ?? currentPrice);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-zinc-400 text-sm mb-1">{symbol}</p>
          <p className="text-4xl font-bold tabular-nums">${currentPrice.toFixed(2)}</p>
          <p className={`text-sm mt-1 font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}{absoluteChange.toFixed(2)} ({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)
          </p>
        </div>
        <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button key={p} onClick={() => handlePeriod(p)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${period === p ? "bg-zinc-600 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="relative" style={{ height: "192px" }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/60 rounded-xl z-10">
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
          </div>
        )}
        <canvas ref={canvasRef} role="img" aria-label={`Gráfica de ${symbol}`} />
      </div>
    </div>
  );
}
