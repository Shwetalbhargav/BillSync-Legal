import { Link } from "react-router-dom";
import { FallbackStatePanel } from "../components/fallback/FallbackStatePanel";
import { getFallbackState } from "../constants/fallbackStates";
import { fallbackRoutes } from "../routes/routeConfig";

function relatedStates(currentPath) {
  return fallbackRoutes.filter((item) => item.path !== currentPath).slice(0, 5);
}

export function FallbackStatePage({ route }) {
  const Icon = route.icon;
  const state = getFallbackState(route.path);
  const related = relatedStates(route.path);

  return (
    <main className="min-h-screen bg-app px-4 py-6 md:px-8">
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row">
            <div className="shrink-0 rounded-lg bg-blueSoft p-3 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 break-words">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">{route.module}</p>
              <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{state.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Use this shared state wherever the product needs calm guidance and a clear next step.
              </p>
            </div>
          </div>
          <Link
            className="focus-ring inline-flex w-fit items-center justify-center rounded-lg border border-border bg-panel px-4 py-2 text-sm font-semibold text-primary transition hover:bg-blueSoft"
            to="/fallback-gallery"
          >
            View gallery
          </Link>
        </div>
      </section>

      <FallbackStatePanel icon={Icon} state={state} />

      <section className="surface-card p-6">
        <h2 className="text-base font-semibold text-ink">Related states</h2>
        <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <Link
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary transition hover:bg-blueSoft"
              key={item.path}
              to={item.path}
            >
              {item.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
    </main>
  );
}
