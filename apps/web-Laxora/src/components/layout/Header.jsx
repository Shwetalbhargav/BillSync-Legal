import { Bell, Search } from "lucide-react";
import { RoleSwitcherForTesting } from "../rbac/RoleSwitcherForTesting";

export function Header({ role, onRoleChange }) {
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
        <RoleSwitcherForTesting role={role} onChange={onRoleChange} />
        <button className="focus-ring rounded-lg p-2 text-muted hover:bg-blueSoft hover:text-primary" type="button" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
