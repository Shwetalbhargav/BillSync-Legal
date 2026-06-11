import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { payrollWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard, StatusBadge } from "../../components/common";
import {
  CompensationTable,
  PayrollHero,
  PayrollNotConfigured,
  PayrollSetupChecklist,
  SectionIssues,
} from "../../components/payroll/PayrollWidgets";

export function PayrollDetailPage() {
  const { runId } = useParams();
  const [state, setState] = useState({
    status: "loading",
    run: null,
    setupSteps: [],
    compensation: [],
    issues: [],
    message: "",
  });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await payrollWorkspaceApi.loadRun(runId);
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({
        status: "error",
        run: null,
        setupSteps: [],
        compensation: [],
        issues: [],
        message: error?.userMessage || "We could not load this payroll run right now.",
      });
    }
  }

  useEffect(() => {
    load();
  }, [runId]);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Payroll run needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <PayrollHero title="Payroll run detail" />
      <SectionIssues issues={state.issues} />
      <PayrollNotConfigured message="This payroll run is a placeholder until payroll records are connected." />
      <section className="surface-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-primary">{state.run?.title || "Payroll run"}</h2>
            <p className="mt-1 break-all text-sm leading-6 text-muted">Reference: {state.run?.id || "Not available"}</p>
          </div>
          <StatusBadge tone="warning">Not configured</StatusBadge>
        </div>
      </section>
      <PayrollSetupChecklist steps={state.setupSteps} />
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Compensation records</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Compensation rules must be completed before this run can be prepared.</p>
        <div className="mt-4">
          <CompensationTable compensation={state.compensation} />
        </div>
      </section>
    </div>
  );
}
