import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadMatterBilling } from "../../api/matterTabs";
import { BillingSections, MatterTabShell, SectionIssues } from "../../components/matters/MatterTabWidgets";
import { useMatterModuleAccess } from "./useMatterModuleAccess";

export function MatterBillingPage() {
  const { matterId } = useParams();
  const access = useMatterModuleAccess();
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
    if (access.unavailable || !access.canRead) {
      setState((current) => ({ ...current, loading: false, error: access.message || "You do not have access to this matter." }));
      return;
    }
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await loadMatterBilling(matterId);
      setState({ loading: false, error: "", ...data });
    } catch (error) {
      setState({
        loading: false,
        error: error?.status === 403 ? "You do not have access to this matter." : (error?.userMessage || "We could not load this matter right now."),
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
  }, [matterId, access.status, access.unavailable, access.canRead]);

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
