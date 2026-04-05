import type { DecisionVisibilityResponse } from "./decision-visibility";
import { ailExecutionDetailPath, decisionDetailPath } from "@/lib/routes/operator";

/** Max rows pulled per backend before merge when sourceSystem=all (honest bounded snapshot). */
export const unifiedMergeCapPerSource = 250;

export type DecisionSourceSystem = "signalforge" | "ail";

export type UnifiedDecisionListRow = {
  sourceSystem: DecisionSourceSystem;
  visibility: DecisionVisibilityResponse;
};

export function detailPathForUnifiedRow(row: UnifiedDecisionListRow): string {
  return row.sourceSystem === "ail"
    ? ailExecutionDetailPath(row.visibility.decisionId)
    : decisionDetailPath(row.visibility.decisionId);
}

export function mergeAndPaginateUnifiedDecisions(
  sfItems: DecisionVisibilityResponse[] | null,
  ailItems: DecisionVisibilityResponse[] | null,
  page: number,
  pageSize: number
): { rows: UnifiedDecisionListRow[]; totalCount: number } {
  const tagged: UnifiedDecisionListRow[] = [
    ...(sfItems ?? []).map((visibility) => ({
      sourceSystem: "signalforge" as const,
      visibility,
    })),
    ...(ailItems ?? []).map((visibility) => ({
      sourceSystem: "ail" as const,
      visibility,
    })),
  ];
  tagged.sort(
    (a, b) =>
      new Date(b.visibility.occurredAtUtc).getTime() -
      new Date(a.visibility.occurredAtUtc).getTime()
  );
  const totalCount = tagged.length;
  const p = page < 1 ? 1 : page;
  const start = (p - 1) * pageSize;
  const rows = tagged.slice(start, start + pageSize);
  return { rows, totalCount };
}

export function pickDecisionsSourceSystem(
  raw: string | undefined,
  sfAuthed: boolean,
  ailReachable: boolean
): "all" | "signalforge" | "ail" {
  const v = raw?.toLowerCase().trim();
  if (v === "signalforge" && sfAuthed) return "signalforge";
  if (v === "ail" && ailReachable) return "ail";
  if (v === "all" && sfAuthed && ailReachable) return "all";
  if (sfAuthed && ailReachable) return "all";
  if (sfAuthed) return "signalforge";
  return "ail";
}
