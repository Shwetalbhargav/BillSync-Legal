import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { billablesApi } from "../../api/billables";
import { billingApi } from "../../api/billing";
import { useAuth } from "../../auth/AuthProvider";
import { SkeletonBlock, StateCard } from "../../components/common";
import { BillableDetailPanel, SectionIssues, SyncHistoryList } from "../../components/billing/BillingWidgets";

export function BillableDetailPage() {
  const { billableId } = useParams();
  const { role } = useAuth();
  const [state, setState] = useState({ status: "loading", billable: null, logs: [], issues: [], message: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await billingApi.loadBillableDetail(billableId);
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", billable: null, logs: [], issues: [], message: error?.userMessage || "We could not load this billable work item." });
    }
  }

  useEffect(() => {
    load();
  }, [billableId]);

  async function approve(item) {
    setSaving(true);
    try {
      await billablesApi.approve(item.id, {});
      await load();
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not approve this work right now." }));
    } finally {
      setSaving(false);
    }
  }

  async function reject(item) {
    const reason = window.prompt("Add a short reason for sending this work back.");
    if (!reason?.trim()) return;
    setSaving(true);
    try {
      await billablesApi.reject(item.id, { reason: reason.trim() });
      await load();
    } catch (error) {
      setState((current) => ({ ...current, message: error?.userMessage || "We could not send this work back right now." }));
    } finally {
      setSaving(false);
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Billable detail needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <Link className="focus-ring inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-primary hover:underline" to="/app/billables">
        <ArrowLeft className="h-4 w-4" />
        Back to billables
      </Link>
      {state.message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{state.message}</div> : null}
      <SectionIssues issues={state.issues} />
      <BillableDetailPanel
        billable={state.billable}
        canApprove={role === "admin"}
        onApprove={approve}
        onReject={reject}
        saving={saving}
      />
      <SyncHistoryList logs={state.logs} />
    </div>
  );
}
