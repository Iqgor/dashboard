export function MetricCard({ label, value, delta, detail, tone = "neutral" }) {
  const toneStyles = {
    neutral: "bg-white text-zinc-900",
    positive: "bg-emerald-100 text-emerald-900",
    negative: "bg-rose-100 text-rose-900",
  };

  return (
    <div className={`p-4 ${toneStyles[tone]}`}>
      <div className="mb-0 flex items-center justify-between gap-0">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
          {label}
        </span>
        <span className="bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white">
          {delta}
        </span>
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-0 text-xs text-zinc-500">{detail}</div>
    </div>
  );
}
