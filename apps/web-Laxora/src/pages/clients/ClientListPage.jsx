import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { clientsApi } from "../../api/clients";
import { asList, normalizeClient, normalizeUser } from "../../api/normalizers";
import { usersApi } from "../../api/users";
import { Button, SkeletonBlock, StateCard } from "../../components/common";
import { ClientCard } from "../../components/clients/ClientWidgets";
import { useClientModuleAccess } from "./useClientModuleAccess";

export function ClientListPage() {
  const access = useClientModuleAccess();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("loading");
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [sort, setSort] = useState("az");
  const [letterFilter, setLetterFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [message, setMessage] = useState("");

  async function load(search = query, ownerUserId = ownerFilter) {
    if (access.unavailable || !access.canRead) {
      setClients([]);
      setStatus("permission");
      setMessage(access.message || "You do not have access to client records.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const response = await clientsApi.list({ q: search, ownerUserId, limit: 100 });
      const normalized = asList(response).map(normalizeClient);
      setClients(normalized);
      setStatus(normalized.length ? "ready" : "empty");
    } catch (error) {
      setClients([]);
      setStatus(error?.status === 403 ? "permission" : "error");
      setMessage(error?.status === 403 ? "You do not have access to client records." : (error?.userMessage || "We could not load clients right now. Please try again."));
    }
  }

  useEffect(() => {
    usersApi.list({ limit: 200 })
      .then((response) => setUsers(asList(response).map(normalizeUser).filter((user) => ["partner", "lawyer", "associate"].includes(user.role))))
      .catch(() => setUsers([]));
    load("");
  }, [access.status, access.unavailable, access.canRead]);

  function handleSubmit(event) {
    event.preventDefault();
    load(query, ownerFilter);
  }

  function changeOwnerFilter(value) {
    setOwnerFilter(value);
    load(query, value);
  }

  async function deleteClient(client) {
    if (!access.canDelete || access.readOnly) {
      setMessage("You can review clients, but changes are paused for this workspace.");
      return;
    }
    const confirmed = window.confirm(`Delete ${client.name}? This is allowed only when the client has no related matters, invoices, payments, or time entries.`);
    if (!confirmed) return;
    setMessage("");
    try {
      await clientsApi.remove(client.id);
      setClients((current) => current.filter((item) => item.id !== client.id));
    } catch (error) {
      setMessage(error?.status === 403 ? "You do not have access to delete clients." : (error?.data?.message || error?.userMessage || "We could not delete this client."));
    }
  }

  const filteredClients = clients.filter((client) => !letterFilter || client.name.toUpperCase().startsWith(letterFilter));
  const sortedClients = [...filteredClients].sort((a, b) => {
    const order = a.name.localeCompare(b.name);
    return sort === "za" ? -order : order;
  });

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Client List</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Review workspace clients, contact details, owners, and billing readiness.</p>
          </div>
          {access.canCreate && !access.readOnly ? (
            <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryStrong" to="/app/clients/new">
              <Plus className="h-4 w-4" />
              New client
            </Link>
          ) : null}
        </div>
        <form className="mt-5 grid gap-3 lg:grid-cols-[1fr_150px_150px_240px_auto]" onSubmit={handleSubmit}>
          <label className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3" onChange={(event) => setQuery(event.target.value)} placeholder="Search by client name, email, or phone" value={query} />
          </label>
          <select className="focus-ring rounded-lg border border-border px-3 py-3 text-sm font-semibold text-primary" onChange={(event) => setLetterFilter(event.target.value)} value={letterFilter}>
            <option value="">All letters</option>
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => <option key={letter} value={letter}>{letter}</option>)}
          </select>
          <select className="focus-ring rounded-lg border border-border px-3 py-3 text-sm font-semibold text-primary" onChange={(event) => setSort(event.target.value)} value={sort}>
            <option value="az">A to Z</option>
            <option value="za">Z to A</option>
          </select>
          <select className="focus-ring rounded-lg border border-border px-3 py-3 text-sm font-semibold text-primary" onChange={(event) => changeOwnerFilter(event.target.value)} value={ownerFilter}>
            <option value="">All appointed users</option>
            {users.map((person) => (
              <option key={person.id} value={person.id}>{person.name} ({person.role})</option>
            ))}
          </select>
          <Button isLoading={status === "loading"} type="submit">Search</Button>
        </form>
      </section>

      {access.readOnly && status !== "permission" ? <StateCard state="permission" title="Clients are read-only" message={access.message} /> : null}
      {status === "loading" ? <div className="grid gap-4 xl:grid-cols-2"><SkeletonBlock /><SkeletonBlock /></div> : null}
      {message && status === "ready" ? <StateCard state="permission" title="Client action blocked" message={message} /> : null}
      {status === "permission" ? <StateCard state="permission" title="Clients are not available" message={message} /> : null}
      {status === "error" ? <StateCard state="error" title="Client list needs attention" message={message} actionLabel="Retry" onAction={() => load(query, ownerFilter)} /> : null}
      {status === "empty" ? <StateCard state="empty" title="No clients found" message="Create a client or try a broader search term." /> : null}
      {status === "ready" ? (
        <div className="max-h-[760px] overflow-y-auto pr-2">
          <div className="grid gap-4 xl:grid-cols-2">
            {sortedClients.map((client) => (
              <ClientCard
                canDelete={access.canDelete}
                canEdit={access.canEdit}
                client={client}
                key={client.id}
                onDelete={deleteClient}
                readOnly={access.readOnly}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
