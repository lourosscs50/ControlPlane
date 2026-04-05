import type { ReactNode } from "react";
import Link from "next/link";
import { operatorTraceHubPathForAlert } from "@/lib/identifiers/cross-system";

type Props = {
  /**
   * SignalForge alert aggregate id (same as ChronoFlow `alertId`).
   * Opens the ControlPlane trace hub — not a W3C trace thread route.
   */
  alertEntityId?: string;
  /**
   * @deprecated Use `alertEntityId`. Same value; kept for incremental migration.
   */
  correlationId?: string;
  children?: ReactNode;
  className?: string;
};

/**
 * Link to the ControlPlane trace hub (`/trace/[alertEntityId]`).
 */
export function CorrelationLink({
  alertEntityId,
  correlationId,
  children,
  className,
}: Props) {
  const id = (alertEntityId ?? correlationId ?? "").trim();
  if (!id) return null;

  return (
    <Link
      href={operatorTraceHubPathForAlert(id)}
      className={
        className ??
        "font-mono text-sm text-accent-muted hover:text-white hover:underline"
      }
    >
      {children ?? id}
    </Link>
  );
}
