export function SectionCard({ title, action, children, className = "" }) {
  return (
    <section className={`bg-white p-5 ${className}`}>
      <div className="flex items-center justify-between gap-0 mb-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
