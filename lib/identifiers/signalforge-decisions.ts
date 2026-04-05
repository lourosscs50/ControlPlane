import { decisionsListPath, type DecisionsListQuery } from "@/lib/routes/operator";

/**
 * Build `/decisions` query for the SignalForge **signal** entity id.
 * Wire query param remains `correlationId` for API backward compatibility.
 */
export function decisionsListForSignalEntity(
  signalEntityId: string,
  extra?: Omit<DecisionsListQuery, "correlationId">
): string {
  return decisionsListPath({ ...extra, correlationId: signalEntityId });
}

/**
 * Build `/decisions` query for the SignalForge **alert** entity id.
 * Wire query param remains `executionId` for API backward compatibility.
 */
export function decisionsListForAlertEntity(
  alertEntityId: string,
  extra?: Omit<DecisionsListQuery, "executionId">
): string {
  return decisionsListPath({ ...extra, executionId: alertEntityId });
}
