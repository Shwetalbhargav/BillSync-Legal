import { CheckCircle2, Lock, Mail, Phone, UserRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/common/Button";

const initialForm = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  practiceName: "",
  address: "",
  qualifications: "",
};

function cleanMobile(value) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function validateInvite(form) {
  if (!form.name.trim()) return "Enter your full name.";
  if (!form.email.trim()) return "Enter your work email.";
  if (form.mobile.length !== 10) return "Enter your 10 digit mobile number.";
  if (form.password.length < 8) return "Choose a password with at least 8 characters.";
  if (!form.practiceName.trim()) return "Enter your practice name.";
  return "";
}

export function RegisterInvitePage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const { register } = useAuth();

  function updateField(field, value) {
    setError("");
    setForm((current) => ({ ...current, [field]: field === "mobile" ? cleanMobile(value) : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationMessage = validateInvite(form);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim(), practiceName: form.practiceName.trim() });
      setIsAccepted(true);
    } catch (submitError) {
      setError(submitError?.userMessage || "We could not accept the invite right now. Please check the details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAccepted) {
    return (
      <section className="surface-card p-6">
        <div className="rounded-lg bg-success/10 p-3 text-success">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-ink">Workspace created</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Your solo practice workspace is ready. Sign in with the same details to continue onboarding.</p>
        <Link
          className="focus-ring mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primaryStrong"
          to="/app/setup-status"
        >
          Continue onboarding
        </Link>
      </section>
    );
  }

  return (
    <section className="surface-card p-6">
      <header className="mb-6">
        <h2 className="text-xl font-semibold text-ink">Create your workspace</h2>
        <p className="mt-1 text-sm text-muted">Start as the Owner of a solo or small-firm workspace.</p>
      </header>

      {error ? (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm font-semibold text-danger">
          {error}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
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
            <input className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3" onChange={(event) => updateField("email", event.target.value)} placeholder="name@firm.com" type="email" value={form.email} />
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
          Practice name
          <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => updateField("practiceName", event.target.value)} placeholder="Shah Legal Practice" value={form.practiceName} />
        </label>
        <Button className="w-full" isLoading={isSubmitting} type="submit">
          Create workspace
        </Button>
      </form>
      <footer className="mt-6 border-t border-border pt-4 text-center text-sm text-muted">
        Already registered?{" "}
        <Link className="font-semibold text-primary" to="/login">
          Sign in
        </Link>
      </footer>
    </section>
  );
}
