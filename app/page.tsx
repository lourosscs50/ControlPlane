import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/operator/DashboardSkeleton";
import { EmptyState } from "@/components/operator/EmptyState";
import { ErrorState } from "@/components/operator/ErrorState";
import { FilterBarSkeleton } from "@/components/operator/FilterBarSkeleton";
import { OperatorContextBanners } from "@/components/operator/OperatorContextBanners";
import { OperatorDataTable } from "@/components/operator/OperatorDataTable";
import { OperatorFilterBar } from "@/components/operator/OperatorFilterBar";
import { PaginationBar } from "@/components/operator/PaginationBar";
import { SummaryCards } from "@/components/operator/SummaryCards";
import { loadDashboardData } from "@/lib/operator/dashboard-data";
import { isUuid, parseDashboardParams } from "@/lib/operator/dashboard-params";
import { getChronoFlowConfig } from "@/lib/env";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function DashboardBody({ searchParams }: PageProps) {
  const sp = await searchParams;
  const raw: Record<string, string | string[] | undefined> = { ...sp };
  const params = parseDashboardParams(raw);
  const { baseUrl } = getChronoFlowConfig();

  let result: Awaited<ReturnType<typeof loadDashboardData>>;
  let error: unknown = null;
  try {
    result = await loadDashboardData(params);
  } catch (e) {
    error = e;
  }

  if (error) {
    return (
      <div className="mt-6">
        <ErrorState error={error} />
      </div>
    );
  }

  const { rows, meta } = result!;
  const returnEncoded = encodeURIComponent(meta.returnHref);
  const uuidSearch = Boolean(params.search.trim() && isUuid(params.search));

  return (
    <>
      <OperatorContextBanners meta={meta} />
      <div className="mt-4">
        <SummaryCards rows={rows} />
      </div>
      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState
            hint={
              baseUrl
                ? "Adjust status, dates, or search. UUID search looks up an execution id first, then falls back to alert id."
                : "Configure CHRONOFLOW_API_BASE_URL to connect."
            }
          />
        ) : (
          <OperatorDataTable
            rows={rows}
            params={params}
            returnHrefEncoded={returnEncoded}
          />
        )}
      </div>
      {!uuidSearch && rows.length > 0 ? (
        <div className="mt-4">
          <PaginationBar meta={meta} params={params} />
        </div>
      ) : null}
    </>
  );
}

export default function HomePage(props: PageProps) {
  const { baseUrl } = getChronoFlowConfig();
  const unconfigured = !baseUrl;

  return (
    <>
      <header className="border-b border-surface-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-muted">
          ControlPlane
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-white">
          Control executions
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Read-only operator console for ChronoFlow intake outcomes. Filter,
          inspect, and copy identifiers — no mutations.
        </p>
        {unconfigured ? (
          <p
            className="mt-4 rounded-lg border border-amber-900/60 bg-amber-950/30 px-4 py-2 text-sm text-amber-200"
            role="status"
          >
            Configure{" "}
            <code className="rounded bg-black/40 px-1">
              CHRONOFLOW_API_BASE_URL
            </code>{" "}
            (and optional{" "}
            <code className="rounded bg-black/40 px-1">CHRONOFLOW_API_KEY</code>
            ). See <code className="rounded bg-black/40 px-1">.env.example</code>.
          </p>
        ) : null}
      </header>

      <section className="mt-8 space-y-6">
        <Suspense fallback={<FilterBarSkeleton />}>
          <OperatorFilterBar />
        </Suspense>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardBody searchParams={props.searchParams} />
        </Suspense>
      </section>
    </>
  );
}
