import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { asList, normalizeTask } from "../../api/normalizers";
import { tasksApi } from "../../api/tasks";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import { TaskCard, TaskSummaryTiles } from "../../components/tasks/TaskWidgets";

export function TaskListPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  async function load(params = { status: statusFilter }) {
    setStatus("loading");
    setMessage("");
    try {
      const response = await tasksApi.list({ status: params.status });
      const normalized = asList(response).map(normalizeTask);
      const filtered = query.trim()
        ? normalized.filter((task) => `${task.title} ${task.description} ${task.matter}`.toLowerCase().includes(query.trim().toLowerCase()))
        : normalized;
      setTasks(filtered);
      setStatus(filtered.length ? "ready" : "empty");
    } catch (error) {
      setTasks([]);
      setStatus("error");
      setMessage(error?.userMessage || "We could not load tasks right now. Please try again.");
    }
  }

  useEffect(() => {
    load({ status: "" });
  }, []);

  async function handleStatusChange(task, nextStatus) {
    try {
      await tasksApi.updateStatus(task.id, nextStatus);
      await load();
    } catch (error) {
      setMessage(error?.userMessage || "We could not update this task right now.");
      setStatus("error");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    load();
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Daily Work</p>
            <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">My Tasks</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Track today’s work, due dates, blockers, and matter context in one place.</p>
          </div>
          <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryStrong" to="/app/tasks/new">
            <Plus className="h-4 w-4" />
            New task
          </Link>
        </div>
        <form className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_auto]" onSubmit={handleSubmit}>
          <label className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3" onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" value={query} />
          </label>
          <select className="focus-ring rounded-lg border border-border px-3 py-3" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
            <option value="">All statuses</option>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button isLoading={status === "loading"} type="submit">Search</Button>
        </form>
      </section>

      {status === "ready" ? <TaskSummaryTiles tasks={tasks} /> : null}
      {status === "loading" ? <div className="grid gap-4 xl:grid-cols-2"><SkeletonBlock /><SkeletonBlock /></div> : null}
      {status === "error" ? <StateCard state="error" title="Task list needs attention" message={message} actionLabel="Retry" /> : null}
      {status === "empty" ? <StateCard state="empty" title="No tasks found" message="Create a task or try a broader filter." /> : null}
      {status === "ready" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {tasks.map((task) => <TaskCard key={task.id} onStatusChange={handleStatusChange} task={task} />)}
        </div>
      ) : null}
    </div>
  );
}
