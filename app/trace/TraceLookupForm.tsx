"use client";

import { useActionState, useEffect, useRef } from "react";
import type { TraceLookupFormState } from "@/app/trace/actions";
import { traceLookupAction } from "@/app/trace/actions";

export function TraceLookupForm() {
  const firstField = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState<
    TraceLookupFormState,
    FormData
  >(traceLookupAction, null);

  useEffect(() => {
    firstField.current?.focus();
  }, []);

  return (
    <form action={formAction} className="mt-8 max-w-xl space-y-6">
      <div>
        <label
          htmlFor="trace-id"
          className="block text-sm font-medium text-slate-300"
        >
          Id
        </label>
        <input
          ref={firstField}
          id="trace-id"
          name="id"
          type="text"
          autoComplete="off"
          placeholder="e.g. ChronoFlow execution UUID or SignalForge alert id"
          className="mt-2 w-full rounded-lg border border-surface-border bg-black/35 px-3 py-2.5 font-mono text-sm text-white placeholder:text-slate-600 focus:border-accent-muted focus:outline-none focus:ring-1 focus:ring-accent-muted"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-slate-300">Open as</legend>
        <div className="space-y-2 text-sm text-slate-400">
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="radio"
              name="mode"
              value="auto"
              defaultChecked
              className="mt-1"
            />
            <span>
              <span className="font-medium text-slate-200">Auto</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                UUIDs are looked up as execution ids in ChronoFlow first; if not
                found, opens trace as correlation. Non-UUID values always open
                trace.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" name="mode" value="execution" className="mt-0.5" />
            <span className="font-medium text-slate-200">Execution id</span>
            <span className="text-xs text-slate-500">
              (ChronoFlow — <code className="text-slate-400">/executions/…</code>)
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" name="mode" value="correlation" className="mt-0.5" />
            <span className="font-medium text-slate-200">Alert entity id (trace hub)</span>
            <span className="text-xs text-slate-500">
              (SignalForge alert = ChronoFlow <code className="text-slate-400">alertId</code> —{" "}
              <code className="text-slate-400">/trace/…</code>)
            </span>
          </label>
        </div>
      </fieldset>

      {state?.error ? (
        <p className="rounded-lg border border-rose-900/60 bg-rose-950/35 px-3 py-2 text-sm text-rose-100">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Opening…" : "Go"}
      </button>
    </form>
  );
}
