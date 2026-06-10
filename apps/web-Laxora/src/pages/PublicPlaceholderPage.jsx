import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";

export function PublicPlaceholderPage({ title }) {
  return (
    <section className="surface-card p-6 text-center">
      <h2 className="text-xl font-semibold text-primary">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
        This access screen is reserved for the dedicated auth branch.
      </p>
      <Button as="span" className="mt-5" type="button">
        <Link to="/login">Back to sign in</Link>
      </Button>
    </section>
  );
}
