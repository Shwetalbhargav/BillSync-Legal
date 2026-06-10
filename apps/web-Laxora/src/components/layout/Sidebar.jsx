import clsx from "clsx";
import { NavLink } from "react-router-dom";
import { Scale } from "lucide-react";
import { canAccess } from "../../constants/permissions";
import { navigationItems } from "../../routes/routeConfig";

export function Sidebar({ role }) {
  const items = navigationItems.filter((item) => canAccess(role, item.moduleKey));

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-nav px-3 py-6 text-white lg:flex">
      <div className="mb-8 flex items-center gap-3 px-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-accent">
          <Scale className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold leading-5">BillSync Legal</p>
          <p className="text-xs text-[#B5C7EA]">Law Firm Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                  isActive ? "bg-white/10 text-white ring-1 ring-accent/50" : "text-[#B5C7EA] hover:bg-white/10 hover:text-white",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
