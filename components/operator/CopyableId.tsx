"use client";

import Link from "next/link";
import { CopyButton } from "@/components/operator/CopyButton";

type Props = {
  value: string;
  copyLabel: string;
  href?: string;
  className?: string;
  monospaceClassName?: string;
};

/**
 * Read-only id display with clipboard action and optional deep-link.
 */
export function CopyableId({
  value,
  copyLabel,
  href,
  className,
  monospaceClassName,
}: Props) {
  const mono =
    monospaceClassName ??
    "break-all font-mono text-sm text-slate-200 whitespace-pre-wrap";

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-2 min-w-0 ${className ?? ""}`}
    >
      {href ? (
        <Link
          href={href}
          className={`${mono} text-accent-muted hover:text-white hover:underline`}
        >
          {value}
        </Link>
      ) : (
        <span className={mono}>{value}</span>
      )}
      <CopyButton value={value} label={copyLabel} />
    </span>
  );
}
