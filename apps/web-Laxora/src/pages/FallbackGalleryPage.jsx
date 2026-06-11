import { Link } from "react-router-dom";
import { FallbackStatePanel } from "../components/fallback/FallbackStatePanel";
import { fallbackStateCatalog } from "../constants/fallbackStates";
import { fallbackRoutes } from "../routes/routeConfig";

const routeByPath = fallbackRoutes.reduce((routes, route) => {
  routes[route.path] = route;
  return routes;
}, {});

const groups = fallbackStateCatalog.reduce((items, state) => {
  items[state.group] = items[state.group] || [];
  items[state.group].push(state);
  return items;
}, {});

export function FallbackGalleryPage() {
  return (
    <main className="min-h-screen bg-app px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="surface-card p-6">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">Fallback Suite</p>
              <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Reusable State Gallery</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                Shared recovery states for loading, empty, offline, permission, unavailable, payment, upload, sync, extension, and assistant moments.
              </p>
            </div>
            <span className="w-fit rounded-full border border-border bg-blueSoft px-3 py-1 text-xs font-bold text-primary">
              {fallbackStateCatalog.length} states
            </span>
          </div>
        </section>

        {Object.entries(groups).map(([group, states]) => (
          <section className="space-y-3" key={group}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-ink">{group}</h2>
              <span className="text-xs font-semibold text-muted">
                {states.length} state{states.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid min-w-0 gap-4 xl:grid-cols-2">
              {states.map((state) => (
                <div className="min-w-0 space-y-2" key={state.id}>
                  <FallbackStatePanel actionMode="buttons" icon={routeByPath[state.path]?.icon} state={state} />
                  <Link className="inline-flex text-sm font-semibold text-primary hover:underline" to={state.path}>
                    Open full state
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
