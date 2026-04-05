import type { ExecutionListQuery } from "@/lib/chronoflow/types";

export type OperatorStatusFilter = "all" | "success" | "failed" | "running";

export type DashboardSortKey = "receivedAt" | "status" | "duration";

export type SortDirection = "asc" | "desc";

export type DashboardParams = {
  status: OperatorStatusFilter;
  from: string;
  to: string;
  search: string;
  lifecycleEventType: string;
  workflowKey: string;
  page: number;
  pageSize: number;
  sort: DashboardSortKey;
  sortDir: SortDirection;
};

const pick = (
  raw: Record<string, string | string[] | undefined>,
  k: string
): string | undefined => {
  const v = raw[k];
  return typeof v === "string" ? v : undefined;
};

export function parseDashboardParams(
  raw: Record<string, string | string[] | undefined>
): DashboardParams {
  const statusRaw = pick(raw, "status");
  const status: OperatorStatusFilter =
    statusRaw === "success" ||
    statusRaw === "failed" ||
    statusRaw === "running" ||
    statusRaw === "all"
      ? statusRaw
      : "all";

  const pageRaw = pick(raw, "page");
  const page = pageRaw && /^\d+$/.test(pageRaw) ? Math.max(1, Number(pageRaw)) : 1;

  const pageSizeRaw = pick(raw, "pageSize");
  const pageSize = pageSizeRaw && /^\d+$/.test(pageSizeRaw) ? Number(pageSizeRaw) : 25;
  const safePageSize = [10, 25, 50, 100].includes(pageSize) ? pageSize : 25;

  const sortRaw = pick(raw, "sort");
  const sort: DashboardSortKey =
    sortRaw === "status" || sortRaw === "duration" ? sortRaw : "receivedAt";

  const sortDirRaw = pick(raw, "sortDir");
  const sortDir: SortDirection = sortDirRaw === "asc" ? "asc" : "desc";

  return {
    status,
    from: pick(raw, "from") ?? "",
    to: pick(raw, "to") ?? "",
    search: pick(raw, "search") ?? "",
    lifecycleEventType: pick(raw, "lifecycleEventType") ?? "",
    workflowKey: pick(raw, "workflowKey") ?? "",
    page,
    pageSize: safePageSize,
    sort,
    sortDir,
  };
}

/** Maps operator filters to ChronoFlow list API (no ChronoFlow code changes). */
export function toChronoFlowListQuery(p: DashboardParams): ExecutionListQuery {
  const out: ExecutionListQuery = {};

  if (p.lifecycleEventType.trim()) {
    out.lifecycleEventType = p.lifecycleEventType.trim();
  }
  if (p.workflowKey.trim()) {
    out.workflowKey = p.workflowKey.trim();
  }

  switch (p.status) {
    case "success":
      out.wasExecuted = true;
      out.wasSuppressed = false;
      break;
    case "failed":
      out.wasSuppressed = true;
      break;
    case "running":
      out.wasExecuted = false;
      out.wasSuppressed = false;
      break;
    default:
      break;
  }

  return out;
}

export function buildDashboardHref(
  base: DashboardParams,
  patch: Partial<DashboardParams>
): string {
  const next = { ...base, ...patch };
  const qs = new URLSearchParams();

  if (next.status !== "all") qs.set("status", next.status);
  if (next.from.trim()) qs.set("from", next.from.trim());
  if (next.to.trim()) qs.set("to", next.to.trim());
  if (next.search.trim()) qs.set("search", next.search.trim());
  if (next.lifecycleEventType.trim()) {
    qs.set("lifecycleEventType", next.lifecycleEventType.trim());
  }
  if (next.workflowKey.trim()) qs.set("workflowKey", next.workflowKey.trim());
  if (next.page > 1) qs.set("page", String(next.page));
  if (next.pageSize !== 25) qs.set("pageSize", String(next.pageSize));
  if (next.sort !== "receivedAt") qs.set("sort", next.sort);
  if (next.sortDir !== "desc") qs.set("sortDir", next.sortDir);

  const s = qs.toString();
  return s ? `/?${s}` : "/";
}

export function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s.trim()
  );
}
