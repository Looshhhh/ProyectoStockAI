import type { NewsArticle } from "@/lib/news";

type Props = { news: NewsArticle[] };

function sentimentDot(score: number) {
  if (score > 0.2)  return <span className="w-2 h-2 rounded-full bg-green-400 shrink-0 mt-1.5" />;
  if (score < -0.2) return <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 mt-1.5" />;
  return <span className="w-2 h-2 rounded-full bg-zinc-500 shrink-0 mt-1.5" />;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1)  return "hace menos de 1h";
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export default function NewsFeed({ news }: Props) {
if (!news || news.length === 0) return null;
  return (
    <div className="mt-4 pt-4 border-t border-zinc-800">
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Noticias recientes</p>
      <ul className="space-y-3">
        {news.map((article, i) => (
          <li key={i} className="flex gap-2">
            {sentimentDot(article.sentimentScore)}
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0"
            >
              <p className="text-xs text-zinc-300 leading-snug line-clamp-2 hover:text-white transition">
                {article.title}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">
                {article.source} · {timeAgo(article.publishedAt)}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
