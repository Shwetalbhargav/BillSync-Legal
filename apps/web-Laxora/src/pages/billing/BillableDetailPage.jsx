import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { billablesApi } from "../../api/billables";
import { billingApi } from "../../api/billing";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import { BillableDetailPanel, SectionIssues, SyncHistoryList } from "../../components/billing/BillingWidgets";
import { useBillingModuleAccess } from "./useBillingModuleAccess";

const billingCategories = [
  "Email drafting/review",
  "Contract drafting/review",
  "Legal research",
  "Client consultation (calls/meetings)",
  "Case preparation/documentation",
  "Court appearance or hearing attendance",
  "Negotiation/settlement discussions",
  "IP filing & compliance work",
  "Dispute resolution activities",
  "Miscellaneous administrative legal work",
];

const activityCodes = ["EMAIL", "CALL", "MEETING", "DOC_REVIEW", "RESEARCH", "NEGOTIATION", "ADMIN", "OTHER"];

function dateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function editFormFrom(billable = {}) {
  return {
    description: billable.description || "",
    category: billable.category || "Miscellaneous administrative legal work",
    activityCode: billable.raw?.activityCode || "OTHER",
    durationMinutes: String(billable.minutes || 0),
    rate: String(billable.rate || 0),
    amount: String(billable.amount || 0),
    date: dateInput(billable.date),
    status: billable.status || "pending",
  };
}

export function BillableDetailPage() {
  const { billableId } = useParams();
  const access = useBillingModuleAccess("billing");
  const [state, setState] = useState({ status: "loading", billable: null, logs: [], issues: [], message: "" });
  const [form, setForm] = useState(editFormFrom());
  const [saving, setSaving] = useState(false);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await billingApi.loadBillableDetail(billableId);
      setState({ status: "ready", message: "", ...data });
      setForm(editFormFrom(data.billable));
    } catch (error) {
      setState({ status: "error", billable: null, logs: [], issues: [], message: error?.userMessage || "We could not load this billable work item." });
    }
  }

  function updateField(field, value) {
    setState((current) => ({ ...current, message: "" }));
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveBillable() {
    if (!form.description.trim()) {
      setState((current) => ({ ...current, message: "Add a billing description before saving." }));
      return;
    }
    setSaving(true);
    try {
      await billablesApi.update(billableId, {
        description: form.description.trim(),
        category: form.category,
        activityCode: form.activityCode,
        durationMinutes: Number(form.durationMinutes || 0),
        rate: Number(form.rate || 0),
        amount: Number(form.amount || 0),
        date: form.date || undefined,
        status: form.status,
      });
      await load();
      setState((current) => ({ ...current, message: "Billable work updated." }));
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not update this billable work right now." }));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, [billableId]);

  async function approve(item) {
    setSaving(true);
    try {
      await billablesApi.approve(item.id, {});
      await load();
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not approve this work right now." }));
    } finally {
      setSaving(false);
    }
  }

  async function reject(item) {
    const reason = window.prompt("Add a short reason for sending this work back.");
    if (!reason?.trim()) return;
    setSaving(true);
    try {
      await billablesApi.reject(item.id, { reason: reason.trim() });
      await load();
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not send this work back right now." }));
    } finally {
      setSaving(false);
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (access.unavailable) return <StateCard state="empty" title="Billable work is not available" message={access.message} />;
  if (!access.canViewInvoices) return <StateCard state="permission" title="Billable work is not available" message="You do not have access to this area." />;
  if (state.status === "error") return <StateCard state="error" title="Billable detail needs attention" message={state.message} actionLabel="Retry" onAction={load} />;

  return (
    <div className="space-y-6">
      <Link className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-primary hover:underline" to="/app/billables">
        <ArrowLeft className="h-4 w-4" />
        Back to billables
      </Link>
      {state.message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{state.message}</div> : null}
      {access.readOnly ? <StateCard state="empty" title="Billable work is read-only" message={access.message} /> : null}
      <SectionIssues issues={state.issues} />
      <BillableDetailPanel
        billable={state.billable}
        canApprove={access.canCreateInvoices}
        onApprove={approve}
        onReject={reject}
        saving={saving}
      />
      {access.canCreateInvoices && !access.readOnly && state.billable.status !== "billed" ? (
        <section className="surface-card p-5">
          <h2 className="text-base font-bold text-primary">Edit billing details</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-semibold text-ink md:col-span-2">
              Description
              <textarea className="focus-ring mt-1 min-h-24 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => updateField("description", event.target.value)} value={form.description} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Category
              <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => updateField("category", event.target.value)} value={form.category}>
                {billingCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              Work type
              <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => updateField("activityCode", event.target.value)} value={form.activityCode}>
                {activityCodes.map((code) => <option key={code} value={code}>{code}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              Minutes
              <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" min="0" onChange={(event) => updateField("durationMinutes", event.target.value)} type="number" value={form.durationMinutes} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Rate per hour
              <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" min="0" onChange={(event) => updateField("rate", event.target.value)} type="number" value={form.rate} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Amount
              <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" min="0" onChange={(event) => updateField("amount", event.target.value)} type="number" value={form.amount} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Date
              <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => updateField("date", event.target.value)} type="date" value={form.date} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Status
              <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => updateField("status", event.target.value)} value={form.status}>
                <option value="pending">Pending</option>
                <option value="approved">Ready to Bill</option>
                <option value="rejected">Rejected</option>
                <option value="excluded">Excluded</option>
              </select>
            </label>
          </div>
          <Button className="mt-4" disabled={saving} isLoading={saving} onClick={saveBillable} type="button">Save billing details</Button>
        </section>
      ) : null}
      {state.billable.status === "billed" ? <StateCard state="empty" title="Billing item is locked" message="This work is already on an invoice. Revise the invoice to change client-facing charges." /> : null}
      <SyncHistoryList logs={state.logs} />
    </div>
  );
}
