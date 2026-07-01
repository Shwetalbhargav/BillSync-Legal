import { Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { clientsApi } from "../../api/clients";
import { invoicesApi } from "../../api/invoices";
import { mattersApi } from "../../api/matters";
import { asList, normalizeClient, normalizeInvoice, normalizeMatter } from "../../api/normalizers";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import { useBillingModuleAccess } from "../billing/useBillingModuleAccess";

const defaultTaxNote = "Tax on this supply may be payable by the recipient under reverse charge mechanism, where applicable.";

function dateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function unwrap(response) {
  return response?.data || response;
}

export function InvoiceEditPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const access = useBillingModuleAccess("billing");
  const [state, setState] = useState({ status: "loading", message: "", clients: [], matters: [], invoice: null });
  const [form, setForm] = useState({
    clientId: "",
    caseId: "",
    templateType: "standard",
    dueDate: "",
    periodStart: "",
    periodEnd: "",
    taxTreatment: "gst_charged",
    taxName: "GST",
    taxRatePct: 0,
    taxNote: defaultTaxNote,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const [invoiceResponse, clientsResponse, mattersResponse] = await Promise.all([
        invoicesApi.get(invoiceId),
        clientsApi.list({ limit: 200 }),
        mattersApi.list({ limit: 200 }),
      ]);
      const invoice = normalizeInvoice(unwrap(invoiceResponse));
      setForm({
        clientId: invoice.clientId,
        caseId: invoice.matterId,
        templateType: invoice.templateType,
        dueDate: dateInput(invoice.dueAt),
        periodStart: dateInput(invoice.raw?.periodStart),
        periodEnd: dateInput(invoice.raw?.periodEnd),
        taxTreatment: invoice.taxTreatment || "gst_charged",
        taxName: invoice.raw?.taxName || "GST",
        taxRatePct: Number(invoice.raw?.taxRatePct || 0),
        taxNote: invoice.taxNote || defaultTaxNote,
      });
      setState({
        status: "ready",
        message: "",
        invoice,
        clients: asList(clientsResponse).map(normalizeClient),
        matters: asList(mattersResponse).map(normalizeMatter),
      });
    } catch (error) {
      setState({ status: "error", message: error?.userMessage || "We could not load this invoice for editing.", clients: [], matters: [], invoice: null });
    }
  }

  useEffect(() => {
    load();
  }, [invoiceId]);

  function updateField(field, value) {
    setState((current) => ({ ...current, message: "" }));
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveInvoice(event) {
    event.preventDefault();
    if (!form.clientId) {
      setState((current) => ({ ...current, message: "Select a client before saving." }));
      return;
    }
    setSaving(true);
    try {
      await invoicesApi.update(invoiceId, {
        clientId: form.clientId,
        caseId: form.caseId || undefined,
        templateType: form.templateType,
        dueDate: form.dueDate || undefined,
        periodStart: form.periodStart || undefined,
        periodEnd: form.periodEnd || undefined,
        taxTreatment: form.taxTreatment,
        taxName: form.taxName,
        taxRatePct: Number(form.taxRatePct || 0),
        taxNote: form.taxNote,
      });
      navigate(`/app/invoices/${invoiceId}`, { replace: true });
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not save this invoice." }));
    } finally {
      setSaving(false);
    }
  }

  async function deleteInvoice() {
    setDeleting(true);
    try {
      await invoicesApi.remove(invoiceId);
      navigate("/app/invoices", { replace: true });
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "Only draft invoices can be deleted." }));
    } finally {
      setDeleting(false);
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (access.unavailable) return <StateCard state="empty" title="Invoice edit is not available" message={access.message} />;
  if (!access.canCreateInvoices) return <StateCard state="permission" title="Invoice edit is not available" message="You do not have access to edit invoices." />;
  if (state.status === "error") return <StateCard state="error" title="Invoice edit needs attention" message={state.message} actionLabel="Retry" onAction={load} />;

  const isDraft = ["draft", "ready_to_bill"].includes(state.invoice?.status);
  if (!isDraft) {
    return <StateCard state="permission" title="Invoice is locked" message="Finalised and sent invoices are immutable. Create a revision to change billing details." />;
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Invoice CRUD</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Edit invoice</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Update draft invoice metadata before finalising or sending.</p>
      </section>
      <form className="surface-card space-y-5 p-6" onSubmit={saveInvoice}>
        {state.message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{state.message}</div> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-ink">
            Template
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("templateType", event.target.value)} value={form.templateType}>
              <option value="standard">Standard invoice</option>
              <option value="solo_advocate_fee_invoice">Solo advocate fee invoice</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Client
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("clientId", event.target.value)} value={form.clientId}>
              <option value="">Select client</option>
              {state.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Matter
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("caseId", event.target.value)} value={form.caseId}>
              <option value="">No matter</option>
              {state.matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.title}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Due date
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("dueDate", event.target.value)} type="date" value={form.dueDate} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Period start
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("periodStart", event.target.value)} type="date" value={form.periodStart} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Period end
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("periodEnd", event.target.value)} type="date" value={form.periodEnd} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            GST/RCM treatment
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("taxTreatment", event.target.value)} value={form.taxTreatment}>
              <option value="gst_charged">GST charged</option>
              <option value="rcm_applicable">RCM applicable</option>
              <option value="gst_not_applicable">GST not applicable</option>
              <option value="gst_exempt">GST exempt</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Tax rate
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" min="0" onChange={(event) => updateField("taxRatePct", event.target.value)} type="number" value={form.taxRatePct} />
          </label>
          <label className="block text-sm font-semibold text-ink md:col-span-2">
            Tax note
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("taxNote", event.target.value)} value={form.taxNote} />
          </label>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button disabled={deleting || saving} isLoading={deleting} onClick={deleteInvoice} type="button" variant="danger">
            <Trash2 className="h-4 w-4" />
            Delete draft
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link className="focus-ring inline-flex justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/invoices/${invoiceId}`}>Cancel</Link>
            <Button isLoading={saving} type="submit">
              <Save className="h-4 w-4" />
              Save invoice
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
