import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoicesApi } from "../../api/invoices";
import { invoiceWorkspaceApi } from "../../api/invoiceWorkspace";
import { useAuth } from "../../auth/AuthProvider";
import { SkeletonBlock, StateCard } from "../../components/common";
import { BuilderSourcePicker, SectionIssues, TemplateShell } from "../../components/invoices/InvoiceWidgets";
import { useBillingModuleAccess } from "../billing/useBillingModuleAccess";

const initialForm = {
  source: "billables",
  templateType: "standard",
  clientId: "",
  caseId: "",
  dueDate: "",
  periodStart: "",
  periodEnd: "",
  timeEntryIds: [],
  billableIds: [],
  expenseIds: [],
  issuingAdvocateId: "",
  taxTreatment: "gst_charged",
  taxNote: "Tax on this supply may be payable by the recipient under reverse charge mechanism, where applicable.",
  paymentDetailsNote: "",
  invoiceNotes: "",
  professionalDescription: "Professional fee for legal services",
  professionalAmount: "",
  professionalServiceDate: "",
  professionalPeriodLabel: "",
};

function buildPayload(form, userId) {
  return {
    clientId: form.clientId,
    ...(form.caseId ? { caseId: form.caseId } : {}),
    ...(form.dueDate ? { dueDate: form.dueDate } : {}),
    ...(form.periodStart ? { periodStart: form.periodStart } : {}),
    ...(form.periodEnd ? { periodEnd: form.periodEnd } : {}),
    ...(form.issuingAdvocateId || userId ? { createdBy: form.issuingAdvocateId || userId } : {}),
    currency: "INR",
    templateType: form.templateType,
    taxTreatment: form.taxTreatment,
    taxNote: form.taxNote,
  };
}

export function InvoiceBuilderPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const access = useBillingModuleAccess("billing");
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ status: "loading", clients: [], matters: [], billables: [], timeEntries: [], expenses: [], advocates: [], issues: [], message: "" });
  const [saving, setSaving] = useState(false);

  async function load(params = {}) {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await invoiceWorkspaceApi.loadBuilderOptions(params);
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", clients: [], matters: [], billables: [], timeEntries: [], expenses: [], advocates: [], issues: [], message: error?.userMessage || "We could not prepare the invoice builder." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (state.status !== "ready") return;
    const matchesSelection = (item) => (
      (!form.clientId || item.clientId === form.clientId)
      && (!form.caseId || item.matterId === form.caseId)
    );
    const isChargeable = (item) => Number(item.amount || 0) > 0 && !item.needsRate;
    setForm((current) => ({
      ...current,
      billableIds: state.billables.filter((item) => matchesSelection(item) && isChargeable(item)).map((item) => item.id),
      timeEntryIds: state.timeEntries.filter((item) => matchesSelection(item) && isChargeable(item)).map((item) => item.id),
      expenseIds: state.expenses.filter(matchesSelection).map((item) => item.id),
    }));
  }, [form.clientId, form.caseId, state.status, state.billables, state.timeEntries, state.expenses]);

  function updateField(field, value) {
    setState((current) => ({ ...current, message: "" }));
    if (field === "clientId") {
      load(value ? { clientId: value } : {});
      setForm((current) => ({ ...current, clientId: value, caseId: "", timeEntryIds: [], billableIds: [], expenseIds: [] }));
      return;
    }
    if (field === "caseId") {
      load({ ...(form.clientId ? { clientId: form.clientId } : {}), ...(value ? { caseId: value } : {}) });
      setForm((current) => ({ ...current, caseId: value, timeEntryIds: [], billableIds: [], expenseIds: [] }));
      return;
    }
    setForm((current) => {
      if (field === "source") return { ...current, source: value, timeEntryIds: [], billableIds: [] };
      return { ...current, [field]: value };
    });
  }

  async function generate() {
    if (!form.clientId) {
      setState((current) => ({ ...current, message: "Select a client before creating the invoice." }));
      return;
    }
    if (form.source === "time" && !form.timeEntryIds.length) {
      setState((current) => ({ ...current, message: "Select at least one approved time entry." }));
      return;
    }
    if (form.source === "billables" && !form.billableIds.length) {
      setState((current) => ({ ...current, message: "Select at least one approved billable item." }));
      return;
    }
    const selectedSourceItems = form.source === "billables"
      ? state.billables.filter((item) => form.billableIds.includes(item.id))
      : form.source === "time"
        ? state.timeEntries.filter((item) => form.timeEntryIds.includes(item.id))
        : [];
    if (selectedSourceItems.some((item) => Number(item.amount || 0) <= 0 || item.needsRate)) {
      setState((current) => ({ ...current, message: "One or more selected work entries has Rs 0. Add a rate or amount on the billable before generating the invoice." }));
      return;
    }
    if (form.source === "manual" && !form.professionalAmount) {
      setState((current) => ({ ...current, message: "Add a professional fee amount before creating a manual invoice." }));
      return;
    }
    if (!access.canCreateInvoices) {
      setState((current) => ({ ...current, message: "You do not have access to create invoices." }));
      return;
    }

    setSaving(true);
    try {
      const base = buildPayload(form, user?.id);
      const invoice = form.source === "manual"
        ? await invoicesApi.create(base)
        : form.source === "billables"
          ? await invoicesApi.fromBillables({ ...base, billableIds: form.billableIds })
          : await invoicesApi.fromTime({ ...base, timeEntryIds: form.timeEntryIds });
      const invoiceId = invoice.id || invoice._id;
      if (form.source === "manual" && invoiceId) {
        await invoicesApi.createLine(invoiceId, {
          lineType: "professional_fee",
          serviceDate: form.professionalServiceDate || undefined,
          periodLabel: form.professionalPeriodLabel || undefined,
          description: form.professionalDescription.trim() || "Professional fee for legal services",
          amount: Number(form.professionalAmount || 0),
          taxCategory: "Professional fee",
        });
      }
      const selectedExpenses = state.expenses.filter((expense) => form.expenseIds.includes(expense.id));
      if (invoiceId && selectedExpenses.length) {
        await Promise.all(selectedExpenses.map((expense) => invoicesApi.createLine(invoiceId, {
          lineType: "reimbursable_expense",
          serviceDate: expense.date || undefined,
          description: `${expense.description}${expense.receiptDocumentId ? ` (Receipt: ${expense.receiptDocumentId})` : ""}`,
          amount: expense.amount,
          receiptDocumentId: expense.receiptDocumentId || undefined,
          taxCategory: "Reimbursement",
        })));
      }
      navigate(`/app/invoices/${invoiceId}`);
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not create this invoice. Check the selected work and try again." }));
    } finally {
      setSaving(false);
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (access.unavailable) return <StateCard state="empty" title="Invoice builder is not available" message={access.message} />;
  if (!access.canCreateInvoices) return <StateCard state="permission" title="Invoice builder is not available" message="You do not have access to this area." />;
  if (state.status === "error") return <StateCard state="error" title="Invoice builder needs attention" message={state.message} actionLabel="Retry" onAction={load} />;

  return (
    <div className="space-y-6">
      {state.message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{state.message}</div> : null}
      <SectionIssues issues={state.issues} />
      <BuilderSourcePicker
        billables={state.billables}
        clients={state.clients}
        expenses={state.expenses}
        form={form}
        advocates={state.advocates}
        matters={state.matters}
        onChange={updateField}
        onGenerate={generate}
        saving={saving}
        timeEntries={state.timeEntries}
      />
      <TemplateShell canEdit={access.canCreateInvoices} selectedTemplate={form.templateType} />
    </div>
  );
}
