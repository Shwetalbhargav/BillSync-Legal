import { StateCard } from "../components/common/StateCard";

function stateForTitle(title) {
  if (/loading|progress|thinking/i.test(title)) return "loading";
  if (/failed|attention|offline|unavailable/i.test(title)) return "error";
  if (/permission|session/i.test(title)) return "permission";
  if (/connected|ready|submitted|accepted|reset/i.test(title)) return "success";
  return "empty";
}

export function FallbackStatePage({ route }) {
  const Icon = route.icon;
  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row">
          <div className="shrink-0 rounded-lg bg-blueSoft p-3 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 break-words">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">{route.module}</p>
            <h1 className="mt-1 text-2xl font-bold text-primary">{route.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              This shared state keeps the product clear, calm, and useful when the expected content is not ready.
            </p>
          </div>
        </div>
      </section>
      <StateCard
        state={stateForTitle(route.title)}
        title={route.title}
        message="The exact wording will be finalized with the screen branch and tested with non-technical users."
      />
    </div>
  );
}
