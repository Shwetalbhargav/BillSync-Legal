import { useEffect, useMemo, useState } from "react";
import { billablesApi } from "../../api/billables";
import { billingApi } from "../../api/billing";
import { useAuth } from "../../auth/AuthProvider";
import { SkeletonBlock, StateCard } from "../../components/common";
import { ApprovalQueue, BillingHero } from "../../components/billing/BillingWidgets";

export function BillableApprovalPage() {
  const { role } = useAuth();
  const [state, setState] = useState({ status: "loading", billables: [], message: "" });
  const [savingId, setSavingId] = useState("");
  const canApprove = role === "admin";

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const billables = await billingApi.loadApprovalQueue();
      setState({ status: "ready", billables, message: "" });
    } catch (error) {
      setState({ status: "error", billables: [], message: error?.userMessage || "We could not load the approval queue right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(item) {
    setSavingId(item.id);
    try {
      await billablesApi.approve(item.id, {});
      await load();
    } catch (error) {
      setState((current) => ({ ...current, status: "ready", message: error?.userMessage || "We could not approve this work right now." }));
    } finally {
      setSavingId("");
    }
  }

  async function reject(item) {
    const reason = window.prompt("Add a short reason for sending this work back.");
    if (!reason?.trim()) return;
    setSavingId(item.id);
    try {
      await billablesApi.reject(item.id, { reason: reason.trim() });
      await load();
    } catch (error) {
      setState((current) => ({ ...current, status: "ready", message: error?.userMessage || "We could not send this work back right now." }));
    } finally {
      setSavingId("");
    }
  }

  const amount = useMemo(() => state.billables.reduce((sum, item) => sum + Number(item.amount || 0), 0), [state.billables]);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Approval queue needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <BillingHero amount={amount} count={state.billables.length} pendingCount={state.billables.length} />
      {state.message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{state.message}</div> : null}
      <ApprovalQueue billables={state.billables} canApprove={canApprove} onApprove={approve} onReject={reject} savingId={savingId} />
    </div>
  );
}
