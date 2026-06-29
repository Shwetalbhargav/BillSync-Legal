import { Bell, ChevronDown, LogOut, Search, Settings, Building2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

const defaultProfileImage = "/images/default-user.jpg";

function membershipOptionKey(membership, index) {
  return membership.id || membership._id || `${membership.workspaceId || "workspace"}-${membership.userId || "member"}-${index}`;
}

export function Header({ user, onLogout }) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [switchError, setSwitchError] = useState("");
  const { moduleNavigation, switchWorkspace, workspaceContext } = useAuth();
  const displayName = user?.name || "My profile";
  const activeWorkspace = workspaceContext?.workspace;
  const memberships = workspaceContext?.memberships || [];
  const quickModules = (moduleNavigation?.items || [])
    .filter((item) => !item.disabled && item.state !== "hidden")
    .slice(0, 3);
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const avatarUrl = user?.avatarUrl || user?.raw?.avatarUrl || user?.raw?.profilePhotoUrl || user?.raw?.photoUrl || user?.raw?.picture || user?.raw?.imageUrl || "";

  async function handleLogout() {
    setIsAccountOpen(false);
    await onLogout();
  }

  async function handleWorkspaceChange(event) {
    const workspaceId = event.target.value;
    if (!workspaceId || workspaceId === activeWorkspace?.id) return;
    setSwitchError("");
    try {
      await switchWorkspace(workspaceId);
    } catch (error) {
      setSwitchError(error?.userMessage || "Workspace could not be opened. Please try again.");
    }
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-16 min-w-0 items-center justify-between gap-3 border-b border-border bg-panel/95 px-4 backdrop-blur lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative hidden w-full max-w-md sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className="focus-ring w-full rounded-lg border border-border bg-blueSoft py-2 pl-10 pr-3 text-sm"
            aria-label="Search matters, clients, or tasks"
            placeholder="Search matters, clients, or tasks"
          />
        </div>
        {quickModules.length > 0 ? (
          <nav className="hidden min-w-0 items-center gap-1 xl:flex" aria-label="Workspace shortcuts">
            {quickModules.map((item) => (
              <Link
                key={item.path}
                className="focus-ring max-w-28 truncate rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-blueSoft hover:text-primary"
                to={item.path}
              >
                {item.experimental ? "Preview" : item.readOnly ? `${item.label} read-only` : item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
      <div className="flex flex-1 items-center justify-between gap-3 sm:flex-none sm:justify-end">
        <div className="hidden min-w-0 items-center gap-2 md:flex">
          <Building2 className="h-4 w-4 shrink-0 text-muted" />
          {memberships.length > 1 ? (
            <select
              aria-label="Switch workspace"
              className="focus-ring min-h-10 max-w-56 rounded-lg border border-border bg-panel px-3 py-2 text-sm font-semibold text-ink"
              disabled={workspaceContext?.status === "loading"}
              onChange={handleWorkspaceChange}
              value={activeWorkspace?.id || ""}
            >
              {memberships.map((membership, index) => (
                <option key={membershipOptionKey(membership, index)} value={membership.workspaceId}>
                  {membership.workspace?.name || "Workspace"}
                </option>
              ))}
            </select>
          ) : (
            <span className="max-w-56 truncate text-sm font-semibold text-ink">{activeWorkspace?.name || "Workspace"}</span>
          )}
        </div>
        <Link className="focus-ring flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-muted hover:bg-blueSoft hover:text-primary sm:hidden" to="/app/search" aria-label="Search workspace">
          <Search className="h-5 w-5" />
        </Link>
        <button className="focus-ring min-h-11 min-w-11 rounded-lg p-2 text-muted hover:bg-blueSoft hover:text-primary" type="button" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <div className="relative">
          <button
            aria-expanded={isAccountOpen}
            aria-haspopup="menu"
            aria-label="Open account menu"
            className="focus-ring flex min-h-11 items-center gap-2 rounded-full p-1 text-muted hover:bg-blueSoft hover:text-primary"
            onClick={() => setIsAccountOpen((current) => !current)}
            type="button"
          >
            <span className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-blueSoft text-sm font-bold text-primary">
              {avatarUrl ? (
                <img
                  alt={displayName}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    if (event.currentTarget.src.endsWith(defaultProfileImage)) return;
                    event.currentTarget.src = defaultProfileImage;
                  }}
                  src={avatarUrl}
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">{initials || "U"}</span>
              )}
            </span>
            <ChevronDown className="hidden h-4 w-4 sm:block" />
          </button>
          {isAccountOpen ? (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-panel p-2 shadow-soft" role="menu">
              <div className="border-b border-border px-3 py-2 md:hidden">
                <p className="text-xs font-semibold uppercase text-muted">Workspace</p>
                {memberships.length > 1 ? (
                  <select
                    aria-label="Switch workspace"
                    className="focus-ring mt-2 w-full rounded-lg border border-border bg-panel px-2 py-2 text-sm font-semibold text-ink"
                    disabled={workspaceContext?.status === "loading"}
                    onChange={handleWorkspaceChange}
                    value={activeWorkspace?.id || ""}
                  >
                    {memberships.map((membership, index) => (
                      <option key={membershipOptionKey(membership, index)} value={membership.workspaceId}>
                        {membership.workspace?.name || "Workspace"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 truncate text-sm font-semibold text-ink">{activeWorkspace?.name || "Workspace"}</p>
                )}
              </div>
              <button className="flex w-full min-w-0 items-center rounded-lg px-3 py-2 text-left text-sm font-semibold text-ink" role="menuitem" type="button">
                <span className="truncate">{displayName}</span>
              </button>
              <Link className="focus-ring flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-blueSoft hover:text-primary" onClick={() => setIsAccountOpen(false)} role="menuitem" to="/app/profile">
                <Settings className="h-4 w-4" />
                Profile setting
              </Link>
              <button className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-muted hover:bg-blueSoft hover:text-primary" onClick={handleLogout} role="menuitem" type="button">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
              {switchError ? <p className="px-3 py-2 text-xs font-semibold text-danger">{switchError}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
