import Link from "next/link";
import {
  buildDashboardHref,
  type DashboardParams,
} from "@/lib/operator/dashboard-params";
import type { DashboardLoadMeta } from "@/lib/operator/dashboard-data";

export function PaginationBar({
  params,
  meta,
}: {
  params: DashboardParams;
  meta: DashboardLoadMeta;
}) {
  const prevHref = buildDashboardHref(params, { page: meta.page - 1 });
  const nextHref = buildDashboardHref(params, { page: meta.page + 1 });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-border pt-4">
      <p className="text-sm text-slate-500">
        Page{" "}
        <span className="font-medium text-slate-300">{meta.page}</span>
        <span className="mx-1 text-slate-600">·</span>
        {meta.pageSize} rows/page
      </p>
      <div className="flex gap-2">
        <Link
          href={prevHref}
          className={`rounded-lg border px-4 py-2 text-sm font-medium ${
            meta.hasPrev
              ? "border-surface-border text-slate-200 hover:bg-surface-raised"
              : "pointer-events-none border-transparent text-slate-600 opacity-50"
          }`}
          aria-disabled={!meta.hasPrev}
        >
          Previous
        </Link>
        <Link
          href={nextHref}
          className={`rounded-lg border px-4 py-2 text-sm font-medium ${
            meta.hasNext
              ? "border-surface-border text-slate-200 hover:bg-surface-raised"
              : "pointer-events-none border-transparent text-slate-600 opacity-50"
          }`}
          aria-disabled={!meta.hasNext}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
