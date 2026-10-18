export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      <div className="h-8 w-56 rounded-md bg-muted" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-muted" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-border bg-card" />
        ))}
      </div>
      <div className="mt-6 h-64 rounded-xl border border-border bg-card" />
    </div>
  );
}
