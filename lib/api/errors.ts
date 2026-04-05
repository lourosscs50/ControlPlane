/** Normalized read-only API failures for operator-facing messages. */
export type ApiSource = "chronoflow" | "signalforge" | "ail";

export class ControlPlaneApiError extends Error {
  constructor(
    message: string,
    public readonly source: ApiSource,
    public readonly status: number,
    public readonly body?: string
  ) {
    super(message);
    this.name = "ControlPlaneApiError";
  }
}

export function isControlPlaneApiError(e: unknown): e is ControlPlaneApiError {
  return e instanceof ControlPlaneApiError;
}
