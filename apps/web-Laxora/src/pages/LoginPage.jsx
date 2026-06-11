import { Lock, Phone, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { useAuth } from "../auth/AuthProvider";

const initialForm = {
  name: "",
  mobile: "",
  password: "",
  role: "lawyer",
  firmId: "",
};

function cleanMobile(value) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function validateForm(form) {
  if (!form.name.trim()) return "Enter your full name.";
  if (form.mobile.length !== 10) return "Enter the 10 digit mobile number registered with your firm.";
  if (!form.password) return "Enter your password.";
  if (!form.firmId.trim()) return "Enter your firm code.";
  return "";
}

export function LoginPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || "/app/dashboard";

  function updateField(field, value) {
    setError("");
    setForm((current) => ({ ...current, [field]: field === "mobile" ? cleanMobile(value) : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationMessage = validateForm(form);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await login({ ...form, name: form.name.trim(), firmId: form.firmId.trim() });
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(submitError?.userMessage || submitError?.message || "We could not open your workspace. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="surface-card p-6">
      <header className="mb-6">
        <h2 className="text-xl font-semibold text-ink">Welcome back</h2>
        <p className="mt-1 text-sm text-muted">Enter your firm details to open your workspace.</p>
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
            <input
              className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3"
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Your full name"
              value={form.name}
            />
          </span>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Mobile
          <span className="relative mt-1 block">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3"
              inputMode="numeric"
              onChange={(event) => updateField("mobile", event.target.value)}
              placeholder="Registered mobile number"
              value={form.mobile}
            />
          </span>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Password
          <span className="relative mt-1 block">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3"
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Password"
              type="password"
              value={form.password}
            />
          </span>
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-ink">
            Role
            <select
              className="focus-ring mt-1 w-full rounded-lg border border-border py-3 pl-3 pr-8"
              onChange={(event) => updateField("role", event.target.value)}
              value={form.role}
            >
              <option value="lawyer">Lawyer</option>
              <option value="partner">Partner</option>
              <option value="associate">Associate</option>
              <option value="intern">Intern</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Firm code
            <input
              className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3"
              onChange={(event) => updateField("firmId", event.target.value)}
              placeholder="Firm code"
              value={form.firmId}
            />
          </label>
        </div>
        <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link className="font-semibold text-primary" to="/forgot-password">
            Need help signing in?
          </Link>
          <Link className="font-semibold text-primary" to="/register">
            Accept invite
          </Link>
        </div>
        <Button className="w-full" isLoading={isSubmitting} type="submit">
          Sign in to workspace
        </Button>
      </form>
    </section>
  );
}
