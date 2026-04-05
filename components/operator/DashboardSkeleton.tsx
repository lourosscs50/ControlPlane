export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-36 rounded-xl bg-slate-800/60" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-800/50" />
        ))}
      </div>
      <div className="space-y-2 rounded-xl border border-slate-800 p-4">
        <div className="h-10 rounded bg-slate-800/70" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-12 rounded bg-slate-800/40" />
        ))}
      </div>
    </div>
  );
}
