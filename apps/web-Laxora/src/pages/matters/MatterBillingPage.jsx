import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadMatterBilling } from "../../api/matterTabs";
import { BillingSections, MatterTabShell, SectionIssues } from "../../components/matters/MatterTabWidgets";

export function MatterBillingPage() {
  const { matterId } = useParams();
  const [state, setState] = useState({
    loading: true,
    error: "",
    matter: null,
    rollup: null,
    billables: [],
    invoices: [],
    payments: [],
    timeEntries: [],
    issues: [],
  });

  async function load() {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await loadMatterBilling(matterId);
      setState({ loading: false, error: "", ...data });
    } catch (error) {
      setState({
        loading: false,
        error: error?.userMessage || "We could not load this matter right now.",
        matter: null,
        rollup: null,
        billables: [],
        invoices: [],
        payments: [],
        timeEntries: [],
        issues: [],
      });
    }
  }

  useEffect(() => {
    load();
  }, [matterId]);

  return (
    <MatterTabShell activeTab="billing" error={state.error} loading={state.loading} matter={state.matter} onRetry={load}>
      <SectionIssues issues={state.issues} />
      <BillingSections
        billables={state.billables}
        invoices={state.invoices}
        payments={state.payments}
        rollup={state.rollup}
        timeEntries={state.timeEntries}
      />
    </MatterTabShell>
  );
}
