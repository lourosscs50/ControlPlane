"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  buildDashboardHref,
  parseDashboardParams,
  type DashboardParams,
  type OperatorStatusFilter,
} from "@/lib/operator/dashboard-params";

const lifecycleOptions = [
  { value: "", label: "Any lifecycle" },
  { value: "AlertCreated", label: "AlertCreated" },
  { value: "AlertReopened", label: "AlertReopened" },
  { value: "AlertAcknowledged", label: "AlertAcknowledged" },
  { value: "AlertResolved", label: "AlertResolved" },
];

const statusOptions: { value: OperatorStatusFilter; label: string }[] = [
  { value: "all", label: "Any status" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed / suppressed" },
  { value: "running", label: "Running / no workflow" },
];

function useDashboardParams(): DashboardParams {
  const sp = useSearchParams();
  return useMemo(() => {
    const raw: Record<string, string | string[] | undefined> = {};
    sp.forEach((v, k) => {
      raw[k] = v;
    });
    return parseDashboardParams(raw);
  }, [sp]);
}

export function OperatorFilterBar() {
  const router = useRouter();
  const p = useDashboardParams();
  const [searchDraft, setSearchDraft] = useState(p.search);
  const [workflowDraft, setWorkflowDraft] = useState(p.workflowKey);

  useEffect(() => {
    setSearchDraft(p.search);
  }, [p.search]);

  useEffect(() => {
    setWorkflowDraft(p.workflowKey);
  }, [p.workflowKey]);

  useEffect(() => {
    const trimmed = searchDraft.trim();
    if (trimmed === p.search) return;
    const id = window.setTimeout(() => {
      router.replace(
        buildDashboardHref(p, { search: trimmed, page: 1 })
      );
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchDraft, p, router]);

  useEffect(() => {
    const trimmed = workflowDraft.trim();
    if (trimmed === p.workflowKey) return;
    const id = window.setTimeout(() => {
      router.replace(
        buildDashboardHref(p, { workflowKey: trimmed, page: 1 })
      );
    }, 300);
    return () => window.clearTimeout(id);
  }, [workflowDraft, p, router]);

  const hasFilters =
    p.status !== "all" ||
    Boolean(p.from || p.to || p.search || p.lifecycleEventType || p.workflowKey);

  function navigate(patch: Partial<DashboardParams>) {
    router.replace(buildDashboardHref(p, { ...patch, page: 1 }));
  }

  return (
    <div className="sticky top-4 z-20 rounded-xl border border-surface-border bg-surface/95 p-4 shadow-lg shadow-black/20 backdrop-blur-md">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-300">Filters</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Field label="Rows / page" className="min-w-[8rem]">
            <select
              value={String(p.pageSize)}
              onChange={(e) =>
                router.replace(
                  buildDashboardHref(p, {
                    pageSize: Number(e.target.value),
                    page: 1,
                  })
                )
              }
              className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          {hasFilters ? (
            <Link
              href="/"
              className="text-xs font-medium text-accent-muted hover:text-white"
            >
              Clear all
            </Link>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Field label="Status">
          <select
            value={p.status}
            onChange={(e) =>
              navigate({
                status: e.target.value as OperatorStatusFilter,
              })
            }
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Received from">
          <input
            type="date"
            value={p.from}
            onChange={(e) => navigate({ from: e.target.value })}
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
          />
        </Field>
        <Field label="Received to">
          <input
            type="date"
            value={p.to}
            onChange={(e) => navigate({ to: e.target.value })}
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
          />
        </Field>
        <Field
          label="Search (execution id / alert id)"
          hint="300ms debounce — UUID tries ChronoFlow execution first, then alert id"
        >
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Execution or alert GUID…"
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white placeholder:text-slate-600"
          />
        </Field>
        <Field label="Lifecycle">
          <select
            value={p.lifecycleEventType}
            onChange={(e) =>
              navigate({ lifecycleEventType: e.target.value })
            }
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white"
          >
            {lifecycleOptions.map((o) => (
              <option key={o.value || "any"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Workflow key" hint="300ms debounce">
          <input
            value={workflowDraft}
            onChange={(e) => setWorkflowDraft(e.target.value)}
            placeholder="e.g. alert-created-default"
            className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white placeholder:text-slate-600"
          />
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      {children}
      {hint ? <p className="text-[10px] text-slate-600">{hint}</p> : null}
    </div>
  );
}
