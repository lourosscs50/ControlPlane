import Link from "next/link";
import type { ReactNode } from "react";
import type { DayCount, StatusBucket } from "@/lib/analytics/aggregate";

type StatusChartProps = {
  buckets: StatusBucket[];
  /** Per-bar dashboard drill-down href (executions list with filters). */
  hrefForKey: (distributionKey: string) => string | null;
};

export function StatusDistributionChart({
  buckets,
  hrefForKey,
}: StatusChartProps) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="mt-4 flex h-36 items-end gap-3">
      {buckets.map((b) => {
        const h = Math.round((b.count / max) * 100);
        const color =
          b.key === "SUCCESS"
            ? "bg-emerald-500/90"
            : b.key === "FAILED"
              ? "bg-rose-500/90"
              : "bg-amber-400/90";
        const href = hrefForKey(b.key);
        const inner: ReactNode = (
          <>
            <div
              className={`w-full max-w-[4rem] rounded-t ${color} transition-[height]`}
              style={{ height: `${Math.max(b.count ? 8 : 0, h)}%` }}
              title={`${b.key}: ${b.count}`}
            />
            <div className="text-center text-[10px] uppercase tracking-wide text-slate-500">
              {b.key}
            </div>
            <div className="font-mono text-xs text-slate-300">{b.count}</div>
          </>
        );
        return (
          <div
            key={b.key}
            className="flex min-w-[3.5rem] flex-1 flex-col items-center justify-end gap-2"
          >
            {href ? (
              <Link
                href={href}
                className="flex w-full flex-col items-center justify-end gap-2 rounded-lg pb-1 outline-none ring-offset-2 ring-offset-transparent transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-accent-muted"
                aria-label={`View executions filtered as ${b.key} for this date range`}
              >
                {inner}
              </Link>
            ) : (
              inner
            )}
          </div>
        );
      })}
    </div>
  );
}

type AlertsTimeProps = {
  series: DayCount[];
  /** Dashboard drill-down: executions received on this UTC calendar day. */
  hrefForDay: (day: string) => string;
};

export function AlertsOverTimeChart({ series, hrefForDay }: AlertsTimeProps) {
  if (!series.length) {
    return (
      <p className="mt-4 text-sm text-slate-500">No alerts in this window.</p>
    );
  }
  const max = Math.max(1, ...series.map((d) => d.count));
  return (
    <div className="mt-4 flex h-32 items-end gap-px sm:gap-0.5">
      {series.map((d) => {
        const h = Math.round((d.count / max) * 100);
        return (
          <Link
            key={d.day}
            href={hrefForDay(d.day)}
            className="group relative flex min-w-0 flex-1 flex-col items-center justify-end outline-none ring-offset-2 ring-offset-transparent focus-visible:ring-2 focus-visible:ring-accent-muted"
            aria-label={`Executions received on ${d.day} (${d.count} alerts created that day in range)`}
          >
            <div
              className="w-full rounded-t bg-violet-500/85 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              style={{ height: `${Math.max(4, h)}%` }}
            />
            <span className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded bg-black/80 px-2 py-0.5 font-mono text-[10px] text-white group-hover:block group-focus:block">
              {d.day}: {d.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
