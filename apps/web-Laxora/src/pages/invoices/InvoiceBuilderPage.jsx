import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoicesApi } from "../../api/invoices";
import { invoiceWorkspaceApi } from "../../api/invoiceWorkspace";
import { useAuth } from "../../auth/AuthProvider";
import { SkeletonBlock, StateCard } from "../../components/common";
import { BuilderSourcePicker, SectionIssues, TemplateShell } from "../../components/invoices/InvoiceWidgets";

const initialForm = {
  source: "time",
  clientId: "",
  caseId: "",
  dueDate: "",
  periodStart: "",
  periodEnd: "",
  timeEntryIds: [],
  billableIds: [],
};

function buildPayload(form, userId) {
  return {
    clientId: form.clientId,
    ...(form.caseId ? { caseId: form.caseId } : {}),
    ...(form.dueDate ? { dueDate: form.dueDate } : {}),
    ...(form.periodStart ? { periodStart: form.periodStart } : {}),
    ...(form.periodEnd ? { periodEnd: form.periodEnd } : {}),
    ...(userId ? { createdBy: userId } : {}),
    currency: "INR",
  };
}

export function InvoiceBuilderPage() {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ status: "loading", clients: [], matters: [], billables: [], timeEntries: [], issues: [], message: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await invoiceWorkspaceApi.loadBuilderOptions();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", clients: [], matters: [], billables: [], timeEntries: [], issues: [], message: error?.userMessage || "We could not prepare the invoice builder." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateField(field, value) {
    setState((current) => ({ ...current, message: "" }));
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
    if (form.source === "billables" && role !== "admin") {
      setState((current) => ({ ...current, message: "Invoices from approved billables can be created by firm administrators." }));
      return;
    }

    setSaving(true);
    try {
      const base = buildPayload(form, user?.id);
      const invoice = form.source === "billables"
        ? await invoicesApi.fromBillables({ ...base, billableIds: form.billableIds })
        : await invoicesApi.fromTime({ ...base, timeEntryIds: form.timeEntryIds });
      navigate(`/app/invoices/${invoice.id || invoice._id}`);
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not create this invoice. Check the selected work and try again." }));
    } finally {
      setSaving(false);
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Invoice builder needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      {state.message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{state.message}</div> : null}
      <SectionIssues issues={state.issues} />
      <BuilderSourcePicker
        billables={state.billables}
        clients={state.clients}
        form={form}
        matters={state.matters}
        onChange={updateField}
        onGenerate={generate}
        saving={saving}
        timeEntries={state.timeEntries}
      />
      <TemplateShell canEdit={role === "admin" || role === "partner"} />
    </div>
  );
}
