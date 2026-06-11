import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientsApi } from "../../api/clients";
import { mattersApi } from "../../api/matters";
import { asList, normalizeClient, normalizeMatter } from "../../api/normalizers";
import { timeEntriesApi } from "../../api/timeEntries";
import { useAuth } from "../../auth/AuthProvider";
import { Button, SkeletonBlock, StateCard } from "../../components/common";

const initialForm = {
  caseId: "",
  clientId: "",
  narrative: "",
  billableMinutes: "",
  nonbillableMinutes: "0",
  date: "",
  status: "draft",
};

function validate(form, user) {
  if (!user?.id) return "Please sign in again before saving time.";
  if (!form.caseId) return "Select the matter for this time entry.";
  if (!form.clientId) return "Select a matter with a client.";
  if (!form.narrative.trim()) return "Enter a short work description.";
  const total = Number(form.billableMinutes || 0) + Number(form.nonbillableMinutes || 0);
  if (total < 1) return "Enter the time spent.";
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
      const saved = await timeEntriesApi.create({
        caseId: form.caseId,
        clientId: form.clientId,
        userId: user.id,
        narrative: form.narrative.trim(),
        billableMinutes: Number(form.billableMinutes || 0),
        nonbillableMinutes: Number(form.nonbillableMinutes || 0),
        date: form.date ? new Date(form.date).toISOString() : undefined,
        status: "draft",
      });
      if (form.status === "submitted") await timeEntriesApi.submit(saved?.id || saved?._id);
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
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Manual Time Entry</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Add work that happened away from the meter and keep it ready for review.</p>
      </section>
      <form className="surface-card space-y-4 p-6" onSubmit={submit}>
        {message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{message}</div> : null}
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
        <label className="block text-sm font-semibold text-ink">Work description
          <textarea className="focus-ring mt-1 min-h-28 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("narrative", event.target.value)} placeholder="Describe the work" value={form.narrative} />
        </label>
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
        </div>
        <label className="block text-sm font-semibold text-ink">Next step
          <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("status", event.target.value)} value={form.status}>
            <option value="draft">Save as draft</option>
            <option value="submitted">Submit for approval</option>
          </select>
        </label>
        <div className="flex justify-end">
          <Button isLoading={status === "saving"} type="submit"><Save className="h-4 w-4" /> Save time</Button>
        </div>
      </form>
    </div>
  );
}
