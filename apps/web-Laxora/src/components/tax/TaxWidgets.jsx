import { AlertCircle, Calculator, FileText, Landmark, ReceiptText, ShieldCheck, WalletCards } from "lucide-react";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";

export function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function TaxHero({ mode = "gst" }) {
  const isTds = mode === "tds";
  return (
    <section className="surface-card p-6">
      <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">{isTds ? "TDS" : "GST"}</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{isTds ? "TDS management" : "GST dashboard"}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {isTds ? "Keep deduction setup visible without claiming compliance features before they are turned on." : "Review invoice tax totals and keep firm GST settings aligned with billing."}
          </p>
        </div>
        <div className="rounded-lg bg-blueSoft p-3 text-primary">
          {isTds ? <ShieldCheck className="h-6 w-6" /> : <Calculator className="h-6 w-6" />}
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

export function GstSummaryGrid({ summary }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricTile icon={ReceiptText} label="Invoices" value={summary.invoiceCount || 0} />
      <MetricTile icon={WalletCards} label="Taxable amount" value={formatMoney(summary.taxableAmount)} />
      <MetricTile icon={Landmark} label="GST amount" value={formatMoney(summary.gstAmount)} tone="warning" />
      <MetricTile icon={FileText} label="Gross amount" value={formatMoney(summary.grossAmount)} tone="success" />
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
          <p className="text-sm font-bold text-warning">Some tax details need another refresh.</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-ink">
            {issues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function GstSettingsForm({ form, onChange, onSubmit, saving }) {
  return (
    <Card>
      <CardHeader title="GST settings" description="These settings are used when invoice totals are calculated." />
      <CardBody>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block text-sm font-semibold text-ink">
            Tax name
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("taxName", event.target.value)} value={form.taxName} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Rate percent
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" min="0" max="100" onChange={(event) => onChange("taxRatePct", event.target.value)} type="number" value={form.taxRatePct} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Calculation style
            <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("inclusive", event.target.value === "true")} value={String(form.inclusive)}>
              <option value="false">Added to subtotal</option>
              <option value="true">Included in line amount</option>
            </select>
          </label>
        </div>
        <Button className="mt-4 w-full sm:w-auto" disabled={saving} isLoading={saving} onClick={onSubmit} type="button">Save GST settings</Button>
      </CardBody>
    </Card>
  );
}

export function InvoiceTaxTable({ invoices }) {
  if (!invoices.length) return <StateCard state="empty" title="No taxed invoices found" message="Tax summaries will appear after invoices are created for the selected period." />;
  return (
    <DataTable
      columns={[
        { key: "invoice", label: "Invoice" },
        { key: "client", label: "Client" },
        { key: "taxable", label: "Taxable" },
        { key: "tax", label: "GST" },
        { key: "rate", label: "Rate" },
        { key: "status", label: "Status" },
        { key: "date", label: "Date" },
      ]}
      rows={invoices.map((invoice) => ({
        id: invoice.id,
        invoice: invoice.number,
        client: invoice.client || "Client",
        taxable: formatMoney(invoice.taxableAmount),
        tax: formatMoney(invoice.taxAmount),
        rate: `${Number(invoice.taxRatePct || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`,
        status: <StatusBadge tone={invoice.status === "paid" ? "success" : invoice.status === "void" ? "danger" : "warning"}>{invoice.status}</StatusBadge>,
        date: formatDate(invoice.issuedAt),
      }))}
    />
  );
}

export function TdsNotConfigured({ message }) {
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-5">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="text-base font-bold text-warning">TDS is not turned on yet</h2>
          <p className="mt-1 text-sm leading-6 text-ink">{message || "BillSync can show this setup area now, but deduction rules and certificates should be connected before the firm relies on this for compliance work."}</p>
        </div>
      </div>
    </section>
  );
}

export function TdsReadinessCards() {
  const items = [
    { title: "Deduction rules", detail: "Rates and party categories need a connected setup flow." },
    { title: "Certificate tracking", detail: "Certificate numbers and dates are reserved for a later workflow." },
    { title: "Payment matching", detail: "Invoice and payment deduction matching will be added when TDS records are available." },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader title={item.title} />
          <CardBody>
            <p className="text-sm leading-6 text-muted">{item.detail}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
