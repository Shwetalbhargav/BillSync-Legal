import { CheckCircle2, Lock, Mail, Phone, Plus, Send, UserRound, Users } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { workspaceMembershipApi, planOptions, workspaceRoles } from "../api/workspaceMembership";
import { useAuth } from "../auth/AuthProvider";
import { Button, StateCard } from "../components/common";

const initialForm = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  workspaceName: "",
  planKey: "small_workspace",
};

const initialInvite = { email: "", role: "lawyer" };

function cleanMobile(value) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function validateWorkspaceForm(form) {
  if (!form.name.trim()) return "Enter your full name.";
  if (!form.email.trim()) return "Enter your work email.";
  if (form.mobile.length !== 10) return "Enter your 10 digit mobile number.";
  if (form.password.length < 8) return "Choose a password with at least 8 characters.";
  if (!form.workspaceName.trim()) return "Enter a workspace name.";
  return "";
}

function inviteLink(inviteCode) {
  return inviteCode ? `${window.location.origin}/invite/accept?invite=${encodeURIComponent(inviteCode)}` : "";
}

export function RegisterInvitePage() {
  const [form, setForm] = useState(initialForm);
  const [invite, setInvite] = useState(initialInvite);
  const [invites, setInvites] = useState([]);
  const [state, setState] = useState({ status: "form", message: "" });
  const [error, setError] = useState("");
  const { register, workspace } = useAuth();
  const navigate = useNavigate();

  function updateField(field, value) {
    setError("");
    setForm((current) => ({ ...current, [field]: field === "mobile" ? cleanMobile(value) : value }));
  }

  async function handleCreateWorkspace(event) {
    event.preventDefault();
    const validationMessage = validateWorkspaceForm(form);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setState({ status: "creating", message: "" });
    try {
      await register({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        workspaceName: form.workspaceName.trim(),
      });
      setState({ status: "owner-created", message: "" });
    } catch (submitError) {
      setState({ status: "form", message: "" });
      setError(submitError?.userMessage || submitError?.message || "We could not create the workspace right now. Please check the details and try again.");
    }
  }

  async function sendInvite(event) {
    event.preventDefault();
    if (!invite.email.trim()) {
      setError("Enter a member email address.");
      return;
    }
    setError("");
    setState((current) => ({ ...current, message: "Sending invite..." }));
    try {
      const created = await workspaceMembershipApi.invite({ email: invite.email.trim(), role: invite.role });
      setInvites((current) => [...current, created]);
      setInvite(initialInvite);
      setState((current) => ({ ...current, message: "Invite ready." }));
    } catch (submitError) {
      setState((current) => ({ ...current, message: "" }));
      setError(submitError?.userMessage || "The invite could not be created. Check the email and role, then try again.");
    }
  }

  if (state.status === "creating") {
    return <StateCard state="loading" title="Creating workspace" message="Your account, workspace, plan, and Owner access are being prepared." />;
  }

  if (state.status === "owner-created") {
    return (
      <section className="surface-card p-6">
        <div className="rounded-lg bg-success/10 p-3 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-ink">Owner access is ready</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          {workspace?.name || form.workspaceName} is ready. Invite teammates now, or continue setup and add them later.
        </p>

        {error ? <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</div> : null}
        {state.message ? <p className="mt-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm font-semibold text-success">{state.message}</p> : null}

        <form className="mt-6 grid gap-3 md:grid-cols-[1fr_180px_auto]" onSubmit={sendInvite}>
          <label className="block text-sm font-semibold text-ink">
            Member email
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => setInvite((current) => ({ ...current, email: event.target.value }))} placeholder="member@example.com" type="email" value={invite.email} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Role
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => setInvite((current) => ({ ...current, role: event.target.value }))} value={invite.role}>
              {workspaceRoles.filter((role) => role.value !== "owner").map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
          </label>
          <Button className="self-end" type="submit">
            <Send className="h-4 w-4" />
            Invite
          </Button>
        </form>

        {invites.length ? (
          <div className="mt-5 space-y-3">
            {invites.map((item) => (
              <div className="rounded-lg border border-border bg-white p-3" key={item.id || item.email}>
                <p className="text-sm font-semibold text-ink">{item.email}</p>
                <p className="mt-1 text-xs font-semibold uppercase text-muted">{workspaceRoles.find((role) => role.value === item.role)?.label || item.role}</p>
                {item.inviteCode ? <p className="mt-2 break-all text-xs text-muted">{inviteLink(item.inviteCode)}</p> : <p className="mt-2 text-xs text-muted">Invite link is hidden in this environment.</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-border bg-blueSoft p-4">
            <p className="text-sm font-semibold text-ink">No members invited yet</p>
            <p className="mt-1 text-sm leading-6 text-muted">Invite links will appear here while email delivery is not connected.</p>
          </div>
        )}

        <Button className="mt-6 w-full" onClick={() => navigate("/app/setup-status")} type="button">
          Continue setup
        </Button>
      </section>
    );
  }

  return (
    <section className="surface-card p-6">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Workspace onboarding</p>
        <h2 className="mt-1 text-xl font-semibold text-ink">Create your workspace</h2>
        <p className="mt-1 text-sm text-muted">Create an Owner account, choose a plan, then invite your team.</p>
      </header>

      {error ? <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</div> : null}

      <form className="space-y-4" onSubmit={handleCreateWorkspace}>
        <label className="block text-sm font-semibold text-ink">
          Name
          <span className="relative mt-1 block">
            <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3" onChange={(event) => updateField("name", event.target.value)} placeholder="Your full name" value={form.name} />
          </span>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Work email
          <span className="relative mt-1 block">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3" onChange={(event) => updateField("email", event.target.value)} placeholder="name@example.com" type="email" value={form.email} />
          </span>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Mobile
          <span className="relative mt-1 block">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3" inputMode="numeric" onChange={(event) => updateField("mobile", event.target.value)} placeholder="Registered mobile number" value={form.mobile} />
          </span>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Password
          <span className="relative mt-1 block">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3" onChange={(event) => updateField("password", event.target.value)} placeholder="Create password" type="password" value={form.password} />
          </span>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Workspace name
          <span className="relative mt-1 block">
            <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3" onChange={(event) => updateField("workspaceName", event.target.value)} placeholder="Shah Legal Workspace" value={form.workspaceName} />
          </span>
        </label>

        <div>
          <p className="text-sm font-semibold text-ink">Plan</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {planOptions.map((plan) => (
              <label className="rounded-lg border border-border bg-white p-4" key={plan.key}>
                <input className="mr-2" checked={form.planKey === plan.key} onChange={() => updateField("planKey", plan.key)} type="radio" />
                <span className="text-sm font-semibold text-ink">{plan.name}</span>
                <p className="mt-1 text-sm leading-6 text-muted">{plan.summary}</p>
              </label>
            ))}
          </div>
        </div>

        <Button className="w-full" type="submit">
          <Plus className="h-4 w-4" />
          Create workspace
        </Button>
      </form>
      <footer className="mt-6 border-t border-border pt-4 text-center text-sm text-muted">
        Already registered? <Link className="font-semibold text-primary" to="/login">Sign in</Link>
      </footer>
    </section>
  );
}
