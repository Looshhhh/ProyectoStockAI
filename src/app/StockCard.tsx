"use client";

import { useState } from "react";
import PriceChart, { type HistoricalPoint } from "./PriceChart";
import Fundamentals from "./Fundamentals";
import { getHistoricalData, type StockFullData } from "./actions";

type Props = {
  stock: StockFullData;
  initialHistory: HistoricalPoint[];
  onRemove: (s: string) => void;
};

export default function StockCard({ stock, initialHistory, onRemove }: Props) {
  const [history, setHistory] = useState(initialHistory);

  async function handlePeriodChange(period: "1D" | "1W" | "1M" | "3M") {
    const data = await getHistoricalData(stock.symbol, period);
    setHistory(data);
    return data;
  }

  if (stock.error) {
    return (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 relative">
        <button
          onClick={() => onRemove(stock.symbol)}
          className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300 transition text-lg leading-none"
          aria-label={`Eliminar ${stock.symbol}`}
        >
          ✕
        </button>
        <p className="text-zinc-400 font-bold">{stock.symbol}</p>
        <p className="text-zinc-600 text-sm mt-1">No se encontró este símbolo.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 relative">
      <button
        onClick={() => onRemove(stock.symbol)}
        className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300 transition text-lg leading-none"
        aria-label={`Eliminar ${stock.symbol}`}
      >
        ✕
      </button>
      <PriceChart
        symbol={stock.symbol}
        data={history}
        currentPrice={stock.price}
        changePercent={stock.changePercent}
        onPeriodChange={handlePeriodChange}
      />
      <Fundamentals
        peRatio={stock.peRatio}
        eps={stock.eps}
        marketCap={stock.marketCap}
        sector={stock.sector}
        fiftyTwoWeekHigh={stock.fiftyTwoWeekHigh}
        fiftyTwoWeekLow={stock.fiftyTwoWeekLow}
        dividendYield={stock.dividendYield}
        analystRating={stock.analystRating}
      />
    </div>
  );
}