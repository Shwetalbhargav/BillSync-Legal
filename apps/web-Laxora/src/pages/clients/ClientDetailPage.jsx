import { Clock3, Edit, ReceiptText, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { clientsApi } from "../../api/clients";
import { asList, normalizeClient, normalizeMatter, normalizeTimeEntry, normalizeWorkSession, toId } from "../../api/normalizers";
import { timeEntriesApi } from "../../api/timeEntries";
import { workSessionsApi } from "../../api/workSessions";
import { Button, Card, CardBody, CardHeader, SkeletonBlock, StateCard, StatusBadge } from "../../components/common";
import { ClientSummaryTiles } from "../../components/clients/ClientWidgets";
import { useClientModuleAccess } from "./useClientModuleAccess";

function unwrap(response) {
  return response?.data || response;
}

function formatMinutes(value) {
  const minutes = Math.round(Number(value || 0));
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function buildWorkRows(timeEntries, workSessions) {
  const map = new Map();
  timeEntries.forEach((entry) => {
    const key = entry.userId || entry.user || "unassigned";
    const row = map.get(key) || { id: key, name: entry.user || "Unassigned", submittedMinutes: 0, sessionMinutes: 0 };
    row.submittedMinutes += Number(entry.minutes || entry.billableMinutes || 0);
    map.set(key, row);
  });
  workSessions.forEach((session) => {
    const key = session.userId || session.user || "unassigned";
    const row = map.get(key) || { id: key, name: session.userName || session.user || "Unassigned", submittedMinutes: 0, sessionMinutes: 0 };
    row.sessionMinutes += Number(session.minutes || session.durationMinutes || 0);
    map.set(key, row);
  });
  return Array.from(map.values()).filter((row) => row.submittedMinutes || row.sessionMinutes);
}

function ClientTeamPanel({ team }) {
  return (
    <Card>
      <CardHeader title="Lawyers working with client" description="Click a team member to open their profile." action={<StatusBadge>{team.length}</StatusBadge>} />
      <CardBody className="space-y-3">
        {team.length ? team.map((person) => (
          person.id ? (
            <Link className="focus-ring flex items-center justify-between rounded-lg border border-border p-3 hover:bg-blueSoft" key={person.id} to={`/app/people/${person.id}`}>
              <span className="font-bold text-ink">{person.name}</span>
              <StatusBadge>{person.role}</StatusBadge>
            </Link>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-border p-3" key={person.name}>
              <span className="font-bold text-ink">{person.name}</span>
              <StatusBadge>{person.role}</StatusBadge>
            </div>
          )
        )) : <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">No appointed lawyers are linked yet.</div>}
      </CardBody>
    </Card>
  );
}

function MatterLinksPanel({ matters }) {
  return (
    <Card>
      <CardHeader title="Client matters" description="Click a matter to open the matter details." action={<StatusBadge>{matters.length}</StatusBadge>} />
      <CardBody className="space-y-3">
        {matters.length ? matters.map((matter) => (
          <Link className="focus-ring block rounded-lg border border-border p-3 hover:bg-blueSoft" key={matter.id} to={`/app/matters/${matter.id}`}>
            <p className="text-sm font-bold text-ink">{matter.title}</p>
            <p className="mt-1 text-xs font-semibold text-muted">{matter.status || "Active"}</p>
          </Link>
        )) : <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">No matters are connected to this client yet.</div>}
      </CardBody>
    </Card>
  );
}

function ClientWorkChart({ rows }) {
  const max = Math.max(...rows.flatMap((row) => [row.submittedMinutes, row.sessionMinutes]), 1);
  return (
    <Card>
      <CardHeader title="Client time and effort" description="Work submitted and time entry effort for this client by user." action={<Clock3 className="h-5 w-5 text-primary" />} />
      <CardBody className="space-y-4">
        {rows.length ? rows.map((row) => (
          <div className="rounded-lg border border-border p-4" key={row.id}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-ink">{row.name}</p>
              <p className="text-xs font-bold text-muted">{formatMinutes(row.submittedMinutes + row.sessionMinutes)}</p>
            </div>
            <div className="grid gap-2">
              <div>
                <div className="mb-1 flex justify-between text-xs font-semibold text-muted"><span>Work submitted</span><span>{formatMinutes(row.submittedMinutes)}</span></div>
                <div className="h-3 overflow-hidden rounded-full bg-blueLine"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(6, (row.submittedMinutes / max) * 100)}%` }} /></div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs font-semibold text-muted"><span>Time entry</span><span>{formatMinutes(row.sessionMinutes)}</span></div>
                <div className="h-3 overflow-hidden rounded-full bg-blueLine"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(6, (row.sessionMinutes / max) * 100)}%` }} /></div>
              </div>
            </div>
          </div>
        )) : <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">No submitted work or time entries are recorded for this client yet.</div>}
      </CardBody>
    </Card>
  );
}

export function ClientDetailPage() {
  const { clientId } = useParams();
  const access = useClientModuleAccess();
  const [state, setState] = useState({ status: "loading", client: null, matters: [], summary: null, timeEntries: [], workSessions: [], message: "" });

  async function load() {
    if (access.unavailable || !access.canRead) {
      setState({ status: "permission", client: null, matters: [], summary: null, timeEntries: [], workSessions: [], message: access.message || "You do not have access to this client." });
      return;
    }
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const [clientResponse, casesResponse, summaryResponse, entriesResponse, sessionsResponse] = await Promise.all([
        clientsApi.get(clientId),
        clientsApi.cases(clientId, { limit: 25 }),
        clientsApi.summary(clientId),
        timeEntriesApi.list({ clientId, limit: 100 }),
        workSessionsApi.list({ clientId, limit: 100 }),
      ]);
      setState({
        status: "ready",
        client: normalizeClient(unwrap(clientResponse)),
        matters: asList(casesResponse).map(normalizeMatter),
        summary: unwrap(summaryResponse),
        timeEntries: asList(entriesResponse).map(normalizeTimeEntry),
        workSessions: asList(sessionsResponse).map(normalizeWorkSession),
        message: "",
      });
    } catch (error) {
      setState({
        status: error?.status === 403 ? "permission" : "error",
        client: null,
        matters: [],
        summary: null,
        timeEntries: [],
        workSessions: [],
        message: error?.status === 403 ? "You do not have access to this client." : (error?.userMessage || "We could not load this client right now."),
      });
    }
  }

  useEffect(() => {
    load();
  }, [clientId, access.status, access.unavailable, access.canRead]);

  if (state.status === "loading") return <div className="grid gap-4 lg:grid-cols-2"><SkeletonBlock /><SkeletonBlock /></div>;
  if (state.status === "permission") return <StateCard state="permission" title="Client is not available" message={state.message} />;
  if (state.status === "error") return <StateCard state="error" title="Client needs attention" message={state.message} actionLabel="Retry" onAction={load} />;

  const client = state.client;
  const teamMap = new Map();
  if (client.ownerId || client.ownerName) {
    teamMap.set(client.ownerId || client.ownerName, { id: client.ownerId, name: client.ownerName || "Appointed user", role: "Owner" });
  }
  state.matters.forEach((matter) => {
    (matter.assignedUsers || []).forEach((person) => {
      const id = toId(person) || person.id || person.name;
      if (!id) return;
      teamMap.set(id, { id, name: person.name || person.userName || "Team member", role: person.role || "Matter team" });
    });
  });
  const team = Array.from(teamMap.values()).filter((person) => person.name);
  const workRows = buildWorkRows(state.timeEntries, state.workSessions);

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Client Overview</p>
            <h1 className="mt-1 break-words text-2xl font-bold text-primary md:text-3xl">{client.name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge tone="success">{client.status}</StatusBadge>
              <StatusBadge>{client.paymentTerms}</StatusBadge>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">{client.email || "Email not added yet"} - {client.phone || "Phone not added yet"}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/clients/${client.id}/contacts`}>
              <Users className="h-4 w-4" />
              Contacts
            </Link>
            <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/clients/${client.id}/billing`}>
              <ReceiptText className="h-4 w-4" />
              Billing
            </Link>
            {access.canEdit && !access.readOnly ? (
              <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryStrong" to={`/app/clients/${client.id}/edit`}>
                <Edit className="h-4 w-4" />
                Edit
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {access.readOnly ? <StateCard state="permission" title="Clients are read-only" message={access.message} /> : null}

      <ClientSummaryTiles summary={state.summary} />

      <section className="grid gap-6 xl:grid-cols-2">
        <ClientTeamPanel team={team} />
        <MatterLinksPanel matters={state.matters} />
      </section>

      <ClientWorkChart rows={workRows} />

      <div className="flex justify-end">
        <Button onClick={load} type="button" variant="secondary">Refresh client</Button>
      </div>
    </div>
  );
}
