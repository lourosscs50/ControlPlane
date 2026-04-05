"use client";

import Link from "next/link";
import { CopyableId } from "@/components/operator/CopyableId";
import { CorrelationLink } from "@/components/operator/CorrelationLink";
import {
  alertEntityIdFromDecision,
  signalEntityIdFromDecision,
} from "@/lib/identifiers/decision-trace";
import { decisionsListForSignalEntity } from "@/lib/identifiers/signalforge-decisions";
import {
  detailPathForUnifiedRow,
  type UnifiedDecisionListRow,
} from "@/lib/api/unified-decisions";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function traceSnippet(d: UnifiedDecisionListRow["visibility"]) {
  const t = d.trace;
  if (t.traceId?.trim()) {
    const s = t.traceId.trim();
    return s.length > 28 ? `${s.slice(0, 26)}…` : s;
  }
  if (t.correlationId?.trim()) {
    const s = t.correlationId.trim();
    return s.length > 28 ? `${s.slice(0, 26)}…` : s;
  }
  if (t.executionInstanceId?.trim()) {
    const s = t.executionInstanceId.trim();
    return s.length > 28 ? `${s.slice(0, 26)}…` : s;
  }
  return "—";
}

function sourceLabel(row: UnifiedDecisionListRow): string {
  return row.sourceSystem === "ail" ? "A.I.L." : "SignalForge";
}

export function DecisionTable({
  rows,
  compact,
}: {
  rows: UnifiedDecisionListRow[];
  compact?: boolean;
}) {
  if (!rows.length) {
    return (
      <p className="text-sm text-slate-500">No decision rows for this filter.</p>
    );
  }

  if (compact) {
    return (
      <ul className="space-y-3">
        {rows.map((row) => {
          const d = row.visibility;
          const href = detailPathForUnifiedRow(row);
          return (
            <li
              key={`${row.sourceSystem}-${d.decisionId}`}
              className="rounded-lg border border-surface-border bg-black/20 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {sourceLabel(row)}
                </span>
                <Link
                  href={href}
                  className="font-mono text-sm text-accent-muted hover:text-white"
                >
                  {d.decisionId}
                </Link>
                <span className="text-xs text-slate-500">{d.decisionType}</span>
                <span className="text-xs font-medium text-slate-400">
                  {d.status}
                </span>
              </div>
              <p className="mt-2 font-mono text-[11px] text-slate-500">
                {formatWhen(d.occurredAtUtc)}
              </p>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-raised/40">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-raised/80 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Decision</th>
              <th className="px-4 py-3">Type / category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Policy</th>
              <th className="px-4 py-3">Strategy</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Trace / correlation</th>
              <th className="px-4 py-3">Signal id</th>
              <th className="px-4 py-3">Alert id</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {rows.map((row) => {
              const d = row.visibility;
              const sig = signalEntityIdFromDecision(d);
              const alertId = alertEntityIdFromDecision(d);
              const detailHref = detailPathForUnifiedRow(row);
              return (
                <tr
                  key={`${row.sourceSystem}-${d.decisionId}`}
                  className="align-top"
                >
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {sourceLabel(row)}
                  </td>
                  <td className="px-4 py-3">
                    <CopyableId
                      value={d.decisionId}
                      copyLabel="Copy decision id"
                      href={detailHref}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-200">{d.decisionType}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {d.decisionCategory}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{d.status}</td>
                  <td className="px-4 py-3 break-words text-slate-300">
                    {d.policyProfileKey ?? "—"}
                  </td>
                  <td className="px-4 py-3 break-words font-mono text-xs text-slate-400">
                    {d.strategyPathKey ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                    {formatWhen(d.occurredAtUtc)}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500 break-all max-w-[14rem]">
                    {traceSnippet(d)}
                  </td>
                  <td className="px-4 py-3">
                    {sig ? (
                      <span className="inline-flex flex-col gap-1">
                        <CopyableId
                          value={sig}
                          copyLabel="Copy signal id"
                          href={decisionsListForSignalEntity(sig, { page: 1 })}
                        />
                        <span className="text-[10px] text-slate-600">
                          filter decisions
                        </span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {alertId ? (
                      <span className="inline-flex flex-col gap-1">
                        <CorrelationLink alertEntityId={alertId}>
                          {alertId}
                        </CorrelationLink>
                        <Link
                          href={`/?search=${encodeURIComponent(alertId)}`}
                          className="text-[10px] text-accent-muted hover:text-white"
                        >
                          Search executions
                        </Link>
                      </span>
                    ) : (
                      "—"
                    )}
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
