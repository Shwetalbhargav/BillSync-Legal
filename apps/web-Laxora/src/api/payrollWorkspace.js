import { backendGapAdapters } from "./gaps.js";
import { peopleWorkspaceApi } from "./peopleWorkspace.js";

function issueMessage(result, message) {
  return result.status === "rejected" ? message : "";
}

function settledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

const setupSteps = [
  {
    id: "compensation",
    title: "Compensation records",
    detail: "Add salary, stipend, or retainer rules for each team member.",
    status: "needed",
  },
  {
    id: "deductions",
    title: "Deductions and benefits",
    detail: "Connect deductions, benefits, and reimbursement rules before running payroll.",
    status: "needed",
  },
  {
    id: "review",
    title: "Review and approval",
    detail: "Set who can prepare, approve, and close payroll runs.",
    status: "needed",
  },
  {
    id: "payslips",
    title: "Payslip delivery",
    detail: "Turn on payslip generation only after payroll records are connected.",
    status: "planned",
  },
];

export const payrollWorkspaceApi = {
  async loadDashboard() {
    const [peopleResult, payrollResult] = await Promise.allSettled([
      peopleWorkspaceApi.loadDashboard(),
      backendGapAdapters.payrollRuns.load(),
    ]);
    const people = settledValue(peopleResult, { people: [] }).people || [];
    return {
      people,
      setupSteps,
      payrollRuns: [],
      compensation: people.map((person) => ({
        id: person.id,
        name: person.name,
        role: person.role,
        status: "not-configured",
      })),
      issues: [
        issueMessage(peopleResult, "Team members could not be refreshed."),
        issueMessage(payrollResult, "Payroll is not turned on yet."),
      ].filter(Boolean),
    };
  },

  async loadRun(runId) {
    const dashboard = await this.loadDashboard();
    return {
      ...dashboard,
      run: {
        id: runId,
        title: "Payroll run",
        status: "not-configured",
      },
    };
  },
};
