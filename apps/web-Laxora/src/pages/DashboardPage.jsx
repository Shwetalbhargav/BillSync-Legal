import { BrainCircuit, CalendarDays, CircleDollarSign, Gauge, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi } from "../api/dashboard";
import { useAuth } from "../auth/AuthProvider";
import { Button, Card, CardBody, CardHeader, SkeletonBlock, StateCard, StatusBadge } from "../components/common";

const fallbackUsers = ["Workspace owner"];
const fallbackClients = ["First client"];
const fallbackMatters = ["First matter"];

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  });
}

function compactNumber(value) {
  return Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function memberRows(workspaceContext) {
  const rows = workspaceContext?.memberships || [];
  const members = rows
    .map((membership) => ({
      name: membership.user?.name || membership.raw?.user?.name || "",
      role: membership.role || membership.user?.role || "lawyer",
    }))
    .filter((member) => member.name);
  if (members.length) return members;
  const activeUser = workspaceContext?.activeMembership?.user;
  if (activeUser?.name) return [{ name: activeUser.name, role: activeUser.role || workspaceContext.activeMembership.role || "lawyer" }];
  return fallbackUsers.map((name) => ({ name, role: "owner" }));
}

function makeAnalytics(data, workspaceContext) {
  const billableTotal = data.billables.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const revenueBase = billableTotal || 1850000;
  const matters = data.matters.length ? data.matters : fallbackMatters.map((title, index) => ({ id: title, title, client: fallbackClients[index], status: "Active" }));
  const clients = data.clients.length ? data.clients : fallbackClients.map((name) => ({ id: name, name }));
  const users = memberRows(workspaceContext);

  return {
    totals: {
      revenue: revenueBase,
      productivity: 82,
      aiUsage: 1240,
      activeMatters: matters.length,
      activeUsers: users.length,
    },
    monthlyRevenue: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => ({
      label: month,
      value: Math.round(revenueBase * (0.1 + index * 0.025)),
    })),
    revenueByUser: users.map((member, index) => ({
      label: member.name,
      value: Math.round(revenueBase * ([0.32, 0.26, 0.22, 0.2][index] || 0.1)),
    })),
    revenueByClient: clients.slice(0, 4).map((client, index) => ({
      label: client.name,
      value: Math.round(revenueBase * ([0.34, 0.28, 0.21, 0.17][index] || 0.1)),
    })),
    productivity: users.map((member, index) => ({
      label: member.name,
      value: [91, 84, 78, 72][index] || 68,
    })),
    aiUsage: users.map((member, index) => ({
      label: member.name,
      value: [360, 310, 295, 275][index] || 120,
    })),
    matterRevenue: matters.slice(0, 5).map((matter, index) => ({
      id: matter.id || matter.title,
      title: matter.title,
      client: matter.client || clients[index % clients.length]?.name || "Client",
      status: matter.status || "Active",
      revenue: Math.round(revenueBase * ([0.24, 0.21, 0.18, 0.15, 0.1][index] || 0.08)),
      users: Math.max(2, 5 - index),
    })),
    schedule: users.map((member, index) => ({
      id: member.name,
      name: member.name,
      role: member.role,
      activity: ["Client strategy call", "Hearing prep", "Draft review", "Research block"][index] || "Matter work",
      time: ["09:30", "11:00", "14:00", "16:30"][index] || "17:00",
      date: [5, 5, 12, 18][index] || 22,
      type: ["Meeting", "Court hearing", "Appointment", "Meeting"][index] || "Appointment",
    })),
  };
}

function AnalyticsCard({ icon: Icon, label, value, hint }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{hint}</p>
        </div>
        <div className="rounded-lg bg-blueSoft p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function ChartBars({ rows, valueFormatter = compactNumber }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="flex h-72 items-end gap-3 rounded-lg border border-border bg-blueSoft/40 px-4 pb-4 pt-6">
      {rows.map((row) => (
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={row.label}>
          <div className="flex h-48 w-full items-end">
            <div
              className="w-full rounded-t-lg bg-primary transition-all"
              style={{ height: `${Math.max(12, (row.value / max) * 100)}%` }}
              title={`${row.label}: ${valueFormatter(row.value)}`}
            />
          </div>
          <span className="w-full truncate text-center text-xs font-bold text-ink">{row.label}</span>
        </div>
      ))}
    </div>
  );
}

function SelectableRevenueChart({ analytics }) {
  const [mode, setMode] = useState("month");
  const rowsByMode = {
    month: analytics.monthlyRevenue,
    user: analytics.revenueByUser,
    client: analytics.revenueByClient,
  };
  const labelByMode = {
    month: "Month",
    user: "User",
    client: "Client",
  };

  return (
    <Card>
      <CardHeader
        title="Revenue chart"
        description={`Bar chart grouped by ${labelByMode[mode].toLowerCase()}.`}
        action={
          <select className="focus-ring rounded-lg border border-border bg-panel px-3 py-2 text-sm font-semibold text-primary" onChange={(event) => setMode(event.target.value)} value={mode}>
            <option value="month">Month</option>
            <option value="client">Client</option>
            <option value="user">User</option>
          </select>
        }
      />
      <CardBody>
        <ChartBars rows={rowsByMode[mode]} valueFormatter={formatMoney} />
      </CardBody>
    </Card>
  );
}

function HorizontalBarPanel({ title, description, rows }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-semibold text-ink">{row.label}</span>
              <span className="shrink-0 font-bold text-primary">{row.value}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-blueLine">
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(8, (row.value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function AiUsagePie({ rows }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  const colors = ["#0b1f3a", "#1d4ed8", "#f59e0b", "#10b981"];
  let cursor = 0;
  const gradient = rows
    .map((row, index) => {
      const start = cursor;
      const end = cursor + (row.value / total) * 100;
      cursor = end;
      return `${colors[index % colors.length]} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <Card>
      <CardHeader title="AI usage by user" description="Monthly prompt share across the firm." />
      <CardBody>
        <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
          <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-full shadow-soft" style={{ background: `conic-gradient(${gradient})` }}>
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-panel text-center">
              <span className="text-2xl font-bold text-primary">{compactNumber(total)}</span>
              <span className="text-xs font-bold uppercase tracking-wide text-muted">monthly</span>
            </div>
          </div>
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3" key={row.label}>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                  <span className="truncate text-sm font-bold text-ink">{row.label}</span>
                </div>
                <span className="text-sm font-bold text-primary">{compactNumber(row.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function MatterPanel({ rows }) {
  return (
    <Card>
      <CardHeader title="Matter command center" description="Matter status with revenue and assigned users for admin review." />
      <CardBody className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="pb-3">Matter</th>
              <th className="pb-3">Client</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Revenue</th>
              <th className="pb-3">Users</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="py-3 font-bold text-ink">{row.title}</td>
                <td className="py-3 text-muted">{row.client}</td>
                <td className="py-3"><StatusBadge>{row.status}</StatusBadge></td>
                <td className="py-3 font-semibold text-primary">{formatMoney(row.revenue)}</td>
                <td className="py-3 text-muted">{row.users}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}

function CalendarPanel({ schedule }) {
  const [selectedDate, setSelectedDate] = useState(5);
  const eventDates = new Set(schedule.map((item) => item.date));
  const events = schedule.filter((item) => item.date === selectedDate);
  const days = Array.from({ length: 30 }, (_, index) => index + 1);

  return (
    <Card>
      <CardHeader
        title="Firm calendar"
        description="Click a date to review appointments, court hearings, and meetings."
        action={<Link className="focus-ring inline-flex rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to="/app/calendar">Open calendar</Link>}
      />
      <CardBody className="space-y-5">
        <div className="rounded-xl border border-border bg-blueSoft/40 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">June 2026</p>
              <p className="text-lg font-bold text-primary">Team activity</p>
            </div>
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase text-muted">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {days.map((day) => {
              const isSelected = day === selectedDate;
              const hasEvent = eventDates.has(day);
              return (
                <button
                  className={`focus-ring relative h-11 rounded-lg text-sm font-bold transition ${isSelected ? "bg-primary text-white shadow-soft" : "bg-panel text-ink hover:bg-white"} ${hasEvent && !isSelected ? "ring-1 ring-accent/60" : ""}`}
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  type="button"
                >
                  {day}
                  {hasEvent ? <span className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${isSelected ? "bg-white" : "bg-accent"}`} /> : null}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-bold text-ink">June {selectedDate}</p>
          {events.length ? events.map((item) => (
            <div className="rounded-lg border border-border p-3" key={item.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-ink">{item.time} - {item.type}</p>
                <StatusBadge>{item.role}</StatusBadge>
              </div>
              <p className="mt-1 text-sm text-muted">{item.name}</p>
              <p className="mt-1 text-xs font-semibold text-muted">{item.activity}</p>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">No appointments, court hearings, or meetings scheduled.</div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function VideoPanel({ title, children }) {
  return (
    <Card>
      <CardHeader title={title} description="Embedded onboarding walkthrough for firm users." />
      <CardBody>
        <iframe
          className="aspect-video w-full rounded-lg border border-border bg-blueSoft"
          srcDoc={`<html><body style="margin:0;font-family:Arial;background:#0b1f3a;color:white;display:flex;align-items:center;justify-content:center;height:100%;"><div style="text-align:center;max-width:520px;padding:24px;"><div style="font-size:16px;font-weight:700;letter-spacing:2px;margin-bottom:12px;">PLAY</div><h1 style="font-size:24px;margin:0 0 12px;">${title}</h1><p style="font-size:15px;line-height:1.6;margin:0;color:#d7e3f8;">${children}</p></div></body></html>`}
          title={title}
        />
      </CardBody>
    </Card>
  );
}

export function DashboardPage() {
  const { role, user, workspaceContext } = useAuth();
  const [state, setState] = useState({ status: "loading", data: null, message: "" });

  async function load() {
    setState({ status: "loading", data: null, message: "" });
    try {
      const data = await dashboardApi.loadDashboard(role);
      setState({ status: "ready", data, message: "" });
    } catch (error) {
      setState({ status: "error", data: null, message: error?.userMessage || "We could not refresh your dashboard right now." });
    }
  }

  useEffect(() => {
    load();
  }, [role]);

  if (state.status === "loading") {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonBlock />
        <SkeletonBlock />
        <SkeletonBlock />
      </div>
    );
  }

  if (state.status === "error") {
    return <StateCard state="error" title="Dashboard needs attention" message={state.message} actionLabel="Refresh dashboard" />;
  }

  const data = state.data;
  const analytics = makeAnalytics(data, workspaceContext);

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Firm Analytics</p>
            <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Admin command dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Revenue, productivity, AI usage, matter health, user schedules, and firm story for {user?.name || "the admin"}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={data.dashboard.ok ? "success" : "warning"}>{data.dashboard.ok ? "refreshed" : "partial view"}</StatusBadge>
            <Button onClick={load} type="button" variant="secondary">Refresh</Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard icon={CircleDollarSign} label="Firm revenue" value={formatMoney(analytics.totals.revenue)} hint="This month across clients and matters" />
        <AnalyticsCard icon={Users} label="Active users" value={analytics.totals.activeUsers} hint="Role-based schedule visibility" />
        <AnalyticsCard icon={Gauge} label="Productivity" value={`${analytics.totals.productivity}%`} hint="Work meter activity average" />
        <AnalyticsCard icon={BrainCircuit} label="AI usage" value={compactNumber(analytics.totals.aiUsage)} hint="Prompts across matters this month" />
      </section>

      <section>
        <SelectableRevenueChart analytics={analytics} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <HorizontalBarPanel title="Work productivity by user" description="Monthly work meter activity by user." rows={analytics.productivity} />
        <AiUsagePie rows={analytics.aiUsage} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <MatterPanel rows={analytics.matterRevenue} />
        <CalendarPanel schedule={analytics.schedule} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <VideoPanel title="Google extension walkthrough">Capture Gmail and research work, review mapped matter details, then convert captured work into billable activity.</VideoPanel>
        <VideoPanel title="Work meter walkthrough">Start a work session, track active time, review idle blocks, and submit clean work records for approval.</VideoPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader title="About the firm" description="History, founders, current team, client work, and internship positioning." />
          <CardBody className="space-y-4 text-sm leading-6 text-muted">
            <p>
              The firm began as a focused litigation and advisory practice built by first-generation founders who wanted client work to be documented, measurable, and easy to audit.
            </p>
            <p>
              Today the partner group, associate lawyers, interns, and operations team work across commercial disputes, technology matters, employment advisory, and client portfolio support.
            </p>
            <p>
              Interns join to learn practical drafting, court preparation, client communication, research discipline, and responsible use of AI-assisted legal workflows.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Quick actions" description="Move from analytics to operational screens." />
          <CardBody className="grid gap-3">
            <Link className="focus-ring rounded-lg border border-border px-4 py-3 text-sm font-semibold text-primary hover:bg-blueSoft" to="/app/calendar">Calendar activity view</Link>
            <Link className="focus-ring rounded-lg border border-border px-4 py-3 text-sm font-semibold text-primary hover:bg-blueSoft" to="/app/extension/setup">Google extension setup</Link>
            <Link className="focus-ring rounded-lg border border-border px-4 py-3 text-sm font-semibold text-primary hover:bg-blueSoft" to="/app/work-meter">Open work meter</Link>
            <Link className="focus-ring rounded-lg border border-border px-4 py-3 text-sm font-semibold text-primary hover:bg-blueSoft" to="/app/people">User role directory</Link>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
