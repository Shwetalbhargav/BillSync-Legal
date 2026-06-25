import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { useAuth } from "../auth/AuthProvider";

const initialForm = {
  name: "",
  mobile: "",
  password: "",
};

function cleanMobile(value) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function validateForm(form) {
  if (!form.name.trim()) return "Enter your full name.";
  if (form.mobile.length !== 10) return "Enter the 10 digit mobile number registered with your account.";
  if (!form.password) return "Enter your password.";
  return "";
}

export function LoginPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
      await login({ ...form, name: form.name.trim() });
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
        <h2 className="text-xl font-semibold text-ink">Welcome !!</h2>
        <p className="mt-1 text-sm text-muted">Enter your details to open your workspace.</p>
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
            <input
              className="focus-ring w-full rounded-lg border border-border px-3 py-3"
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Your full name"
              value={form.name}
            />
          </span>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Mobile
          <span className="relative mt-1 block">
            <input
              className="focus-ring w-full rounded-lg border border-border px-3 py-3"
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
            <input
              className="focus-ring w-full rounded-lg border border-border py-3 pl-3 pr-12"
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Password"
              type={isPasswordVisible ? "text" : "password"}
              value={form.password}
            />
            <button
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              className="focus-ring absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-blueSoft hover:text-primary"
              onClick={() => setIsPasswordVisible((current) => !current)}
              type="button"
            >
              {isPasswordVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </span>
        </label>
        <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link className="font-semibold text-primary" to="/forgot-password">
            Need help signing in?
          </Link>
          <Link className="font-semibold text-primary" to="/register">
            Create workspace
          </Link>
        </div>
        <Button className="w-full" isLoading={isSubmitting} type="submit">
          Sign in to workspace
        </Button>
      </form>
    </section>
  );
}
