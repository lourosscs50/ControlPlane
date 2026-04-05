import Link from "next/link";
import { DecisionTable } from "@/components/decisions/DecisionTable";
import { ErrorState } from "@/components/operator/ErrorState";
import { listAilExecutionDecisions } from "@/lib/api/ail";
import { listDecisions } from "@/lib/api/signalforge";
import {
  mergeAndPaginateUnifiedDecisions,
  pickDecisionsSourceSystem,
  unifiedMergeCapPerSource,
  type UnifiedDecisionListRow,
} from "@/lib/api/unified-decisions";
import { getAilConfig, getSignalForgeConfig } from "@/lib/env";
import { decisionsListPath } from "@/lib/routes/operator";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickStr(
  v: string | string[] | undefined
): string | undefined {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (Array.isArray(v) && v[0]?.trim()) return v[0].trim();
  return undefined;
}

function pickInt(v: string | string[] | undefined, fallback: number): number {
  const s = pickStr(v);
  if (!s) return fallback;
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

export default async function DecisionsListPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const sfCfg = getSignalForgeConfig();
  const ailCfg = getAilConfig();

  const page = pickInt(sp.page, 1);
  const pageSize = Math.min(100, Math.max(1, pickInt(sp.pageSize, 50)));

  const filters = {
    decisionCategory: pickStr(sp.decisionCategory),
    decisionType: pickStr(sp.decisionType),
    status: pickStr(sp.status),
    fromOccurredUtc: pickStr(sp.fromOccurredUtc),
    toOccurredUtc: pickStr(sp.toOccurredUtc),
    correlationId: pickStr(sp.correlationId),
    traceId: pickStr(sp.traceId),
    executionId: pickStr(sp.executionId),
    ruleId: pickStr(sp.ruleId),
    policyProfileKey: pickStr(sp.policyProfileKey),
  };

  const sfReachable = Boolean(sfCfg.baseUrl);
  const sfAuthed = sfReachable && Boolean(sfCfg.apiToken);
  const ailReachable = Boolean(ailCfg.baseUrl);

  if (!sfReachable && !ailReachable) {
    return (
      <div>
        <header className="border-b border-surface-border pb-6">
          <h1 className="text-2xl font-semibold text-white">Decisions</h1>
        </header>
        <div className="mt-6">
          <ErrorState
            title="Configuration error"
            error={
              new Error(
                "Configure SIGNALFORGE_API_BASE_URL and/or AIL_API_BASE_URL."
              )
            }
          />
        </div>
      </div>
    );
  }

  if (sfReachable && !sfCfg.apiToken && !ailReachable) {
    return (
      <div>
        <header className="border-b border-surface-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-muted">
            SignalForge
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-white">
            Decision visibility
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Read-only operator view of SignalForge decision records (bounded
            summaries only).
          </p>
        </header>
        <p
          className="mt-6 rounded-lg border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200"
          role="status"
        >
          Set{" "}
          <code className="rounded bg-black/40 px-1">SIGNALFORGE_API_TOKEN</code>{" "}
          so ControlPlane can call{" "}
          <code className="rounded bg-black/40 px-1">GET /decisions</code> (JWT).
        </p>
      </div>
    );
  }

  const sourceSystem = pickDecisionsSourceSystem(
    pickStr(sp.sourceSystem),
    sfAuthed,
    ailReachable
  );

  let tableRows: UnifiedDecisionListRow[] = [];
  let totalCount = 0;
  let sfError: unknown = null;
  let ailError: unknown = null;

  try {
    if (sourceSystem === "signalforge") {
      if (!sfAuthed) {
        return (
          <div>
            <header className="border-b border-surface-border pb-6">
              <h1 className="text-2xl font-semibold text-white">Decisions</h1>
            </header>
            <p
              className="mt-6 rounded-lg border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200"
              role="status"
            >
              SignalForge list requires{" "}
              <code className="rounded bg-black/40 px-1">
                SIGNALFORGE_API_TOKEN
              </code>
              . Choose source &quot;A.I.L.&quot; or configure the token.
            </p>
          </div>
        );
      }
      const data = await listDecisions({
        page,
        pageSize,
        ...filters,
      });
      if (!data) {
        return (
          <div>
            <header className="border-b border-surface-border pb-6">
              <h1 className="text-2xl font-semibold text-white">Decisions</h1>
            </header>
            <p
              className="mt-6 rounded-lg border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200"
              role="status"
            >
              Decision list unavailable (unauthorized). Check{" "}
              <code className="rounded bg-black/40 px-1">
                SIGNALFORGE_API_TOKEN
              </code>
              .
            </p>
          </div>
        );
      }
      tableRows = data.items.map((visibility) => ({
        sourceSystem: "signalforge",
        visibility,
      }));
      totalCount = data.totalCount;
    } else if (sourceSystem === "ail") {
      if (!ailReachable) {
        return (
          <div>
            <header className="border-b border-surface-border pb-6">
              <h1 className="text-2xl font-semibold text-white">Decisions</h1>
            </header>
            <p className="mt-6 text-sm text-slate-500">
              Configure{" "}
              <code className="rounded bg-black/30 px-1">AIL_API_BASE_URL</code>{" "}
              for A.I.L. execution visibility listing.
            </p>
          </div>
        );
      }
      const data = await listAilExecutionDecisions(page, pageSize);
      if (!data) {
        return (
          <div>
            <header className="border-b border-surface-border pb-6">
              <h1 className="text-2xl font-semibold text-white">Decisions</h1>
            </header>
            <p
              className="mt-6 rounded-lg border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200"
              role="status"
            >
              A.I.L. list unavailable (unauthorized). Check{" "}
              <code className="rounded bg-black/40 px-1">AIL_API_KEY</code> if
              your deployment requires it.
            </p>
          </div>
        );
      }
      tableRows = data.items.map((visibility) => ({
        sourceSystem: "ail",
        visibility,
      }));
      totalCount = data.totalCount;
    } else {
      const sfItems =
        sfAuthed
          ? await listDecisions({
              page: 1,
              pageSize: unifiedMergeCapPerSource,
              ...filters,
            }).catch((e) => {
              sfError = e;
              return null;
            })
          : null;

      const ailItems = ailReachable
        ? await listAilExecutionDecisions(
            1,
            unifiedMergeCapPerSource
          ).catch((e) => {
            ailError = e;
            return null;
          })
        : null;

      if (sfError && ailError) {
        return (
          <div>
            <header className="border-b border-surface-border pb-6">
              <h1 className="text-2xl font-semibold text-white">Decisions</h1>
            </header>
            <div className="mt-6">
              <ErrorState
                title="Failed to load cross-system decisions"
                error={sfError}
              />
            </div>
          </div>
        );
      }

      const merged = mergeAndPaginateUnifiedDecisions(
        sfItems?.items ?? (sfAuthed ? [] : null),
        ailItems?.items ?? (ailReachable ? [] : null),
        page,
        pageSize
      );
      tableRows = merged.rows;
      totalCount = merged.totalCount;
    }
  } catch (e) {
    return (
      <div>
        <header className="border-b border-surface-border pb-6">
          <h1 className="text-2xl font-semibold text-white">Decisions</h1>
        </header>
        <div className="mt-6">
          <ErrorState title="Failed to load decisions" error={e} />
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const listQueryBase = {
    ...filters,
    pageSize,
    sourceSystem:
      sfAuthed && ailReachable
        ? sourceSystem
        : sourceSystem === "all"
          ? undefined
          : sourceSystem,
    page: 1,
  };
  const baseQuery = decisionsListPath(listQueryBase);
  const prevHref = decisionsListPath({ ...listQueryBase, page: page - 1 });
  const nextHref = decisionsListPath({ ...listQueryBase, page: page + 1 });

  const showSourceFilter = sfAuthed && ailReachable;

  return (
    <div>
      <header className="border-b border-surface-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-muted">
          Control plane
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-white">
          Decision visibility
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Unified read-only operator list for SignalForge and A.I.L. decisions
          (same envelope as each API; no prompts or raw payloads). Detail links
          route to SignalForge decision pages or{" "}
          <code className="text-slate-300">/ail/executions/&lt;id&gt;</code> for
          A.I.L. execution instance ids.
        </p>
      </header>

      {sourceSystem === "all" ? (
        <p
          className="mt-6 rounded-lg border border-slate-700 bg-slate-900/40 px-4 py-3 text-sm text-slate-400"
          role="status"
        >
          Cross-system view merges up to{" "}
          <span className="font-mono text-slate-300">
            {unifiedMergeCapPerSource}
          </span>{" "}
          newest rows per configured source, then sorts by{" "}
          <code className="text-slate-300">occurredAtUtc</code>. Pagination
          applies to that merged snapshot — use{" "}
          <strong className="text-slate-300">Source: SignalForge</strong> or{" "}
          <strong className="text-slate-300">Source: A.I.L.</strong> for full
          server-side paging.
        </p>
      ) : null}

      {(sfError || ailError) && sourceSystem === "all" ? (
        <p
          className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          {sfError ? (
            <>
              SignalForge branch failed to load; showing other source if
              available.{" "}
            </>
          ) : null}
          {ailError ? (
            <>
              A.I.L. branch failed to load; showing other source if available.
            </>
          ) : null}
        </p>
      ) : null}

      <form
        method="get"
        action="/decisions"
        className="mt-8 grid gap-4 rounded-xl border border-surface-border bg-surface-raised/30 p-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {showSourceFilter ? (
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            Source
            <select
              name="sourceSystem"
              defaultValue={sourceSystem}
              className="rounded-lg border border-surface-border bg-black/30 px-3 py-2 text-sm text-white"
            >
              <option value="all">All (merged snapshot)</option>
              <option value="signalforge">SignalForge</option>
              <option value="ail">A.I.L.</option>
            </select>
          </label>
        ) : null}
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Decision type
          <input
            name="decisionType"
            defaultValue={filters.decisionType ?? ""}
            placeholder="e.g. alert.created"
            className="rounded-lg border border-surface-border bg-black/30 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Status
          <input
            name="status"
            defaultValue={filters.status ?? ""}
            placeholder="e.g. succeeded"
            className="rounded-lg border border-surface-border bg-black/30 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Signal entity id (API: correlationId)
          <input
            name="correlationId"
            defaultValue={filters.correlationId ?? ""}
            className="rounded-lg border border-surface-border bg-black/30 px-3 py-2 font-mono text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Alert entity id (API: executionId)
          <input
            name="executionId"
            defaultValue={filters.executionId ?? ""}
            className="rounded-lg border border-surface-border bg-black/30 px-3 py-2 font-mono text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          From (UTC, ISO)
          <input
            name="fromOccurredUtc"
            defaultValue={filters.fromOccurredUtc ?? ""}
            placeholder="2026-04-01"
            className="rounded-lg border border-surface-border bg-black/30 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          To (UTC, ISO)
          <input
            name="toOccurredUtc"
            defaultValue={filters.toOccurredUtc ?? ""}
            className="rounded-lg border border-surface-border bg-black/30 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Rule id
          <input
            name="ruleId"
            defaultValue={filters.ruleId ?? ""}
            className="rounded-lg border border-surface-border bg-black/30 px-3 py-2 font-mono text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          Policy / rule name
          <input
            name="policyProfileKey"
            defaultValue={filters.policyProfileKey ?? ""}
            className="rounded-lg border border-surface-border bg-black/30 px-3 py-2 text-sm text-white"
          />
        </label>
        <input type="hidden" name="pageSize" value={String(pageSize)} />
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
          >
            Apply filters
          </button>
          <Link
            href="/decisions"
            className="text-sm text-accent-muted hover:text-white"
          >
            Clear
          </Link>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <p>
          <span className="font-mono text-slate-300">{totalCount}</span> total ·
          page <span className="font-mono text-slate-300">{page}</span> /{" "}
          {totalPages}
        </p>
        <div className="flex gap-2">
          <Link
            href={hasPrev ? prevHref : baseQuery}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              hasPrev
                ? "border-surface-border text-slate-200 hover:bg-surface-raised"
                : "pointer-events-none border-transparent text-slate-600 opacity-50"
            }`}
            aria-disabled={!hasPrev}
          >
            Previous
          </Link>
          <Link
            href={hasNext ? nextHref : baseQuery}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              hasNext
                ? "border-surface-border text-slate-200 hover:bg-surface-raised"
                : "pointer-events-none border-transparent text-slate-600 opacity-50"
            }`}
            aria-disabled={!hasNext}
          >
            Next
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <DecisionTable rows={tableRows} />
      </div>
    </div>
  );
}
