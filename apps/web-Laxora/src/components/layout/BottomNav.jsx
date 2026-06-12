import clsx from "clsx";
import { NavLink } from "react-router-dom";
import { canAccess } from "../../constants/permissions";
import { navigationItems } from "../../routes/routeConfig";

export function BottomNav({ role }) {
  const items = navigationItems.filter((item) => canAccess(role, item.moduleKey)).slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-panel pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Mobile navigation">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                "focus-ring flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold",
                isActive ? "text-primary" : "text-muted",
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
