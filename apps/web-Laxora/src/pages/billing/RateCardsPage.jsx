import { useEffect, useState } from "react";
import { rateCardsApi } from "../../api/rateCards";
import { billingApi } from "../../api/billing";
import { useAuth } from "../../auth/AuthProvider";
import { SkeletonBlock, StateCard } from "../../components/common";
import { RateCardForm, RateCardsTable, SectionIssues } from "../../components/billing/BillingWidgets";

const initialForm = {
  userId: "",
  caseId: "",
  activityCode: "",
  ratePerHour: "",
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: "",
};

function buildPayload(form) {
  return {
    userId: form.userId,
    ...(form.caseId ? { caseId: form.caseId } : {}),
    ...(form.activityCode ? { activityCode: form.activityCode } : {}),
    ratePerHour: Number(form.ratePerHour),
    effectiveFrom: form.effectiveFrom,
    ...(form.effectiveTo ? { effectiveTo: form.effectiveTo } : {}),
  };
}

export function RateCardsPage() {
  const { role } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ status: "loading", rateCards: [], users: [], matters: [], issues: [], message: "" });
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState("");
  const canManageRates = role === "admin";

  async function load() {
    if (!canManageRates) {
      setState({ status: "ready", rateCards: [], users: [], matters: [], issues: [], message: "" });
      return;
    }
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await billingApi.loadRateCards();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", rateCards: [], users: [], matters: [], issues: [], message: error?.userMessage || "We could not load rate cards right now." });
    }
  }

  useEffect(() => {
    load();
  }, [canManageRates]);

  function updateField(field, value) {
    setState((current) => ({ ...current, message: "" }));
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit() {
    if (!canManageRates) {
      setState((current) => ({ ...current, message: "Rate cards can be changed only by firm administrators." }));
      return;
    }
    if (!form.userId || !form.ratePerHour || !form.effectiveFrom) {
      setState((current) => ({ ...current, message: "Select a team member, rate, and start date before saving." }));
      return;
    }

    setSaving(true);
    try {
      await rateCardsApi.create(buildPayload(form));
      setForm(initialForm);
      await load();
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not save this rate card right now." }));
    } finally {
      setSaving(false);
    }
  }

  async function remove(card) {
    if (!canManageRates) {
      setState((current) => ({ ...current, message: "Rate cards can be changed only by firm administrators." }));
      return;
    }
    setSavingId(card.id);
    try {
      await rateCardsApi.remove(card.id);
      await load();
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not remove this rate card right now." }));
    } finally {
      setSavingId("");
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Rate cards need attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Rates</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Rate cards</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Keep hourly rates current by team member, matter, and work type.</p>
      </section>
      {state.message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{state.message}</div> : null}
      <SectionIssues issues={state.issues} />
      {canManageRates ? (
        <RateCardForm form={form} matters={state.matters} onChange={updateField} onSubmit={submit} saving={saving} users={state.users} />
      ) : (
        <StateCard state="permission" title="Rate management is reserved" message="You can review billing work, but rate card changes need an administrator account." />
      )}
      <RateCardsTable onDelete={remove} rateCards={state.rateCards} savingId={savingId} />
    </div>
  );
}
