import { Clock3, Edit, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { caseAssignmentsApi } from "../../api/caseAssignments";
import { mattersApi } from "../../api/matters";
import { asList, normalizeAssignment, normalizeMatter, normalizeTimeEntry } from "../../api/normalizers";
import { Button, Card, CardBody, CardHeader, Dialog, SkeletonBlock, StateCard, StatusBadge } from "../../components/common";
import { AssignmentList, MatterRollupTiles } from "../../components/matters/MatterWidgets";

function unwrap(response) {
  return response?.data || response;
}

function formatMinutes(value) {
  const minutes = Number(value || 0);
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (!hours) return `${remaining} min`;
  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDateTime(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function DetailRow({ label, value }) {
  const displayValue = value == null || value === "" ? "Not set" : value;
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 safe-text text-sm font-semibold text-primary">{displayValue}</p>
    </div>
  );
}

function TimeEntryList({ entries, onSelect, selectedId }) {
  return (
    <Card>
      <CardHeader
        title="Recent time entries"
        description="Click an entry to inspect work, effort, and manpower for this matter."
        action={<StatusBadge>{entries.length}</StatusBadge>}
      />
      <CardBody>
        {entries.length ? (
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <button
                className={`focus-ring flex w-full min-w-0 flex-col gap-3 py-4 text-left sm:flex-row sm:items-center sm:justify-between ${selectedId === entry.id ? "bg-blueSoft/50 px-3" : ""}`}
                key={entry.id}
                onClick={() => onSelect(entry)}
                type="button"
              >
                <div className="min-w-0">
                  <p className="safe-text font-semibold text-primary">{entry.title}</p>
                  <p className="mt-1 text-sm text-muted">{entry.user}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <StatusBadge>{entry.status}</StatusBadge>
                  <StatusBadge>{formatMinutes(entry.minutes)}</StatusBadge>
                  <StatusBadge>{formatMoney(entry.amount)}</StatusBadge>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No time entries are linked to this matter yet.</p>
        )}
      </CardBody>
    </Card>
  );
}

function TimeEntryDetail({ entry, onClose }) {
  return (
    <Dialog isOpen={Boolean(entry)} onClose={onClose} title="Time entry details">
      {entry ? (
        <div className="space-y-5">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="safe-text text-base font-bold text-primary">{entry.title}</p>
              <p className="mt-1 text-sm text-muted">{entry.client || entry.matter || "Matter work"}</p>
            </div>
            <StatusBadge>{entry.status}</StatusBadge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DetailRow label="Team member" value={entry.userId ? <Link className="text-primary hover:underline" to={`/app/people/${entry.userId}`}>{entry.user}</Link> : entry.user} />
            <DetailRow label="Total effort" value={formatMinutes(entry.minutes)} />
            <DetailRow label="Billable effort" value={formatMinutes(entry.billableMinutes)} />
            <DetailRow label="Nonbillable effort" value={formatMinutes(entry.nonbillableMinutes)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DetailRow label="Work type" value={entry.workType} />
            <DetailRow label="Tool" value={entry.workTool} />
            <DetailRow label="Rate applied" value={formatMoney(entry.rateApplied)} />
            <DetailRow label="Amount" value={formatMoney(entry.amount)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DetailRow label="Activity" value={`${entry.activityPercent}%`} />
            <DetailRow label="Keyboard" value={entry.keyboardCount} />
            <DetailRow label="Mouse" value={entry.mouseCount} />
            <DetailRow label="Idle time" value={formatMinutes(Math.round(Number(entry.idleSeconds || 0) / 60))} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <DetailRow label="Occurred" value={formatDateTime(entry.occurredAt)} />
            <DetailRow label="Submitted" value={formatDateTime(entry.submittedAt)} />
            <DetailRow label="Reviewed" value={formatDateTime(entry.reviewedAt)} />
          </div>

          {entry.rejectionReason ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-red-700">Review note</p>
              <p className="mt-1 text-sm font-semibold text-red-800">{entry.rejectionReason}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}

export function MatterDetailPage() {
  const { matterId } = useParams();
  const [state, setState] = useState({ status: "loading", matter: null, assignments: [], rollup: null, timeEntries: [], message: "" });
  const [selectedTimeEntry, setSelectedTimeEntry] = useState(null);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    setSelectedTimeEntry(null);
    try {
      const [matterResponse, rollupResponse, assignmentsResponse, timeResponse] = await Promise.all([
        mattersApi.get(matterId),
        mattersApi.rollup(matterId),
        caseAssignmentsApi.list({ caseId: matterId }),
        mattersApi.timeEntries(matterId, { limit: 5 }),
      ]);
      setState({
        status: "ready",
        matter: normalizeMatter(unwrap(matterResponse)),
        rollup: unwrap(rollupResponse),
        assignments: asList(assignmentsResponse).map(normalizeAssignment),
        timeEntries: asList(timeResponse).map(normalizeTimeEntry),
        message: "",
      });
    } catch (error) {
      setState({ status: "error", matter: null, assignments: [], rollup: null, timeEntries: [], message: error?.userMessage || "We could not load this matter right now." });
    }
  }

  useEffect(() => {
    load();
  }, [matterId]);

  if (state.status === "loading") return <div className="grid gap-4 lg:grid-cols-2"><SkeletonBlock /><SkeletonBlock /></div>;
  if (state.status === "error") return <StateCard state="error" title="Matter needs attention" message={state.message} actionLabel="Retry" />;

  const matter = state.matter;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Matter Overview</p>
            <h1 className="mt-1 break-words text-2xl font-bold text-primary md:text-3xl">{matter.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge tone={matter.status === "open" ? "success" : "neutral"}>{matter.status}</StatusBadge>
              <StatusBadge>{matter.billingType}</StatusBadge>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{matter.description || "No description has been added yet."}</p>
            <p className="mt-2 text-sm font-semibold text-muted">Client: {matter.client}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/matters/${matter.id}/team`}>
              <Users className="h-4 w-4" />
              Team
            </Link>
            <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryStrong" to={`/app/matters/${matter.id}/edit`}>
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </div>
        </div>
      </section>

      <MatterRollupTiles rollup={state.rollup} />

      <section className="surface-card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink">Team assignments</h2>
          <Link className="text-sm font-semibold text-primary hover:underline" to={`/app/matters/${matter.id}/team`}>Manage team</Link>
        </div>
        <AssignmentList assignments={state.assignments} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.75fr)]">
        <TimeEntryList entries={state.timeEntries} onSelect={setSelectedTimeEntry} selectedId={selectedTimeEntry?.id} />
        <div className="min-w-0">
          {selectedTimeEntry ? (
            <TimeEntryDetail entry={selectedTimeEntry} onClose={() => setSelectedTimeEntry(null)} />
          ) : (
            <Card className="h-full">
              <CardBody className="flex h-full min-h-[220px] items-center justify-center text-center">
                <div>
                  <Clock3 className="mx-auto h-8 w-8 text-muted" />
                  <h2 className="mt-3 text-base font-bold text-primary">Select a time entry</h2>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-muted">Open an entry to review manpower, effort, activity, billable value, and review status.</p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={load} type="button" variant="secondary">Refresh matter</Button>
      </div>
    </div>
  );
}
