import { Link } from "react-router-dom";
import { StateCard } from "../components/common/StateCard";

export function PermissionDeniedPage() {
  return (
    <div className="space-y-6">
      <StateCard
        state="permission"
        title="This area needs a different role"
        message="Your current access does not include this workspace area. Ask your firm administrator if your role should be updated."
      />
      <Link
        className="focus-ring inline-flex items-center justify-center rounded-lg border border-border bg-panel px-4 py-2 text-sm font-semibold text-primary transition hover:bg-blueSoft"
        to="/app/dashboard"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
