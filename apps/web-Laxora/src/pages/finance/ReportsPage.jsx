import { useEffect, useMemo, useState } from "react";
import { financeWorkspaceApi, reportsApi } from "../../api";
import { SkeletonBlock, StateCard, Toast } from "../../components/common";
import { FinanceHero, KpiGrid, MetricTile, ReportsPanel, SectionIssues, formatMoney } from "../../components/finance/FinanceWidgets";
import { BarChart3, ReceiptText, WalletCards } from "lucide-react";
import { useReportsModuleAccess } from "./useReportsModuleAccess";

const defaultFilters = {
  from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  to: new Date().toISOString().slice(0, 10),
  groupBy: "user",
};

function saveReport(text, filename) {
  const blob = new Blob([text || ""], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const access = useReportsModuleAccess();
  const [filters, setFilters] = useState(defaultFilters);
  const [state, setState] = useState({ status: "loading", gst: {}, invoiceTotals: {}, billableTotals: {}, issues: [], message: "" });
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState(null);

  const dashboardKpi = useMemo(() => ({
    revenue: state.invoiceTotals.totalRevenue || state.gst.grossAmount,
    wip: state.billableTotals.totalValue,
    ar: state.gst.grossAmount,
    utilization: 0,
    realization: 0,
  }), [state]);

  async function load(nextFilters = filters) {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await financeWorkspaceApi.loadReports(nextFilters);
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", gst: {}, invoiceTotals: {}, billableTotals: {}, issues: [], message: error?.userMessage || "We could not load report details right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateFilter(field, value) {
    const next = { ...filters, [field]: value };
    setFilters(next);
  }

  async function downloadReport(kind) {
    if (!access.canExport) {
      setNotice({ tone: "warning", title: "Export is not available", message: "You can review reports, but this workspace cannot export them right now." });
      return;
    }
    setSaving(kind);
    setNotice(null);
    try {
      const params = { from: filters.from, to: filters.to };
      if (kind === "time") saveReport(await reportsApi.timeEntriesCsv(params), "billsync-time-entries.csv");
      if (kind === "invoices") saveReport(await reportsApi.invoicesCsv(params), "billsync-invoices.csv");
      if (kind === "tax") saveReport(await reportsApi.gstCsv(params), "billsync-tax-summary.csv");
      if (kind === "utilization") saveReport(await reportsApi.utilizationCsv({ ...params, groupBy: filters.groupBy }), "billsync-utilization.csv");
      setNotice({ tone: "success", title: "Report downloaded", message: "The report is ready for review." });
    } catch (error) {
      setNotice({ tone: "warning", title: "Report was not downloaded", message: error?.userMessage || "Please check the filters and try again." });
    } finally {
      setSaving("");
    }
  }

  async function checkPdfReadiness() {
    if (!access.canExport) {
      setNotice({ tone: "warning", title: "Board pack is not available", message: "You can review reports, but this workspace cannot export board packs right now." });
      return;
    }
    setSaving("pdf");
    setNotice(null);
    try {
      await reportsApi.pdf({ from: filters.from, to: filters.to });
      setNotice({ tone: "success", title: "Board pack is ready", message: "The finance pack is ready for review." });
    } catch {
      setNotice({ tone: "warning", title: "Board pack is not ready yet", message: "Use the downloadable reports for now. The polished pack can be connected later." });
    } finally {
      setSaving("");
    }
  }

  if (access.status === "loading") return <SkeletonBlock />;
  if (access.unavailable) return <StateCard state="empty" title="Reports are not available" message={access.message} />;
  if (!access.canView) return <StateCard state="permission" title="Reports are not available" message="You do not have access to this area." />;
  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Reports need attention" message={state.message} actionLabel="Retry" onAction={() => load()} />;

  return (
    <div className="space-y-6">
      <FinanceHero kpi={dashboardKpi} paymentSummary={{ outstanding: state.gst.grossAmount }} />
      {notice ? <Toast tone={notice.tone} title={notice.title} message={notice.message} /> : null}
      {access.readOnly ? <StateCard state="empty" title="Reports are read-only" message={access.message} /> : null}
      <SectionIssues issues={state.issues} />
      <section className="surface-card p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block text-sm font-semibold text-ink">
            From
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => updateFilter("from", event.target.value)} type="date" value={filters.from} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            To
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => updateFilter("to", event.target.value)} type="date" value={filters.to} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Utilization view
            <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => updateFilter("groupBy", event.target.value)} value={filters.groupBy}>
              <option value="user">Team member</option>
              <option value="client">Client</option>
              <option value="case">Matter</option>
            </select>
          </label>
        </div>
      </section>
      <KpiGrid kpi={dashboardKpi} />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile icon={ReceiptText} label="Taxable amount" value={formatMoney(state.gst.taxableAmount)} />
        <MetricTile icon={WalletCards} label="Tax amount" value={formatMoney(state.gst.gstAmount)} tone="warning" />
        <MetricTile icon={BarChart3} label="Gross amount" value={formatMoney(state.gst.grossAmount)} tone="success" />
      </div>
      <ReportsPanel canExport={access.canExport} onDownload={downloadReport} onPdf={checkPdfReadiness} saving={saving} />
    </div>
  );
}
