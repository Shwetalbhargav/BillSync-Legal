import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { settingsWorkspaceApi } from "../../api";
import { useAuth } from "../../auth/AuthProvider";
import { Button, SkeletonBlock, StateCard, Toast } from "../../components/common";
import {
  BillingDefaultsForm,
  FirmSetupForm,
  PermissionsMatrix,
  PlatformBillingPanel,
  SectionIssues,
  SettingsHero,
  SettingsSummary,
  TaxDefaultsForm,
  UnavailableDefaults,
} from "../../components/settings/SettingsWidgets";
import { permissions } from "../../constants/permissions";
import { PermissionDeniedPage } from "../PermissionDeniedPage";

const adminViews = new Set(["security", "firm", "admin"]);

function firmFormFrom(firm = {}) {
  return {
    name: firm.name || "",
    currency: firm.currency || "INR",
  };
}

function billingFormFrom(firm = {}) {
  return {
    defaultRate: String(firm.billingPreferences?.defaultRate ?? 0),
    autoSync: Boolean(firm.billingPreferences?.autoSync),
  };
}

function taxFormFrom(firm = {}) {
  return {
    taxName: firm.taxSettings?.taxName || "GST",
    taxRatePct: String(firm.taxSettings?.taxRatePct ?? 0),
    inclusive: Boolean(firm.taxSettings?.inclusive),
  };
}

export function SettingsAdminPage({ view = "settings" }) {
  const { role, user } = useAuth();
  const [state, setState] = useState({ status: "loading", firm: {}, users: [], roleSummary: {}, defaults: {}, issues: [], message: "" });
  const [firmForm, setFirmForm] = useState(firmFormFrom());
  const [billingForm, setBillingForm] = useState(billingFormFrom());
  const [taxForm, setTaxForm] = useState(taxFormFrom());
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState(null);

  const requiresAdmin = adminViews.has(view);
  const firmId = user?.firmId;

  const loadSettings = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await settingsWorkspaceApi.load({ firmId });
      setState({ status: "ready", message: "", ...data });
      setFirmForm(firmFormFrom(data.firm));
      setBillingForm(billingFormFrom(data.firm));
      setTaxForm(taxFormFrom(data.firm));
    } catch (error) {
      setState({
        status: "error",
        firm: {},
        users: [],
        roleSummary: {},
        defaults: {},
        platformBilling: {},
        issues: [],
        message: error?.userMessage || "Settings could not be loaded right now.",
      });
    }
  }, [firmId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const visibleSections = useMemo(() => {
    if (view === "invoice") return ["platformBilling", "billing", "tax", "unavailable"];
    if (view === "storage" || view === "notifications") return ["unavailable", "permissions"];
    if (view === "security") return ["permissions", "unavailable"];
    if (view === "compliance") return ["tax", "unavailable"];
    if (view === "firm") return ["firm", "billing", "tax"];
    if (view === "admin") return ["firm", "permissions", "unavailable"];
    return ["firm", "platformBilling", "billing", "tax", "permissions", "unavailable"];
  }, [view]);

  if (requiresAdmin && role !== "admin") {
    return <PermissionDeniedPage />;
  }

  function updateFirmForm(field, value) {
    setNotice(null);
    setFirmForm((current) => ({ ...current, [field]: value }));
  }

  function updateBillingForm(field, value) {
    setNotice(null);
    setBillingForm((current) => ({ ...current, [field]: value }));
  }

  function updateTaxForm(field, value) {
    setNotice(null);
    setTaxForm((current) => ({ ...current, [field]: value }));
  }

  async function saveFirmSetup() {
    if (!firmId) {
      setNotice({ tone: "warning", title: "Firm details needed", message: "Sign in with a firm account before saving shared settings." });
      return;
    }
    if (!firmForm.name.trim() || firmForm.currency.length !== 3) {
      setNotice({ tone: "warning", title: "Firm setup needs attention", message: "Enter a firm name and choose a three-letter currency." });
      return;
    }
    setSaving("firm");
    try {
      await settingsWorkspaceApi.updateFirm(firmId, {
        name: firmForm.name.trim(),
        currency: firmForm.currency,
        taxSettings: state.firm.taxSettings,
        billingPreferences: state.firm.billingPreferences,
      });
      await settingsWorkspaceApi.updateCurrency(firmId, { currency: firmForm.currency });
      setNotice({ tone: "success", title: "Firm setup saved", message: "Shared workspace details were updated." });
      await loadSettings();
    } catch (error) {
      setNotice({ tone: "warning", title: "Firm setup was not saved", message: error?.userMessage || "Please review the details and try again." });
    } finally {
      setSaving("");
    }
  }

  async function saveBillingDefaults() {
    if (!firmId) {
      setNotice({ tone: "warning", title: "Firm details needed", message: "Sign in with a firm account before saving billing defaults." });
      return;
    }
    const defaultRate = Number(billingForm.defaultRate);
    if (!Number.isFinite(defaultRate) || defaultRate < 0) {
      setNotice({ tone: "warning", title: "Billing defaults need attention", message: "Enter a default hourly rate of zero or more." });
      return;
    }
    setSaving("billing");
    try {
      await settingsWorkspaceApi.updateBillingPreferences(firmId, { defaultRate, autoSync: Boolean(billingForm.autoSync) });
      setNotice({ tone: "success", title: "Billing defaults saved", message: "Future billing review will use these defaults." });
      await loadSettings();
    } catch (error) {
      setNotice({ tone: "warning", title: "Billing defaults were not saved", message: error?.userMessage || "Please review the details and try again." });
    } finally {
      setSaving("");
    }
  }

  async function saveTaxDefaults() {
    if (!firmId) {
      setNotice({ tone: "warning", title: "Firm details needed", message: "Sign in with a firm account before saving tax defaults." });
      return;
    }
    const taxRatePct = Number(taxForm.taxRatePct);
    if (!taxForm.taxName.trim() || !Number.isFinite(taxRatePct) || taxRatePct < 0 || taxRatePct > 100) {
      setNotice({ tone: "warning", title: "Tax defaults need attention", message: "Enter a tax name and a rate between 0 and 100." });
      return;
    }
    setSaving("tax");
    try {
      await settingsWorkspaceApi.updateTaxSettings(firmId, {
        taxName: taxForm.taxName.trim(),
        taxRatePct,
        inclusive: Boolean(taxForm.inclusive),
      });
      setNotice({ tone: "success", title: "Tax defaults saved", message: "Future invoice calculations will use these settings." });
      await loadSettings();
    } catch (error) {
      setNotice({ tone: "warning", title: "Tax defaults were not saved", message: error?.userMessage || "Please review the details and try again." });
    } finally {
      setSaving("");
    }
  }

  async function createPlatformInvoice() {
    setSaving("platform-invoice");
    setNotice(null);
    try {
      await settingsWorkspaceApi.createPlatformInvoice();
      setNotice({ tone: "success", title: "Subscription invoice prepared", message: "The Lexora subscription invoice is ready for review." });
      await loadSettings();
    } catch (error) {
      setNotice({ tone: "warning", title: "Subscription invoice was not prepared", message: error?.userMessage || "Please try again after checking the workspace plan." });
    } finally {
      setSaving("");
    }
  }

  async function markPlatformPaymentFailed(invoice) {
    if (!invoice?.id) {
      setNotice({ tone: "warning", title: "No subscription invoice selected", message: "Prepare a Lexora subscription invoice before checking payment state." });
      return;
    }
    setSaving("platform-payment");
    setNotice(null);
    try {
      await settingsWorkspaceApi.recordPlatformPayment(invoice.id, {
        status: "failed",
        amountPaise: invoice.raw?.balancePaise || invoice.raw?.totalPaise || 0,
        failureMessage: "The subscription payment needs review before the workspace can be marked paid.",
        method: "provider_pending",
      });
      setNotice({ tone: "warning", title: "Subscription payment needs review", message: "The failed payment state is visible for follow-up." });
      await loadSettings();
    } catch (error) {
      setNotice({ tone: "warning", title: "Payment state was not updated", message: error?.userMessage || "Please try again after checking the subscription invoice." });
    } finally {
      setSaving("");
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Settings need attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <SettingsHero firm={state.firm} role={role} variant={view} />
      {notice ? <Toast tone={notice.tone} title={notice.title} message={notice.message} /> : null}
      <div className="flex justify-end">
        <Button isLoading={state.status === "loading"} onClick={loadSettings} type="button" variant="secondary">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      <SectionIssues issues={state.issues} />
      <SettingsSummary firm={state.firm} roleSummary={state.roleSummary} />
      {visibleSections.includes("platformBilling") ? <PlatformBillingPanel billing={state.platformBilling} onCreateInvoice={createPlatformInvoice} onMarkFailed={markPlatformPaymentFailed} saving={saving} /> : null}
      {visibleSections.includes("firm") ? <FirmSetupForm form={firmForm} onChange={updateFirmForm} onSubmit={saveFirmSetup} saving={saving === "firm"} /> : null}
      {visibleSections.includes("billing") ? <BillingDefaultsForm form={billingForm} onChange={updateBillingForm} onSubmit={saveBillingDefaults} saving={saving === "billing"} /> : null}
      {visibleSections.includes("tax") ? <TaxDefaultsForm form={taxForm} onChange={updateTaxForm} onSubmit={saveTaxDefaults} saving={saving === "tax"} /> : null}
      {visibleSections.includes("permissions") ? <PermissionsMatrix permissions={permissions} roleSummary={state.roleSummary} /> : null}
      {visibleSections.includes("unavailable") ? <UnavailableDefaults defaults={state.defaults} /> : null}
    </div>
  );
}
