import { useEffect, useState } from "react";
import { financeWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import { AuditHero, AuditLogTable, AuditStats, SectionIssues } from "../../components/finance/FinanceWidgets";

export function AuditLogsPage() {
  const [state, setState] = useState({ status: "loading", logs: [], platformStats: [], statusStats: [], issues: [], message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await financeWorkspaceApi.loadAudit();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", logs: [], platformStats: [], statusStats: [], issues: [], message: error?.userMessage || "We could not load audit events right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Audit events need attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <AuditHero />
      <SectionIssues issues={state.issues} />
      <AuditStats platformStats={state.platformStats} statusStats={state.statusStats} />
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Recent events</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Review recent finance and billing activity.</p>
        <div className="mt-4">
          <AuditLogTable logs={state.logs} />
        </div>
      </section>
    </div>
  );
}
