import type { ReactNode } from "react";

/**
 * Minimal read-only section shell for operator detail surfaces.
 * `related` is visually de-emphasized vs primary panels (tone only — same information hierarchy).
 */
export function OperatorPanel({
  title,
  children,
  tone = "default",
}: {
  title: string;
  children: ReactNode;
  tone?: "default" | "related";
}) {
  const shell =
    tone === "related"
      ? "rounded-xl border border-dashed border-surface-border/70 bg-surface-raised/25 p-5"
      : "rounded-xl border border-surface-border bg-surface-raised/50 p-5";

  return (
    <section className={shell}>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
