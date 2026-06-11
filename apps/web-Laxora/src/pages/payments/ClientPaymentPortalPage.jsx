import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { paymentWorkspaceApi, paymentsApi } from "../../api";
import { StateCard, Toast } from "../../components/common";
import { PublicPaymentForm } from "../../components/payments/PaymentWidgets";

const initialForm = {
  amount: "",
  method: "upi",
  payerName: "",
  payerEmail: "",
  reference: "",
  notes: "",
};

function normalizePortalInvoice(invoice = {}) {
  return {
    invoiceNumber: invoice.invoiceNumber || invoice.number || "Invoice",
    clientName: invoice.clientName || invoice.client?.name || "Client",
    matter: invoice.caseName || invoice.matter || invoice.case?.title || "Matter",
    outstanding: Number(invoice.outstanding || invoice.balanceDue || invoice.total || 0),
    paidAmount: Number(invoice.paidAmount || invoice.paid || 0),
    total: Number(invoice.total || invoice.amount || 0),
  };
}

export function ClientPaymentPortalPage() {
  const { paymentCode } = useParams();
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ status: "loading", invoice: null, message: "" });
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    async function load() {
      setState({ status: "loading", invoice: null, message: "" });
      try {
        const data = await paymentWorkspaceApi.loadPortal(paymentCode);
        const invoice = normalizePortalInvoice(data?.invoice || data);
        setState({ status: "ready", invoice, message: "" });
        setForm((current) => ({ ...current, amount: invoice.outstanding || invoice.total || "" }));
      } catch (error) {
        setState({ status: "error", invoice: null, message: error?.userMessage || "This payment page is not available right now." });
      }
    }
    load();
  }, [paymentCode]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitPayment() {
    if (!Number(form.amount)) {
      setNotice({ tone: "warning", title: "Amount needs attention", message: "Enter the amount you have paid before submitting." });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      await paymentsApi.submitPortalPayment(paymentCode, {
        amount: Number(form.amount),
        method: form.method,
        payerName: form.payerName || undefined,
        payerEmail: form.payerEmail || undefined,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      });
      setSubmitted(true);
    } catch (error) {
      setNotice({ tone: "warning", title: "Payment details were not submitted", message: error?.userMessage || "Please check the details and try again." });
    } finally {
      setSaving(false);
    }
  }

  if (state.status === "loading") {
    return (
      <main className="min-h-screen bg-app p-4 md:p-8">
        <StateCard state="loading" title="Opening payment page" message="Please wait while we prepare the invoice details." />
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="min-h-screen bg-app p-4 md:p-8">
        <StateCard state="error" title="Payment page needs attention" message={state.message} actionLabel="Try again" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-4">
        {notice ? <Toast tone={notice.tone} title={notice.title} message={notice.message} /> : null}
        <PublicPaymentForm form={form} invoice={state.invoice} onChange={updateForm} onSubmit={submitPayment} saving={saving} submitted={submitted} />
      </div>
    </main>
  );
}
