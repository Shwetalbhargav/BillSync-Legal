import { Edit, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { caseAssignmentsApi } from "../../api/caseAssignments";
import { mattersApi } from "../../api/matters";
import { asList, normalizeAssignment, normalizeMatter } from "../../api/normalizers";
import { Button, SkeletonBlock, StateCard, StatusBadge } from "../../components/common";
import { AssignmentList, MatterRelatedList, MatterRollupTiles } from "../../components/matters/MatterWidgets";

function unwrap(response) {
  return response?.data || response;
}

export function MatterDetailPage() {
  const { matterId } = useParams();
  const [state, setState] = useState({ status: "loading", matter: null, assignments: [], rollup: null, timeEntries: [], message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
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
        timeEntries: asList(timeResponse),
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

      <MatterRelatedList emptyText="No time entries are linked to this matter yet." items={state.timeEntries} title="Recent time entries" />

      <div className="flex justify-end">
        <Button onClick={load} type="button" variant="secondary">Refresh matter</Button>
      </div>
    </div>
  );
}
