import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { calendarApi } from "../../api/calendar";
import { clientsApi } from "../../api/clients";
import { mattersApi } from "../../api/matters";
import { asList, normalizeClient, normalizeMatter } from "../../api/normalizers";
import { useAuth } from "../../auth/AuthProvider";
import { Button, SkeletonBlock, StateCard } from "../../components/common";

const initialForm = {
  caseId: "",
  clientId: "",
  title: "",
  courtName: "",
  courtroom: "",
  judgeOrBench: "",
  location: "",
  startedAt: "",
  endedAt: "",
  minutes: "",
  narrative: "",
  billable: "true",
};

function diffMinutes(start, end) {
  const startTime = Date.parse(start);
  const endTime = Date.parse(end);
  if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime < startTime) return 0;
  return Math.round((endTime - startTime) / 60000);
}

function validate(form, user) {
  if (!user?.id) return "Please sign in again before saving hearing time.";
  if (!form.caseId) return "Select the matter for this hearing.";
  if (!form.clientId) return "Select a matter with a client.";
  if (!form.title.trim()) return "Enter the hearing title.";
  if (!form.startedAt) return "Enter when the hearing started.";
  const minutes = Number(form.minutes || diffMinutes(form.startedAt, form.endedAt));
  if (!minutes || minutes < 1) return "Enter the time spent on this hearing.";
  return "";
}

export function ManualCourtTimeEntryPage() {
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
      setMessage("");
      try {
        const [matterResponse, clientResponse] = await Promise.all([
          mattersApi.list({ limit: 200 }),
          clientsApi.list({ limit: 200 }),
        ]);
        setMatters(asList(matterResponse).map(normalizeMatter));
        setClients(asList(clientResponse).map(normalizeClient));
        setStatus("ready");
      } catch (error) {
        setStatus("error");
        setMessage(error?.userMessage || "We could not prepare the hearing form.");
      }
    }
    load();
  }, []);

  const selectedMatter = useMemo(() => matters.find((matter) => matter.id === form.caseId), [form.caseId, matters]);
  const computedMinutes = Number(form.minutes || diffMinutes(form.startedAt, form.endedAt) || 0);

  function updateField(field, value) {
    setMessage("");
    setForm((current) => {
      if (field === "caseId") {
        const matter = matters.find((item) => item.id === value);
        return { ...current, caseId: value, clientId: matter?.clientId || current.clientId };
      }
      return { ...current, [field]: value };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationMessage = validate(form, user);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }
    setStatus("saving");
    try {
      const minutes = Number(form.minutes || diffMinutes(form.startedAt, form.endedAt));
      const narrative = form.narrative.trim() || `${form.title.trim()} hearing`;
      await calendarApi.saveManualHearing({
        activity: {
          caseId: form.caseId,
          clientId: form.clientId,
          userId: user.id,
          activityType: "hearing",
          startedAt: new Date(form.startedAt).toISOString(),
          endedAt: form.endedAt ? new Date(form.endedAt).toISOString() : undefined,
          durationMinutes: minutes,
          source: "manual",
          workTool: "court",
          billable: form.billable === "true",
          narrative,
          calendarEvent: {
            title: form.title.trim(),
            scheduledStart: new Date(form.startedAt).toISOString(),
            scheduledEnd: form.endedAt ? new Date(form.endedAt).toISOString() : undefined,
            courtName: form.courtName.trim(),
            courtroom: form.courtroom.trim(),
            judgeOrBench: form.judgeOrBench.trim(),
            location: form.location.trim(),
            notes: narrative,
          },
        },
        timeEntry: {
          caseId: form.caseId,
          clientId: form.clientId,
          userId: user.id,
          narrative,
          billableMinutes: form.billable === "true" ? minutes : 0,
          nonbillableMinutes: form.billable === "true" ? 0 : minutes,
          date: new Date(form.startedAt).toISOString(),
          status: "draft",
        },
      });
      navigate("/app/calendar", { replace: true });
    } catch (error) {
      setMessage(error?.userMessage || "We could not save this hearing time right now. Please review the details and try again.");
      setStatus("ready");
    }
  }

  if (status === "loading") return <SkeletonBlock />;
  if (status === "error") return <StateCard state="error" title="Hearing form needs attention" message={message} />;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Court Time</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Court Hearing Time Entry</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Record hearing work against the right matter so billing stays clear.</p>
      </section>

      <form className="surface-card space-y-4 p-6" onSubmit={handleSubmit}>
        {message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{message}</div> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-ink">
            Matter
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("caseId", event.target.value)} value={form.caseId}>
              <option value="">Select matter</option>
              {matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.title}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Client
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("clientId", event.target.value)} value={form.clientId}>
              <option value="">Select client</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
        </div>
        {selectedMatter ? <p className="rounded-lg bg-blueSoft p-3 text-sm font-semibold text-primary">Selected matter client: {selectedMatter.client}</p> : null}
        <label className="block text-sm font-semibold text-ink">
          Hearing title
          <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("title", event.target.value)} placeholder="Interim relief hearing" value={form.title} />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-ink">
            Court
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("courtName", event.target.value)} placeholder="Court name" value={form.courtName} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Courtroom
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("courtroom", event.target.value)} placeholder="Courtroom" value={form.courtroom} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Judge or bench
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("judgeOrBench", event.target.value)} placeholder="Judge or bench" value={form.judgeOrBench} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Location
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("location", event.target.value)} placeholder="Location" value={form.location} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Started
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("startedAt", event.target.value)} type="datetime-local" value={form.startedAt} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Ended
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("endedAt", event.target.value)} type="datetime-local" value={form.endedAt} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Minutes
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" min="1" onChange={(event) => updateField("minutes", event.target.value)} placeholder={computedMinutes ? String(computedMinutes) : "60"} type="number" value={form.minutes} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Billing
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("billable", event.target.value)} value={form.billable}>
              <option value="true">Billable</option>
              <option value="false">Non-billable</option>
            </select>
          </label>
        </div>
        <label className="block text-sm font-semibold text-ink">
          Notes
          <textarea className="focus-ring mt-1 min-h-28 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("narrative", event.target.value)} placeholder="Short note for billing review" value={form.narrative} />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link className="focus-ring inline-flex justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to="/app/calendar">
            Cancel
          </Link>
          <Button isLoading={status === "saving"} type="submit">
            <Save className="h-4 w-4" />
            Save hearing time
          </Button>
        </div>
      </form>
    </div>
  );
}
