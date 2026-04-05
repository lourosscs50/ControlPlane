export function DetailPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-6 w-40 rounded bg-slate-800/70" />
      <div className="h-16 rounded-lg bg-slate-800/50" />
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 rounded-xl bg-slate-800/40" />
        ))}
      </div>
    </div>
  );
}
