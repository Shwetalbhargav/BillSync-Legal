import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { caseAssignmentsApi } from "../../api/caseAssignments";
import { mattersApi } from "../../api/matters";
import { asList, normalizeAssignment, normalizeMatter, normalizeUser } from "../../api/normalizers";
import { usersApi } from "../../api/users";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import { AssignmentList } from "../../components/matters/MatterWidgets";
import { useMatterModuleAccess } from "./useMatterModuleAccess";

const initialForm = { caseId: "", userId: "", role: "associate", status: "active" };

export function MatterAssignmentsPage() {
  const { matterId } = useParams();
  const access = useMatterModuleAccess();
  const [state, setState] = useState({ status: "loading", assignments: [], users: [], matters: [], message: "" });
  const [form, setForm] = useState({ ...initialForm, caseId: matterId || "" });

  async function load() {
    if (access.unavailable || !access.canRead) {
      setState({ status: "permission", assignments: [], users: [], matters: [], message: access.message || "You do not have access to matter assignments." });
      return;
    }
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const [assignmentsResponse, usersResponse, mattersResponse] = await Promise.all([
        caseAssignmentsApi.list(matterId ? { caseId: matterId } : {}),
        usersApi.list({ limit: 100 }),
        mattersApi.list({ limit: 100 }),
      ]);
      const matters = asList(mattersResponse).map(normalizeMatter);
      setState({
        status: "ready",
        assignments: asList(assignmentsResponse).map(normalizeAssignment),
        users: asList(usersResponse).map(normalizeUser),
        matters,
        message: "",
      });
      if (!matterId && !form.caseId && matters[0]?.id) setForm((current) => ({ ...current, caseId: matters[0].id }));
    } catch (error) {
      setState({
        status: error?.status === 403 ? "permission" : "error",
        assignments: [],
        users: [],
        matters: [],
        message: error?.status === 403 ? "You do not have access to matter assignments." : (error?.userMessage || "We could not load matter assignments right now."),
      });
    }
  }

  useEffect(() => {
    load();
  }, [matterId, access.status, access.unavailable, access.canRead]);

  function updateField(field, value) {
    setState((current) => ({ ...current, message: "" }));
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleAssign(event) {
    event.preventDefault();
    if (access.readOnly || !access.canAssign) {
      setState((current) => ({ ...current, message: "You can review assignments, but changes are paused for this workspace." }));
      return;
    }
    if (!form.caseId) {
      setState((current) => ({ ...current, message: "Select a matter." }));
      return;
    }
    if (!form.userId) {
      setState((current) => ({ ...current, message: "Select a team member." }));
      return;
    }
    setState((current) => ({ ...current, status: "saving" }));
    try {
      await caseAssignmentsApi.create(form);
      setForm({ ...initialForm, caseId: matterId || form.caseId });
      await load();
    } catch (error) {
      setState((current) => ({ ...current, status: "ready", message: error?.status === 403 ? "You do not have access to change matter assignments." : (error?.userMessage || "We could not save this assignment right now.") }));
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "permission") return <StateCard state="permission" title="Matter assignments are not available" message={state.message} />;
  if (state.status === "error") return <StateCard state="error" title="Assignments need attention" message={state.message} />;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Matter Team</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Matter Assignments</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Assign team members to matters and keep staffing visible for daily work.</p>
      </section>

      {access.readOnly ? <StateCard state="permission" title="Matters are read-only" message={access.message} /> : null}

      {access.canAssign && !access.readOnly ? (
      <form className="surface-card grid gap-3 p-6 lg:grid-cols-[1fr_1fr_160px_140px_auto]" onSubmit={handleAssign}>
        {state.message ? <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning lg:col-span-5">{state.message}</div> : null}
        <select className="focus-ring rounded-lg border border-border px-3 py-3" disabled={Boolean(matterId)} onChange={(event) => updateField("caseId", event.target.value)} value={form.caseId}>
          <option value="">Select matter</option>
          {state.matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.title}</option>)}
        </select>
        <select className="focus-ring rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("userId", event.target.value)} value={form.userId}>
          <option value="">Select team member</option>
          {state.users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.role}</option>)}
        </select>
        <select className="focus-ring rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("role", event.target.value)} value={form.role}>
          <option value="partner">Partner</option>
          <option value="associate">Associate</option>
          <option value="admin">Admin</option>
          <option value="primary">Primary</option>
        </select>
        <select className="focus-ring rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("status", event.target.value)} value={form.status}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Button isLoading={state.status === "saving"} type="submit">
          <Plus className="h-4 w-4" />
          Assign
        </Button>
      </form>
      ) : null}

      {state.assignments.length ? <AssignmentList assignments={state.assignments} /> : <StateCard state="empty" title="No team assignments yet" message="Assignments will appear here after a team member is added to a matter." />}

      {matterId ? (
        <Link className="focus-ring inline-flex rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/matters/${matterId}`}>
          Back to matter
        </Link>
      ) : null}
    </div>
  );
}
