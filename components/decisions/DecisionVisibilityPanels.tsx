import Link from "next/link";
import { CopyableId } from "@/components/operator/CopyableId";
import { CorrelationLink } from "@/components/operator/CorrelationLink";
import type { DecisionVisibilityResponse } from "@/lib/api/decision-visibility";
import {
  alertEntityIdFromDecision,
  signalEntityIdFromDecision,
} from "@/lib/identifiers/decision-trace";
import { decisionsListForSignalEntity } from "@/lib/identifiers/signalforge-decisions";

export type DecisionTraceSemantics = "signalforge" | "ail";

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-surface-border bg-surface-raised/50 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-baseline">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="break-words font-mono text-sm text-slate-200 whitespace-pre-wrap">
        {value}
      </div>
    </div>
  );
}

function formatIso(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "full",
      timeStyle: "medium",
    });
  } catch {
    return iso;
  }
}

/**
 * Shared decision visibility body: renders backend summaries as-is (no client-side reinterpretation).
 */
export function DecisionVisibilityPanels({
  d,
  traceSemantics,
}: {
  d: DecisionVisibilityResponse;
  traceSemantics: DecisionTraceSemantics;
}) {
  const inputText = d.input?.normalizedSummary ?? "—";
  const outputText = d.output?.resultSummary ?? "—";
  const traceThread = d.trace.traceId?.trim() ? d.trace.traceId : null;

  const sig =
    traceSemantics === "signalforge"
      ? signalEntityIdFromDecision(d)
      : null;
  const alertId =
    traceSemantics === "signalforge"
      ? alertEntityIdFromDecision(d)
      : null;

  const execInst = d.trace.executionInstanceId?.trim()
    ? d.trace.executionInstanceId
    : null;
  const execLabel =
    traceSemantics === "ail" || d.decisionCategory.startsWith("ail.")
      ? "A.I.L. execution instance id"
      : "Execution instance id (cross-system)";

  const ailCorrelation = traceSemantics === "ail" && d.trace.correlationId?.trim()
    ? d.trace.correlationId
    : null;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <Panel title="Summary">
        <div className="space-y-3">
          <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-start">
            <div className="text-sm text-slate-500">Decision id</div>
            <CopyableId value={d.decisionId} copyLabel="Copy decision id" />
          </div>
          <Field label="Type" value={d.decisionType} />
          <Field label="Category" value={d.decisionCategory} />
          <Field label="Status" value={d.status} />
          <Field label="Occurred (UTC)" value={formatIso(d.occurredAtUtc)} />
        </div>
      </Panel>

      <Panel title="Trace">
        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-slate-800/80 bg-black/20 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-400">
              Trace thread (cross-system)
            </p>
            <p className="mt-2">
              {traceThread ? (
                <span className="font-mono text-slate-300">{traceThread}</span>
              ) : (
                <>
                  Not set. When backends propagate a platform trace thread, it
                  appears here as <code className="text-slate-500">traceId</code>
                  .
                </>
              )}
            </p>
          </div>

          {execInst ? (
            <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-start">
              <div className="text-slate-500">{execLabel}</div>
              <CopyableId value={execInst} copyLabel="Copy execution instance id" />
            </div>
          ) : null}

          {ailCorrelation ? (
            <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-start">
              <div className="text-slate-500">Correlation / grouping id</div>
              <div>
                <CopyableId
                  value={ailCorrelation}
                  copyLabel="Copy correlation id"
                />
                <p className="mt-1 text-xs text-slate-600">
                  Optional workflow grouping for A.I.L.; not a SignalForge signal
                  entity id.
                </p>
              </div>
            </div>
          ) : null}

          {traceSemantics === "signalforge" ? (
            <>
              <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-start">
                <div className="text-slate-500">Signal entity id</div>
                <div>
                  {sig ? (
                    <>
                      <CopyableId
                        value={sig}
                        copyLabel="Copy signal id"
                        href={decisionsListForSignalEntity(sig)}
                      />
                      <p className="mt-1 text-xs text-slate-600">
                        API filter param name remains{" "}
                        <code className="text-slate-500">correlationId</code> for
                        backward compatibility.
                      </p>
                    </>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </div>
              </div>
              <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-start">
                <div className="text-slate-500">Alert entity id</div>
                <div>
                  {alertId ? (
                    <>
                      <CorrelationLink alertEntityId={alertId} />
                      <p className="mt-1">
                        <Link
                          href={`/?search=${encodeURIComponent(alertId)}`}
                          className="text-xs text-accent-muted hover:text-white"
                        >
                          Search ChronoFlow executions (dashboard)
                        </Link>
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Opens trace hub (not W3C trace). API filter param name:{" "}
                        <code className="text-slate-500">executionId</code>.
                      </p>
                    </>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-start">
                <div className="text-slate-500">Signal entity id</div>
                <span className="text-slate-500">—</span>
              </div>
              <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-start">
                <div className="text-slate-500">Alert entity id</div>
                <span className="text-slate-500">—</span>
              </div>
              <p className="text-xs text-slate-600">
                SignalForge entity slots are not populated for A.I.L. execution
                visibility rows. Legacy <code className="text-slate-500">executionId</code>{" "}
                on the wire (alert id) is always null here.
              </p>
            </>
          )}

          <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-start">
            <div className="text-slate-500">Related entity ids</div>
            <ul className="list-inside list-disc font-mono text-xs text-slate-300">
              {d.trace.relatedEntityIds?.length ? (
                d.trace.relatedEntityIds.map((x) => <li key={x}>{x}</li>)
              ) : (
                <li className="list-none text-slate-500">—</li>
              )}
            </ul>
          </div>
        </div>
      </Panel>

      <Panel title="Input summary">
        <p className="break-words text-sm text-slate-300 whitespace-pre-wrap">
          {inputText}
        </p>
      </Panel>

      <Panel title="Output summary">
        <p className="break-words text-sm text-slate-300 whitespace-pre-wrap">
          {outputText}
        </p>
      </Panel>

      <Panel title="Explanation">
        <div className="space-y-3 text-sm">
          <Field
            label="Available"
            value={d.explanation.explanationAvailable ? "Yes" : "No"}
          />
          <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-baseline">
            <div className="text-sm text-slate-500">Summary</div>
            <div className="break-words text-slate-300 whitespace-pre-wrap">
              {d.explanation.summaryText?.trim()
                ? d.explanation.summaryText
                : "—"}
            </div>
          </div>
          <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-start">
            <div className="text-sm text-slate-500">Reason codes</div>
            <div>
              {d.explanation.reasonCodes?.length ? (
                <ul className="flex flex-wrap gap-2">
                  {d.explanation.reasonCodes.map((c) => (
                    <li
                      key={c}
                      className="rounded border border-surface-border px-2 py-0.5 font-mono text-xs text-slate-300"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-500">—</span>
              )}
            </div>
          </div>
          <Field
            label="Confidence band"
            value={d.explanation.confidenceBand ?? "—"}
          />
          <Field
            label="Fallback / retry usage"
            value={
              d.explanation.fallbackUsageCount != null ||
              d.explanation.retryUsageCount != null
                ? `fallback: ${d.explanation.fallbackUsageCount ?? "—"} · retry: ${d.explanation.retryUsageCount ?? "—"}`
                : "—"
            }
          />
        </div>
      </Panel>

      <Panel title="Metadata">
        <div className="space-y-3">
          <Field
            label="Recommended downstream"
            value={d.recommendedDownstreamSummary ?? "—"}
          />
          <Field label="Policy / profile" value={d.policyProfileKey ?? "—"} />
          <Field label="Strategy path" value={d.strategyPathKey ?? "—"} />
          <Field label="Provider label" value={d.providerModelSummary ?? "—"} />
          <Field label="Actor" value={d.auditActorUserId ?? "—"} />
        </div>
      </Panel>
    </div>
  );
}
