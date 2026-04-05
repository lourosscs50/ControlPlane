"use server";

import { redirect } from "next/navigation";
import { getExecutionById } from "@/lib/api/chronoflow";
import { tracePath } from "@/lib/correlation";
import { getChronoFlowConfig } from "@/lib/env";
import { isUuid } from "@/lib/operator/dashboard-params";
import { executionDetailPath } from "@/lib/routes/operator";

export type TraceLookupFormState = {
  error?: string;
} | null;

export type TraceIdMode = "auto" | "execution" | "correlation";

export async function traceLookupAction(
  _prev: TraceLookupFormState,
  formData: FormData
): Promise<TraceLookupFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const mode = String(formData.get("mode") ?? "auto") as TraceIdMode;

  if (!id) {
    return { error: "Enter a ChronoFlow execution id or a correlation (alert) id." };
  }

  if (mode === "execution") {
    redirect(executionDetailPath(id));
  }

  if (mode === "correlation") {
    redirect(tracePath(id));
  }

  if (!isUuid(id)) {
    redirect(tracePath(id));
  }

  const { baseUrl } = getChronoFlowConfig();
  if (!baseUrl) {
    return {
      error:
        "Auto-detection needs CHRONOFLOW_API_BASE_URL. Choose “Execution id” or “Correlation id” explicitly, or configure ChronoFlow.",
    };
  }

  try {
    const row = await getExecutionById(id);
    if (row) {
      redirect(executionDetailPath(id));
    }
  } catch {
    return {
      error:
        "ChronoFlow could not resolve this UUID. Check connectivity or choose an explicit id type.",
    };
  }

  redirect(tracePath(id));
}
