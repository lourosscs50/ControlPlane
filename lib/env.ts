/**
 * Server-side configuration. Do not import from client components.
 */
export function getChronoFlowConfig(): {
  baseUrl: string;
  apiKey: string | undefined;
} {
  const baseUrl = process.env.CHRONOFLOW_API_BASE_URL?.replace(/\/$/, "") ?? "";
  const apiKey = process.env.CHRONOFLOW_API_KEY?.trim() || undefined;
  return { baseUrl, apiKey };
}

export function getSignalForgeConfig(): {
  baseUrl: string;
  /** Bearer token for endpoints that require JWT (e.g. GET /alerts/metrics). */
  apiToken: string | undefined;
} {
  const baseUrl = process.env.SIGNALFORGE_API_BASE_URL?.replace(/\/$/, "") ?? "";
  const apiToken = process.env.SIGNALFORGE_API_TOKEN?.trim() || undefined;
  return { baseUrl, apiToken };
}

export function getAilConfig(): {
  baseUrl: string;
  apiKey: string | undefined;
} {
  const baseUrl = process.env.AIL_API_BASE_URL?.replace(/\/$/, "") ?? "";
  const apiKey = process.env.AIL_API_KEY?.trim() || undefined;
  return { baseUrl, apiKey };
}
