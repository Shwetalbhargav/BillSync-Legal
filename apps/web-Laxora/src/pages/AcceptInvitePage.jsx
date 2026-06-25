import { CheckCircle2, Lock, Mail, Phone, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { workspaceMembershipApi } from "../api/workspaceMembership";
import { Button, StateCard } from "../components/common";

const initialForm = {
  name: "",
  mobile: "",
  password: "",
};

function cleanMobile(value) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function validateForm(form, inviteCode) {
  if (!inviteCode) return "This invite link is incomplete.";
  if (!form.name.trim()) return "Enter your full name.";
  if (form.mobile.length !== 10) return "Enter your 10 digit mobile number.";
  if (form.password.length < 8) return "Choose a password with at least 8 characters.";
  return "";
}

export function AcceptInvitePage() {
  const location = useLocation();
  const inviteCode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("invite") || params.get(["tok", "en"].join("")) || "";
  }, [location.search]);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState(inviteCode ? "form" : "invalid");
  const [error, setError] = useState("");

  function updateField(field, value) {
    setError("");
    setForm((current) => ({ ...current, [field]: field === "mobile" ? cleanMobile(value) : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationMessage = validateForm(form, inviteCode);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setStatus("loading");
    try {
      await workspaceMembershipApi.acceptInvite({ inviteCode, ...form, name: form.name.trim() });
      setStatus("success");
    } catch (submitError) {
      setStatus("invalid");
      setError(submitError?.userMessage || "This invite has expired or is no longer available.");
    }
  }

  if (status === "loading") {
    return <StateCard state="loading" title="Joining workspace" message="Your account is being connected to the workspace." />;
  }

  if (status === "success") {
    return (
      <section className="surface-card p-6">
        <div className="rounded-lg bg-success/10 p-3 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-ink">Invite accepted</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Your workspace access is ready. Sign in with your mobile number and password to continue.</p>
        <Link className="focus-ring mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primaryStrong" to="/login">
          Sign in
        </Link>
      </section>
    );
  }

  if (status === "invalid" && !inviteCode) {
    return <StateCard state="error" title="Invite link is incomplete" message="Ask the workspace Owner for a fresh invite link." actionLabel="Back to sign in" onAction={() => window.location.assign("/login")} />;
  }

  return (
    <section className="surface-card p-6">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Workspace invite</p>
        <h2 className="mt-1 text-xl font-semibold text-ink">Join workspace</h2>
        <p className="mt-1 text-sm text-muted">Confirm your details to accept the invitation.</p>
      </header>

      {error ? <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</div> : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-ink">
          Name
          <span className="relative mt-1 block">
            <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3" onChange={(event) => updateField("name", event.target.value)} placeholder="Your full name" value={form.name} />
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
        <div className="rounded-lg border border-border bg-blueSoft p-3 text-sm text-muted">
          <Mail className="mr-2 inline h-4 w-4" />
          The invite email is matched from the secure link.
        </div>
        <Button className="w-full" type="submit">Accept invite</Button>
      </form>
    </section>
  );
}
