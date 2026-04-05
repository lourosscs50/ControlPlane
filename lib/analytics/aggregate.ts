import type { AlertResponse } from "@/lib/api/signalforge";
import type { ControlExecutionRecord } from "@/lib/chronoflow/types";
import { getOperatorStatus } from "@/lib/operator/execution-status";

export type ExecutionMetricsSummary = {
  total: number;
  successCount: number;
  failedCount: number;
  runningCount: number;
  successRate: number | null;
  failureRate: number | null;
};

export function summarizeExecutions(
  rows: ControlExecutionRecord[]
): ExecutionMetricsSummary {
  const total = rows.length;
  let successCount = 0;
  let failedCount = 0;
  let runningCount = 0;
  for (const r of rows) {
    const s = getOperatorStatus(r);
    if (s === "SUCCESS") successCount += 1;
    else if (s === "FAILED") failedCount += 1;
    else runningCount += 1;
  }
  const successRate = total > 0 ? successCount / total : null;
  const failureRate = total > 0 ? failedCount / total : null;
  return {
    total,
    successCount,
    failedCount,
    runningCount,
    successRate,
    failureRate,
  };
}

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export type AlertKpisFromList = {
  totalAlerts: number;
  openAlerts: number;
  resolvedAlerts: number;
  avgTimeToAcknowledgeSeconds: number | null;
  avgTimeToResolveSeconds: number | null;
};

/** Derive alert KPIs from a bounded alert list when `/alerts/metrics` is unavailable. */
export function alertMetricsFromList(alerts: AlertResponse[]): AlertKpisFromList {
  const totalAlerts = alerts.length;
  let openAlerts = 0;
  let resolvedAlerts = 0;
  const ackSecs: number[] = [];
  const resSecs: number[] = [];
  for (const a of alerts) {
    if (a.isResolved) resolvedAlerts += 1;
    else openAlerts += 1;
    if (a.timeToAcknowledgeSeconds != null) {
      ackSecs.push(a.timeToAcknowledgeSeconds);
    }
    if (a.timeToResolveSeconds != null) {
      resSecs.push(a.timeToResolveSeconds);
    }
  }
  return {
    totalAlerts,
    openAlerts,
    resolvedAlerts,
    avgTimeToAcknowledgeSeconds: mean(ackSecs),
    avgTimeToResolveSeconds: mean(resSecs),
  };
}

export type StatusBucket = { key: string; count: number; pct: number };

export function executionStatusDistribution(
  rows: ControlExecutionRecord[]
): StatusBucket[] {
  const ex = summarizeExecutions(rows);
  const total = ex.total || 1;
  return [
    { key: "SUCCESS", count: ex.successCount, pct: ex.successCount / total },
    { key: "RUNNING", count: ex.runningCount, pct: ex.runningCount / total },
    { key: "FAILED", count: ex.failedCount, pct: ex.failedCount / total },
  ];
}

export type DayCount = { day: string; count: number };

export function alertsPerDay(alerts: AlertResponse[]): DayCount[] {
  const map = new Map<string, number>();
  for (const a of alerts) {
    const d = a.createdAtUtc.slice(0, 10);
    map.set(d, (map.get(d) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }));
}
