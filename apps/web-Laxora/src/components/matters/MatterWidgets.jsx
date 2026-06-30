import { Link } from "react-router-dom";
import { BriefcaseBusiness, CalendarDays, Edit, ReceiptText, UserRound } from "lucide-react";
import { Card, CardBody, CardHeader, StatusBadge } from "../common";

const statusTone = {
  open: "success",
  pending: "warning",
  closed: "neutral",
  archived: "neutral",
};

function dateText(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function MatterCard({ matter }) {
  return (
    <Card className="p-5">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-lg font-bold text-primary">{matter.title}</h3>
            <StatusBadge tone={statusTone[String(matter.status).toLowerCase()] || "neutral"}>{matter.status}</StatusBadge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">{matter.client}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-muted">
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Opened {dateText(matter.openedAt)}</span>
            <span className="inline-flex items-center gap-1"><ReceiptText className="h-4 w-4" /> {matter.billingType}</span>
            <span className="inline-flex items-center gap-1"><UserRound className="h-4 w-4" /> {matter.assignedLabel || "Unassigned"}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link className="focus-ring rounded-lg border border-border px-3 py-2 text-center text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/matters/${matter.id}`}>
            Open
          </Link>
          <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/matters/${matter.id}/edit`}>
            <Edit className="h-4 w-4" />
            Edit
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function MatterRollupTiles({ rollup }) {
  const tiles = [
    { label: "Work in progress", value: rollup?.wip ?? 0 },
    { label: "Billed", value: rollup?.billed ?? 0 },
    { label: "Paid", value: rollup?.paid ?? 0 },
    { label: "Receivable", value: rollup?.ar ?? 0 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => (
        <Card className="p-5" key={tile.label}>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{tile.label}</p>
          <p className="mt-2 text-2xl font-bold text-primary">Rs {Number(tile.value || 0).toLocaleString("en-IN")}</p>
        </Card>
      ))}
    </div>
  );
}

export function AssignmentList({ assignments }) {
  if (!assignments.length) {
    return <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted">No team assignments are active for this matter yet.</div>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {assignments.map((assignment) => (
        <Card className="p-4" key={assignment.id || `${assignment.userName}-${assignment.role}`}>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blueSoft p-2 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {assignment.userId ? (
                  <Link className="focus-ring rounded text-sm font-bold text-ink hover:text-primary hover:underline" to={`/app/people/${assignment.userId}`}>
                    {assignment.userName}
                  </Link>
                ) : (
                  <h3 className="text-sm font-bold text-ink">{assignment.userName}</h3>
                )}
                <StatusBadge tone={assignment.status === "active" ? "success" : "neutral"}>{assignment.status}</StatusBadge>
              </div>
              <p className="mt-1 text-xs font-semibold text-muted">{assignment.role} {assignment.userRole ? `- ${assignment.userRole}` : ""}</p>
              <p className="mt-2 break-words text-sm text-muted">{assignment.email || assignment.matterTitle}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function MatterRelatedList({ emptyText, items, title }) {
  return (
    <Card>
      <CardHeader title={title} action={<StatusBadge>{items.length}</StatusBadge>} />
      <CardBody className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div className="flex min-w-0 items-start gap-3 rounded-lg border border-border p-3" key={item.id || item._id || item.number || item.status}>
              <div className="rounded-lg bg-blueSoft p-2 text-primary">
                <BriefcaseBusiness className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="break-words text-sm font-bold text-ink">{item.title || item.number || item.invoiceNumber || item.description || item.status || "Related item"}</p>
                <p className="mt-1 text-xs font-semibold text-muted">{item.status || item.createdAt || "Ready for review"}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">{emptyText}</div>
        )}
      </CardBody>
    </Card>
  );
}
