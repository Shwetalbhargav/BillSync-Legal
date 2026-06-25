import { Send, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { workspaceMembershipApi, workspaceRoles } from "../../api/workspaceMembership";
import { useAuth } from "../../auth/AuthProvider";
import { Button, DataTable, StateCard, StatusBadge } from "../../components/common";

const initialInvite = { email: "", role: "lawyer" };

function roleLabel(role) {
  return workspaceRoles.find((item) => item.value === role)?.label || role || "Member";
}

export function WorkspaceMembersPage() {
  const { role, workspace } = useAuth();
  const [state, setState] = useState({ status: "loading", members: [], message: "" });
  const [invite, setInvite] = useState(initialInvite);
  const [notice, setNotice] = useState(null);
  const isOwner = role === "owner";

  async function loadMembers() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const members = await workspaceMembershipApi.members();
      setState({ status: "ready", members, message: "" });
    } catch (error) {
      setState({ status: "error", members: [], message: error?.userMessage || "Members could not be loaded." });
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function sendInvite(event) {
    event.preventDefault();
    setNotice(null);
    if (!isOwner) {
      setNotice({ tone: "danger", message: "Only Owners can invite workspace members." });
      return;
    }
    if (!invite.email.trim()) {
      setNotice({ tone: "warning", message: "Enter a member email address." });
      return;
    }

    try {
      const created = await workspaceMembershipApi.invite({ email: invite.email.trim(), role: invite.role });
      setInvite(initialInvite);
      setNotice({
        tone: "success",
        message: created.inviteCode
          ? `${created.email} can join with ${window.location.origin}/invite/accept?invite=${created.inviteCode}`
          : `${created.email} has been invited.`,
      });
      await loadMembers();
    } catch (error) {
      setNotice({ tone: "danger", message: error?.userMessage || "Invite could not be sent. Check the email and role, then try again." });
    }
  }

  if (!isOwner) {
    return <StateCard state="permission" title="Owner access needed" message="Ask a workspace Owner to manage invitations and roles." />;
  }

  if (state.status === "loading") {
    return <StateCard state="loading" title="Loading members" message="Workspace membership is being loaded." />;
  }

  if (state.status === "error") {
    return <StateCard state="error" title="Members could not load" message={state.message} onAction={loadMembers} />;
  }

  const rows = state.members.map((member) => ({
    id: member.id,
    name: member.user?.name || "Invited member",
    email: member.user?.email || "Email not available",
    role: roleLabel(member.role),
    status: member.status,
  }));

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Workspace</p>
            <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Members</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Invite teammates to {workspace?.name || "this workspace"} and assign the role they need for shared work.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-blueSoft p-3 text-sm font-semibold text-ink">
            <Users className="mr-2 inline h-4 w-4" />
            {rows.length} active or invited
          </div>
        </div>

        <form className="mt-6 grid gap-3 md:grid-cols-[1fr_200px_auto]" onSubmit={sendInvite}>
          <label className="block text-sm font-semibold text-ink">
            Email
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))} placeholder="member@example.com" type="email" value={invite.email} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Role
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => setInvite((current) => ({ ...current, role: event.target.value }))} value={invite.role}>
              {workspaceRoles.filter((item) => item.value !== "owner").map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <Button className="self-end" type="submit">
            <Send className="h-4 w-4" />
            Invite
          </Button>
        </form>

        {notice ? (
          <p className={`mt-4 rounded-lg border p-3 text-sm font-semibold ${notice.tone === "success" ? "border-success/30 bg-success/10 text-success" : notice.tone === "warning" ? "border-warning/30 bg-warning/10 text-warning" : "border-danger/30 bg-danger/10 text-danger"}`}>
            {notice.message}
          </p>
        ) : null}
      </section>

      {rows.length ? (
        <DataTable
          columns={[
            { key: "name", label: "Member" },
            { key: "email", label: "Email" },
            { key: "role", label: "Role" },
            { key: "status", label: "Status" },
          ]}
          rows={rows.map((row) => ({ ...row, status: <StatusBadge>{row.status}</StatusBadge> }))}
        />
      ) : (
        <StateCard state="empty" title="No members yet" message="Invite your first teammate when you are ready to share the workspace." />
      )}

      <StateCard state="empty" title="Role editing is coming next" message="Invite creation is connected. Inline role changes and removal controls are intentionally held for the next permission-hardening branch." />
    </div>
  );
}
