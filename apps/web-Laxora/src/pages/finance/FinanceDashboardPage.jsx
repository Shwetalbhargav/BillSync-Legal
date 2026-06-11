import { useEffect, useState } from "react";
import { financeWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import {
  AgingSummary,
  FinanceHero,
  FinanceListCard,
  KpiGrid,
  SectionIssues,
} from "../../components/finance/FinanceWidgets";

export function FinanceDashboardPage() {
  const [state, setState] = useState({ status: "loading", kpi: {}, paymentSummary: {}, aging: {}, revenueByClient: [], monthlyRevenue: [], wipByClient: [], utilizationTrend: [], issues: [], message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await financeWorkspaceApi.loadDashboard();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", kpi: {}, paymentSummary: {}, aging: {}, revenueByClient: [], monthlyRevenue: [], wipByClient: [], utilizationTrend: [], issues: [], message: error?.userMessage || "We could not load finance details right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Finance needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <FinanceHero kpi={state.kpi} paymentSummary={state.paymentSummary} />
      <SectionIssues issues={state.issues} />
      <KpiGrid kpi={state.kpi} />
      <AgingSummary aging={state.aging} />
      <div className="grid gap-6 xl:grid-cols-2">
        <FinanceListCard emptyText="No revenue found" rows={state.monthlyRevenue} title="Revenue trend" />
        <FinanceListCard emptyText="No client revenue found" rows={state.revenueByClient} title="Revenue by client" />
        <FinanceListCard emptyText="No work in progress found" rows={state.wipByClient} title="Work in progress by client" valueLabel="Unbilled work" />
        <FinanceListCard emptyText="No utilization found" rows={state.utilizationTrend} title="Utilization trend" valueLabel="Utilization" valueType="percent" />
      </div>
    </div>
  );
}
