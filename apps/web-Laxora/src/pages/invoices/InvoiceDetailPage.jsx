import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Copy, ExternalLink, Link2 } from "lucide-react";
import { invoicesApi } from "../../api/invoices";
import { invoiceWorkspaceApi } from "../../api/invoiceWorkspace";
import { paymentsApi } from "../../api/payments";
import { Button, DataTable, SkeletonBlock, StateCard, StatusBadge } from "../../components/common";
import { InvoiceChargeBreakup, InvoiceDetailPanel, InvoiceLinesTable, SectionIssues, ShareShell, formatDate } from "../../components/invoices/InvoiceWidgets";

export function InvoiceDetailPage() {
  const { invoiceId } = useParams();
  const [state, setState] = useState({ status: "loading", invoice: null, logs: [], issues: [], message: "" });
  const [sendForm, setSendForm] = useState({ to: "", subject: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [portalLink, setPortalLink] = useState(null);
  const [creatingPortal, setCreatingPortal] = useState(false);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await invoiceWorkspaceApi.loadInvoiceDetail(invoiceId);
      setState({ status: "ready", message: "", ...data });
      setSendForm((current) => ({ ...current, to: data.invoice.sentTo || current.to }));
    } catch (error) {
      setState({ status: "error", invoice: null, logs: [], issues: [], message: error?.userMessage || "We could not load this invoice." });
    }
  }

  useEffect(() => {
    load();
  }, [invoiceId]);

  function updateSendField(field, value) {
    setState((current) => ({ ...current, message: "" }));
    setSendForm((current) => ({ ...current, [field]: value }));
  }

  async function sendInvoice() {
    if (!sendForm.to.trim()) {
      setState((current) => ({ ...current, message: "Add a recipient before sending." }));
      return;
    }
    setSaving(true);
    try {
      await invoicesApi.send(invoiceId, {
        to: sendForm.to.trim(),
        subject: sendForm.subject.trim() || undefined,
        message: sendForm.message.trim() || undefined,
      });
      await load();
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not send this invoice right now." }));
    } finally {
      setSaving(false);
    }
  }

  async function voidInvoice() {
    setSaving(true);
    try {
      await invoicesApi.void(invoiceId, {});
      await load();
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not void this invoice right now." }));
    } finally {
      setSaving(false);
    }
  }

  async function createPaymentLink() {
    setCreatingPortal(true);
    setState((current) => ({ ...current, message: "" }));
    try {
      const response = await paymentsApi.createPortalLink(invoiceId);
      const link = response?.data || response;
      setPortalLink(link);
      setSendForm((current) => ({
        ...current,
        message: current.message || `Please use this secure payment link to complete payment: ${link.url}`,
      }));
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not create the payment link right now." }));
    } finally {
      setCreatingPortal(false);
    }
  }

  async function copyPaymentLink() {
    if (!portalLink?.url || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(portalLink.url);
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Invoice needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <Link className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-primary hover:underline" to="/app/invoices">
        <ArrowLeft className="h-4 w-4" />
        Back to invoices
      </Link>
      {state.message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{state.message}</div> : null}
      <SectionIssues issues={state.issues} />
      <InvoiceDetailPanel invoice={state.invoice} onSend={sendInvoice} onVoid={voidInvoice} saving={saving} />
      <section className="surface-card p-5">
        <h2 className="text-base font-bold text-primary">Send or share</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="block text-sm font-semibold text-ink">
            Recipient
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => updateSendField("to", event.target.value)} placeholder="client@example.com" value={sendForm.to} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Subject
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => updateSendField("subject", event.target.value)} placeholder="Invoice for review" value={sendForm.subject} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Message
            <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => updateSendField("message", event.target.value)} placeholder="Short note" value={sendForm.message} />
          </label>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button disabled={saving || state.invoice.status === "void"} isLoading={saving} onClick={sendInvoice} type="button">Send invoice</Button>
          <Button disabled={creatingPortal || state.invoice.status === "void"} isLoading={creatingPortal} onClick={createPaymentLink} type="button" variant="secondary">
            <Link2 className="h-4 w-4" />
            Create pay now link
          </Button>
          <a className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-panel px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" href={invoicesApi.pdfUrl(invoiceId)} rel="noreferrer" target="_blank">
            <ExternalLink className="h-4 w-4" />
            Open PDF
          </a>
          <Link className="focus-ring inline-flex items-center justify-center rounded-lg border border-border bg-panel px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/invoices/${invoiceId}/lines`}>Edit lines</Link>
        </div>
        {portalLink ? (
          <div className="mt-4 rounded-lg border border-success/25 bg-success/10 p-4 text-sm leading-6 text-ink">
            <p className="font-bold text-success">Pay now link is ready</p>
            <p className="break-all">{portalLink.url}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <a className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryStrong" href={portalLink.url} rel="noreferrer" target="_blank">
                <ExternalLink className="h-4 w-4" />
                Open payment portal
              </a>
              <Button onClick={copyPaymentLink} type="button" variant="secondary">
                <Copy className="h-4 w-4" />
                Copy link
              </Button>
            </div>
          </div>
        ) : null}
      </section>
      <InvoiceChargeBreakup invoice={state.invoice} />
      <InvoiceLinesTable lines={state.invoice.lines} />
      <ShareShell />
      <InvoiceActivity logs={state.logs} />
    </div>
  );
}

function InvoiceActivity({ logs }) {
  if (!logs.length) return <StateCard state="empty" title="No invoice activity yet" message="Send and sync activity will appear here when available." />;
  return (
    <DataTable
      columns={[
        { key: "event", label: "Activity" },
        { key: "status", label: "Status" },
        { key: "when", label: "When" },
      ]}
      rows={logs.map((log) => ({
        id: log.id,
        event: log.title,
        status: <StatusBadge>{log.status}</StatusBadge>,
        when: formatDate(log.createdAt),
      }))}
    />
  );
}
