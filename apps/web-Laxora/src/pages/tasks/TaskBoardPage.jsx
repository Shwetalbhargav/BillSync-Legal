import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { asList, normalizeTask } from "../../api/normalizers";
import { tasksApi } from "../../api/tasks";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import { TaskBoard, TaskSummaryTiles } from "../../components/tasks/TaskWidgets";

export function TaskBoardPage() {
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  async function load() {
    setStatus("loading");
    setMessage("");
    try {
      const response = await tasksApi.list();
      const normalized = asList(response).map(normalizeTask);
      setTasks(normalized);
      setStatus(normalized.length ? "ready" : "empty");
    } catch (error) {
      setStatus("error");
      setMessage(error?.userMessage || "We could not load the task board right now.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStatusChange(task, nextStatus) {
    try {
      await tasksApi.updateStatus(task.id, nextStatus);
      await load();
    } catch (error) {
      setStatus("error");
      setMessage(error?.userMessage || "We could not move this task right now.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Team Tasks</p>
            <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Task Board</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Review work by stage and move tasks forward when priorities change.</p>
          </div>
          <Link className="focus-ring inline-flex justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryStrong" to="/app/tasks/new">New task</Link>
        </div>
      </section>

      {status === "ready" ? <TaskSummaryTiles tasks={tasks} /> : null}
      {status === "loading" ? <SkeletonBlock /> : null}
      {status === "error" ? <StateCard state="error" title="Task board needs attention" message={message} actionLabel="Retry" /> : null}
      {status === "empty" ? <StateCard state="empty" title="No tasks on the board" message="Create the first task to start planning work." /> : null}
      {status === "ready" ? <TaskBoard onStatusChange={handleStatusChange} tasks={tasks} /> : null}
      {status === "ready" ? <Button onClick={load} type="button" variant="secondary">Refresh board</Button> : null}
    </div>
  );
}
