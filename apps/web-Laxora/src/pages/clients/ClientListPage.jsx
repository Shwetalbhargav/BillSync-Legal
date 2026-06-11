import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { clientsApi } from "../../api/clients";
import { asList, normalizeClient } from "../../api/normalizers";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import { ClientCard } from "../../components/clients/ClientWidgets";

export function ClientListPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("loading");
  const [clients, setClients] = useState([]);
  const [message, setMessage] = useState("");

  async function load(search = query) {
    setStatus("loading");
    setMessage("");
    try {
      const response = await clientsApi.list({ q: search, limit: 25 });
      const normalized = asList(response).map(normalizeClient);
      setClients(normalized);
      setStatus(normalized.length ? "ready" : "empty");
    } catch (error) {
      setClients([]);
      setStatus("error");
      setMessage(error?.userMessage || "We could not load clients right now. Please try again.");
    }
  }

  useEffect(() => {
    load("");
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    load(query);
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Clients</p>
            <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Client List</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Review firm clients, contact details, owners, and billing readiness.</p>
          </div>
          <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryStrong" to="/app/clients/new">
            <Plus className="h-4 w-4" />
            New client
          </Link>
        </div>
        <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3" onChange={(event) => setQuery(event.target.value)} placeholder="Search by client name, email, or phone" value={query} />
          </label>
          <Button isLoading={status === "loading"} type="submit">Search</Button>
        </form>
      </section>

      {status === "loading" ? <div className="grid gap-4 xl:grid-cols-2"><SkeletonBlock /><SkeletonBlock /></div> : null}
      {status === "error" ? <StateCard state="error" title="Client list needs attention" message={message} actionLabel="Retry" /> : null}
      {status === "empty" ? <StateCard state="empty" title="No clients found" message="Create a client or try a broader search term." /> : null}
      {status === "ready" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {clients.map((client) => <ClientCard client={client} key={client.id} />)}
        </div>
      ) : null}
    </div>
  );
}
