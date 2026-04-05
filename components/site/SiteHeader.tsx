import Link from "next/link";

const link =
  "text-sm font-medium text-slate-400 hover:text-white transition-colors";

export function SiteHeader() {
  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-surface-border pb-5">
      <Link href="/" className="text-sm font-semibold text-white hover:text-accent-muted">
        ControlPlane
      </Link>
      <nav className="flex flex-wrap gap-6" aria-label="Primary">
        <Link href="/" className={link}>
          Executions
        </Link>
        <Link href="/analytics" className={link}>
          Analytics
        </Link>
        <Link href="/decisions" className={link}>
          Decisions
        </Link>
        <Link href="/trace" className={link}>
          Trace lookup
        </Link>
      </nav>
    </header>
  );
}
