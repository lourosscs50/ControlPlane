import Link from "next/link";
import { notFound } from "next/navigation";
import { AilExecutionExtensionPanel } from "@/components/decisions/AilExecutionExtensionPanel";
import { DecisionVisibilityPanels } from "@/components/decisions/DecisionVisibilityPanels";
import { ErrorState } from "@/components/operator/ErrorState";
import { getDecision } from "@/lib/api/signalforge";
import { getSignalForgeConfig } from "@/lib/env";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DecisionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { baseUrl, apiToken } = getSignalForgeConfig();

  if (!baseUrl) {
    return (
      <div>
        <BackLink />
        <div className="mt-6">
          <ErrorState
            title="Configuration error"
            error={new Error("SIGNALFORGE_API_BASE_URL is not configured.")}
          />
        </div>
      </div>
    );
  }

  if (!apiToken) {
    return (
      <div>
        <BackLink />
        <p
          className="mt-6 rounded-lg border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200"
          role="status"
        >
          Configure{" "}
          <code className="rounded bg-black/40 px-1">SIGNALFORGE_API_TOKEN</code>{" "}
          to load decision detail.
        </p>
      </div>
    );
  }

  let detail: Awaited<ReturnType<typeof getDecision>> = null;
  let error: unknown = null;
  try {
    detail = await getDecision(id);
  } catch (e) {
    error = e;
  }

  if (error) {
    return (
      <div>
        <BackLink />
        <div className="mt-6">
          <ErrorState title="Failed to load decision" error={error} />
        </div>
      </div>
    );
  }

  if (!detail) notFound();

  const d = detail;

  return (
    <div>
      <BackLink />

      <header className="mt-4 border-b border-surface-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Decision detail
        </p>
        <h1 className="mt-2 break-all font-mono text-xl text-white sm:text-2xl">
          {d.decisionType}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{d.decisionCategory}</p>
      </header>

      <DecisionVisibilityPanels d={d} traceSemantics="signalforge" />

      {d.executionExtension ? (
        <div className="mt-8">
          <AilExecutionExtensionPanel ext={d.executionExtension} />
        </div>
      ) : null}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/decisions"
      className="inline-flex items-center text-sm font-medium text-accent-muted hover:text-white"
    >
      ← Decisions
    </Link>
  );
}
