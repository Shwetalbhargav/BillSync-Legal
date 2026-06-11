import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { asList, normalizeTask } from "../../api/normalizers";
import { tasksApi } from "../../api/tasks";
import { SkeletonBlock, StateCard } from "../../components/common";
import { TaskCard, TaskSummaryTiles } from "../../components/tasks/TaskWidgets";

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { dueFrom: start.toISOString(), dueTo: end.toISOString() };
}

export function MyWorkTodayPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  async function load() {
    setStatus("loading");
    setMessage("");
    try {
      const response = await tasksApi.today({ assignedTo: user?.id, ...todayRange() });
      const normalized = asList(response).map(normalizeTask);
      setTasks(normalized);
      setStatus(normalized.length ? "ready" : "empty");
    } catch (error) {
      setStatus("error");
      setMessage(error?.userMessage || "We could not load today's work right now.");
    }
  }

  useEffect(() => {
    load();
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Today</p>
            <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">My Work Today</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">A focused view of tasks due today, ready for the work meter when you begin.</p>
          </div>
          <Link className="focus-ring inline-flex justify-center rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to="/app/tasks">All tasks</Link>
        </div>
      </section>

      {status === "ready" ? <TaskSummaryTiles tasks={tasks} /> : null}
      {status === "loading" ? <SkeletonBlock /> : null}
      {status === "error" ? <StateCard state="error" title="Today’s work needs attention" message={message} actionLabel="Retry" /> : null}
      {status === "empty" ? <StateCard state="empty" title="No tasks due today" message="You are clear for now. New due tasks will appear here." /> : null}
      {status === "ready" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
        </div>
      ) : null}
    </div>
  );
}
