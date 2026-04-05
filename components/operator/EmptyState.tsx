export function EmptyState({
  title = "No executions found for current filters",
  hint,
}: {
  title?: string;
  hint?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border bg-surface-raised/25 px-8 py-20 text-center"
      role="status"
    >
      <p className="text-lg font-medium text-slate-300">{title}</p>
      {hint ? (
        <p className="mt-3 max-w-lg text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
