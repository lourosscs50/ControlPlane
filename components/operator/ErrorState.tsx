"use client";

import { useRouter } from "next/navigation";
import { ChronoFlowApiError } from "@/lib/api/chronoflow";
import { isControlPlaneApiError } from "@/lib/api/errors";

function formatOperatorError(error: unknown): string {
  if (error instanceof ChronoFlowApiError) {
    return `${error.message}${error.status ? ` (HTTP ${error.status})` : ""}`;
  }
  if (isControlPlaneApiError(error)) {
    return `${error.message}${error.status ? ` (HTTP ${error.status})` : ""}`;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

function operatorErrorBody(error: unknown): string | undefined {
  if (error instanceof ChronoFlowApiError && error.body) return error.body;
  if (isControlPlaneApiError(error) && error.body) return error.body;
  return undefined;
}

export function ErrorState({
  error,
  title = "Failed to load executions",
}: {
  error: unknown;
  title?: string;
}) {
  const router = useRouter();
  const msg = formatOperatorError(error);
  const body = operatorErrorBody(error);

  return (
    <div
      className="rounded-xl border border-rose-900/70 bg-rose-950/35 px-6 py-5 text-rose-50 shadow-sm"
      role="alert"
    >
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm opacity-90">{msg}</p>
      {body ? (
        <details className="mt-4 text-xs opacity-80">
          <summary className="cursor-pointer">Response details</summary>
          <pre className="mt-2 max-h-36 overflow-auto rounded bg-black/35 p-2">
            {body}
          </pre>
        </details>
      ) : null}
      <button
        type="button"
        onClick={() => router.refresh()}
        className="mt-5 rounded-lg bg-rose-900/80 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
      >
        Retry
      </button>
    </div>
  );
}
