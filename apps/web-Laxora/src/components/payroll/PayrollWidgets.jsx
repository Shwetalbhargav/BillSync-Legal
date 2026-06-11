import { AlertCircle, Banknote, CheckCircle2, Clock3, FileText, ListChecks, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";

export function PayrollHero({ title = "Payroll" }) {
  return (
    <section className="surface-card p-6">
      <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">People</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Prepare payroll setup without pretending salary runs are connected before the firm turns them on.</p>
        </div>
        <div className="rounded-lg bg-blueSoft p-3 text-primary">
          <Banknote className="h-6 w-6" />
        </div>
      </div>
    </section>
  );
}

export function PayrollNotConfigured({ message = "Payroll records are not connected yet. Complete setup before preparing salary, stipend, retainer, or payslip work." }) {
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-5">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="text-base font-bold text-warning">Payroll is not turned on yet</h2>
          <p className="mt-1 text-sm leading-6 text-ink">{message}</p>
        </div>
      </div>
    </section>
  );
}

export function SectionIssues({ issues }) {
  if (!issues?.length) return null;
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <p className="text-sm font-bold text-warning">Some payroll details need another refresh.</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-ink">
            {issues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function PayrollSetupChecklist({ steps }) {
  return (
    <Card>
      <CardHeader title="Required setup" description="These steps must be completed before payroll is used for firm operations." />
      <CardBody className="grid gap-3 md:grid-cols-2">
        {steps.map((step) => (
          <div className="rounded-lg border border-border p-4" key={step.id}>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blueSoft p-2 text-primary">
                {step.status === "planned" ? <Clock3 className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-ink">{step.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{step.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

export function PayrollRunsTable({ runs }) {
  if (!runs.length) {
    return <StateCard state="empty" title="No payroll runs yet" message="Payroll runs will appear only after payroll is turned on and setup is complete." />;
  }
  return (
    <DataTable
      columns={[
        { key: "period", label: "Period" },
        { key: "status", label: "Status" },
        { key: "team", label: "Team" },
        { key: "action", label: "Details" },
      ]}
      rows={runs.map((run) => ({
        id: run.id,
        period: run.period,
        status: <StatusBadge>{run.status}</StatusBadge>,
        team: run.peopleCount,
        action: (
          <Link to={`/app/payroll/${run.id}`}>
            <Button size="sm" type="button" variant="secondary">Open</Button>
          </Link>
        ),
      }))}
    />
  );
}

export function CompensationTable({ compensation }) {
  if (!compensation.length) {
    return <StateCard state="empty" title="No compensation records found" message="Compensation placeholders will appear after team members are loaded." />;
  }
  return (
    <DataTable
      columns={[
        { key: "name", label: "Name" },
        { key: "role", label: "Role" },
        { key: "status", label: "Compensation" },
        { key: "note", label: "Next step" },
      ]}
      rows={compensation.map((person) => ({
        id: person.id,
        name: person.name,
        role: <StatusBadge>{person.role}</StatusBadge>,
        status: <StatusBadge tone="warning">Not set</StatusBadge>,
        note: "Add compensation rules when payroll is turned on.",
      }))}
    />
  );
}

export function PayrollReadinessCards({ peopleCount }) {
  const cards = [
    { icon: UserRound, label: "Team members", value: peopleCount || 0 },
    { icon: Banknote, label: "Compensation records", value: "Not set" },
    { icon: FileText, label: "Payslip delivery", value: "Planned" },
    { icon: CheckCircle2, label: "Approval flow", value: "Needed" },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ icon: Icon, label, value }) => (
        <div className="rounded-lg border border-border bg-panel p-4" key={label}>
          <div className="mb-3 inline-flex rounded-lg bg-blueSoft p-2 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-1 break-words text-lg font-bold text-primary">{value}</p>
        </div>
      ))}
    </div>
  );
}
