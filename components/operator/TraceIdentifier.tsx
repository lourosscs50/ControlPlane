import { CorrelationLink } from "@/components/operator/CorrelationLink";
import { CopyButton } from "@/components/operator/CopyButton";

type Props = {
  /** SignalForge alert id (ChronoFlow `alertId`); trace hub key — not W3C trace. */
  alertEntityId?: string;
  /** @deprecated Use `alertEntityId`. */
  correlationId?: string;
  /** When set, link text uses this instead of full id (e.g. truncated table cell). */
  displayText?: string;
  className?: string;
  /** Hide the field label (e.g. dashboard table cells). */
  showLabel?: boolean;
  copyButtonLabel?: string;
};

/**
 * Alert id used as ControlPlane trace hub key: visible, copyable, opens `/trace/[alertEntityId]`.
 */
export function TraceIdentifier({
  alertEntityId,
  correlationId,
  displayText,
  className,
  showLabel = true,
  copyButtonLabel = "Copy alert id (trace hub key)",
}: Props) {
  const id = (alertEntityId ?? correlationId ?? "").trim();
  if (!id) return null;

  return (
    <div className={`min-w-0 ${className ?? ""}`}>
      {showLabel ? (
        <div className="text-sm text-slate-500">
          Alert id (trace hub key)
        </div>
      ) : null}
      <div className={`flex flex-wrap items-center gap-2 ${showLabel ? "mt-1" : ""}`}>
        <CorrelationLink
          alertEntityId={id}
          className="break-all font-mono text-sm text-accent-muted hover:text-white hover:underline"
        >
          {displayText ?? id}
        </CorrelationLink>
        <CopyButton value={id} label={copyButtonLabel} />
      </div>
    </div>
  );
}
