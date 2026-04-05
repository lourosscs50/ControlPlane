"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdvisoryBadge } from "@/components/operator/AdvisoryBadge";
import { StatusBadge } from "@/components/operator/StatusBadge";
import {
  buildDashboardHref,
  type DashboardParams,
  type DashboardSortKey,
} from "@/lib/operator/dashboard-params";
import { TraceIdentifier } from "@/components/operator/TraceIdentifier";
import { getOperatorStatus } from "@/lib/operator/execution-status";
import type { ControlExecutionRecord } from "@/lib/chronoflow/types";

function formatWhen(row: ControlExecutionRecord) {
  const iso = row.executedAtUtc ?? row.receivedAtUtc;
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function SortLink({
  label,
  sortKey,
  params,
}: {
  label: string;
  sortKey: DashboardSortKey;
  params: DashboardParams;
}) {
  const active = params.sort === sortKey;
  const nextDir =
    active && params.sortDir === "desc" ? ("asc" as const) : ("desc" as const);
  const href = buildDashboardHref(params, {
    sort: sortKey,
    sortDir: active ? nextDir : "desc",
    page: 1,
  });
  const caret = active ? (params.sortDir === "desc" ? "↓" : "↑") : "";

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1 font-medium hover:text-accent-muted ${
        active ? "text-white" : "text-slate-500"
      }`}
    >
      {label}
      <span className="text-xs opacity-70">{caret}</span>
    </Link>
  );
}

export function OperatorDataTable({
  rows,
  params,
  returnHrefEncoded,
}: {
  rows: ControlExecutionRecord[];
  params: DashboardParams;
  returnHrefEncoded: string;
}) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-raised/40">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-raised/80 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">
                <SortLink label="Created" sortKey="receivedAt" params={params} />
              </th>
              <th className="px-4 py-3">
                <SortLink label="Status" sortKey="status" params={params} />
              </th>
              <th className="px-4 py-3">Lifecycle</th>
              <th className="px-4 py-3">Correlation</th>
              <th className="px-4 py-3">Workflow</th>
              <th className="px-4 py-3">AIL</th>
              <th className="px-4 py-3">Strategy</th>
              <th className="px-4 py-3">
                <SortLink label="Duration" sortKey="duration" params={params} />
              </th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {rows.map((row) => {
              const status = getOperatorStatus(row);
              const dur =
                row.executedAtUtc && row.receivedAtUtc
                  ? `${Math.max(
                      0,
                      new Date(row.executedAtUtc).getTime() -
                        new Date(row.receivedAtUtc).getTime()
                    )} ms`
                  : "—";
              return (
                <tr
                  key={row.id}
                  role="link"
                  tabIndex={0}
                  onClick={() =>
                    router.push(
                      `/executions/${row.id}?returnTo=${returnHrefEncoded}`
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(
                        `/executions/${row.id}?returnTo=${returnHrefEncoded}`
                      );
                    }
                  }}
                  className="cursor-pointer transition-colors hover:bg-surface-raised/55 focus-visible:bg-surface-raised/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-400">
                    {new Date(row.receivedAtUtc).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-200">
                    {row.lifecycleEventType}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <div
                      role="presentation"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <TraceIdentifier
                        correlationId={row.alertId}
                        showLabel={false}
                        displayText={`${row.alertId.slice(0, 8)}…`}
                        copyButtonLabel="Copy"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {row.workflowKey ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <AdvisoryBadge advisoryWasUsed={row.advisoryWasUsed} />
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {row.advisoryStrategyKey ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {dur}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                    {formatWhen(row)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
