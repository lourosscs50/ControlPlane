"use client";

import { useState } from "react";

export function CopyButton({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const [ok, setOk] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setOk(true);
      setTimeout(() => setOk(false), 1600);
    } catch {
      setOk(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md border border-surface-border bg-surface-raised/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white"
    >
      {ok ? "Copied" : label}
    </button>
  );
}
