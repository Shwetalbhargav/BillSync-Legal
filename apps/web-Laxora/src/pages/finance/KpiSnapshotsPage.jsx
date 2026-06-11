import { useEffect, useState } from "react";
import { financeWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import { FinanceListCard, FinanceHero, SectionIssues, SnapshotTable } from "../../components/finance/FinanceWidgets";

export function KpiSnapshotsPage() {
  const [state, setState] = useState({ status: "loading", snapshots: [], revenueTrend: [], issues: [], message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await financeWorkspaceApi.loadSnapshots();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", snapshots: [], revenueTrend: [], issues: [], message: error?.userMessage || "We could not load saved finance snapshots right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Snapshots need attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <FinanceHero kpi={{}} paymentSummary={{}} />
      <SectionIssues issues={state.issues} />
      <FinanceListCard emptyText="No revenue trend found" rows={state.revenueTrend} title="Revenue trend" />
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Saved finance snapshots</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Monthly snapshots keep firm finance reviews consistent.</p>
        <div className="mt-4">
          <SnapshotTable snapshots={state.snapshots} />
        </div>
      </section>
    </div>
  );
}
