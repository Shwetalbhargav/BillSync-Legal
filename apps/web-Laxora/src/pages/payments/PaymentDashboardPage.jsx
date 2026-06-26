import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { paymentWorkspaceApi, paymentsApi } from "../../api";
import { Button, SkeletonBlock, StateCard, Toast } from "../../components/common";
import {
  AgingPanel,
  GatewayNotConnected,
  PaymentEntryForm,
  PaymentFailedState,
  PaymentHero,
  PaymentsTable,
  PortalSetupPanel,
  SectionIssues,
} from "../../components/payments/PaymentWidgets";
import { useBillingModuleAccess } from "../billing/useBillingModuleAccess";

const initialForm = {
  invoiceId: "",
  amount: "",
  method: "bank_transfer",
  receivedDate: new Date().toISOString().slice(0, 10),
  status: "cleared",
  reference: "",
  notes: "",
};

function paymentBody(form) {
  return {
    invoiceId: form.invoiceId,
    amount: Number(form.amount),
    method: form.method,
    receivedDate: form.receivedDate,
    status: form.status,
    reference: form.reference || undefined,
    notes: form.notes || undefined,
  };
}

export function PaymentDashboardPage() {
  const access = useBillingModuleAccess("finance");
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ status: "loading", payments: [], invoices: [], summary: {}, aging: {}, agingByClient: [], issues: [], message: "" });
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [notice, setNotice] = useState(null);
  const [portalLink, setPortalLink] = useState(null);
  const [failedPayment, setFailedPayment] = useState(null);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await paymentWorkspaceApi.loadDashboard();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", payments: [], invoices: [], summary: {}, aging: {}, agingByClient: [], issues: [], message: error?.userMessage || "We could not load payments right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selectedInvoice = useMemo(() => state.invoices.find((invoice) => invoice.id === form.invoiceId), [form.invoiceId, state.invoices]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function savePayment() {
    if (!form.invoiceId || !Number(form.amount) || !form.receivedDate) {
      setNotice({ tone: "warning", title: "Payment details need attention", message: "Select an invoice, enter an amount, and choose the received date." });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      await paymentsApi.create(paymentBody(form));
      setForm(initialForm);
      setNotice({ tone: "success", title: "Payment saved", message: "The receipt is recorded and ready for reconciliation." });
      await load();
    } catch (error) {
      setNotice({ tone: "warning", title: "Payment was not saved", message: error?.userMessage || "Please check the details and try again." });
    } finally {
      setSaving(false);
    }
  }

  async function reconcilePayment(payment, status) {
    setSavingId(payment.id);
    setNotice(null);
    try {
      await paymentsApi.reconcile(payment.id, { status, receivedDate: new Date().toISOString().slice(0, 10) });
      setFailedPayment(status === "failed" ? payment : null);
      setNotice({ tone: status === "cleared" ? "success" : "warning", title: status === "cleared" ? "Payment cleared" : "Payment marked for follow-up", message: status === "cleared" ? "The receipt is now cleared." : "The payment remains visible for reconciliation." });
      await load();
    } catch (error) {
      setNotice({ tone: "warning", title: "Reconciliation needs attention", message: error?.userMessage || "Please confirm the payment details and try again." });
    } finally {
      setSavingId("");
    }
  }

  async function createPaymentPage() {
    if (!form.invoiceId) {
      setNotice({ tone: "warning", title: "Select an invoice first", message: "Choose the invoice that should be shared with the client." });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const response = await paymentsApi.createPortalLink(form.invoiceId);
      setPortalLink(response?.data || response);
      setNotice({ tone: "success", title: "Payment page ready", message: "The client payment page can now be shared." });
    } catch (error) {
      setNotice({ tone: "warning", title: "Payment page was not created", message: error?.userMessage || "Please try again after checking the invoice." });
    } finally {
      setSaving(false);
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (access.unavailable) return <StateCard state="empty" title="Payments are not available" message={access.message} />;
  if (!access.canViewInvoices) return <StateCard state="permission" title="Payments are not available" message="You do not have access to this area." />;
  if (state.status === "error") return <StateCard state="error" title="Payments need attention" message={state.message} actionLabel="Retry" onAction={load} />;

  return (
    <div className="space-y-6">
      <PaymentHero summary={state.summary} />
      {access.readOnly ? <StateCard state="empty" title="Payments are read-only" message={access.message} /> : null}
      {notice ? <Toast tone={notice.tone} title={notice.title} message={notice.message} /> : null}
      <SectionIssues issues={state.issues} />
      {failedPayment ? <PaymentFailedState onRetry={() => reconcilePayment(failedPayment, "cleared")} /> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <PaymentEntryForm canRecord={access.canRecordPayments} form={form} invoices={state.invoices} onChange={updateForm} onSubmit={savePayment} saving={saving} />
        <div className="space-y-4">
          <PortalSetupPanel canCreate={access.canSendInvoices} onCreate={createPaymentPage} portalLink={portalLink} saving={saving} />
          <GatewayNotConnected />
          <section className="surface-card p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Selected invoice</p>
            {selectedInvoice ? (
              <div className="mt-2 text-sm leading-6 text-muted">
                <p className="font-bold text-ink">{selectedInvoice.number}</p>
                <p>{selectedInvoice.client || "Client"} can receive a payment page for this invoice.</p>
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6 text-muted">Select an invoice to create a client payment page.</p>
            )}
          </section>
        </div>
      </div>
      <section className="surface-card p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-primary">Recent payments</h2>
            <p className="mt-1 text-sm text-muted">Clear receipts quickly after the firm confirms funds.</p>
          </div>
          <Button disabled={!access.canRecordPayments} type="button" variant="secondary" onClick={() => setForm(initialForm)}>
            <Plus className="h-4 w-4" />
            New receipt
          </Button>
        </div>
        <PaymentsTable canRecord={access.canRecordPayments} payments={state.payments} savingId={savingId} onFail={(payment) => reconcilePayment(payment, "failed")} onReconcile={reconcilePayment} />
      </section>
      <AgingPanel aging={state.aging} agingByClient={state.agingByClient} />
    </div>
  );
}
