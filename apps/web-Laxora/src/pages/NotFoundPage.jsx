import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";
import { StateCard } from "../components/common/StateCard";

export function NotFoundPage() {
  return (
    <div className="space-y-4">
      <StateCard state="empty" title="Page not found" message="That workspace area is not available from this link." />
      <Button type="button">
        <Link to="/app/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  );
}
