import clsx from "clsx";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { canAccess } from "../../constants/permissions";
import { navigationItems, withPinnedNavigationItems } from "../../routes/routeConfig";

export function BottomNav({ role }) {
  const { moduleNavigation } = useAuth();
  const hasDynamicItems = moduleNavigation.status === "ready" && moduleNavigation.items.length > 0;
  const fallbackItems = navigationItems.filter((item) => canAccess(role, item.moduleKey));
  const items = withPinnedNavigationItems(hasDynamicItems ? moduleNavigation.items : fallbackItems, role)
    .filter((item) => item.state !== "hidden")
    .slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-panel pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Mobile navigation">
      {items.map((item) => {
        const Icon = item.icon;
        if (item.disabled || item.state === "disabled") {
          return (
            <button
              key={item.path}
              aria-disabled="true"
              className="flex min-h-16 min-w-0 cursor-not-allowed flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold text-muted/60"
              title={item.reason || item.label}
              type="button"
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          );
        }
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
            <span className="max-w-full truncate">{item.experimental ? "Preview" : item.readOnly ? "Read-only" : item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
