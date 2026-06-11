import { Link } from "react-router-dom";
import { StateCard } from "../components/common/StateCard";

export function PasswordHelpPage({ mode = "forgot" }) {
  const isReset = mode === "reset";
  return (
    <div className="space-y-4">
      <header className="surface-card p-6">
        <h2 className="text-xl font-semibold text-ink">{isReset ? "Reset password" : "Password help"}</h2>
        <p className="mt-1 text-sm text-muted">We will help you get back into your workspace without exposing private account details.</p>
      </header>
      <StateCard
        state="permission"
        title={isReset ? "Reset link is not ready yet" : "Password help is not ready yet"}
        message="Ask your firm administrator to update your access for now. This page is reserved for the self-service flow."
      />
      <Link
        className="focus-ring mt-6 inline-flex w-full items-center justify-center rounded-lg border border-border bg-panel px-4 py-2 text-sm font-semibold text-primary transition hover:bg-blueSoft"
        to="/login"
      >
        Back to sign in
      </Link>
    </div>
  );
}
