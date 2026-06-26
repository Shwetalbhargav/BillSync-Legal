import { useEffect, useState } from "react";
import { paymentWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import { AgingPanel, PaymentHero, SectionIssues } from "../../components/payments/PaymentWidgets";
import { useBillingModuleAccess } from "../billing/useBillingModuleAccess";

export function ReceivablesAgingPage() {
  const access = useBillingModuleAccess("finance");
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
  if (access.unavailable) return <StateCard state="empty" title="Receivables are not available" message={access.message} />;
  if (!access.canViewInvoices) return <StateCard state="permission" title="Receivables are not available" message="You do not have access to this area." />;
  if (state.status === "error") return <StateCard state="error" title="Receivables need attention" message={state.message} actionLabel="Retry" onAction={load} />;

  return (
    <div className="space-y-6">
      <PaymentHero summary={state.summary} />
      <SectionIssues issues={state.issues} />
      <AgingPanel aging={state.aging} agingByClient={state.agingByClient} />
    </div>
  );
}
