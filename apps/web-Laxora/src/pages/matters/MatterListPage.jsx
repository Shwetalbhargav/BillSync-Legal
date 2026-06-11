import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { mattersApi } from "../../api/matters";
import { asList, normalizeMatter } from "../../api/normalizers";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import { MatterCard } from "../../components/matters/MatterWidgets";

export function MatterListPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [status, setStatus] = useState("loading");
  const [matters, setMatters] = useState([]);
  const [message, setMessage] = useState("");

  async function load(params = { q: query, status: statusFilter }) {
    setStatus("loading");
    setMessage("");
    try {
      const response = await mattersApi.list({ q: params.q, status: params.status, limit: 25 });
      const normalized = asList(response).map(normalizeMatter);
      setMatters(normalized);
      setStatus(normalized.length ? "ready" : "empty");
    } catch (error) {
      setMatters([]);
      setStatus("error");
      setMessage(error?.userMessage || "We could not load matters right now. Please try again.");
    }
  }

  useEffect(() => {
    load({ q: "", status: "" });
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    load();
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Matters</p>
            <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Matter List</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Review active matters, clients, billing type, and team readiness.</p>
          </div>
          <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryStrong" to="/app/matters/new">
            <Plus className="h-4 w-4" />
            New matter
          </Link>
        </div>
        <form className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_auto]" onSubmit={handleSubmit}>
          <label className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3" onChange={(event) => setQuery(event.target.value)} placeholder="Search matters" value={query} />
          </label>
          <select className="focus-ring rounded-lg border border-border px-3 py-3" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
          <Button isLoading={status === "loading"} type="submit">Search</Button>
        </form>
      </section>

      {status === "loading" ? <div className="grid gap-4 xl:grid-cols-2"><SkeletonBlock /><SkeletonBlock /></div> : null}
      {status === "error" ? <StateCard state="error" title="Matter list needs attention" message={message} actionLabel="Retry" /> : null}
      {status === "empty" ? <StateCard state="empty" title="No matters found" message="Create a matter or try a broader search term." /> : null}
      {status === "ready" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {matters.map((matter) => <MatterCard matter={matter} key={matter.id} />)}
        </div>
      ) : null}
    </div>
  );
}
