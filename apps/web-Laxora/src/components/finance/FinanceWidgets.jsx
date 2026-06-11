import { AlertCircle, BarChart3, Download, FileText, Gauge, History, ReceiptText, RefreshCw, WalletCards } from "lucide-react";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";

export function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatPercent(value) {
  return `${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`;
}

export function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function FinanceHero({ kpi, paymentSummary }) {
  return (
    <section className="surface-card p-6">
      <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Finance</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Finance dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Track cash collected, work in progress, receivables, revenue, and utilization in one review surface.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px]">
          <MetricTile icon={WalletCards} label="Outstanding" value={formatMoney(paymentSummary.outstanding || kpi.ar)} tone="warning" />
          <MetricTile icon={BarChart3} label="Revenue" value={formatMoney(kpi.revenue || paymentSummary.clearedPayments)} tone="success" />
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
          <p className="text-sm font-bold text-warning">Some finance details need another refresh.</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-ink">
            {issues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function KpiGrid({ kpi }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <MetricTile icon={BarChart3} label="Revenue" value={formatMoney(kpi.revenue)} tone="success" />
      <MetricTile icon={ReceiptText} label="Work in progress" value={formatMoney(kpi.wip)} />
      <MetricTile icon={WalletCards} label="Receivables" value={formatMoney(kpi.ar)} tone="warning" />
      <MetricTile icon={Gauge} label="Utilization" value={formatPercent(kpi.utilization)} />
      <MetricTile icon={RefreshCw} label="Realization" value={formatPercent(kpi.realization)} />
    </div>
  );
}

export function FinanceListCard({ emptyText, rows, title, valueLabel = "Amount", valueType = "money" }) {
  return (
    <Card>
      <CardHeader title={title} description="Top items for this review period." />
      <CardBody className="space-y-3">
        {rows.length ? rows.map((row) => (
          <div className="rounded-lg border border-border p-3" key={row.id || row.label}>
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 break-words text-sm font-bold text-ink">{row.label}</p>
              <p className="shrink-0 text-sm font-bold text-primary">{valueType === "percent" ? formatPercent(row.value) : formatMoney(row.amount)}</p>
            </div>
            <p className="mt-1 text-xs font-semibold text-muted">{valueLabel}{row.entries ? ` • ${row.entries} records` : ""}</p>
          </div>
        )) : (
          <div className="rounded-lg border border-dashed border-border p-4">
            <p className="text-sm font-bold text-ink">{emptyText}</p>
            <p className="mt-1 text-sm leading-6 text-muted">There is nothing to review for this period.</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function AgingSummary({ aging }) {
  return (
    <Card>
      <CardHeader title="Receivables aging" action={<StatusBadge>{aging.invoiceCount}</StatusBadge>} />
      <CardBody className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Current", aging.current],
          ["1-30 days", aging.bkt_1_30],
          ["31-60 days", aging.bkt_31_60],
          ["61-90 days", aging.bkt_61_90],
          ["90+ days", aging.bkt_90_plus],
        ].map(([label, value]) => (
          <div className="rounded-lg border border-border p-3" key={label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-1 text-sm font-bold text-primary">{formatMoney(value)}</p>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

export function ReportsPanel({ onDownload, onPdf, saving }) {
  const reports = [
    { id: "time", title: "Time entries", description: "Download reviewed time and matter work.", action: () => onDownload("time") },
    { id: "invoices", title: "Invoices", description: "Download invoice totals, dates, and delivery status.", action: () => onDownload("invoices") },
    { id: "tax", title: "Tax summary", description: "Download tax totals for invoice review.", action: () => onDownload("tax") },
    { id: "utilization", title: "Utilization", description: "Download billable and non-billable time by team member.", action: () => onDownload("utilization") },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardHeader eyebrow="Report" title={report.title} description={report.description} />
          <CardBody>
            <Button disabled={saving === report.id} isLoading={saving === report.id} onClick={report.action} type="button">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </CardBody>
        </Card>
      ))}
      <Card>
        <CardHeader eyebrow="Report" title="Board pack" description="A polished PDF pack is planned for the next finance export step." />
        <CardBody>
          <Button disabled={saving === "pdf"} isLoading={saving === "pdf"} onClick={onPdf} type="button" variant="secondary">
            <FileText className="h-4 w-4" />
            Check readiness
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

export function AuditLogTable({ logs }) {
  if (!logs.length) return <StateCard state="empty" title="No audit events found" message="Audit events will appear after connected finance actions run." />;
  return (
    <DataTable
      columns={[
        { key: "when", label: "When" },
        { key: "source", label: "Source" },
        { key: "action", label: "Action" },
        { key: "status", label: "Status" },
        { key: "summary", label: "Summary" },
      ]}
      rows={logs.map((log) => ({
        id: log.id || `${log.platform}-${log.createdAt}`,
        when: formatDate(log.createdAt),
        source: log.platform,
        action: log.action,
        status: <StatusBadge tone={log.status === "success" || log.status === "synced" ? "success" : log.status === "failed" ? "danger" : "warning"}>{log.status}</StatusBadge>,
        summary: log.summary,
      }))}
    />
  );
}

export function AuditStats({ platformStats, statusStats }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <FinanceListCard emptyText="No sources found" rows={platformStats.map((row) => ({ id: row.id, label: row.label, amount: row.count }))} title="Events by source" valueLabel="Events" />
      <FinanceListCard emptyText="No statuses found" rows={statusStats.map((row) => ({ id: row.id, label: row.label, amount: row.count }))} title="Events by status" valueLabel="Events" />
    </div>
  );
}

export function SnapshotTable({ snapshots }) {
  if (!snapshots.length) return <StateCard state="empty" title="No finance snapshots yet" message="Saved monthly snapshots will appear after a finance review is generated." />;
  return (
    <DataTable
      columns={[
        { key: "month", label: "Month" },
        { key: "scope", label: "Scope" },
        { key: "revenue", label: "Revenue" },
        { key: "wip", label: "Work in progress" },
        { key: "ar", label: "Receivables" },
        { key: "utilization", label: "Utilization" },
      ]}
      rows={snapshots.map((snapshot) => ({
        id: snapshot.id || `${snapshot.scope}-${snapshot.month}`,
        month: snapshot.month,
        scope: snapshot.scope,
        revenue: formatMoney(snapshot.revenue),
        wip: formatMoney(snapshot.wip),
        ar: formatMoney(snapshot.ar),
        utilization: formatPercent(snapshot.utilization),
      }))}
    />
  );
}

export function AuditHero() {
  return (
    <section className="surface-card p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">Audit</p>
      <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Audit logs</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Review finance sync activity, invoice links, and billing events without exposing raw system detail.</p>
      <History className="mt-5 h-8 w-8 text-primary" />
    </section>
  );
}
