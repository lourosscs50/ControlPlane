import { getExecutionById, listExecutions } from "@/lib/api/chronoflow";
import type { ControlExecutionRecord, ExecutionListQuery } from "@/lib/chronoflow/types";
import {
  buildDashboardHref,
  type DashboardParams,
  isUuid,
  toChronoFlowListQuery,
} from "@/lib/operator/dashboard-params";
import {
  getOperatorStatus,
  statusSortOrder,
} from "@/lib/operator/execution-status";

const ChronoflowMaxTake = 100;

export type DashboardLoadMeta = {
  page: number;
  pageSize: number;
  hasPrev: boolean;
  hasNext: boolean;
  dateFilterActive: boolean;
  /** When true, date filtering uses the newest 100 API rows (ChronoFlow has no date query). */
  dateWindowLimited: boolean;
  /** Sort reorders rows after fetch; when true, order may differ from ChronoFlow for non-date views (current page only). */
  sortIsLocalPageOnly: boolean;
  returnHref: string;
};

export type DashboardLoadResult = {
  rows: ControlExecutionRecord[];
  meta: DashboardLoadMeta;
};

function durationMs(row: ControlExecutionRecord): number {
  if (!row.executedAtUtc || !row.receivedAtUtc) return 0;
  const a = new Date(row.receivedAtUtc).getTime();
  const b = new Date(row.executedAtUtc).getTime();
  const d = b - a;
  return Number.isFinite(d) ? d : 0;
}

function sortRows(
  rows: ControlExecutionRecord[],
  sort: DashboardParams["sort"],
  dir: DashboardParams["sortDir"]
): ControlExecutionRecord[] {
  const m = dir === "asc" ? 1 : -1;
  const out = [...rows];
  out.sort((a, b) => {
    if (sort === "status") {
      return (
        m *
        (statusSortOrder(getOperatorStatus(a)) -
          statusSortOrder(getOperatorStatus(b)))
      );
    }
    if (sort === "duration") {
      return m * (durationMs(a) - durationMs(b));
    }
    const ta = new Date(a.receivedAtUtc).getTime();
    const tb = new Date(b.receivedAtUtc).getTime();
    return m * (ta - tb);
  });
  return out;
}

function filterByDateRange(
  rows: ControlExecutionRecord[],
  from: string,
  to: string
): ControlExecutionRecord[] {
  const fromT = from.trim() ? new Date(from + "T00:00:00.000Z").getTime() : null;
  const toT = to.trim() ? new Date(to + "T23:59:59.999Z").getTime() : null;

  return rows.filter((r) => {
    const t = new Date(r.receivedAtUtc).getTime();
    if (fromT !== null && !Number.isNaN(fromT) && t < fromT) return false;
    if (toT !== null && !Number.isNaN(toT) && t > toT) return false;
    return true;
  });
}

/** Apply API-equivalent filters in-memory (UUID search path). */
function matchesListFilters(
  r: ControlExecutionRecord,
  q: ExecutionListQuery
): boolean {
  if (q.alertId && r.alertId !== q.alertId) return false;
  if (
    q.lifecycleEventType &&
    r.lifecycleEventType !== q.lifecycleEventType.trim()
  )
    return false;
  if (q.workflowKey && (r.workflowKey ?? "") !== q.workflowKey.trim())
    return false;
  if (q.wasExecuted === true && !r.wasExecuted) return false;
  if (q.wasExecuted === false && r.wasExecuted) return false;
  if (q.wasSuppressed === true && !r.wasSuppressed) return false;
  if (q.wasSuppressed === false && r.wasSuppressed) return false;
  return true;
}

export async function loadDashboardData(
  params: DashboardParams
): Promise<DashboardLoadResult> {
  const returnHref = buildDashboardHref(params, {});
  const dateFilterActive = Boolean(params.from.trim() || params.to.trim());
  const pageSize = params.pageSize;
  const page = params.page;
  const baseQ = toChronoFlowListQuery(params);
  const search = params.search.trim();

  // —— UUID search: execution id, then alert id fallback ——
  if (search && isUuid(search)) {
    let rows: ControlExecutionRecord[] = [];
    const byId = await getExecutionById(search);
    if (byId) rows = [byId];
    if (rows.length === 0) {
      rows = await listExecutions({
        ...baseQ,
        alertId: search,
        skip: 0,
        take: ChronoflowMaxTake,
      });
    }
    rows = rows.filter((r) => matchesListFilters(r, baseQ));
    rows = filterByDateRange(rows, params.from, params.to);
    rows = sortRows(rows, params.sort, params.sortDir);

    return {
      rows,
      meta: {
        page: 1,
        pageSize,
        hasPrev: false,
        hasNext: false,
        dateFilterActive,
        dateWindowLimited: dateFilterActive,
        sortIsLocalPageOnly: true,
        returnHref,
      },
    };
  }

  // —— Date range: pull API window, filter, paginate in memory ——
  if (dateFilterActive) {
    const batch = await listExecutions({
      ...baseQ,
      skip: 0,
      take: ChronoflowMaxTake,
    });
    let filtered = filterByDateRange(batch, params.from, params.to);
    filtered = sortRows(filtered, params.sort, params.sortDir);
    const start = (page - 1) * pageSize;
    const rows = filtered.slice(start, start + pageSize);

    return {
      rows,
      meta: {
        page,
        pageSize,
        hasPrev: page > 1,
        hasNext: start + pageSize < filtered.length,
        dateFilterActive: true,
        dateWindowLimited: true,
        sortIsLocalPageOnly: false,
        returnHref,
      },
    };
  }

  // —— Default: API pagination ——
  const rows = sortRows(
    await listExecutions({
      ...baseQ,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    params.sort,
    params.sortDir
  );

  return {
    rows,
    meta: {
      page,
      pageSize,
      hasPrev: page > 1,
      hasNext: rows.length === pageSize,
      dateFilterActive: false,
      dateWindowLimited: false,
      sortIsLocalPageOnly: true,
      returnHref,
    },
  };
}
