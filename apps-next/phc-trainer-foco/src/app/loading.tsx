export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <p className="text-ink-soft">A carregar…</p>
      <div className="card h-40 animate-pulse bg-surface-2" />
      <div className="card h-24 animate-pulse bg-surface-2" />
    </div>
  );
}
