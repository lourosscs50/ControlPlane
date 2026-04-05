import type { ExecutionVisibilityExtension } from "@/lib/api/decision-visibility";
import { OperatorPanel } from "@/components/operator/OperatorPanel";

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

function opt(v: string | null | undefined): string {
  const t = v?.trim();
  return t ? t : "—";
}

function optBool(b: boolean): string {
  return b ? "Yes" : "No";
}

/**
 * Secondary, A.I.L.-only bounded metadata. Does not replace shared decision visibility fields.
 */
export function AilExecutionExtensionPanel({
  ext,
}: {
  ext: ExecutionVisibilityExtension;
}) {
  const r = ext.reliability;
  const fallbackTarget =
    r.fallbackUsed && (r.fallbackProviderKey || r.fallbackModelKey)
      ? `${opt(r.fallbackProviderKey)} / ${opt(r.fallbackModelKey)}`
      : "—";

  return (
    <OperatorPanel title="A.I.L. execution metadata (bounded)">
      <p className="mb-4 text-xs text-slate-500">
        Operator-safe fields from the backend extension only. No prompt templates, raw
        memory payloads, or chain-of-thought.
      </p>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Prompt registry
          </p>
          <div className="space-y-2">
            <Field label="Prompt key" value={opt(ext.prompt.promptKey)} />
            <Field label="Prompt version" value={opt(ext.prompt.promptVersion)} />
            <Field
              label="Resolution succeeded"
              value={optBool(ext.prompt.resolutionSucceeded)}
            />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Memory participation
          </p>
          <div className="space-y-2">
            <Field
              label="Memory requested"
              value={optBool(ext.memory.memoryRequested)}
            />
            <Field
              label="Memory item count"
              value={
                ext.memory.memoryItemCount != null
                  ? String(ext.memory.memoryItemCount)
                  : "—"
              }
            />
            <Field
              label="Participation summary"
              value={opt(ext.memory.participationSummary)}
            />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Provider / reliability
          </p>
          <div className="space-y-2">
            <Field label="Fallback used" value={optBool(r.fallbackUsed)} />
            <Field label="Fallback target" value={fallbackTarget} />
            <Field label="Primary provider" value={`${opt(r.primaryProviderKey)} / ${opt(r.primaryModelKey)}`} />
            <Field
              label="Selected provider"
              value={`${opt(r.selectedProviderKey)} / ${opt(r.selectedModelKey)}`}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Field
            label="Started (UTC)"
            value={opt(ext.startedAtUtc)}
          />
          <Field label="Safe error summary" value={opt(ext.safeErrorSummary)} />
        </div>
      </div>
    </OperatorPanel>
  );
}
