import { useEffect, useMemo, useState } from "react";
import { billingApi } from "../../api/billing";
import { SkeletonBlock, StateCard } from "../../components/common";
import { BillableFilters, BillablesTable, BillingHero, SectionIssues } from "../../components/billing/BillingWidgets";

const emptyFilters = {
  status: "",
  clientId: "",
  caseId: "",
};

function cleanFilters(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
}

export function BillablesPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [state, setState] = useState({ status: "loading", billables: [], clients: [], matters: [], issues: [], message: "" });

  async function load(nextFilters = filters) {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await billingApi.loadBillables(cleanFilters(nextFilters));
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", billables: [], clients: [], matters: [], issues: [], message: error?.userMessage || "We could not load billable work right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateFilter(field, value) {
    const next = { ...filters, [field]: value };
    setFilters(next);
    load(next);
  }

  function resetFilters() {
    setFilters(emptyFilters);
    load(emptyFilters);
  }

  const totals = useMemo(() => {
    const amount = state.billables.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const pendingCount = state.billables.filter((item) => item.status === "pending").length;
    return { amount, pendingCount };
  }, [state.billables]);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Billables need attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <BillingHero amount={totals.amount} count={state.billables.length} pendingCount={totals.pendingCount} />
      <SectionIssues issues={state.issues} />
      <BillableFilters clients={state.clients} filters={filters} matters={state.matters} onChange={updateFilter} onReset={resetFilters} />
      <BillablesTable billables={state.billables} />
    </div>
  );
}
