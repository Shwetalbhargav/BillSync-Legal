import { backendGapAdapters } from "./gaps.js";
import { attendanceApi } from "./attendance.js";
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
    const today = new Date().toISOString().slice(0, 10);
    const [peopleResult, payrollResult, attendanceResult] = await Promise.allSettled([
      peopleWorkspaceApi.loadDashboard(),
      backendGapAdapters.payrollRuns.load(),
      attendanceApi.list({ from: today, to: today }),
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
      attendancePreview: settledValue(attendanceResult, { summary: null }).summary,
      issues: [
        issueMessage(peopleResult, "Team members could not be refreshed."),
        issueMessage(payrollResult, "Payroll is not turned on yet."),
        issueMessage(attendanceResult, "Attendance and leave could not be refreshed."),
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
