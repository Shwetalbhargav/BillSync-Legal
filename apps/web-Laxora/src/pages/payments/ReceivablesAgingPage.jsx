import { useEffect, useState } from "react";
import { paymentWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import { AgingPanel, PaymentHero, SectionIssues } from "../../components/payments/PaymentWidgets";

export function ReceivablesAgingPage() {
  const [state, setState] = useState({ status: "loading", payments: [], invoices: [], summary: {}, aging: {}, agingByClient: [], issues: [], message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await paymentWorkspaceApi.loadDashboard();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", payments: [], invoices: [], summary: {}, aging: {}, agingByClient: [], issues: [], message: error?.userMessage || "We could not load receivables right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Receivables need attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <PaymentHero summary={state.summary} />
      <SectionIssues issues={state.issues} />
      <AgingPanel aging={state.aging} agingByClient={state.agingByClient} />
    </div>
  );
}
