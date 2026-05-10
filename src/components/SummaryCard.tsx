type Props = { summary: string };

export default function SummaryCard({ summary }: Props) {
  if (!summary) return null;
  return (
    <div className="mt-4 pt-4 border-t border-zinc-800">
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Análisis</p>
      <p className="text-sm text-zinc-300 leading-relaxed">{summary}</p>
    </div>
  );
}
