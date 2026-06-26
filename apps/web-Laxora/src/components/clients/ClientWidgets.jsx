import { Link } from "react-router-dom";
import { Mail, Phone, ReceiptText, Trash2, UserRound } from "lucide-react";
import { Card, CardBody, CardHeader, StatusBadge } from "../common";

const statusTone = {
  active: "success",
  inactive: "neutral",
  prospect: "accent",
};

export function ClientCard({ canDelete = true, canEdit = true, client, onDelete, readOnly = false }) {
  return (
    <Card className="p-5">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-lg font-bold text-primary">{client.name}</h3>
            <StatusBadge tone={statusTone[String(client.status).toLowerCase()] || "neutral"}>{client.status}</StatusBadge>
          </div>
          <div className="mt-3 grid gap-2 text-sm text-muted">
            <span className="inline-flex min-w-0 items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{client.email || "Email not added yet"}</span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <span className="truncate">{client.phone || "Phone not added yet"}</span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-2">
              <UserRound className="h-4 w-4 shrink-0" />
              <span className="truncate">{client.ownerName || "No appointed user"}</span>
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Link className="focus-ring rounded-lg border border-border px-3 py-2 text-center text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/clients/${client.id}`}>
            Open client
          </Link>
          {canEdit && !readOnly ? (
            <Link className="focus-ring rounded-lg border border-border px-3 py-2 text-center text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/clients/${client.id}/edit`}>
              Edit
            </Link>
          ) : null}
          {onDelete && canDelete && !readOnly ? (
            <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-danger/30 px-3 py-2 text-sm font-semibold text-danger hover:bg-danger/10" onClick={() => onDelete(client)} type="button">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function ClientSummaryTiles({ summary }) {
  const tiles = [
    { label: "Work in progress", value: summary?.wip ?? 0 },
    { label: "Billed", value: summary?.billed ?? 0 },
    { label: "Paid", value: summary?.paid ?? 0 },
    { label: "Receivable", value: summary?.ar ?? 0 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => (
        <Card className="p-5" key={tile.label}>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{tile.label}</p>
          <p className="mt-2 text-2xl font-bold text-primary">₹{Number(tile.value || 0).toLocaleString("en-IN")}</p>
        </Card>
      ))}
    </div>
  );
}

export function ContactList({ contacts }) {
  if (!contacts.length) {
    return <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted">No contacts are saved for this client yet.</div>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {contacts.map((contact, index) => (
        <Card className="p-4" key={`${contact.email || contact.phone || contact.name}-${index}`}>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blueSoft p-2 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-ink">{contact.name || "Client contact"}</h3>
              <p className="mt-1 text-xs font-semibold text-muted">{contact.role || "Role not added yet"}</p>
              <p className="mt-2 break-words text-sm text-muted">{contact.email || "Email not added yet"}</p>
              <p className="mt-1 break-words text-sm text-muted">{contact.phone || "Phone not added yet"}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function RelatedBillingList({ emptyText, items, title }) {
  return (
    <Card>
      <CardHeader title={title} action={<StatusBadge>{items.length}</StatusBadge>} />
      <CardBody className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div className="flex min-w-0 items-start gap-3 rounded-lg border border-border p-3" key={item.id || item._id || item.invoiceNumber || item.number}>
              <div className="rounded-lg bg-blueSoft p-2 text-primary">
                <ReceiptText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="break-words text-sm font-bold text-ink">{item.number || item.invoiceNumber || item.description || item.status || "Billing item"}</p>
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
