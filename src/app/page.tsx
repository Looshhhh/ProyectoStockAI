import Watchlist from "./Watchlist";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="mb-10">
        <h1 className="text-6xl font-bold mb-3">Stock Dashboard</h1>
        <p className="text-zinc-400 text-xl">Tu watchlist personal</p>
      </div>
      <Watchlist />
    </main>
  );
}
