"use client";

import Link from "next/link";
import { operatorTraceHubPathForAlert } from "@/lib/identifiers/cross-system";
import {
  ailExecutionDetailPath,
  decisionDetailPath,
  executionDetailPath,
} from "@/lib/routes/operator";
import type {
  TimelineCategory,
  TimelineEvent,
  TraceSourceSystem,
} from "@/lib/trace/build-timeline";

function categoryDotClass(category: TimelineCategory): string {
  switch (category) {
    case "execution":
      return "bg-sky-500 ring-sky-500/30";
    case "signal":
      return "bg-violet-500 ring-violet-500/30";
    case "alert":
      return "bg-amber-400 ring-amber-400/30";
    case "advisory":
      return "bg-teal-400 ring-teal-400/30";
    case "decision":
      return "bg-fuchsia-500 ring-fuchsia-500/30";
    case "intelligence":
      return "bg-emerald-500 ring-emerald-500/30";
  }
}

function sourceSystemLabel(s: TraceSourceSystem): string {
  switch (s) {
    case "chronoflow":
      return "ChronoFlow";
    case "signalforge":
      return "SignalForge";
    case "ail":
      return "A.I.L.";
  }
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "medium",
    });
  } catch {
    return iso;
  }
}

function timelineHref(ev: TimelineEvent): string | undefined {
  const nav = ev.navigation;
  if (!nav) return undefined;
  if (nav.kind === "execution")
    return executionDetailPath(nav.executionInstanceId);
  if (nav.kind === "decision") return decisionDetailPath(nav.decisionId);
  if (nav.kind === "ailExecution")
    return ailExecutionDetailPath(nav.executionInstanceId);
  if (nav.kind === "alertTraceHub")
    return operatorTraceHubPathForAlert(nav.alertEntityId);
  return undefined;
}

function timelineLinkLabel(ev: TimelineEvent): string {
  const nav = ev.navigation;
  if (nav?.kind === "execution")
    return `Open ChronoFlow execution ${nav.executionInstanceId}`;
  if (nav?.kind === "decision") return `Open SignalForge decision ${nav.decisionId}`;
  if (nav?.kind === "ailExecution")
    return `Open A.I.L. execution visibility ${nav.executionInstanceId}`;
  if (nav?.kind === "alertTraceHub")
    return `Open trace hub for alert ${nav.alertEntityId}`;
  return "";
}

export function CrossSystemTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return (
      <p className="text-sm text-slate-500">
        No timeline events for this trace hub context. Load ChronoFlow executions
        and/or SignalForge data, or ensure A.I.L. executions declare an explicit
        ChronoFlow execution link when your gateway supplies it.
      </p>
    );
  }

  return (
    <div className="relative pl-2">
      <div className="absolute bottom-0 left-[15px] top-2 w-px bg-slate-700/90" />
      <ol className="space-y-8">
        {events.map((ev) => {
          const href = timelineHref(ev);
          const body = (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {sourceSystemLabel(ev.sourceSystem)}
                <span className="text-slate-600"> · </span>
                <span className="font-mono normal-case text-slate-500">
                  {ev.eventType}
                </span>
              </p>
              <p className="mt-0.5 text-sm font-medium text-white">{ev.title}</p>
              <p className="mt-1 break-words text-xs text-slate-400">
                {ev.summary}
              </p>
              {ev.traceThreadId ? (
                <p className="mt-1 font-mono text-[10px] text-slate-500 break-all">
                  Trace thread (traceId): {ev.traceThreadId}
                </p>
              ) : null}
              {ev.correlationLabel ? (
                <p className="mt-0.5 font-mono text-[10px] text-slate-600 break-all">
                  {ev.correlationLabel}
                </p>
              ) : null}
              <p className="mt-2 font-mono text-[11px] text-slate-500">
                {formatWhen(ev.atUtc)}
              </p>
            </>
          );

          return (
            <li key={ev.id} className="relative flex gap-4 pl-8">
              <span
                className={`absolute left-0 mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-surface-raised ${categoryDotClass(ev.category)}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                {href ? (
                  <Link
                    href={href}
                    aria-label={timelineLinkLabel(ev)}
                    className="group block rounded-lg -m-2 p-2 text-left outline-none transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-accent-muted"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="p-2">{body}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
