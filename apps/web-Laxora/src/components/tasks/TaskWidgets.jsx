import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, Clock3, Edit, Gauge, PlayCircle, UserRound } from "lucide-react";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";

const statusTone = {
  todo: "neutral",
  in_progress: "warning",
  blocked: "danger",
  done: "success",
  cancelled: "neutral",
};

const priorityTone = {
  low: "neutral",
  normal: "neutral",
  high: "warning",
  urgent: "danger",
};

export function taskStatusLabel(value) {
  const labels = {
    todo: "To do",
    in_progress: "In progress",
    blocked: "Blocked",
    done: "Done",
    cancelled: "Cancelled",
  };
  return labels[value] || value || "To do";
}

export function priorityLabel(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Normal";
}

export function dateText(value) {
  if (!value) return "No due date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No due date" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function TaskCard({ task, onStatusChange }) {
  return (
    <Card className="p-5">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-bold text-primary">{task.title}</h3>
            <StatusBadge tone={statusTone[task.status] || "neutral"}>{taskStatusLabel(task.status)}</StatusBadge>
            <StatusBadge tone={priorityTone[task.priority] || "neutral"}>{priorityLabel(task.priority)}</StatusBadge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">{task.description || "No notes added yet."}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-muted">
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {dateText(task.dueDate)}</span>
            <span className="inline-flex items-center gap-1"><UserRound className="h-4 w-4" /> {task.assignee}</span>
          </div>
          {task.matter ? <p className="mt-2 text-xs font-semibold text-muted">Matter: {task.matter}</p> : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Link className="focus-ring rounded-lg border border-border px-3 py-2 text-center text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/tasks/${task.id}`}>
            Open
          </Link>
          <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/tasks/${task.id}/edit`}>
            <Edit className="h-4 w-4" />
            Edit
          </Link>
          {onStatusChange ? (
            <Button onClick={() => onStatusChange(task, task.status === "done" ? "todo" : "done")} size="sm" type="button" variant="secondary">
              <CheckCircle2 className="h-4 w-4" />
              {task.status === "done" ? "Reopen" : "Mark done"}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function TaskBoard({ tasks, onStatusChange }) {
  const columns = [
    { key: "todo", label: "To do" },
    { key: "in_progress", label: "In progress" },
    { key: "blocked", label: "Blocked" },
    { key: "done", label: "Done" },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.key);
        return (
          <Card className="min-w-0" key={column.key}>
            <CardHeader title={column.label} action={<StatusBadge>{columnTasks.length}</StatusBadge>} />
            <CardBody className="space-y-3">
              {columnTasks.length ? columnTasks.map((task) => (
                <div className="rounded-lg border border-border p-3" key={task.id}>
                  <Link className="break-words text-sm font-bold text-primary hover:underline" to={`/app/tasks/${task.id}`}>{task.title}</Link>
                  <p className="mt-2 text-xs font-semibold text-muted">{dateText(task.dueDate)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge tone={priorityTone[task.priority] || "neutral"}>{priorityLabel(task.priority)}</StatusBadge>
                    <Button onClick={() => onStatusChange(task, column.key === "done" ? "todo" : "in_progress")} size="sm" type="button" variant="ghost">
                      {column.key === "done" ? "Reopen" : "Start"}
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">No tasks here.</div>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

export function TaskSummaryTiles({ tasks }) {
  const dueToday = tasks.filter((task) => isToday(task.dueDate)).length;
  const active = tasks.filter((task) => ["todo", "in_progress", "blocked"].includes(task.status)).length;
  const done = tasks.filter((task) => task.status === "done").length;
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  const tiles = [
    { label: "Active", value: active, icon: Clock3 },
    { label: "Due today", value: dueToday, icon: CalendarDays },
    { label: "Done", value: done, icon: CheckCircle2 },
    { label: "Blocked", value: blocked, icon: Gauge },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Card className="p-5" key={tile.label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">{tile.label}</p>
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold text-primary">{tile.value}</p>
          </Card>
        );
      })}
    </div>
  );
}

export function TaskTable({ tasks }) {
  if (!tasks.length) {
    return <StateCard state="empty" title="No tasks found" message="Create a task or try a broader filter." />;
  }

  return (
    <DataTable
      columns={[
        { key: "title", label: "Task" },
        { key: "matter", label: "Matter" },
        { key: "assignee", label: "Assignee" },
        { key: "due", label: "Due" },
        { key: "status", label: "Status" },
      ]}
      rows={tasks.map((task) => ({
        id: task.id,
        title: <Link className="font-bold text-primary hover:underline" to={`/app/tasks/${task.id}`}>{task.title}</Link>,
        matter: task.matter || "Not set",
        assignee: task.assignee,
        due: dateText(task.dueDate),
        status: <StatusBadge tone={statusTone[task.status] || "neutral"}>{taskStatusLabel(task.status)}</StatusBadge>,
      }))}
    />
  );
}

export function WorkLaunchCard({ task }) {
  return (
    <Card className="p-5">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">Ready to work on this?</p>
          <p className="mt-1 text-sm leading-6 text-muted">Start the meter with this task and matter already selected.</p>
        </div>
        <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryStrong" to={`/app/work-meter?taskId=${task.id}&matterId=${task.matterId || ""}`}>
          <PlayCircle className="h-4 w-4" />
          Start work meter
        </Link>
      </div>
    </Card>
  );
}

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}
