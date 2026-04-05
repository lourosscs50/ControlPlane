export function AdvisoryBadge({
  advisoryWasUsed,
}: {
  advisoryWasUsed: boolean;
}) {
  if (!advisoryWasUsed) {
    return (
      <span className="inline-flex rounded-md bg-slate-800/80 px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-600/60">
        No AIL
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-md bg-blue-950/80 px-2 py-0.5 text-xs font-medium text-blue-100 ring-1 ring-blue-700/50">
      AIL advisory
    </span>
  );
}
