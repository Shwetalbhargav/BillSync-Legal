import { Bell, LogOut, Search, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../common/Button";
import { StatusBadge } from "../common/StatusBadge";

export function Header({ role, user, onLogout }) {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-panel/95 px-4 backdrop-blur lg:px-8">
      <div className="relative hidden w-full max-w-md sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          className="focus-ring w-full rounded-lg border border-border bg-blueSoft py-2 pl-10 pr-3 text-sm"
          placeholder="Search matters, clients, or tasks"
        />
      </div>
      <div className="flex flex-1 items-center justify-between gap-3 sm:flex-none sm:justify-end">
        <Link className="hidden min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-blueSoft md:flex" to="/app/profile">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blueSoft text-primary">
            <UserRound className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block max-w-40 truncate text-sm font-semibold text-ink">{user?.name || "My profile"}</span>
            <StatusBadge>{role}</StatusBadge>
          </span>
        </Link>
        <button className="focus-ring rounded-lg p-2 text-muted hover:bg-blueSoft hover:text-primary" type="button" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <Button onClick={onLogout} size="sm" type="button" variant="ghost">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
