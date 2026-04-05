import type { DashboardLoadMeta } from "@/lib/operator/dashboard-data";

export function OperatorContextBanners({ meta }: { meta: DashboardLoadMeta }) {
  return (
    <div className="space-y-2 text-xs leading-relaxed">
      {meta.dateWindowLimited ? (
        <p
          className="rounded-lg border border-amber-900/50 bg-amber-950/25 px-3 py-2 text-amber-100/90"
          role="status"
        >
          <strong className="font-semibold">Date range:</strong> matches are
          computed from the latest {100} records ChronoFlow returns for your
          filter (the API does not expose server-side date filtering yet).
        </p>
      ) : null}
      {meta.sortIsLocalPageOnly ? (
        <p className="text-slate-500">
          <strong className="text-slate-400">Sorting:</strong> column order is
          applied after fetch on this page. Default API ordering is newest first.
        </p>
      ) : null}
    </div>
  );
}
