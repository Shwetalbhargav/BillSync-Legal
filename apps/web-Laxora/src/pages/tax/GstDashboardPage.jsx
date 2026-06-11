import { useEffect, useState } from "react";
import { taxWorkspaceApi } from "../../api";
import { useAuth } from "../../auth/AuthProvider";
import { SkeletonBlock, StateCard, Toast } from "../../components/common";
import { GstSettingsForm, GstSummaryGrid, InvoiceTaxTable, SectionIssues, TaxHero } from "../../components/tax/TaxWidgets";

function formFromSettings(settings = {}) {
  return {
    taxName: settings.taxName || "GST",
    taxRatePct: String(settings.taxRatePct ?? 0),
    inclusive: Boolean(settings.inclusive),
  };
}

export function GstDashboardPage() {
  const { user } = useAuth();
  const [state, setState] = useState({ status: "loading", settings: {}, summary: {}, invoices: [], issues: [], message: "" });
  const [form, setForm] = useState(formFromSettings());
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await taxWorkspaceApi.loadGst({ firmId: user?.firmId });
      setState({ status: "ready", message: "", ...data });
      setForm(formFromSettings(data.settings));
    } catch (error) {
      setState({ status: "error", settings: {}, summary: {}, invoices: [], issues: [], message: error?.userMessage || "We could not load GST details right now." });
    }
  }

  useEffect(() => {
    load();
  }, [user?.firmId]);

  function updateForm(field, value) {
    setNotice(null);
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveSettings() {
    if (!user?.firmId) {
      setNotice({ tone: "warning", title: "Firm details needed", message: "Sign in with a firm account before changing GST settings." });
      return;
    }
    if (!form.taxName.trim() || Number(form.taxRatePct) < 0 || Number(form.taxRatePct) > 100) {
      setNotice({ tone: "warning", title: "GST settings need attention", message: "Enter a tax name and a rate between 0 and 100." });
      return;
    }
    setSaving(true);
    try {
      await taxWorkspaceApi.updateGstSettings(user.firmId, {
        taxName: form.taxName.trim(),
        taxRatePct: Number(form.taxRatePct),
        inclusive: Boolean(form.inclusive),
      });
      setNotice({ tone: "success", title: "GST settings saved", message: "Future invoice calculations will use the updated settings." });
      await load();
    } catch (error) {
      setNotice({ tone: "warning", title: "GST settings were not saved", message: error?.userMessage || "Please review the settings and try again." });
    } finally {
      setSaving(false);
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="GST details need attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <TaxHero />
      {notice ? <Toast tone={notice.tone} title={notice.title} message={notice.message} /> : null}
      <SectionIssues issues={state.issues} />
      <GstSummaryGrid summary={state.summary} />
      <GstSettingsForm form={form} onChange={updateForm} onSubmit={saveSettings} saving={saving} />
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Invoice tax review</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Review invoice tax amounts before reporting or sharing finance summaries.</p>
        <div className="mt-4">
          <InvoiceTaxTable invoices={state.invoices} />
        </div>
      </section>
    </div>
  );
}
