import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { clientsApi } from "../../api/clients";
import { mattersApi } from "../../api/matters";
import { asList, normalizeClient, normalizeMatter } from "../../api/normalizers";
import { Button, SkeletonBlock, StateCard } from "../../components/common";

const initialForm = {
  clientId: "",
  title: "",
  description: "",
  status: "open",
  billingType: "hourly",
  case_type: "",
  openedAt: "",
  closedAt: "",
};

function unwrap(response) {
  return response?.data || response;
}

function dateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function validate(form) {
  if (!form.clientId) return "Select the client for this matter.";
  if (!form.title.trim()) return "Enter the matter title.";
  if (form.closedAt && form.openedAt && Date.parse(form.closedAt) < Date.parse(form.openedAt)) return "Closed date must be after the opened date.";
  return "";
}

export function MatterFormPage() {
  const { matterId } = useParams();
  const isEdit = Boolean(matterId);
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      setStatus("loading");
      try {
        const clientsResponse = await clientsApi.list({ limit: 100 });
        const clientOptions = asList(clientsResponse).map(normalizeClient);
        setClients(clientOptions);
        if (isEdit) {
          const matter = normalizeMatter(unwrap(await mattersApi.get(matterId)));
          setForm({
            clientId: matter.clientId,
            title: matter.title,
            description: matter.description,
            status: String(matter.status || "open").toLowerCase(),
            billingType: matter.billingType,
            case_type: matter.matterType,
            openedAt: dateInput(matter.openedAt),
            closedAt: dateInput(matter.closedAt),
          });
        }
        setStatus("ready");
      } catch (error) {
        setMessage(error?.userMessage || "We could not prepare this matter form.");
        setStatus("error");
      }
    }
    load();
  }, [isEdit, matterId]);

  function updateField(field, value) {
    setMessage("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationMessage = validate(form);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }
    setStatus("saving");
    try {
      const body = {
        clientId: form.clientId,
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        billingType: form.billingType,
        case_type: form.case_type.trim(),
        openedAt: form.openedAt || undefined,
        closedAt: form.closedAt || undefined,
      };
      const response = isEdit ? await mattersApi.replace(matterId, body) : await mattersApi.create(body);
      const saved = normalizeMatter(unwrap(response));
      navigate(`/app/matters/${saved.id || matterId}`, { replace: true });
    } catch (error) {
      setMessage(error?.userMessage || "We could not save this matter right now. Please review the details and try again.");
      setStatus("ready");
    }
  }

  if (status === "loading") return <SkeletonBlock />;
  if (status === "error") return <StateCard state="error" title="Matter form needs attention" message={message} />;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Matters</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{isEdit ? "Edit Matter" : "Create Matter"}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Capture the core matter details your team needs for staffing, time, and billing.</p>
      </section>

      <form className="surface-card space-y-4 p-6" onSubmit={handleSubmit}>
        {message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{message}</div> : null}
        <label className="block text-sm font-semibold text-ink">
          Client
          <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("clientId", event.target.value)} value={form.clientId}>
            <option value="">Select client</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Matter title
          <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("title", event.target.value)} placeholder="Matter title" value={form.title} />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Description
          <textarea className="focus-ring mt-1 min-h-28 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("description", event.target.value)} placeholder="Short matter description" value={form.description} />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-ink">
            Status
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("status", event.target.value)} value={form.status}>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Billing type
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("billingType", event.target.value)} value={form.billingType}>
              <option value="hourly">Hourly</option>
              <option value="fixed_fee">Fixed fee</option>
              <option value="contingency">Contingency</option>
              <option value="retainer">Retainer</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Matter type
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("case_type", event.target.value)} placeholder="Litigation, advisory, filing..." value={form.case_type} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Opened date
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("openedAt", event.target.value)} type="date" value={form.openedAt} />
          </label>
          <label className="block text-sm font-semibold text-ink md:col-span-2">
            Closed date
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("closedAt", event.target.value)} type="date" value={form.closedAt} />
          </label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link className="focus-ring inline-flex justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={isEdit ? `/app/matters/${matterId}` : "/app/matters"}>
            Cancel
          </Link>
          <Button isLoading={status === "saving"} type="submit">
            <Save className="h-4 w-4" />
            Save matter
          </Button>
        </div>
      </form>
    </div>
  );
}
