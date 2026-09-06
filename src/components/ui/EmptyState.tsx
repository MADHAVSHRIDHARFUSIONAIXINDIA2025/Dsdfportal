export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
