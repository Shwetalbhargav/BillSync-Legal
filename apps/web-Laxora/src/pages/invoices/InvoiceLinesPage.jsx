import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Pencil, X } from "lucide-react";
import { invoicesApi } from "../../api/invoices";
import { normalizeInvoiceLine } from "../../api/normalizers";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import { formatDate, formatMoney } from "../../components/invoices/InvoiceWidgets";
import { useBillingModuleAccess } from "../billing/useBillingModuleAccess";

const initialLine = {
  lineType: "professional_fee",
  serviceDate: "",
  periodLabel: "",
  description: "",
  qtyHours: "",
  rate: "",
  amount: "",
  receiptDocumentId: "",
  taxCategory: "GST",
};

function linePayload(line) {
  return {
    lineType: line.lineType || "professional_fee",
    ...(line.serviceDate ? { serviceDate: line.serviceDate } : {}),
    ...(line.periodLabel ? { periodLabel: line.periodLabel.trim() } : {}),
    description: line.description.trim(),
    qtyHours: Number(line.qtyHours || 0),
    rate: Number(line.rate || 0),
    ...(line.amount ? { amount: Number(line.amount) } : {}),
    ...(line.receiptDocumentId ? { receiptDocumentId: line.receiptDocumentId.trim() } : {}),
    taxCategory: line.taxCategory || "GST",
  };
}

function lineNeedsHours(line) {
  return (line.lineType || "hourly") === "hourly";
}

function isValidLine(line) {
  if (!line.description.trim()) return false;
  if (lineNeedsHours(line)) return Boolean(line.qtyHours) && Boolean(line.rate);
  return Boolean(line.amount);
}

export function InvoiceLinesPage() {
  const { invoiceId } = useParams();
  const access = useBillingModuleAccess("billing");
  const [form, setForm] = useState(initialLine);
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState(initialLine);
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

  function updateEditField(field, value) {
    setState((current) => ({ ...current, message: "" }));
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(line) {
    setEditingId(line.id);
    setEditForm({
      lineType: line.lineType || "hourly",
      serviceDate: line.serviceDate ? String(line.serviceDate).slice(0, 10) : "",
      periodLabel: line.periodLabel || "",
      description: line.description || "",
      qtyHours: String(line.qtyHours ?? ""),
      rate: String(line.rate ?? ""),
      amount: String(line.amount ?? ""),
      receiptDocumentId: line.receiptDocumentId || "",
      taxCategory: line.taxCategory || "GST",
    });
  }

  function cancelEdit() {
    setEditingId("");
    setEditForm(initialLine);
  }

  async function addLine() {
    if (!isValidLine(form)) {
      setState((current) => ({ ...current, message: lineNeedsHours(form) ? "Add a description, hours, and rate before saving." : "Add a description and amount before saving." }));
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

  async function saveLine(line) {
    if (!isValidLine(editForm)) {
      setState((current) => ({ ...current, message: lineNeedsHours(editForm) ? "Add a description, hours, and rate before saving." : "Add a description and amount before saving." }));
      return;
    }
    setSaving(true);
    try {
      await invoicesApi.updateLine(invoiceId, line.id, linePayload(editForm));
      cancelEdit();
      await load();
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not update this line right now." }));
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
        <div className="grid gap-3 md:grid-cols-6">
          <label className="block text-sm font-semibold text-ink">
            Line type
            <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => updateField("lineType", event.target.value)} value={form.lineType}>
              <option value="professional_fee">Professional fee</option>
              <option value="reimbursable_expense">Reimbursable expense</option>
              <option value="hourly">Hourly</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Service date
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => updateField("serviceDate", event.target.value)} type="date" value={form.serviceDate} />
          </label>
          <label className="block text-sm font-semibold text-ink md:col-span-2">
            Description
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => updateField("description", event.target.value)} value={form.description} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Hours
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" disabled={!lineNeedsHours(form)} min="0" onChange={(event) => updateField("qtyHours", event.target.value)} type="number" value={form.qtyHours} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Rate
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" disabled={!lineNeedsHours(form)} min="0" onChange={(event) => updateField("rate", event.target.value)} type="number" value={form.rate} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Amount
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" min="0" onChange={(event) => updateField("amount", event.target.value)} type="number" value={form.amount} />
          </label>
          <label className="block text-sm font-semibold text-ink md:col-span-2">
            Period label
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => updateField("periodLabel", event.target.value)} placeholder="June 2026" value={form.periodLabel} />
          </label>
          <label className="block text-sm font-semibold text-ink md:col-span-2">
            Receipt document reference
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" disabled={form.lineType !== "reimbursable_expense"} onChange={(event) => updateField("receiptDocumentId", event.target.value)} placeholder="Document id" value={form.receiptDocumentId} />
          </label>
        </div>
        <Button className="mt-4" disabled={saving} isLoading={saving} onClick={addLine} type="button">Add line</Button>
      </section>
      <section className="surface-card overflow-x-auto p-5">
        {state.lines.length ? (
          <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wide text-muted">
                <th className="border-b border-border px-3 py-2">Line</th>
                <th className="border-b border-border px-3 py-2">Type</th>
                <th className="border-b border-border px-3 py-2">Date/Period</th>
                <th className="border-b border-border px-3 py-2 text-right">Hours</th>
                <th className="border-b border-border px-3 py-2 text-right">Rate</th>
                <th className="border-b border-border px-3 py-2">Tax</th>
                <th className="border-b border-border px-3 py-2 text-right">Amount</th>
                <th className="border-b border-border px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.lines.map((line) => {
                const editing = editingId === line.id;
                return (
                  <tr key={line.id}>
                    <td className="border-b border-border px-3 py-3">
                      {editing ? (
                        <input className="focus-ring w-full rounded-lg border border-border bg-panel px-3 py-2" onChange={(event) => updateEditField("description", event.target.value)} value={editForm.description} />
                      ) : (
                        <>
                          <p className="break-words font-semibold text-ink">{line.description}</p>
                          {line.receiptDocumentId ? <p className="mt-1 text-xs font-semibold text-muted">Receipt: {line.receiptDocumentId}</p> : null}
                        </>
                      )}
                    </td>
                    <td className="border-b border-border px-3 py-3">
                      {editing ? (
                        <select className="focus-ring w-44 rounded-lg border border-border bg-panel px-3 py-2" onChange={(event) => updateEditField("lineType", event.target.value)} value={editForm.lineType}>
                          <option value="professional_fee">Professional fee</option>
                          <option value="reimbursable_expense">Reimbursable expense</option>
                          <option value="hourly">Hourly</option>
                        </select>
                      ) : (
                        <span className="text-muted">{line.lineType === "reimbursable_expense" ? "Expense" : line.lineType === "professional_fee" ? "Professional fee" : "Hourly"}</span>
                      )}
                    </td>
                    <td className="border-b border-border px-3 py-3">
                      {editing ? (
                        <div className="grid gap-2">
                          <input className="focus-ring w-36 rounded-lg border border-border bg-panel px-3 py-2" onChange={(event) => updateEditField("serviceDate", event.target.value)} type="date" value={editForm.serviceDate} />
                          <input className="focus-ring w-36 rounded-lg border border-border bg-panel px-3 py-2" onChange={(event) => updateEditField("periodLabel", event.target.value)} placeholder="Period" value={editForm.periodLabel} />
                        </div>
                      ) : (
                        <span className="text-muted">{formatDate(line.serviceDate) !== "Not set" ? formatDate(line.serviceDate) : line.periodLabel || "Not set"}</span>
                      )}
                    </td>
                    <td className="border-b border-border px-3 py-3 text-right">
                      {editing ? (
                        <input className="focus-ring w-24 rounded-lg border border-border bg-panel px-3 py-2 text-right" disabled={!lineNeedsHours(editForm)} min="0" onChange={(event) => updateEditField("qtyHours", event.target.value)} type="number" value={editForm.qtyHours} />
                      ) : (
                        <span className="font-semibold text-ink">{Number(line.qtyHours || 0).toFixed(2)}</span>
                      )}
                    </td>
                    <td className="border-b border-border px-3 py-3 text-right">
                      {editing ? (
                        <input className="focus-ring w-28 rounded-lg border border-border bg-panel px-3 py-2 text-right" disabled={!lineNeedsHours(editForm)} min="0" onChange={(event) => updateEditField("rate", event.target.value)} type="number" value={editForm.rate} />
                      ) : (
                        <span className="text-muted">{formatMoney(line.rate)}</span>
                      )}
                    </td>
                    <td className="border-b border-border px-3 py-3">
                      {editing ? (
                        <input className="focus-ring w-28 rounded-lg border border-border bg-panel px-3 py-2" onChange={(event) => updateEditField("taxCategory", event.target.value)} value={editForm.taxCategory} />
                      ) : (
                        <span className="text-muted">{line.taxCategory || "GST"}</span>
                      )}
                    </td>
                    <td className="border-b border-border px-3 py-3 text-right">
                      {editing ? (
                        <input className="focus-ring w-28 rounded-lg border border-border bg-panel px-3 py-2 text-right" min="0" onChange={(event) => updateEditField("amount", event.target.value)} placeholder="Auto" type="number" value={editForm.amount} />
                      ) : (
                        <span className="font-bold text-primary">{formatMoney(line.amount)}</span>
                      )}
                    </td>
                    <td className="border-b border-border px-3 py-3">
                      <div className="flex justify-end gap-2">
                        {editing ? (
                          <>
                            <Button disabled={saving} isLoading={saving} onClick={() => saveLine(line)} size="sm" type="button" variant="success"><Check className="h-4 w-4" />Save</Button>
                            <Button disabled={saving} onClick={cancelEdit} size="sm" type="button" variant="secondary"><X className="h-4 w-4" />Cancel</Button>
                          </>
                        ) : (
                          <>
                            <Button disabled={saving} onClick={() => startEdit(line)} size="sm" type="button" variant="secondary"><Pencil className="h-4 w-4" />Edit</Button>
                            <Button disabled={saving} onClick={() => removeLine(line)} size="sm" type="button" variant="danger">Remove</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <StateCard state="empty" title="No invoice lines yet" message="Lines will appear after an invoice is generated or edited." />
        )}
      </section>
    </div>
  );
}
