import { useEffect, useState } from "react";
import { payrollWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import {
  CompensationTable,
  PayrollHero,
  PayrollNotConfigured,
  PayrollReadinessCards,
  PayrollRunsTable,
  PayrollSetupChecklist,
  SectionIssues,
} from "../../components/payroll/PayrollWidgets";

export function PayrollRunsPage() {
  const [state, setState] = useState({
    status: "loading",
    people: [],
    setupSteps: [],
    payrollRuns: [],
    compensation: [],
    issues: [],
    message: "",
  });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await payrollWorkspaceApi.loadDashboard();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({
        status: "error",
        people: [],
        setupSteps: [],
        payrollRuns: [],
        compensation: [],
        issues: [],
        message: error?.userMessage || "We could not load payroll details right now.",
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Payroll needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <PayrollHero title="Payroll runs" />
      <SectionIssues issues={state.issues} />
      <PayrollNotConfigured />
      <PayrollReadinessCards peopleCount={state.people.length} />
      <PayrollSetupChecklist steps={state.setupSteps} />
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Payroll run history</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Review salary, stipend, and retainer runs after payroll is turned on.</p>
        <div className="mt-4">
          <PayrollRunsTable runs={state.payrollRuns} />
        </div>
      </section>
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Compensation readiness</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Use this list to see which team members still need compensation rules.</p>
        <div className="mt-4">
          <CompensationTable compensation={state.compensation} />
        </div>
      </section>
    </div>
  );
}
