import type { ControlExecutionRecord } from "@/lib/chronoflow/types";

function pick(
  raw: Record<string, string | string[] | undefined>,
  k: string
): string | undefined {
  const v = raw[k];
  return typeof v === "string" ? v : undefined;
}

/** YYYY-MM-DD */
function isDay(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function defaultAnalyticsRangeUtc(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 14);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function parseAnalyticsRange(
  raw: Record<string, string | string[] | undefined>
): { from: string; to: string } {
  const fromRaw = pick(raw, "from")?.trim() ?? "";
  const toRaw = pick(raw, "to")?.trim() ?? "";
  if (isDay(fromRaw) && isDay(toRaw)) {
    return { from: fromRaw, to: toRaw };
  }
  return defaultAnalyticsRangeUtc();
}

export function filterExecutionsByReceivedUtc(
  rows: ControlExecutionRecord[],
  fromDay: string,
  toDay: string
): ControlExecutionRecord[] {
  const fromT = new Date(fromDay + "T00:00:00.000Z").getTime();
  const toT = new Date(toDay + "T23:59:59.999Z").getTime();
  return rows.filter((r) => {
    const t = new Date(r.receivedAtUtc).getTime();
    if (!Number.isFinite(t)) return false;
    if (Number.isFinite(fromT) && t < fromT) return false;
    if (Number.isFinite(toT) && t > toT) return false;
    return true;
  });
}

export function signalForgeCreatedUtcRange(fromDay: string, toDay: string): {
  fromCreatedUtc: string;
  toCreatedUtc: string;
} {
  return {
    fromCreatedUtc: `${fromDay}T00:00:00.000Z`,
    toCreatedUtc: `${toDay}T23:59:59.999Z`,
  };
}
