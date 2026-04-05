import Link from "next/link";
import type { DecisionInsightViewModel } from "@/lib/operator/decision-insight-model";

export function DecisionCrossSystemNav({
  links,
}: {
  links: DecisionInsightViewModel["navigation"];
}) {
  return (
    <section className="rounded-xl border border-surface-border bg-surface-raised/50 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Cross-system navigation
      </h2>
      <p className="mt-1 text-xs text-slate-600">
        Links use explicit ids from this decision row only. No inferred ChronoFlow or A.I.L. ids.
      </p>
      {!links.length ? (
        <p className="mt-4 text-sm text-slate-500">
          No navigation targets are available from this record (missing alert id, trace id, and
          linked execution ids).
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {links.map((l) => (
            <li key={l.href + l.label}>
              <Link
                href={l.href}
                className="text-sm font-medium text-accent-muted hover:text-white"
              >
                {l.label}
              </Link>
              {l.qualifierNote ? (
                <p className="mt-1 text-xs text-slate-600">{l.qualifierNote}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
