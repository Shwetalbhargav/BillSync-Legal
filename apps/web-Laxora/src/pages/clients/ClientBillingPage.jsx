import { CreditCard, Edit3, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { clientsApi } from "../../api/clients";
import { asList, normalizeClient, normalizeInvoice, normalizePayment } from "../../api/normalizers";
import { Button, Card, CardBody, CardHeader, SkeletonBlock, StateCard, StatusBadge } from "../../components/common";
import { ClientSummaryTiles } from "../../components/clients/ClientWidgets";

const paymentTerms = ["DUE_ON_RECEIPT", "NET7", "NET15", "NET30", "NET45", "NET60", "NET90"];

function unwrap(response) {
  return response?.data || response;
}

function money(value) {
  return `INR ${Number(value || 0).toLocaleString("en-IN")}`;
}

function InvoiceList({ invoices }) {
  return (
    <Card>
      <CardHeader title="Invoices" description="Click an invoice to open the full invoice detail." action={<StatusBadge>{invoices.length}</StatusBadge>} />
      <CardBody className="space-y-3">
        {invoices.length ? invoices.map((invoice) => (
          <Link className="focus-ring flex min-w-0 items-start gap-3 rounded-lg border border-border p-3 hover:bg-blueSoft" key={invoice.id} to={`/app/invoices/${invoice.id}`}>
            <div className="rounded-lg bg-blueSoft p-2 text-primary"><ReceiptText className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="break-words text-sm font-bold text-ink">{invoice.number}</p>
                <p className="shrink-0 text-sm font-bold text-primary">{money(invoice.total)}</p>
              </div>
              <p className="mt-1 text-xs font-semibold text-muted">{invoice.status} - due {invoice.dueAt || "not set"}</p>
            </div>
          </Link>
        )) : <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">No invoices are linked to this client yet.</div>}
      </CardBody>
    </Card>
  );
}

function PaymentList({ onSelect, payments }) {
  return (
    <Card>
      <CardHeader title="Payments" description="Click a payment to review paid, pending, method, and reference details." action={<StatusBadge>{payments.length}</StatusBadge>} />
      <CardBody className="space-y-3">
        {payments.length ? payments.map((payment) => (
          <button className="focus-ring flex w-full min-w-0 items-start gap-3 rounded-lg border border-border p-3 text-left hover:bg-blueSoft" key={payment.id} onClick={() => onSelect(payment)} type="button">
            <div className="rounded-lg bg-blueSoft p-2 text-primary"><CreditCard className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="break-words text-sm font-bold text-ink">{payment.reference || payment.invoiceNumber || "Payment"}</p>
                <p className="shrink-0 text-sm font-bold text-primary">{money(payment.amount)}</p>
              </div>
              <p className="mt-1 text-xs font-semibold text-muted">{payment.status} - {payment.method || "method not set"}</p>
            </div>
          </button>
        )) : <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">No payments are linked to this client yet.</div>}
      </CardBody>
    </Card>
  );
}

function PaymentDetailPanel({ onClose, payment, summary }) {
  if (!payment) return null;
  const paid = Number(summary?.paid || 0);
  const pending = Number(summary?.ar || 0);
  return (
    <Card>
      <CardHeader title="Payment detail" description="Receipt and receivable breakdown for the selected payment." action={<Button onClick={onClose} size="sm" type="button" variant="ghost">Close</Button>} />
      <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-border p-4"><p className="text-xs font-bold uppercase text-muted">Selected payment</p><p className="mt-1 text-lg font-bold text-primary">{money(payment.amount)}</p></div>
        <div className="rounded-lg border border-border p-4"><p className="text-xs font-bold uppercase text-muted">Total paid</p><p className="mt-1 text-lg font-bold text-primary">{money(paid)}</p></div>
        <div className="rounded-lg border border-border p-4"><p className="text-xs font-bold uppercase text-muted">Pending</p><p className="mt-1 text-lg font-bold text-primary">{money(pending)}</p></div>
        <div className="rounded-lg border border-border p-4"><p className="text-xs font-bold uppercase text-muted">How paid</p><p className="mt-1 text-sm font-semibold text-ink">{payment.method || "Not recorded"}</p></div>
        <div className="rounded-lg border border-border p-4 md:col-span-2"><p className="text-xs font-bold uppercase text-muted">Reference</p><p className="mt-1 break-words text-sm font-semibold text-ink">{payment.reference || "Not recorded"}</p></div>
        <div className="rounded-lg border border-border p-4 md:col-span-2"><p className="text-xs font-bold uppercase text-muted">Notes</p><p className="mt-1 break-words text-sm font-semibold text-ink">{payment.notes || "No notes added"}</p></div>
      </CardBody>
    </Card>
  );
}

export function ClientBillingPage() {
  const { clientId } = useParams();
  const [state, setState] = useState({ status: "loading", client: null, summary: null, invoices: [], payments: [], message: "" });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [terms, setTerms] = useState("NET30");
  const [saving, setSaving] = useState(false);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const [clientResponse, summaryResponse, invoicesResponse, paymentsResponse] = await Promise.all([
        clientsApi.get(clientId),
        clientsApi.summary(clientId),
        clientsApi.invoices(clientId, { limit: 20 }),
        clientsApi.payments(clientId, { limit: 20 }),
      ]);
      const client = normalizeClient(unwrap(clientResponse));
      setTerms(client.paymentTerms || "NET30");
      setState({
        status: "ready",
        client,
        summary: unwrap(summaryResponse),
        invoices: asList(invoicesResponse).map(normalizeInvoice),
        payments: asList(paymentsResponse).map(normalizePayment),
        message: "",
      });
    } catch (error) {
      setState({ status: "error", client: null, summary: null, invoices: [], payments: [], message: error?.userMessage || "We could not load billing details right now." });
    }
  }

  useEffect(() => {
    load();
  }, [clientId]);

  async function saveBilling() {
    setSaving(true);
    try {
      await clientsApi.assignOwner(clientId, { paymentTerms: terms });
      await load();
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not update billing settings." }));
    } finally {
      setSaving(false);
    }
  }

  if (state.status === "loading") return <div className="grid gap-4 lg:grid-cols-2"><SkeletonBlock /><SkeletonBlock /></div>;
  if (state.status === "error") return <StateCard state="error" title="Billing summary needs attention" message={state.message} onAction={load} />;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Client Billing</p>
            <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{state.client.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Edit billing terms, review invoices, and inspect payment status for this client.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select className="focus-ring rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary" onChange={(event) => setTerms(event.target.value)} value={terms}>
              {paymentTerms.map((term) => <option key={term} value={term}>{term}</option>)}
            </select>
            <Button isLoading={saving} onClick={saveBilling} type="button" variant="secondary">
              <Edit3 className="h-4 w-4" />
              Save billing
            </Button>
          </div>
        </div>
        {state.message ? <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{state.message}</div> : null}
      </section>
      <ClientSummaryTiles summary={state.summary} />
      <PaymentDetailPanel onClose={() => setSelectedPayment(null)} payment={selectedPayment} summary={state.summary} />
      <div className="grid gap-6 xl:grid-cols-2">
        <InvoiceList invoices={state.invoices} />
        <PaymentList onSelect={setSelectedPayment} payments={state.payments} />
      </div>
      <Link className="focus-ring inline-flex rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/clients/${clientId}`}>
        Back to client
      </Link>
    </div>
  );
}
