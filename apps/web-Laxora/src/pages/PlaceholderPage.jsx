import { Link } from "react-router-dom";
import { StateCard } from "../components/common/StateCard";
import { groupedRoutes } from "../routes/routeConfig";

const friendlyMessages = {
  Clients: "Client management will connect to firm records, contacts, matters, invoices, and payments.",
  Matters: "Matter screens will use the case records while keeping lawyer-friendly wording.",
  Tasks: "Task screens will support daily work, assignments, priorities, and status changes.",
  "Time Capture": "Work meter screens will preserve time and help submit clean billable records.",
  Capture: "Captured work screens will help review email, research, and activity records.",
  Billing: "Billing screens will prepare billables, rates, invoices, and approvals.",
  Finance: "Finance screens will show reports, payments, receivables, revenue, and KPI views.",
  Assistant: "The assistant will guide setup, work meter use, matter summaries, and billing preparation.",
  Extension: "Extension screens will guide setup, status checks, and recovery steps.",
  Admin: "Admin screens will manage users, roles, profiles, and firm operations.",
};

export function PlaceholderPage({ route }) {
  const Icon = route.icon;
  const groups = groupedRoutes();
  const siblings = groups[route.module] || [];

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row">
            <div className="shrink-0 rounded-lg bg-blueSoft p-3 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 break-words">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">{route.module}</p>
              <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{route.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                {friendlyMessages[route.module] || "This screen is planned and ready for branch implementation."}
              </p>
            </div>
          </div>
          <span className="w-fit max-w-full rounded-full border border-border bg-blueSoft px-3 py-1 text-xs font-semibold text-primary">
            {route.roleGroup || "Role aware"}
          </span>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <StateCard state="loading" title="Loading state" message="A calm progress state is reserved for this screen." />
        <StateCard state="empty" title="Empty state" message="A helpful empty state will explain the next useful action." />
        <StateCard state="error" title="Recovery state" message="If something fails, the screen will offer a clear retry path." />
      </div>

      <section className="surface-card p-6">
        <h2 className="text-base font-semibold text-ink">Screens in this module</h2>
        <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {siblings.map((item) => (
            <Link
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary transition hover:bg-blueSoft"
              key={item.path}
              to={item.path.replace(/:([A-Za-z]+)/g, "sample")}
            >
              {item.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
