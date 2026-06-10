import { Lock, Phone, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";

export function LoginPage() {
  return (
    <section className="surface-card p-6">
      <header className="mb-6">
        <h2 className="text-xl font-semibold text-ink">Welcome back</h2>
        <p className="mt-1 text-sm text-muted">Enter your firm details to open your workspace.</p>
      </header>
      <form className="space-y-4">
        <label className="block text-sm font-semibold text-ink">
          Name
          <span className="relative mt-1 block">
            <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3" placeholder="Your full name" />
          </span>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Mobile
          <span className="relative mt-1 block">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3" placeholder="Registered mobile number" />
          </span>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Password
          <span className="relative mt-1 block">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3" placeholder="Password" type="password" />
          </span>
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-ink">
            Role
            <select className="focus-ring mt-1 w-full rounded-lg border border-border py-3 pl-3 pr-8">
              <option>lawyer</option>
              <option>partner</option>
              <option>associate</option>
              <option>intern</option>
              <option>admin</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Firm
            <input className="focus-ring mt-1 w-full rounded-lg border border-border py-3 px-3" placeholder="Firm ID" />
          </label>
        </div>
        <Button className="w-full" type="button">
          Sign In to Dashboard
        </Button>
      </form>
      <footer className="mt-6 border-t border-border pt-4 text-center text-sm text-muted">
        First time here? <Link className="font-semibold text-primary" to="/register">Accept invite</Link>
      </footer>
    </section>
  );
}
