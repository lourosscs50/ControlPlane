import { DashboardSkeleton } from "@/components/operator/DashboardSkeleton";
import { FilterBarSkeleton } from "@/components/operator/FilterBarSkeleton";

export default function Loading() {
  return (
    <>
      <header className="border-b border-surface-border pb-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent-muted">
          ControlPlane
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-white">
          Control executions
        </h1>
      </header>
      <section className="mt-8 space-y-6">
        <FilterBarSkeleton />
        <DashboardSkeleton />
      </section>
    </>
  );
}
