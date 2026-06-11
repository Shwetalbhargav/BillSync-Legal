import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { invoiceWorkspaceApi } from "../../api/invoiceWorkspace";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import { InvoiceFilters, InvoiceHero, InvoiceTable, PipelineSummary, SectionIssues } from "../../components/invoices/InvoiceWidgets";

const emptyFilters = { status: "", clientId: "", caseId: "" };

function cleanFilters(filters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
}

export function InvoiceListPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [state, setState] = useState({ status: "loading", invoices: [], pipeline: [], pendingByClient: [], clients: [], matters: [], issues: [], message: "" });

  async function load(nextFilters = filters) {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await invoiceWorkspaceApi.loadInvoices(cleanFilters(nextFilters));
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", invoices: [], pipeline: [], pendingByClient: [], clients: [], matters: [], issues: [], message: error?.userMessage || "We could not load invoices right now." });
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

  const totals = useMemo(() => ({
    total: state.invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
    draftCount: state.invoices.filter((invoice) => invoice.status === "draft").length,
  }), [state.invoices]);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Invoices need attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <InvoiceHero count={state.invoices.length} draftCount={totals.draftCount} total={totals.total} />
      <div className="flex justify-end">
        <Link to="/app/invoices/new">
          <Button type="button">
            <Plus className="h-4 w-4" />
            New invoice
          </Button>
        </Link>
      </div>
      <SectionIssues issues={state.issues} />
      <InvoiceFilters clients={state.clients} filters={filters} matters={state.matters} onChange={updateFilter} onReset={resetFilters} />
      <InvoiceTable invoices={state.invoices} />
      <PipelineSummary pendingByClient={state.pendingByClient} pipeline={state.pipeline} />
    </div>
  );
}
