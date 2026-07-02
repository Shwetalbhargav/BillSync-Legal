import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { billablesApi } from "../../api/billables";
import { clientsApi } from "../../api/clients";
import { mattersApi } from "../../api/matters";
import { asList, normalizeClient, normalizeMatter } from "../../api/normalizers";
import { timeEntriesApi } from "../../api/timeEntries";
import { useAuth } from "../../auth/AuthProvider";
import { Button, SkeletonBlock, StateCard } from "../../components/common";

const initialForm = {
  entryType: "court",
  caseId: "",
  clientId: "",
  subject: "",
  narrative: "",
  billableMinutes: "",
  nonbillableMinutes: "0",
  rate: "",
  amount: "",
  vendor: "",
  date: "",
  billingAction: "ready_to_bill",
};

const entryTypes = [
  { value: "court", label: "Court hours", activityCode: "MEETING", category: "Court appearance or hearing attendance" },
  { value: "call", label: "Call hours", activityCode: "CALL", category: "Client consultation (calls/meetings)" },
  { value: "meeting", label: "Meeting hours", activityCode: "MEETING", category: "Client consultation (calls/meetings)" },
  { value: "research", label: "Research / drafting", activityCode: "RESEARCH", category: "Legal research" },
  { value: "other", label: "Other legal work", activityCode: "OTHER", category: "Miscellaneous administrative legal work" },
  { value: "expense", label: "Court / travel / misc. payment", activityCode: "OTHER", category: "Miscellaneous administrative legal work" },
];

const entryTypeByValue = Object.fromEntries(entryTypes.map((type) => [type.value, type]));

function validate(form, user) {
  if (!user?.id) return "Please sign in again before saving time.";
  if (!form.caseId) return "Select the matter for this time entry.";
  if (!form.clientId) return "Select a matter with a client.";
  if (!form.narrative.trim()) return "Enter a short work description.";
  if (form.entryType === "expense") {
    if (Number(form.amount || 0) <= 0) return "Enter the amount paid.";
    return "";
  }
  const total = Number(form.billableMinutes || 0) + Number(form.nonbillableMinutes || 0);
  if (total < 1) return "Enter the time spent.";
  if (form.billingAction === "ready_to_bill" && Number(form.billableMinutes || 0) < 1) return "Ready to Bill entries need billable minutes.";
  if (form.billingAction === "ready_to_bill" && Number(form.rate || 0) <= 0 && Number(form.amount || 0) <= 0) {
    return "Enter a rate or amount before adding this work to Ready to Bill.";
  }
  return "";
}

export function ManualTimeEntryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [matters, setMatters] = useState([]);
  const [clients, setClients] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      setStatus("loading");
      try {
        const [matterResponse, clientResponse] = await Promise.all([mattersApi.list({ limit: 200 }), clientsApi.list({ limit: 200 })]);
        setMatters(asList(matterResponse).map(normalizeMatter));
        setClients(asList(clientResponse).map(normalizeClient));
        setStatus("ready");
      } catch (error) {
        setStatus("error");
        setMessage(error?.userMessage || "We could not prepare the time form.");
      }
    }
    load();
  }, []);

  const selectedMatter = useMemo(() => matters.find((matter) => matter.id === form.caseId), [form.caseId, matters]);

  function updateField(field, value) {
    setMessage("");
    setForm((current) => {
      if (field === "caseId") {
        const matter = matters.find((item) => item.id === value);
        return { ...current, caseId: value, clientId: matter?.clientId || "" };
      }
      if (field === "entryType") {
        return {
          ...current,
          entryType: value,
          billableMinutes: value === "expense" ? "" : current.billableMinutes,
          nonbillableMinutes: value === "expense" ? "0" : current.nonbillableMinutes,
          rate: value === "expense" ? "" : current.rate,
          amount: value === "expense" ? current.amount : "",
        };
      }
      return { ...current, [field]: value };
    });
  }

  async function submit(event) {
    event.preventDefault();
    const validationMessage = validate(form, user);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }
    setStatus("saving");
    try {
      const date = form.date ? new Date(form.date).toISOString() : undefined;
      const type = entryTypeByValue[form.entryType] || entryTypeByValue.other;
      const description = form.narrative.trim();
      const billableMinutes = Number(form.billableMinutes || 0);
      const rate = Number(form.rate || 0);
      const amount = Number(form.amount || 0) || Number(((billableMinutes / 60) * rate).toFixed(2));

      if (form.entryType === "expense") {
        await billablesApi.createExpense({
          caseId: form.caseId,
          clientId: form.clientId,
          userId: user.id,
          description,
          date,
          amount: Number(form.amount || 0),
          category: type.label,
          vendor: form.vendor.trim() || undefined,
          approvalRequired: form.billingAction !== "ready_to_bill",
          billable: true,
        });
        navigate("/app/invoices/new", { replace: true });
        return;
      }

      if (form.billingAction === "ready_to_bill") {
        await billablesApi.create({
          caseId: form.caseId,
          clientId: form.clientId,
          userId: user.id,
          subject: form.subject.trim() || type.label,
          description,
          durationMinutes: billableMinutes,
          date,
          rate,
          amount,
          activityCode: type.activityCode,
          category: type.category,
          status: "approved",
        });
        navigate("/app/invoices/new", { replace: true });
        return;
      }

      const saved = await timeEntriesApi.create({
        caseId: form.caseId,
        clientId: form.clientId,
        userId: user.id,
        activityCode: type.activityCode,
        narrative: description,
        billableMinutes,
        nonbillableMinutes: Number(form.nonbillableMinutes || 0),
        rateApplied: rate || undefined,
        amount: amount || undefined,
        date,
        status: "draft",
      });
      if (form.billingAction === "submitted") await timeEntriesApi.submit(saved?.id || saved?._id);
      navigate("/app/submit-work", { replace: true });
    } catch (error) {
      setStatus("ready");
      setMessage(error?.userMessage || "We could not save this time entry right now.");
    }
  }

  if (status === "loading") return <SkeletonBlock />;
  if (status === "error") return <StateCard state="error" title="Time form needs attention" message={message} />;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Time Capture</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Manual Billable Entry</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Add court time, calls, meetings, research, and reimbursable payments that happened away from the meter.</p>
      </section>
      <form className="surface-card space-y-4 p-6" onSubmit={submit}>
        {message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{message}</div> : null}
        <label className="block text-sm font-semibold text-ink">Entry type
          <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("entryType", event.target.value)} value={form.entryType}>
            {entryTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-ink">Matter
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("caseId", event.target.value)} value={form.caseId}>
              <option value="">Select matter</option>
              {matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.title}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">Client
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("clientId", event.target.value)} value={form.clientId}>
              <option value="">Select client</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
        </div>
        {selectedMatter ? <p className="rounded-lg bg-blueSoft p-3 text-sm font-semibold text-primary">Selected matter client: {selectedMatter.client}</p> : null}
        <label className="block text-sm font-semibold text-ink">Title
          <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("subject", event.target.value)} placeholder="Court appearance, client call, filing fee" value={form.subject} />
        </label>
        <label className="block text-sm font-semibold text-ink">Work description
          <textarea className="focus-ring mt-1 min-h-28 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("narrative", event.target.value)} placeholder="Describe the work or payment" value={form.narrative} />
        </label>
        {form.entryType === "expense" ? (
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-semibold text-ink">Amount
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" min="0" onChange={(event) => updateField("amount", event.target.value)} step="0.01" type="number" value={form.amount} />
            </label>
            <label className="block text-sm font-semibold text-ink">Paid to
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("vendor", event.target.value)} placeholder="Court registry, travel vendor" value={form.vendor} />
            </label>
            <label className="block text-sm font-semibold text-ink">Payment date
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("date", event.target.value)} type="date" value={form.date} />
            </label>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-semibold text-ink">Billable minutes
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" min="0" onChange={(event) => updateField("billableMinutes", event.target.value)} type="number" value={form.billableMinutes} />
            </label>
            <label className="block text-sm font-semibold text-ink">Non-billable minutes
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" min="0" onChange={(event) => updateField("nonbillableMinutes", event.target.value)} type="number" value={form.nonbillableMinutes} />
            </label>
            <label className="block text-sm font-semibold text-ink">Work date
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("date", event.target.value)} type="date" value={form.date} />
            </label>
            <label className="block text-sm font-semibold text-ink">Rate per hour
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" min="0" onChange={(event) => updateField("rate", event.target.value)} step="0.01" type="number" value={form.rate} />
            </label>
            <label className="block text-sm font-semibold text-ink">Amount
              <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" min="0" onChange={(event) => updateField("amount", event.target.value)} placeholder={form.rate && form.billableMinutes ? String(((Number(form.billableMinutes || 0) / 60) * Number(form.rate || 0)).toFixed(2)) : "Auto from rate"} step="0.01" type="number" value={form.amount} />
            </label>
          </div>
        )}
        <label className="block text-sm font-semibold text-ink">Billing destination
          <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("billingAction", event.target.value)} value={form.billingAction}>
            <option value="ready_to_bill">Add to Ready to Bill</option>
            <option value="submitted">Submit for approval</option>
            {form.entryType !== "expense" ? <option value="draft">Save as time draft</option> : null}
          </select>
        </label>
        {form.entryType === "expense" && form.billingAction === "submitted" ? (
          <p className="rounded-lg bg-blueSoft p-3 text-sm font-semibold text-primary">This payment will wait in billable review before invoicing.</p>
        ) : null}
        <div className="flex justify-end">
          <Button isLoading={status === "saving"} type="submit"><Save className="h-4 w-4" /> Save entry</Button>
        </div>
      </form>
    </div>
  );
}
