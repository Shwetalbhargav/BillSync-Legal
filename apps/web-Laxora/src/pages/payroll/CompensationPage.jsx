import { useEffect, useState } from "react";
import { payrollWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import {
  CompensationTable,
  PayrollHero,
  PayrollNotConfigured,
  PayrollSetupChecklist,
  SectionIssues,
} from "../../components/payroll/PayrollWidgets";

export function CompensationPage() {
  const [state, setState] = useState({
    status: "loading",
    setupSteps: [],
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
        setupSteps: [],
        compensation: [],
        issues: [],
        message: error?.userMessage || "We could not load compensation setup right now.",
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Compensation setup needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <PayrollHero title="Compensation setup" />
      <SectionIssues issues={state.issues} />
      <PayrollNotConfigured message="Compensation records are placeholders until payroll setup is turned on." />
      <section className="surface-card p-5">
        <h2 className="text-xl font-bold text-primary">Team compensation</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Prepare salary, stipend, and retainer setup without calculating payroll early.</p>
        <div className="mt-4">
          <CompensationTable compensation={state.compensation} />
        </div>
      </section>
      <PayrollSetupChecklist steps={state.setupSteps} />
    </div>
  );
}
