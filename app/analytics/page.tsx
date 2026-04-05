import Link from "next/link";
import {
  AlertsOverTimeChart,
  StatusDistributionChart,
} from "@/components/analytics/AnalyticsCharts";
import { ErrorState } from "@/components/operator/ErrorState";
import { listExecutions } from "@/lib/api/chronoflow";
import {
  getAlertMetrics,
  getDecisionMetrics,
  listAllAlertsBounded,
} from "@/lib/api/signalforge";
import type {
  AlertMetricsSummaryResponse,
  DecisionVisibilityMetricsResponse,
} from "@/lib/api/signalforge";
import {
  alertMetricsFromList,
  alertsPerDay,
  executionStatusDistribution,
  summarizeExecutions,
} from "@/lib/analytics/aggregate";
import {
  filterExecutionsByReceivedUtc,
  parseAnalyticsRange,
  signalForgeCreatedUtcRange,
} from "@/lib/analytics/date-range";
import type { ControlExecutionRecord } from "@/lib/chronoflow/types";
import { getChronoFlowConfig, getSignalForgeConfig } from "@/lib/env";
import {
  dashboardStatusFromBucketKey,
  executionsDashboardHref,
} from "@/lib/routes/executions-dashboard";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatSeconds(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m} m ${s} s`;
}

function AnalyticsMetricCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl text-white">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </>
  );

  const cardClass =
    "rounded-xl border border-surface-border bg-surface-raised/45 p-4 transition-colors";

  if (href) {
    return (
      <Link
        href={href}
        className={`${cardClass} block outline-none hover:border-accent-muted/40 focus-visible:ring-2 focus-visible:ring-accent-muted`}
      >
        {inner}
      </Link>
    );
  }

  return <div className={cardClass}>{inner}</div>;
}

async function loadExecutionsForAnalytics(
  from: string,
  to: string
): Promise<{
  rowsInRange: ControlExecutionRecord[];
  limited: boolean;
  error: unknown | null;
}> {
  let error: unknown = null;
  let batch: ControlExecutionRecord[] = [];
  try {
    batch = await listExecutions({ skip: 0, take: 100 });
  } catch (e) {
    error = e;
    return { rowsInRange: [], limited: false, error };
  }

  const limited = batch.length >= 100;
  const rows = filterExecutionsByReceivedUtc(batch, from, to);
  return { rowsInRange: rows, limited, error: null };
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { from, to } = parseAnalyticsRange(sp);
  const { baseUrl: cfBase } = getChronoFlowConfig();
  const { baseUrl: sfBase } = getSignalForgeConfig();

  if (!cfBase) {
    return (
      <div>
        <header className="border-b border-surface-border pb-6">
          <h1 className="text-2xl font-semibold text-white">Analytics</h1>
          <p className="mt-2 text-sm text-slate-400">
            Cross-system read-only metrics require ChronoFlow and optional
            SignalForge configuration.
          </p>
        </header>
        <div className="mt-6">
          <ErrorState
            title="Configuration error"
            error={new Error("CHRONOFLOW_API_BASE_URL is not configured.")}
          />
        </div>
      </div>
    );
  }

  const { rowsInRange, limited: cfLimited, error: cfErr } =
    await loadExecutionsForAnalytics(from, to);

  if (cfErr) {
    return (
      <div>
        <header className="border-b border-surface-border pb-6">
          <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        </header>
        <div className="mt-6">
          <ErrorState title="Failed to load executions" error={cfErr} />
        </div>
      </div>
    );
  }

  const execSummary = summarizeExecutions(rowsInRange);
  const statusBuckets = executionStatusDistribution(rowsInRange);

  const rangeSf = signalForgeCreatedUtcRange(from, to);
  let apiSnapshot: AlertMetricsSummaryResponse | null = null;
  let decisionMetricsSnapshot: DecisionVisibilityMetricsResponse | null = null;
  let alertsInRange: Awaited<ReturnType<typeof listAllAlertsBounded>> = [];
  let sfErr: unknown = null;

  if (sfBase) {
    try {
      const [api, list, decMetrics] = await Promise.all([
        getAlertMetrics(),
        listAllAlertsBounded({ ...rangeSf, pageSize: 100 }, 500),
        getDecisionMetrics(),
      ]);
      apiSnapshot = api;
      alertsInRange = list;
      decisionMetricsSnapshot = decMetrics;
    } catch (e) {
      sfErr = e;
    }
  }

  const alertKpis = alertMetricsFromList(alertsInRange);
  const alertSeries = alertsPerDay(alertsInRange);

  const successPct =
    execSummary.successRate != null
      ? `${Math.round(execSummary.successRate * 100)}%`
      : "—";
  const failPct =
    execSummary.failureRate != null
      ? `${Math.round(execSummary.failureRate * 100)}%`
      : "—";

  const rangeDrill = { from, to };
  const execAllInRangeHref = executionsDashboardHref(rangeDrill);
  const execSuccessHref = executionsDashboardHref({
    ...rangeDrill,
    status: "success",
  });
  const execFailedHref = executionsDashboardHref({
    ...rangeDrill,
    status: "failed",
  });
  const execRunningHref = executionsDashboardHref({
    ...rangeDrill,
    status: "running",
  });

  return (
    <div>
      <header className="border-b border-surface-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-muted">
          Analytics
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-white">
          Operations overview
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Read-only aggregates for the selected UTC date range. ChronoFlow
          samples the newest 100 executions server-side, then filters locally
          (same pattern as the main dashboard). SignalForge alert series use
          created timestamps within the range.
        </p>
      </header>

      <form
        method="get"
        action="/analytics"
        className="mt-8 flex flex-wrap items-end gap-4 rounded-xl border border-surface-border bg-surface-raised/30 p-4"
      >
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          From (UTC)
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-lg border border-surface-border bg-black/30 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          To (UTC)
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-lg border border-surface-border bg-black/30 px-3 py-2 text-sm text-white"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
        >
          Apply range
        </button>
        <Link
          href="/analytics"
          className="text-sm text-accent-muted hover:text-white"
        >
          Reset default (14d)
        </Link>
      </form>

      {cfLimited ? (
        <p
          className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/25 px-4 py-2 text-sm text-amber-200"
          role="status"
        >
          ChronoFlow sample capped at 100 rows — execution metrics may omit older
          data in this range. Narrow the date window or use the executions list
          for full API pagination.
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Alert metrics (SignalForge) — in range
        </h2>
        {!sfBase ? (
          <p className="mt-4 text-sm text-slate-500">
            Set{" "}
            <code className="rounded bg-black/30 px-1">SIGNALFORGE_API_BASE_URL</code>{" "}
            to load alerts. Optional{" "}
            <code className="rounded bg-black/30 px-1">SIGNALFORGE_API_TOKEN</code>{" "}
            unlocks the global metrics API snapshot below.
          </p>
        ) : sfErr ? (
          <div className="mt-4">
            <ErrorState title="SignalForge failed" error={sfErr} />
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <AnalyticsMetricCard
                label="Total alerts"
                value={String(alertKpis.totalAlerts)}
                href="/trace"
                hint="Trace hub: paste alert id or execution id — no alert list in ControlPlane"
              />
              <AnalyticsMetricCard
                label="Open alerts"
                value={String(alertKpis.openAlerts)}
              />
              <AnalyticsMetricCard
                label="Resolved alerts"
                value={String(alertKpis.resolvedAlerts)}
              />
              <AnalyticsMetricCard
                label="Avg time to acknowledge"
                value={formatSeconds(alertKpis.avgTimeToAcknowledgeSeconds)}
              />
              <AnalyticsMetricCard
                label="Avg time to resolve"
                value={formatSeconds(alertKpis.avgTimeToResolveSeconds)}
              />
            </div>
            {apiSnapshot ? (
              <div className="mt-6 rounded-lg border border-slate-700/80 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  GET /alerts/metrics (global API snapshot)
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  These fields come from SignalForge metrics endpoint and are{" "}
                  <span className="font-medium text-slate-400">not date-filtered</span>{" "}
                  by ControlPlane. Use for fleet-wide context; compare to in-range
                  counts above.
                </p>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-slate-500">Total</dt>
                    <dd className="font-mono text-slate-200">
                      {apiSnapshot.totalAlerts}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Open</dt>
                    <dd className="font-mono text-slate-200">
                      {apiSnapshot.openAlerts}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Resolved</dt>
                    <dd className="font-mono text-slate-200">
                      {apiSnapshot.resolvedAlerts}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Avg ack</dt>
                    <dd className="font-mono text-slate-200">
                      {formatSeconds(apiSnapshot.averageTimeToAcknowledgeSeconds)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Avg resolve</dt>
                    <dd className="font-mono text-slate-200">
                      {formatSeconds(apiSnapshot.averageTimeToResolveSeconds)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : sfBase ? (
              <p className="mt-4 text-xs text-slate-500">
                Global metrics API unavailable (missing bearer token or
                non-401 response). In-range KPIs above are derived from alert
                list paging.
              </p>
            ) : null}

            {decisionMetricsSnapshot ? (
              <div className="mt-8 rounded-lg border border-slate-700/80 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Decision visibility (SignalForge)
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  <code className="text-slate-400">GET /decisions/metrics</code>{" "}
                  — global snapshot, not filtered by the analytics date range.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <AnalyticsMetricCard
                    label="Total decisions"
                    value={String(decisionMetricsSnapshot.totalDecisions)}
                    href="/decisions"
                    hint="Open decision list"
                  />
                </div>
                {decisionMetricsSnapshot.countsByDecisionType.length ? (
                  <ul className="mt-4 space-y-2 border-t border-surface-border pt-4 text-sm">
                    {decisionMetricsSnapshot.countsByDecisionType.map((row) => (
                      <li
                        key={row.decisionType}
                        className="flex justify-between gap-4 font-mono text-xs text-slate-300"
                      >
                        <span className="break-all">{row.decisionType}</span>
                        <span>{row.count}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : sfBase && !sfErr ? (
              <p className="mt-6 text-xs text-slate-500">
                Decision metrics unavailable (missing bearer token or API
                error). Decision list still works when a token is configured.
              </p>
            ) : null}
          </>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Execution metrics (ChronoFlow) — in range
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AnalyticsMetricCard
            label="Total executions"
            value={String(execSummary.total)}
            href={execAllInRangeHref}
          />
          <AnalyticsMetricCard
            label="Success rate"
            value={successPct}
            href={execSuccessHref}
            hint="Opens executions with success filter"
          />
          <AnalyticsMetricCard
            label="Failure rate"
            value={failPct}
            href={execFailedHref}
            hint="Opens executions with failure filter"
          />
          <AnalyticsMetricCard
            label="Running"
            value={String(execSummary.runningCount)}
            href={execRunningHref}
            hint="Neither succeeded nor failed in operator semantics"
          />
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-border bg-surface-raised/35 p-5">
          <h3 className="text-sm font-semibold text-white">
            Execution status distribution
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Bars link to the executions list with{" "}
            <code className="text-slate-400">status</code> and the same UTC
            range (<code className="text-slate-400">success</code>,{" "}
            <code className="text-slate-400">failed</code>,{" "}
            <code className="text-slate-400">running</code> — not SUCCEEDED
            / FAILED literals).
          </p>
          <StatusDistributionChart
            buckets={statusBuckets}
            hrefForKey={(key) => {
              const st = dashboardStatusFromBucketKey(key);
              if (!st) return null;
              return executionsDashboardHref({ status: st, from, to });
            }}
          />
        </div>
        <div className="rounded-xl border border-surface-border bg-surface-raised/35 p-5">
          <h3 className="text-sm font-semibold text-white">Alerts over time</h3>
          <p className="mt-1 text-xs text-slate-500">
            By alert created day (UTC). Each bar opens the executions dashboard
            with <code className="text-slate-400">from</code> and{" "}
            <code className="text-slate-400">to</code> set to that day — helpful
            for intake correlation; there is no dedicated alert list route.
          </p>
          {!sfBase || sfErr ? (
            <p className="mt-4 text-sm text-slate-500">No SignalForge data.</p>
          ) : (
            <AlertsOverTimeChart
              series={alertSeries}
              hrefForDay={(day) =>
                executionsDashboardHref({ from: day, to: day })
              }
            />
          )}
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-slate-600">
        <Link href="/" className="text-accent-muted hover:text-white">
          ← Back to executions
        </Link>
      </p>
    </div>
  );
}
