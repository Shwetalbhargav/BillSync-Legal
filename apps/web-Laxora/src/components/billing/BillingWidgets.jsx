import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock3, CreditCard, Filter, Landmark, ReceiptText, XCircle } from "lucide-react";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";

export const billableStatuses = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Billed", value: "billed" },
];

export const billingCategories = [
  "Email drafting/review",
  "Contract drafting/review",
  "Legal research",
  "Client consultation (calls/meetings)",
  "Case preparation/documentation",
  "Court appearance or hearing attendance",
  "Negotiation/settlement discussions",
  "IP filing & compliance work",
  "Dispute resolution activities",
  "Miscellaneous administrative legal work",
];

export const activityCodes = ["EMAIL", "CALL", "MEETING", "DOC_REVIEW", "RESEARCH", "NEGOTIATION", "ADMIN", "OTHER"];

export function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatMinutes(minutes = 0) {
  const total = Math.max(0, Number(minutes || 0));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return hours ? `${hours}h ${String(mins).padStart(2, "0")}m` : `${mins}m`;
}

export function statusTone(status = "") {
  const value = String(status).toLowerCase();
  if (value === "approved" || value === "billed") return "success";
  if (value === "pending") return "warning";
  if (value === "rejected") return "danger";
  return "neutral";
}

export function BillingHero({ amount, count, pendingCount }) {
  return (
    <section className="surface-card p-6">
      <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Billing</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Billables and rates</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Review billable work, approve clean entries, and keep team rates ready for billing.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
          <MetricTile icon={ReceiptText} label="Billables" value={count} />
          <MetricTile icon={Clock3} label="Pending review" value={pendingCount} tone="warning" />
          <MetricTile icon={CreditCard} label="Billable value" value={formatMoney(amount)} tone="success" />
        </div>
      </div>
    </section>
  );
}

export function MetricTile({ icon: Icon, label, tone = "neutral", value }) {
  const toneClass = tone === "success" ? "bg-success/10 text-success" : tone === "warning" ? "bg-warning/10 text-warning" : "bg-blueSoft text-primary";
  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-words text-lg font-bold text-primary">{value}</p>
    </div>
  );
}

export function SectionIssues({ issues }) {
  if (!issues?.length) return null;
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <p className="text-sm font-bold text-warning">Some billing details need another refresh.</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-ink">
            {issues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function BillableFilters({ clients, filters, matters, onChange, onReset }) {
  return (
    <section className="surface-card p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-bold text-primary">
        <Filter className="h-4 w-4" />
        Filters
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <label className="block text-sm font-semibold text-ink">
          Status
          <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("status", event.target.value)} value={filters.status}>
            {billableStatuses.map((status) => <option key={status.label} value={status.value}>{status.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Client
          <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("clientId", event.target.value)} value={filters.clientId}>
            <option value="">All clients</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Matter
          <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("caseId", event.target.value)} value={filters.caseId}>
            <option value="">All matters</option>
            {matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.title}</option>)}
          </select>
        </label>
        <div className="flex items-end">
          <Button className="w-full" onClick={onReset} type="button" variant="secondary">Reset</Button>
        </div>
      </div>
    </section>
  );
}

export function BillablesTable({ billables }) {
  if (!billables.length) {
    return <StateCard state="empty" title="No billable work found" message="Adjust the filters or create billable work from captured time and email review." />;
  }

  return (
    <DataTable
      columns={[
        { key: "description", label: "Work" },
        { key: "matter", label: "Matter" },
        { key: "status", label: "Status" },
        { key: "time", label: "Time" },
        { key: "amount", label: "Amount" },
        { key: "date", label: "Date" },
      ]}
      rows={billables.map((billable) => ({
        id: billable.id,
        description: <Link className="break-words font-bold text-primary hover:underline" to={`/app/billables/${billable.id}`}>{billable.description}</Link>,
        matter: billable.matter || "Matter not set",
        status: <StatusBadge tone={statusTone(billable.status)}>{billable.status}</StatusBadge>,
        time: formatMinutes(billable.minutes),
        amount: formatMoney(billable.amount),
        date: formatDate(billable.date),
      }))}
    />
  );
}

export function ApprovalQueue({ billables, canApprove, onApprove, onReject, savingId }) {
  if (!canApprove) {
    return <StateCard state="permission" title="Approval is reserved for firm reviewers" message="You can review billing details, but approvals need an administrator account in this workspace." />;
  }

  if (!billables.length) {
    return <StateCard state="empty" title="Nothing waiting for approval" message="Pending billable work will appear here when the team submits it for review." />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {billables.map((billable) => (
        <Card className="p-5" key={billable.id}>
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-base font-bold text-primary">{billable.description}</h2>
                <StatusBadge tone="warning">{billable.status}</StatusBadge>
              </div>
              <p className="mt-2 text-sm text-muted">{billable.matter || "Matter not set"} - {formatMinutes(billable.minutes)}</p>
              <p className="mt-1 text-sm font-bold text-primary">{formatMoney(billable.amount)}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <Button disabled={savingId === billable.id} isLoading={savingId === billable.id} onClick={() => onApprove(billable)} size="sm" type="button" variant="success">
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </Button>
              <Button disabled={savingId === billable.id} onClick={() => onReject(billable)} size="sm" type="button" variant="danger">
                <XCircle className="h-4 w-4" />
                Send back
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function BillableDetailPanel({ billable, canApprove, onApprove, onReject, saving }) {
  return (
    <section className="surface-card p-6">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Billable detail</p>
          <h1 className="mt-1 break-words text-2xl font-bold text-primary md:text-3xl">{billable.description}</h1>
          <p className="mt-2 text-sm font-semibold text-muted">{billable.client || "Client not set"} - {billable.matter || "Matter not set"}</p>
        </div>
        <StatusBadge tone={statusTone(billable.status)}>{billable.status}</StatusBadge>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <MetricTile icon={Clock3} label="Time" value={formatMinutes(billable.minutes)} />
        <MetricTile icon={Landmark} label="Rate" value={`${formatMoney(billable.rate)} / hr`} />
        <MetricTile icon={CreditCard} label="Amount" value={formatMoney(billable.amount)} tone="success" />
        <MetricTile icon={ReceiptText} label="Date" value={formatDate(billable.date)} />
      </div>
      <div className="mt-6 rounded-lg border border-border p-4">
        <p className="text-sm font-bold text-primary">Category</p>
        <p className="mt-1 text-sm leading-6 text-muted">{billable.category || "Not set"}</p>
      </div>
      {canApprove && billable.status === "pending" ? (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button disabled={saving} isLoading={saving} onClick={() => onApprove(billable)} type="button" variant="success">Approve</Button>
          <Button disabled={saving} onClick={() => onReject(billable)} type="button" variant="danger">Send back</Button>
        </div>
      ) : null}
    </section>
  );
}

export function SyncHistoryList({ logs }) {
  if (!logs.length) {
    return <StateCard state="empty" title="No billing sync history" message="External billing activity for this item will appear here when available." />;
  }

  return (
    <DataTable
      columns={[
        { key: "event", label: "Activity" },
        { key: "area", label: "Area" },
        { key: "status", label: "Status" },
        { key: "when", label: "When" },
      ]}
      rows={logs.map((log) => ({
        id: log.id,
        event: <span className="font-semibold text-ink">{log.title}</span>,
        area: log.platform,
        status: <StatusBadge>{log.status}</StatusBadge>,
        when: formatDate(log.createdAt),
      }))}
    />
  );
}

export function RateCardForm({ form, matters, onChange, onSubmit, users, saving }) {
  return (
    <Card>
      <CardHeader title="Add rate card" description="Set a team member rate for all work, a matter, or a work type." />
      <CardBody>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm font-semibold text-ink">
            Team member
            <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("userId", event.target.value)} value={form.userId}>
              <option value="">Select team member</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Matter scope
            <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("caseId", event.target.value)} value={form.caseId}>
              <option value="">All matters</option>
              {matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.title}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Work type
            <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("activityCode", event.target.value)} value={form.activityCode}>
              <option value="">All work types</option>
              {activityCodes.map((code) => <option key={code} value={code}>{code}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Rate per hour
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" min="1" onChange={(event) => onChange("ratePerHour", event.target.value)} type="number" value={form.ratePerHour} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Effective from
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("effectiveFrom", event.target.value)} type="date" value={form.effectiveFrom} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Effective to
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("effectiveTo", event.target.value)} type="date" value={form.effectiveTo} />
          </label>
        </div>
        <Button className="mt-4 w-full sm:w-auto" disabled={saving} isLoading={saving} onClick={onSubmit} type="button">Save rate card</Button>
      </CardBody>
    </Card>
  );
}

export function RateCardsTable({ onDelete, rateCards, savingId }) {
  if (!rateCards.length) {
    return <StateCard state="empty" title="No rate cards yet" message="Add a rate card so billable work can use the right hourly rate." />;
  }

  return (
    <DataTable
      columns={[
        { key: "user", label: "Team member" },
        { key: "scope", label: "Scope" },
        { key: "rate", label: "Rate" },
        { key: "window", label: "Active dates" },
        { key: "action", label: "Action" },
      ]}
      rows={rateCards.map((card) => ({
        id: card.id,
        user: <span className="font-bold text-primary">{card.user}</span>,
        scope: [card.matter || "All matters", card.activityCode || "All work types"].join(" - "),
        rate: `${formatMoney(card.ratePerHour)} / hr`,
        window: `${formatDate(card.effectiveFrom)} - ${card.effectiveTo ? formatDate(card.effectiveTo) : "No end date"}`,
        action: <Button disabled={savingId === card.id} onClick={() => onDelete(card)} size="sm" type="button" variant="danger">Remove</Button>,
      }))}
    />
  );
}
