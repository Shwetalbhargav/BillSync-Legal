import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { invoicesApi } from "../../api/invoices";
import { normalizeInvoiceLine } from "../../api/normalizers";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import { InvoiceLinesTable } from "../../components/invoices/InvoiceWidgets";
import { useBillingModuleAccess } from "../billing/useBillingModuleAccess";

const initialLine = {
  description: "",
  qtyHours: "",
  rate: "",
  amount: "",
  taxCategory: "GST",
};

function linePayload(line) {
  return {
    description: line.description.trim(),
    qtyHours: Number(line.qtyHours || 0),
    rate: Number(line.rate || 0),
    ...(line.amount ? { amount: Number(line.amount) } : {}),
    taxCategory: line.taxCategory || "GST",
  };
}

export function InvoiceLinesPage() {
  const { invoiceId } = useParams();
  const access = useBillingModuleAccess("billing");
  const [form, setForm] = useState(initialLine);
  const [state, setState] = useState({ status: "loading", lines: [], message: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const response = await invoicesApi.lines(invoiceId);
      setState({ status: "ready", lines: (Array.isArray(response) ? response : []).map(normalizeInvoiceLine), message: "" });
    } catch (error) {
      setState({ status: "error", lines: [], message: error?.userMessage || "We could not load invoice lines right now." });
    }
  }

  useEffect(() => {
    load();
  }, [invoiceId]);

  function updateField(field, value) {
    setState((current) => ({ ...current, message: "" }));
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function addLine() {
    if (!form.description.trim() || !form.qtyHours || !form.rate) {
      setState((current) => ({ ...current, message: "Add a description, hours, and rate before saving." }));
      return;
    }
    setSaving(true);
    try {
      await invoicesApi.createLine(invoiceId, linePayload(form));
      setForm(initialLine);
      await load();
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not add this line right now." }));
    } finally {
      setSaving(false);
    }
  }

  async function removeLine(line) {
    setSaving(true);
    try {
      await invoicesApi.removeLine(invoiceId, line.id);
      await load();
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not remove this line right now." }));
    } finally {
      setSaving(false);
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (access.unavailable) return <StateCard state="empty" title="Invoice lines are not available" message={access.message} />;
  if (!access.canCreateInvoices) return <StateCard state="permission" title="Invoice lines are not available" message="You do not have access to this area." />;
  if (state.status === "error") return <StateCard state="error" title="Invoice lines need attention" message={state.message} actionLabel="Retry" onAction={load} />;

  return (
    <div className="space-y-6">
      <Link className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-primary hover:underline" to={`/app/invoices/${invoiceId}`}>
        <ArrowLeft className="h-4 w-4" />
        Back to invoice
      </Link>
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Invoice lines</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Edit invoice lines</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Add or remove professional service lines before sending the invoice.</p>
      </section>
      {state.message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{state.message}</div> : null}
      <section className="surface-card p-5">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="block text-sm font-semibold text-ink md:col-span-2">
            Description
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => updateField("description", event.target.value)} value={form.description} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Hours
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" min="0" onChange={(event) => updateField("qtyHours", event.target.value)} type="number" value={form.qtyHours} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Rate
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" min="0" onChange={(event) => updateField("rate", event.target.value)} type="number" value={form.rate} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Amount
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" min="0" onChange={(event) => updateField("amount", event.target.value)} type="number" value={form.amount} />
          </label>
        </div>
        <Button className="mt-4" disabled={saving} isLoading={saving} onClick={addLine} type="button">Add line</Button>
      </section>
      <InvoiceLinesTable lines={state.lines} />
      {state.lines.length ? (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {state.lines.map((line) => <Button disabled={saving} key={line.id} onClick={() => removeLine(line)} type="button" variant="danger">Remove {line.description}</Button>)}
        </div>
      ) : null}
    </div>
  );
}
