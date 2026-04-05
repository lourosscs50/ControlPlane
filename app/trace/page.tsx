import Link from "next/link";
import { TraceLookupForm } from "@/app/trace/TraceLookupForm";

export default function TraceIndexPage() {
  return (
    <div>
      <header className="border-b border-surface-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-muted">
          Trace
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-white">
          Open trace or detail from id
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Paste a{" "}
          <span className="font-medium text-slate-300">
            ChronoFlow execution instance id
          </span>{" "}
          or a{" "}
          <span className="font-medium text-slate-300">
            SignalForge alert entity id
          </span>{" "}
          (trace hub key; same as ChronoFlow <code className="text-slate-400">alertId</code>
          ) — no writes, navigation only. Prefer explicit mode when you already know which
          kind of id you have.
        </p>
      </header>

      <TraceLookupForm />

      <p className="mt-10 text-sm text-slate-500">
        Tip: from the{" "}
        <Link href="/" className="text-accent-muted hover:text-white">
          executions
        </Link>
        ,{" "}
        <Link href="/decisions" className="text-accent-muted hover:text-white">
          decisions
        </Link>
        , or{" "}
        <Link href="/analytics" className="text-accent-muted hover:text-white">
          analytics
        </Link>{" "}
        views, use alert / execution links and charts to jump here with context. For
        SignalForge decision rows, use{" "}
        <Link href="/decisions" className="text-accent-muted hover:text-white">
          /decisions?correlationId=…
        </Link>{" "}
        (signal entity id; legacy wire name) or{" "}
        <code className="text-slate-400">executionId=…</code> (alert entity id; legacy wire name).
      </p>
    </div>
  );
}
