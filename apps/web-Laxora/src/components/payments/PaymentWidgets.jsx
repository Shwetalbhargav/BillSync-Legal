import { AlertCircle, CheckCircle2, CreditCard, Landmark, Link2, RefreshCw, WalletCards } from "lucide-react";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";

export const paymentMethods = [
  { label: "Bank transfer", value: "bank_transfer" },
  { label: "Cheque", value: "cheque" },
  { label: "Cash", value: "cash" },
  { label: "Card", value: "card" },
  { label: "UPI", value: "upi" },
  { label: "Wallet", value: "wallet" },
  { label: "Other", value: "other" },
];

export const paymentStatuses = [
  { label: "Pending", value: "pending" },
  { label: "Cleared", value: "cleared" },
  { label: "Failed", value: "failed" },
];

export function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function paymentTone(status = "") {
  if (status === "cleared") return "success";
  if (status === "pending") return "warning";
  if (status === "failed") return "danger";
  return "neutral";
}

export function PaymentHero({ summary }) {
  return (
    <section className="surface-card p-6">
      <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Payments</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Payment dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Record receipts, reconcile pending payments, and keep receivables visible for follow-up.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[560px]">
          <MetricTile icon={CreditCard} label="Cleared payments" value={formatMoney(summary.clearedPayments)} tone="success" />
          <MetricTile icon={WalletCards} label="Outstanding" value={formatMoney(summary.outstanding)} tone="warning" />
          <MetricTile icon={Landmark} label="Write-offs" value={formatMoney(summary.writeOffs)} />
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
          <p className="text-sm font-bold text-warning">Some payment details need another refresh.</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-ink">
            {issues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function PaymentEntryForm({ form, invoices, onChange, onSubmit, saving }) {
  return (
    <Card>
      <CardHeader title="Record payment" description="Add a receipt against an existing invoice." />
      <CardBody>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block text-sm font-semibold text-ink">
            Invoice
            <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("invoiceId", event.target.value)} value={form.invoiceId}>
              <option value="">Select invoice</option>
              {invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.number} - {invoice.client || "Client"}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Amount
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" min="0" onChange={(event) => onChange("amount", event.target.value)} type="number" value={form.amount} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Method
            <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("method", event.target.value)} value={form.method}>
              {paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Date received
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("receivedDate", event.target.value)} type="date" value={form.receivedDate} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Status
            <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("status", event.target.value)} value={form.status}>
              {paymentStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Reference
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("reference", event.target.value)} value={form.reference} />
          </label>
        </div>
        <label className="mt-3 block text-sm font-semibold text-ink">
          Notes
          <textarea className="focus-ring mt-1 min-h-24 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("notes", event.target.value)} value={form.notes} />
        </label>
        <Button className="mt-4 w-full sm:w-auto" disabled={saving} isLoading={saving} onClick={onSubmit} type="button">Save payment</Button>
      </CardBody>
    </Card>
  );
}

export function PaymentsTable({ onFail, onReconcile, payments, savingId }) {
  if (!payments.length) {
    return <StateCard state="empty" title="No payments recorded" message="Payments will appear after receipts are recorded or submitted through the client payment page." />;
  }
  return (
    <DataTable
      columns={[
        { key: "invoice", label: "Invoice" },
        { key: "amount", label: "Amount" },
        { key: "method", label: "Method" },
        { key: "status", label: "Status" },
        { key: "date", label: "Date" },
        { key: "action", label: "Action" },
      ]}
      rows={payments.map((payment) => ({
        id: payment.id,
        invoice: payment.invoiceNumber || payment.invoiceId || "Invoice",
        amount: formatMoney(payment.amount),
        method: methodLabel(payment.method),
        status: <StatusBadge tone={paymentTone(payment.status)}>{payment.status}</StatusBadge>,
        date: formatDate(payment.paidAt),
        action: (
          <div className="flex flex-wrap gap-2">
            <Button disabled={savingId === payment.id} onClick={() => onReconcile(payment, "cleared")} size="sm" type="button" variant="success">Clear</Button>
            <Button disabled={savingId === payment.id} onClick={() => onFail(payment)} size="sm" type="button" variant="danger">Mark failed</Button>
          </div>
        ),
      }))}
    />
  );
}

export function AgingPanel({ aging, agingByClient }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader title="Receivables aging" action={<StatusBadge>{aging.invoiceCount}</StatusBadge>} />
        <CardBody className="space-y-3">
          {[
            ["Current", aging.current],
            ["1-30 days", aging.bkt_1_30],
            ["31-60 days", aging.bkt_31_60],
            ["61-90 days", aging.bkt_61_90],
            ["90+ days", aging.bkt_90_plus],
          ].map(([label, value]) => (
            <div className="flex items-center justify-between rounded-lg border border-border p-3" key={label}>
              <span className="text-sm font-semibold text-ink">{label}</span>
              <span className="text-sm font-bold text-primary">{formatMoney(value)}</span>
            </div>
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Client follow-up" action={<StatusBadge>{agingByClient.length}</StatusBadge>} />
        <CardBody className="space-y-3">
          {agingByClient.length ? agingByClient.map((item) => (
            <div className="rounded-lg border border-border p-3" key={item.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="break-words text-sm font-bold text-ink">{item.client}</p>
                <p className="text-sm font-bold text-primary">{formatMoney(item.totalOutstanding)}</p>
              </div>
              <p className="mt-1 text-xs font-semibold text-muted">{item.invoiceCount} invoices need follow-up</p>
            </div>
          )) : <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">No receivables need follow-up right now.</p>}
        </CardBody>
      </Card>
    </div>
  );
}

export function PortalSetupPanel({ onCreate, portalLink, saving }) {
  return (
    <section className="surface-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Client payment page</p>
          <h2 className="text-xl font-bold text-primary">Create a payment submission link</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Clients can submit payment details for reconciliation. External collection is not connected in this branch.</p>
        </div>
        <Button disabled={saving} isLoading={saving} onClick={onCreate} type="button">
          <Link2 className="h-4 w-4" />
          Create link
        </Button>
      </div>
      {portalLink ? (
        <div className="mt-4 rounded-lg border border-success/25 bg-success/10 p-4 text-sm leading-6 text-ink">
          <p className="font-bold text-success">Payment page is ready to share</p>
          <p className="break-all">{portalLink.url}</p>
          <p className="text-xs font-semibold text-muted">Expires {formatDate(portalLink.expiresAt)}</p>
        </div>
      ) : null}
    </section>
  );
}

export function GatewayNotConnected() {
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
      <div className="flex gap-3">
        <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="text-sm font-bold text-warning">Online collection is not connected yet</h2>
          <p className="mt-1 text-sm leading-6 text-ink">Use the payment page to collect client-submitted details, then reconcile after the firm confirms receipt.</p>
        </div>
      </div>
    </section>
  );
}

export function PaymentFailedState({ onRetry }) {
  return (
    <section className="rounded-lg border border-danger/30 bg-danger/10 p-5">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
        <div>
          <h2 className="text-base font-bold text-danger">Payment needs attention</h2>
          <p className="mt-1 text-sm leading-6 text-ink">The payment was not cleared. Check the reference, confirm with the client, and retry reconciliation when ready.</p>
          {onRetry ? <Button className="mt-4" onClick={onRetry} type="button" variant="secondary">Try again</Button> : null}
        </div>
      </div>
    </section>
  );
}

export function PublicPaymentForm({ form, invoice, onChange, onSubmit, saving, submitted }) {
  if (submitted) {
    return <StateCard state="success" title="Payment details submitted" message="The firm will confirm receipt and update the invoice after reconciliation." />;
  }
  return (
    <section className="surface-card p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">Secure payment submission</p>
      <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{invoice.invoiceNumber}</h1>
      <p className="mt-2 text-sm font-semibold text-muted">{invoice.clientName || "Client"} - {invoice.matter || "Matter"}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MetricTile icon={CreditCard} label="Outstanding" value={formatMoney(invoice.outstanding)} tone="warning" />
        <MetricTile icon={CheckCircle2} label="Paid" value={formatMoney(invoice.paidAmount)} tone="success" />
        <MetricTile icon={WalletCards} label="Total" value={formatMoney(invoice.total)} />
      </div>
      <GatewayNotConnected />
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-semibold text-ink">
          Amount
          <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" min="0" onChange={(event) => onChange("amount", event.target.value)} type="number" value={form.amount} />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Method
          <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("method", event.target.value)} value={form.method}>
            {paymentMethods.filter((item) => ["card", "upi", "bank_transfer", "wallet", "other"].includes(item.value)).map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Payer name
          <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("payerName", event.target.value)} value={form.payerName} />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Payer email
          <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("payerEmail", event.target.value)} value={form.payerEmail} />
        </label>
        <label className="block text-sm font-semibold text-ink md:col-span-2">
          Reference
          <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("reference", event.target.value)} value={form.reference} />
        </label>
      </div>
      <Button className="mt-4 w-full sm:w-auto" disabled={saving} isLoading={saving} onClick={onSubmit} type="button">Submit payment details</Button>
    </section>
  );
}

function methodLabel(value) {
  return paymentMethods.find((method) => method.value === value)?.label || "Payment";
}
