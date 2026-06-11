import { Link } from "react-router-dom";
import { AlertCircle, Clock3, FileText, History, NotebookTabs, ReceiptText, ShieldCheck } from "lucide-react";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";
import { MatterRollupTiles } from "./MatterWidgets";

const tabs = [
  { label: "Overview", key: "overview", icon: NotebookTabs },
  { label: "Team", key: "team", icon: History },
  { label: "Timeline", key: "timeline", icon: Clock3 },
  { label: "Documents", key: "documents", icon: FileText },
  { label: "Billing", key: "billing", icon: ReceiptText },
  { label: "History", key: "audit", icon: ShieldCheck },
];

export function MatterTabHeader({ activeTab, matter }) {
  const base = `/app/matters/${matter.id}`;
  return (
    <section className="surface-card p-5">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Matter workspace</p>
          <h1 className="mt-1 break-words text-2xl font-bold text-primary md:text-3xl">{matter.title}</h1>
          <p className="mt-2 text-sm font-semibold text-muted">{matter.client}</p>
        </div>
        <StatusBadge tone={String(matter.status).toLowerCase() === "open" ? "success" : "neutral"}>{matter.status}</StatusBadge>
      </div>
      <nav className="mt-5 flex max-w-full gap-2 overflow-x-auto pb-1" aria-label="Matter sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const path = tab.key === "overview" ? `${base}/overview` : `${base}/${tab.key}`;
          const active = tab.key === activeTab;
          return (
            <Link
              className={`focus-ring inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                active ? "bg-primary text-white" : "border border-border bg-panel text-primary hover:bg-blueSoft"
              }`}
              key={tab.key}
              to={path}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

export function MatterTabShell({ activeTab, children, error, loading, matter, onRetry }) {
  if (loading) {
    return <StateCard state="loading" title="Opening matter" message="BillSync is gathering the latest details for this matter." />;
  }

  if (error) {
    return <MatterRetryState message={error} onRetry={onRetry} />;
  }

  return (
    <div className="space-y-6">
      <MatterTabHeader activeTab={activeTab} matter={matter} />
      {children}
    </div>
  );
}

export function MatterRetryState({ message, onRetry }) {
  return (
    <section className="surface-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="rounded-lg bg-blueSoft p-3 text-primary">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-ink">Matter needs attention</h2>
          <p className="mt-1 text-sm leading-6 text-muted">{message || "We could not load this matter right now."}</p>
          <Button className="mt-4" onClick={onRetry} type="button" variant="secondary">Retry</Button>
        </div>
      </div>
    </section>
  );
}

export function SectionIssues({ issues }) {
  if (!issues?.length) return null;
  return (
    <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-ink">
      <p className="font-bold text-warning">Some details need another refresh.</p>
      <ul className="mt-2 space-y-1">
        {issues.map((issue) => <li key={issue}>{issue}</li>)}
      </ul>
    </div>
  );
}

export function TimelineList({ items }) {
  if (!items.length) {
    return (
      <StateCard
        state="empty"
        title="No matter activity yet"
        message="When work is captured, time is submitted, or the team changes, it will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card className="p-4" key={`${item.kind}-${item.id}`}>
          <div className="flex min-w-0 gap-3">
            <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-accent" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="break-words text-sm font-bold text-ink">{item.title}</p>
                <StatusBadge>{item.kind}</StatusBadge>
                <StatusBadge tone={String(item.status).toLowerCase() === "approved" ? "success" : "neutral"}>{item.status}</StatusBadge>
              </div>
              <p className="mt-1 text-sm text-muted">{item.source} {item.minutes ? `- ${item.minutes} min` : ""}</p>
              <p className="mt-2 text-xs font-semibold text-muted">{formatDateTime(item.occurredAt)}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function DocumentList({ documents }) {
  if (!documents.length) {
    return (
      <StateCard
        state="empty"
        title="No documents attached"
        message="Stored pleadings, contracts, evidence, and notes will appear once they are linked to this matter."
      />
    );
  }

  return (
    <DataTable
      columns={[
        { key: "title", label: "Document" },
        { key: "type", label: "Type" },
        { key: "provider", label: "Storage" },
        { key: "status", label: "Status" },
        { key: "updated", label: "Updated" },
      ]}
      rows={documents.map((doc) => ({
        id: doc.id,
        title: <span className="font-semibold text-primary">{doc.title}</span>,
        type: doc.type,
        provider: providerLabel(doc.provider),
        status: <StatusBadge tone={doc.status === "stored" ? "success" : "neutral"}>{doc.status}</StatusBadge>,
        updated: formatDate(doc.updatedAt),
      }))}
    />
  );
}

export function BillingSections({ billables, invoices, payments, rollup, timeEntries }) {
  return (
    <div className="space-y-6">
      <MatterRollupTiles rollup={rollup} />
      <div className="grid gap-4 xl:grid-cols-2">
        <BillingList emptyText="No billable work is waiting on this matter." items={billables} title="Billable work" valueKey="amount" />
        <BillingList emptyText="No invoices are linked to this matter yet." items={invoices} title="Invoices" valueKey="total" />
        <BillingList emptyText="No payments are linked to this matter yet." items={payments} title="Payments" valueKey="amount" />
        <BillingList emptyText="No time entries have been recorded for this matter yet." items={timeEntries} title="Time entries" valueKey="minutes" />
      </div>
    </div>
  );
}

function BillingList({ emptyText, items, title, valueKey }) {
  return (
    <Card>
      <CardHeader title={title} action={<StatusBadge>{items.length}</StatusBadge>} />
      <CardBody className="space-y-3">
        {items.length ? items.map((item) => (
          <div className="rounded-lg border border-border p-3" key={item.id}>
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-bold text-ink">{item.description || item.number || item.title || item.status}</p>
                <p className="mt-1 text-xs font-semibold text-muted">{formatDate(item.issuedAt || item.paidAt || item.occurredAt)}</p>
              </div>
              <StatusBadge>{item.status}</StatusBadge>
            </div>
            <p className="mt-2 text-sm font-semibold text-primary">{formatValue(item[valueKey], valueKey)}</p>
          </div>
        )) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">{emptyText}</div>
        )}
      </CardBody>
    </Card>
  );
}

export function AuditList({ activityEvents, documentEvents, logs }) {
  const rows = [
    ...logs.map((item) => ({ id: `log-${item.id}`, event: item.title, area: item.platform, status: item.status, when: item.createdAt })),
    ...documentEvents.map((item) => ({ id: `doc-${item.id}`, event: item.title, area: "Documents", status: item.status, when: item.updatedAt })),
    ...activityEvents.map((item) => ({ id: `act-${item.id}`, event: item.title, area: "Captured work", status: item.status, when: item.occurredAt })),
  ].sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0));

  if (!rows.length) {
    return (
      <StateCard
        state="empty"
        title="No history yet"
        message="Matter changes, stored documents, and sync updates will appear here as the workspace is used."
      />
    );
  }

  return (
    <DataTable
      columns={[
        { key: "event", label: "Event" },
        { key: "area", label: "Area" },
        { key: "status", label: "Status" },
        { key: "when", label: "When" },
      ]}
      rows={rows.map((row) => ({
        ...row,
        event: <span className="font-semibold text-ink">{row.event}</span>,
        status: <StatusBadge>{row.status}</StatusBadge>,
        when: formatDateTime(row.when),
      }))}
    />
  );
}

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatValue(value, key) {
  if (key === "minutes") return `${Number(value || 0)} min`;
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function providerLabel(value) {
  const labels = {
    local: "BillSync storage",
    zoho_workdrive: "Zoho WorkDrive",
    google_drive: "Google Drive",
    onedrive: "OneDrive",
    s3: "Firm storage",
    external: "External link",
  };
  return labels[value] || "Storage";
}
