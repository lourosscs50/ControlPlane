/**
 * Mirrors ChronoFlow `ControlExecutionRecordResponse` JSON (camelCase).
 */
export type ControlExecutionRecord = {
  id: string;
  triggerType: string;
  lifecycleEventType: string;
  alertId: string;
  ruleId: string;
  signalId: string;
  workflowKey: string | null;
  wasExecuted: boolean;
  wasSuppressed: boolean;
  suppressionReason: string | null;
  executedStepCount: number;
  receivedAtUtc: string;
  executedAtUtc: string | null;
  currentStatus: string;
  advisoryWasUsed: boolean;
  advisoryStrategyKey: string | null;
  advisoryConfidence: string | null;
  advisoryReasonSummary: string | null;
};

export type ExecutionListQuery = {
  alertId?: string;
  lifecycleEventType?: string;
  wasExecuted?: boolean;
  wasSuppressed?: boolean;
  workflowKey?: string;
  skip?: number;
  take?: number;
};
