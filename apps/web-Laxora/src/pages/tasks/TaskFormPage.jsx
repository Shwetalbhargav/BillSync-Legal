import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { clientsApi } from "../../api/clients";
import { mattersApi } from "../../api/matters";
import { asList, normalizeClient, normalizeMatter, normalizeTask, normalizeUser } from "../../api/normalizers";
import { tasksApi } from "../../api/tasks";
import { usersApi } from "../../api/users";
import { Button, SkeletonBlock, StateCard } from "../../components/common";

const initialForm = {
  title: "",
  description: "",
  caseId: "",
  clientId: "",
  assignedTo: "",
  dueDate: "",
  priority: "normal",
  status: "todo",
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
  if (!form.title.trim()) return "Enter the task title.";
  if (!form.caseId) return "Select the matter for this task.";
  if (!form.clientId) return "Select a matter with a client.";
  if (!form.assignedTo) return "Select who should handle this task.";
  return "";
}

export function TaskFormPage() {
  const { taskId } = useParams();
  const isEdit = Boolean(taskId);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [matters, setMatters] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      setStatus("loading");
      setMessage("");
      try {
        const [matterResponse, clientResponse, userResponse, taskResponse] = await Promise.all([
          mattersApi.list({ limit: 200 }),
          clientsApi.list({ limit: 200 }),
          usersApi.list({ limit: 200 }),
          isEdit ? tasksApi.get(taskId) : Promise.resolve(null),
        ]);
        const matterOptions = asList(matterResponse).map(normalizeMatter);
        const clientOptions = asList(clientResponse).map(normalizeClient);
        const userOptions = asList(userResponse).map(normalizeUser);
        setMatters(matterOptions);
        setClients(clientOptions);
        setUsers(userOptions);
        if (isEdit) {
          const task = normalizeTask(unwrap(taskResponse));
          setForm({
            title: task.title,
            description: task.description,
            caseId: task.matterId,
            clientId: task.clientId,
            assignedTo: task.assigneeId,
            dueDate: dateInput(task.dueDate),
            priority: task.priority || "normal",
            status: task.status || "todo",
          });
        }
        setStatus("ready");
      } catch (error) {
        setStatus("error");
        setMessage(error?.userMessage || "We could not prepare this task form.");
      }
    }
    load();
  }, [isEdit, taskId]);

  const selectedMatter = useMemo(() => matters.find((matter) => matter.id === form.caseId), [form.caseId, matters]);

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
    const validationMessage = validate(form);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }
    setStatus("saving");
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        caseId: form.caseId,
        clientId: form.clientId,
        assignedTo: form.assignedTo,
        dueDate: form.dueDate || undefined,
        priority: form.priority,
        status: form.status,
      };
      const response = isEdit ? await tasksApi.update(taskId, body) : await tasksApi.create(body);
      const saved = normalizeTask(unwrap(response));
      navigate(`/app/tasks/${saved.id || taskId}`, { replace: true });
    } catch (error) {
      setMessage(error?.userMessage || "We could not save this task right now. Please review the details and try again.");
      setStatus("ready");
    }
  }

  if (status === "loading") return <SkeletonBlock />;
  if (status === "error") return <StateCard state="error" title="Task form needs attention" message={message} />;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Tasks</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{isEdit ? "Edit Task" : "Create Task"}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Give the task enough matter context so the team can start work confidently.</p>
      </section>

      <form className="surface-card space-y-4 p-6" onSubmit={handleSubmit}>
        {message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{message}</div> : null}
        <label className="block text-sm font-semibold text-ink">
          Task title
          <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("title", event.target.value)} placeholder="Task title" value={form.title} />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Notes
          <textarea className="focus-ring mt-1 min-h-28 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("description", event.target.value)} placeholder="What needs to be done?" value={form.description} />
        </label>
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
          <label className="block text-sm font-semibold text-ink">
            Assigned to
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("assignedTo", event.target.value)} value={form.assignedTo}>
              <option value="">Select team member</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Due date
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("dueDate", event.target.value)} type="date" value={form.dueDate} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Priority
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("priority", event.target.value)} value={form.priority}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Status
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("status", event.target.value)} value={form.status}>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>
        {selectedMatter ? <p className="rounded-lg bg-blueSoft p-3 text-sm font-semibold text-primary">Selected matter client: {selectedMatter.client}</p> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link className="focus-ring inline-flex justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={isEdit ? `/app/tasks/${taskId}` : "/app/tasks"}>
            Cancel
          </Link>
          <Button isLoading={status === "saving"} type="submit">
            <Save className="h-4 w-4" />
            Save task
          </Button>
        </div>
      </form>
    </div>
  );
}
