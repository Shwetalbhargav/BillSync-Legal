import { Search } from "lucide-react";
import { useState } from "react";
import { dashboardApi } from "../api/dashboard";
import { Button, StateCard } from "../components/common";
import { SearchResultGroup } from "../components/dashboard/DashboardWidgets";

export function GlobalSearchPage() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ status: "idle", results: { matters: [], clients: [], tasks: [] } });

  async function handleSearch(event) {
    event.preventDefault();
    if (!query.trim()) {
      setState({ status: "empty", results: { matters: [], clients: [], tasks: [] } });
      return;
    }
    setState((current) => ({ ...current, status: "loading" }));
    try {
      const results = await dashboardApi.globalSearch(query);
      const hasResults = results.matters.length || results.clients.length || results.tasks.length;
      setState({ status: hasResults ? "ready" : "empty", results });
    } catch {
      setState({ status: "error", results: { matters: [], clients: [], tasks: [] } });
    }
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Workspace</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Global Search</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Find matters, clients, and tasks from one quiet search surface.</p>
        <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="focus-ring w-full rounded-lg border border-border bg-panel py-3 pl-10 pr-3" onChange={(event) => setQuery(event.target.value)} placeholder="Search by client, matter, or task" value={query} />
          </label>
          <Button isLoading={state.status === "loading"} type="submit">Search</Button>
        </form>
      </section>

      {state.status === "idle" ? <StateCard state="empty" title="Start with a search" message="Search results will appear here after you enter a term." /> : null}
      {state.status === "empty" ? <StateCard state="empty" title="No matching work found" message="Try a broader name, matter title, or task phrase." /> : null}
      {state.status === "error" ? <StateCard state="error" title="Search needs attention" message="We could not complete the search right now. Please try again." /> : null}
      {state.status === "ready" ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <SearchResultGroup emptyText="No matters matched." items={state.results.matters} title="Matters" />
          <SearchResultGroup emptyText="No clients matched." items={state.results.clients} title="Clients" />
          <SearchResultGroup emptyText="No tasks matched." items={state.results.tasks} title="Tasks" />
        </div>
      ) : null}
    </div>
  );
}
