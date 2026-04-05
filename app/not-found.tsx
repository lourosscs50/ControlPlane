import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-2xl font-semibold text-white">Not found</h1>
      <p className="mt-2 text-slate-400">
        This execution record does not exist or is no longer available.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm font-medium text-accent-muted hover:text-white"
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
