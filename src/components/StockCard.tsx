"use client";

import PriceChart from "@/components/PriceChart";
import Fundamentals from "@/components/Fundamentals";
import ScoreCard from "@/components/ScoreCard";
import NewsFeed from "@/components/NewsFeed";
import SummaryCard from "@/components/SummaryCard";
import type { StockFullData, HistoricalPoint } from "@/lib/yahooFinance";

type Props = {
  stock: StockFullData;
  initialHistory: HistoricalPoint[];
  onRemove: (s: string) => void;
};

export default function StockCard({ stock, initialHistory, onRemove }: Props) {
  if (stock.error) {
    return (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 relative">
        <button onClick={() => onRemove(stock.symbol)}
          className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300 transition text-lg leading-none">✕</button>
        <p className="text-zinc-400 font-bold">{stock.symbol}</p>
        <p className="text-zinc-600 text-sm mt-1">No se encontró este símbolo.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 relative">
      <button onClick={() => onRemove(stock.symbol)}
        className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300 transition text-lg leading-none"
        aria-label={`Eliminar ${stock.symbol}`}>✕</button>

      <PriceChart
        symbol={stock.symbol}
        data={initialHistory}
        currentPrice={stock.price}
        changePercent={stock.changePercent}
      />

      {stock.summary && <SummaryCard summary={stock.summary} />}

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

      {stock.score && <ScoreCard score={stock.score} />}

      {/* Noticias cargadas directo desde el navegador */}
      <NewsFeed symbol={stock.symbol} />
    </div>
  );
}