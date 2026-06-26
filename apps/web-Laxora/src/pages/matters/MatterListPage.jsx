import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { mattersApi } from "../../api/matters";
import { asList, normalizeMatter } from "../../api/normalizers";
import { Button, Card, CardBody, CardHeader, SkeletonBlock, StateCard, StatusBadge } from "../../components/common";
import { MatterCard } from "../../components/matters/MatterWidgets";
import { useMatterModuleAccess } from "./useMatterModuleAccess";

const matterStatuses = ["open", "pending", "closed", "archived"];

export function MatterListPage() {
  const access = useMatterModuleAccess();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [status, setStatus] = useState("loading");
  const [matters, setMatters] = useState([]);
  const [isMatterCardOpen, setIsMatterCardOpen] = useState(true);
  const [message, setMessage] = useState("");

  async function load(params = { q: query, status: statusFilter }) {
    if (access.unavailable || !access.canRead) {
      setMatters([]);
      setStatus("permission");
      setMessage(access.message || "You do not have access to matter records.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const response = await mattersApi.list({ q: params.q, status: params.status, limit: 25 });
      const normalized = asList(response).map(normalizeMatter);
      setMatters(normalized);
      setStatus(normalized.length ? "ready" : "empty");
    } catch (error) {
      setMatters([]);
      setStatus(error?.status === 403 ? "permission" : "error");
      setMessage(error?.status === 403 ? "You do not have access to matter records." : (error?.userMessage || "We could not load matters right now. Please try again."));
    }
  }

  useEffect(() => {
    load({ q: "", status: "" });
  }, [access.status, access.unavailable, access.canRead]);

  function handleSubmit(event) {
    event.preventDefault();
    load();
  }

  function handleStatusChange(value) {
    setStatusFilter(value);
    load({ q: query, status: value });
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
          {access.canCreate && !access.readOnly ? (
            <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryStrong" to="/app/matters/new">
              <Plus className="h-4 w-4" />
              New matter
            </Link>
          ) : null}
        </div>
        <form className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_auto]" onSubmit={handleSubmit}>
          <label className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="focus-ring w-full rounded-lg border border-border py-3 pl-10 pr-3" onChange={(event) => setQuery(event.target.value)} placeholder="Search matters" value={query} />
          </label>
          <select className="focus-ring rounded-lg border border-border px-3 py-3" onChange={(event) => handleStatusChange(event.target.value)} value={statusFilter}>
            <option value="">All statuses</option>
            {matterStatuses.map((matterStatus) => (
              <option key={matterStatus} value={matterStatus}>{matterStatus}</option>
            ))}
          </select>
          <Button isLoading={status === "loading"} type="submit">Search</Button>
        </form>
      </section>

      {access.readOnly && status !== "permission" ? <StateCard state="permission" title="Matters are read-only" message={access.message} /> : null}
      {status === "loading" ? <div className="grid gap-4 xl:grid-cols-2"><SkeletonBlock /><SkeletonBlock /></div> : null}
      {status === "permission" ? <StateCard state="permission" title="Matters are not available" message={message} /> : null}
      {status === "error" ? <StateCard state="error" title="Matter list needs attention" message={message} actionLabel="Retry" onAction={() => load()} /> : null}
      {status === "empty" ? <StateCard state="empty" title="No matters found" message="Create a matter or try a broader search term." /> : null}
      {status === "ready" ? (
        <Card>
          <CardHeader
            title="All matters"
            description="Showing the current filtered matter set. Scroll inside this card to review the rest."
            action={
              <div className="flex items-center gap-2">
                <StatusBadge>{matters.length}</StatusBadge>
                <Button onClick={() => setIsMatterCardOpen((current) => !current)} size="sm" type="button" variant="secondary">
                  {isMatterCardOpen ? "Collapse" : "Expand"}
                </Button>
              </div>
            }
          />
          {isMatterCardOpen ? (
            <CardBody>
              <div className="max-h-[720px] overflow-y-auto pr-2">
                <div className="grid gap-4 xl:grid-cols-2">
                  {matters.map((matter) => <MatterCard matter={matter} key={matter.id} />)}
                </div>
              </div>
            </CardBody>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
