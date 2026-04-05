/** Prevent open redirects — only same-origin relative paths. */
export function safeDashboardReturn(raw: string | undefined): string {
  if (!raw || typeof raw !== "string") return "/";
  let path: string;
  try {
    path = decodeURIComponent(raw.trim());
  } catch {
    return "/";
  }
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path.slice(0, 4096);
}
