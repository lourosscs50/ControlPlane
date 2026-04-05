import type { ReactNode } from "react";

/**
 * Bounded empty / blocked states for operator panels. Variants are visually distinct so operators
 * can tell missing trace, missing config, fetch failure, and successful empty results apart.
 */
export type EmptyStateNoticeVariant =
  | "no_trace_id"
  | "not_configured"
  | "source_unavailable"
  | "no_results_found";

const shellByVariant: Record<EmptyStateNoticeVariant, string> = {
  no_trace_id:
    "border border-slate-700/80 bg-slate-950/40 text-slate-300",
  not_configured:
    "border border-amber-900/60 bg-amber-950/30 text-amber-100",
  source_unavailable:
    "border border-rose-900/55 bg-rose-950/30 text-rose-100",
  no_results_found:
    "border border-sky-900/45 bg-sky-950/25 text-sky-100",
};

const defaultTitle: Record<EmptyStateNoticeVariant, string> = {
  no_trace_id: "No trace identifier",
  not_configured: "Source not configured",
  source_unavailable: "Source unavailable",
  no_results_found: "No related entities found",
};

export function EmptyStateNotice({
  variant,
  title,
  children,
}: {
  variant: EmptyStateNoticeVariant;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`rounded-lg px-4 py-3 text-sm ${shellByVariant[variant]}`}
      role="status"
    >
      <p className="font-medium">{title ?? defaultTitle[variant]}</p>
      {children ? <div className="mt-2 text-sm opacity-95">{children}</div> : null}
    </div>
  );
}
