import { useEffect, useMemo, useState } from "react";
import { billablesApi } from "../../api/billables";
import { billingApi } from "../../api/billing";
import { SkeletonBlock, StateCard } from "../../components/common";
import { ApprovalQueue, BillingHero } from "../../components/billing/BillingWidgets";
import { useBillingModuleAccess } from "./useBillingModuleAccess";

export function BillableApprovalPage() {
  const access = useBillingModuleAccess("billing");
  const [state, setState] = useState({ status: "loading", billables: [], message: "" });
  const [savingId, setSavingId] = useState("");
  const canApprove = access.canCreateInvoices;

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
  if (access.unavailable) return <StateCard state="empty" title="Approval queue is not available" message={access.message} />;
  if (!access.canViewInvoices) return <StateCard state="permission" title="Approval queue is not available" message="You do not have access to this area." />;
  if (state.status === "error") return <StateCard state="error" title="Approval queue needs attention" message={state.message} actionLabel="Retry" onAction={load} />;

  return (
    <div className="space-y-6">
      <BillingHero amount={amount} count={state.billables.length} pendingCount={state.billables.length} />
      {access.readOnly ? <StateCard state="empty" title="Approval queue is read-only" message={access.message} /> : null}
      {state.message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{state.message}</div> : null}
      <ApprovalQueue billables={state.billables} canApprove={canApprove} onApprove={approve} onReject={reject} savingId={savingId} />
    </div>
  );
}
