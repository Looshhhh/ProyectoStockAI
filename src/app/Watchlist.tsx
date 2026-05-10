"use client";

import { useState, useEffect } from "react";
import StockCard from "@/components/StockCard";
import { getStockFullData, getHistoricalData, type StockFullData } from "./actions";
import type { HistoricalPoint } from "@/lib/yahooFinance";

const STORAGE_KEY = "watchlist_symbols";
const DEFAULT_SYMBOLS = ["NVDA", "TSLA", "META"];

type StockEntry = {
  stock: StockFullData;
  history: HistoricalPoint[];
};

export default function Watchlist() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [entries, setEntries] = useState<Record<string, StockEntry>>({});
  const [loadingSymbols, setLoadingSymbols] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Cargar symbols desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = saved ? JSON.parse(saved) : DEFAULT_SYMBOLS;
    setSymbols(initial);
    setHydrated(true);
  }, []);

  // Cargar datos cuando cambian los symbols
  useEffect(() => {
    if (!hydrated) return;
    const toFetch = symbols.filter((s) => !entries[s]);
    if (toFetch.length === 0) return;

    setLoadingSymbols((prev) => [...prev, ...toFetch]);

    Promise.all(
      toFetch.map(async (sym) => {
        const [stock, history] = await Promise.all([
          getStockFullData(sym),
          getHistoricalData(sym, "1M"),
        ]);
        return { sym, stock, history };
      })
    ).then((results) => {
      setEntries((prev) => {
        const next = { ...prev };
        results.forEach(({ sym, stock, history }) => {
          next[sym] = { stock, history };
        });
        return next;
      });
      setLoadingSymbols((prev) => prev.filter((s) => !toFetch.includes(s)));
    });
  }, [symbols, hydrated]);

  function saveSymbols(next: string[]) {
    setSymbols(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function addSymbol() {
    const sym = input.trim().toUpperCase();
    if (!sym) return;
    if (symbols.includes(sym)) {
      setError(`${sym} ya está en tu watchlist.`);
      return;
    }
    setError("");
    setInput("");
    saveSymbols([...symbols, sym]);
  }

  function removeSymbol(sym: string) {
    saveSymbols(symbols.filter((s) => s !== sym));
    setEntries((prev) => {
      const next = { ...prev };
      delete next[sym];
      return next;
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") addSymbol();
  }

  return (
    <div>
      {/* Input para agregar */}
      <div className="flex gap-3 mb-10">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={handleKeyDown}
            placeholder="Agregar símbolo — ej. AAPL"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition text-sm"
          />
          {error && (
            <p className="absolute -bottom-5 left-1 text-xs text-red-400">{error}</p>
          )}
        </div>
        <button
          onClick={addSymbol}
          disabled={!input.trim()}
          className="px-5 py-3 bg-white text-black rounded-xl text-sm font-semibold hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Agregar
        </button>
      </div>

      {/* Grid */}
      {!hydrated ? null : symbols.length === 0 ? (
        <div className="text-center py-24 text-zinc-600">
          <p className="text-lg mb-2">Tu watchlist está vacía.</p>
          <p className="text-sm">Agrega un símbolo arriba para empezar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {symbols.map((sym) => {
            const entry = entries[sym];
            const isLoading = loadingSymbols.includes(sym);

            if (isLoading || !entry) {
              return (
                <div key={sym} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 animate-pulse">
                  <div className="h-4 w-16 bg-zinc-800 rounded mb-4" />
                  <div className="h-8 w-32 bg-zinc-800 rounded mb-2" />
                  <div className="h-48 bg-zinc-800 rounded-xl mt-6" />
                </div>
              );
            }

            return (
              <StockCard
                key={sym}
                stock={entry.stock}
                initialHistory={entry.history}
                onRemove={removeSymbol}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}