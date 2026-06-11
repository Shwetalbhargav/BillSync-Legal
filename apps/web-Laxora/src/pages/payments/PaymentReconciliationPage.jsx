import { useEffect, useMemo, useState } from "react";
import { paymentWorkspaceApi, paymentsApi } from "../../api";
import { SkeletonBlock, StateCard, Toast } from "../../components/common";
import { AgingPanel, PaymentFailedState, PaymentsTable, PaymentHero, SectionIssues } from "../../components/payments/PaymentWidgets";

export function PaymentReconciliationPage() {
  const [state, setState] = useState({ status: "loading", payments: [], invoices: [], summary: {}, aging: {}, agingByClient: [], issues: [], message: "" });
  const [savingId, setSavingId] = useState("");
  const [notice, setNotice] = useState(null);
  const [failedPayment, setFailedPayment] = useState(null);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await paymentWorkspaceApi.loadDashboard();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", payments: [], invoices: [], summary: {}, aging: {}, agingByClient: [], issues: [], message: error?.userMessage || "We could not load reconciliation details right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const reviewPayments = useMemo(() => state.payments.filter((payment) => payment.status !== "cleared"), [state.payments]);

  async function reconcilePayment(payment, status) {
    setSavingId(payment.id);
    setNotice(null);
    try {
      await paymentsApi.reconcile(payment.id, { status, receivedDate: new Date().toISOString().slice(0, 10) });
      setFailedPayment(status === "failed" ? payment : null);
      setNotice({ tone: status === "cleared" ? "success" : "warning", title: status === "cleared" ? "Payment cleared" : "Payment needs follow-up", message: status === "cleared" ? "The receipt is reconciled." : "The payment remains visible for follow-up." });
      await load();
    } catch (error) {
      setNotice({ tone: "warning", title: "Reconciliation was not saved", message: error?.userMessage || "Please check the payment and try again." });
    } finally {
      setSavingId("");
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Reconciliation needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <PaymentHero summary={state.summary} />
      {notice ? <Toast tone={notice.tone} title={notice.title} message={notice.message} /> : null}
      <SectionIssues issues={state.issues} />
      {failedPayment ? <PaymentFailedState onRetry={() => reconcilePayment(failedPayment, "cleared")} /> : null}
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Reconciliation queue</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Review pending or failed receipts and mark them after confirmation.</p>
        <div className="mt-4">
          <PaymentsTable payments={reviewPayments} savingId={savingId} onFail={(payment) => reconcilePayment(payment, "failed")} onReconcile={reconcilePayment} />
        </div>
      </section>
      <AgingPanel aging={state.aging} agingByClient={state.agingByClient} />
    </div>
  );
}
