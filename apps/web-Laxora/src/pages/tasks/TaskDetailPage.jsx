import { Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { normalizeTask } from "../../api/normalizers";
import { tasksApi } from "../../api/tasks";
import { Button, Card, CardBody, CardHeader, SkeletonBlock, StateCard, StatusBadge } from "../../components/common";
import { dateText, priorityLabel, taskStatusLabel, WorkLaunchCard } from "../../components/tasks/TaskWidgets";

function unwrap(response) {
  return response?.data || response;
}

export function TaskDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  async function load() {
    setStatus("loading");
    setMessage("");
    try {
      const response = await tasksApi.get(taskId);
      setTask(normalizeTask(unwrap(response)));
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setMessage(error?.userMessage || "We could not load this task right now.");
    }
  }

  useEffect(() => {
    load();
  }, [taskId]);

  async function changeStatus(nextStatus) {
    setStatus("saving");
    try {
      const response = await tasksApi.updateStatus(taskId, nextStatus);
      setTask(normalizeTask(unwrap(response)));
      setStatus("ready");
    } catch (error) {
      setMessage(error?.userMessage || "We could not update this task right now.");
      setStatus("ready");
    }
  }

  async function removeTask() {
    setStatus("saving");
    try {
      await tasksApi.remove(taskId);
      navigate("/app/tasks", { replace: true });
    } catch (error) {
      setMessage(error?.userMessage || "We could not delete this task right now.");
      setStatus("ready");
    }
  }

  if (status === "loading") return <SkeletonBlock />;
  if (status === "error") return <StateCard state="error" title="Task needs attention" message={message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Task Detail</p>
            <h1 className="mt-1 break-words text-2xl font-bold text-primary md:text-3xl">{task.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge>{taskStatusLabel(task.status)}</StatusBadge>
              <StatusBadge>{priorityLabel(task.priority)}</StatusBadge>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{task.description || "No notes added yet."}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/tasks/${task.id}/edit`}>
              <Edit className="h-4 w-4" />
              Edit
            </Link>
            <Button disabled={status === "saving"} onClick={() => changeStatus(task.status === "done" ? "todo" : "done")} type="button" variant="secondary">
              {task.status === "done" ? "Reopen" : "Mark done"}
            </Button>
          </div>
        </div>
        {message ? <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{message}</div> : null}
      </section>

      <WorkLaunchCard task={task} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Task context" />
          <CardBody className="space-y-3 text-sm text-muted">
            <p><span className="font-bold text-ink">Matter:</span> {task.matter || "Not set"}</p>
            <p><span className="font-bold text-ink">Client:</span> {task.client || "Not set"}</p>
            <p><span className="font-bold text-ink">Assigned to:</span> {task.assignee}</p>
            <p><span className="font-bold text-ink">Due:</span> {dateText(task.dueDate)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Checklist" />
          <CardBody className="space-y-3">
            {task.checklist.length ? task.checklist.map((item) => (
              <div className="flex items-start gap-3 rounded-lg border border-border p-3" key={item.text}>
                <StatusBadge tone={item.done ? "success" : "neutral"}>{item.done ? "Done" : "Open"}</StatusBadge>
                <p className="break-words text-sm text-ink">{item.text}</p>
              </div>
            )) : <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">No checklist items yet.</div>}
          </CardBody>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button disabled={status === "saving"} onClick={removeTask} type="button" variant="danger">
          <Trash2 className="h-4 w-4" />
          Delete task
        </Button>
      </div>
    </div>
  );
}
