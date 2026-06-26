import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Sparkles } from "lucide-react";
import { invoicesApi } from "../../api/invoices";
import { invoiceWorkspaceApi } from "../../api/invoiceWorkspace";
import { useAuth } from "../../auth/AuthProvider";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import { ClientWiseInvoiceDashboard, InvoiceFilters, InvoiceHero, PipelineSummary, SectionIssues } from "../../components/invoices/InvoiceWidgets";
import { useBillingModuleAccess } from "../billing/useBillingModuleAccess";

const emptyFilters = {
  status: "",
  paymentDue: "",
  clientId: "",
  clientName: "",
  caseId: "",
  issuedFrom: "",
  issuedTo: "",
  dueFrom: "",
  dueTo: "",
  month: "",
};

function cleanFilters(filters) {
  const apiFilters = {
    status: filters.status,
    paymentDue: filters.paymentDue,
    clientId: filters.clientId,
    caseId: filters.caseId,
    from: filters.issuedFrom,
    to: filters.issuedTo,
    dueFrom: filters.dueFrom,
    dueTo: filters.dueTo,
  };

  if (filters.month) {
    const [year, month] = filters.month.split("-").map(Number);
    if (year && month) {
      const firstDay = new Date(Date.UTC(year, month - 1, 1));
      const lastDay = new Date(Date.UTC(year, month, 0));
      apiFilters.from = firstDay.toISOString().slice(0, 10);
      apiFilters.to = lastDay.toISOString().slice(0, 10);
    }
  }

  return Object.fromEntries(Object.entries(apiFilters).filter(([, value]) => value));
}

export function InvoiceListPage() {
  const { user } = useAuth();
  const access = useBillingModuleAccess("billing");
  const [filters, setFilters] = useState(emptyFilters);
  const [state, setState] = useState({ status: "loading", invoices: [], pipeline: [], pendingByClient: [], clients: [], matters: [], issues: [], message: "" });
  const [autoCreating, setAutoCreating] = useState(false);

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
    const next = field === "clientId"
      ? { ...filters, clientId: value, caseId: "" }
      : field === "month"
        ? { ...filters, month: value, issuedFrom: "", issuedTo: "" }
        : field === "issuedFrom" || field === "issuedTo"
          ? { ...filters, [field]: value, month: "" }
      : { ...filters, [field]: value };
    setFilters(next);
    load(next);
  }

  function resetFilters() {
    setFilters(emptyFilters);
    load(emptyFilters);
  }

  async function autoCreateFromBillables() {
    setAutoCreating(true);
    setState((current) => ({ ...current, message: "" }));
    try {
      const result = await invoicesApi.autoFromBillables({
        ...(filters.clientId ? { clientId: filters.clientId } : {}),
        ...(user?.id ? { createdBy: user.id } : {}),
      });
      const invoiceResult = result?.data || result;
      const count = invoiceResult?.invoices?.length || 0;
      const billableCount = invoiceResult?.groupedBillables || 0;
      setState((current) => ({
        ...current,
        message: count
          ? `${count} draft invoice${count === 1 ? "" : "s"} created from ${billableCount} approved billable item${billableCount === 1 ? "" : "s"}.`
          : invoiceResult?.message || "No approved unbilled billables found.",
      }));
      await load(filters);
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not auto-create invoices from billables." }));
    } finally {
      setAutoCreating(false);
    }
  }

  const totals = useMemo(() => {
    const visibleInvoices = filters.clientName.trim()
      ? state.invoices.filter((invoice) => invoice.client.toLowerCase().includes(filters.clientName.trim().toLowerCase()))
      : state.invoices;
    const dueInvoices = visibleInvoices.filter((invoice) => ["sent", "partial", "overdue"].includes(invoice.status));
    return {
      total: visibleInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
      draftCount: visibleInvoices.filter((invoice) => invoice.status === "draft").length,
      dueCount: dueInvoices.length,
      dueTotal: dueInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
      visibleInvoices,
    };
  }, [filters.clientName, state.invoices]);

  const filteredMatters = useMemo(
    () => filters.clientId ? state.matters.filter((matter) => matter.clientId === filters.clientId) : state.matters,
    [filters.clientId, state.matters],
  );

  if (state.status === "loading") return <SkeletonBlock />;
  if (access.unavailable) return <StateCard state="empty" title="Invoices are not available" message={access.message} />;
  if (!access.canViewInvoices) return <StateCard state="permission" title="Invoices are not available" message="You do not have access to this area." />;
  if (state.status === "error") return <StateCard state="error" title="Invoices need attention" message={state.message} actionLabel="Retry" onAction={() => load()} />;

  return (
    <div className="space-y-6">
      <InvoiceHero count={totals.visibleInvoices.length} draftCount={totals.draftCount} dueCount={totals.dueCount} dueTotal={totals.dueTotal} total={totals.total} />
      {access.readOnly ? <StateCard state="empty" title="Invoices are read-only" message={access.message} /> : null}
      {state.message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{state.message}</div> : null}
      <div className="flex flex-col justify-end gap-2 sm:flex-row">
        {access.canCreateInvoices ? (
          <Button disabled={autoCreating} isLoading={autoCreating} onClick={autoCreateFromBillables} type="button" variant="secondary">
            <Sparkles className="h-4 w-4" />
            Auto-create from billables
          </Button>
        ) : null}
        {access.canCreateInvoices ? (
          <Link to="/app/invoices/new">
            <Button type="button">
              <Plus className="h-4 w-4" />
              New invoice
            </Button>
          </Link>
        ) : null}
      </div>
      <SectionIssues issues={state.issues} />
      <InvoiceFilters clients={state.clients} filters={filters} matters={filteredMatters} onChange={updateFilter} onReset={resetFilters} />
      <ClientWiseInvoiceDashboard invoices={totals.visibleInvoices} />
      <PipelineSummary pendingByClient={state.pendingByClient} pipeline={state.pipeline} />
    </div>
  );
}
