import clsx from "clsx";
import { NavLink } from "react-router-dom";
import { Menu, Scale } from "lucide-react";
import { canAccess } from "../../constants/permissions";
import { navigationItems } from "../../routes/routeConfig";

export function Sidebar({ collapsed = false, onToggleSidebar, role }) {
  const items = navigationItems.filter((item) => canAccess(role, item.moduleKey));

  return (
    <aside className={clsx("fixed inset-y-0 left-0 z-40 hidden flex-col bg-nav px-3 py-6 text-white transition-all duration-200 lg:flex", collapsed ? "w-20" : "w-64")}>
      <div className={clsx("mb-8 flex items-center gap-3 px-3", collapsed && "flex-col px-0")}>
        <div className={clsx("flex min-w-0 items-center gap-3", collapsed && "justify-center")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-accent">
            <Scale className="h-5 w-5" />
          </div>
          <div className={collapsed ? "sr-only" : ""}>
            <p className="font-bold leading-5">BillSync Legal</p>
            <p className="text-xs text-[#B5C7EA]">Workspace Management</p>
          </div>
        </div>
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="focus-ring ml-auto flex min-h-10 min-w-10 items-center justify-center rounded-lg p-2 text-[#B5C7EA] transition hover:bg-white/10 hover:text-white"
          onClick={onToggleSidebar}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto" aria-label="Primary navigation">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                clsx(
                  "focus-ring flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                  collapsed && "justify-center px-2",
                  isActive ? "bg-white/10 text-white ring-1 ring-accent/50" : "text-[#B5C7EA] hover:bg-white/10 hover:text-white",
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
