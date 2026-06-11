import { Edit, ReceiptText, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { clientsApi } from "../../api/clients";
import { asList, normalizeClient, normalizeMatter } from "../../api/normalizers";
import { Button, SkeletonBlock, StateCard, StatusBadge } from "../../components/common";
import { ClientSummaryTiles, RelatedBillingList } from "../../components/clients/ClientWidgets";

function unwrap(response) {
  return response?.data || response;
}

export function ClientDetailPage() {
  const { clientId } = useParams();
  const [state, setState] = useState({ status: "loading", client: null, matters: [], summary: null, message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const [clientResponse, casesResponse, summaryResponse] = await Promise.all([
        clientsApi.get(clientId),
        clientsApi.cases(clientId, { limit: 5 }),
        clientsApi.summary(clientId),
      ]);
      setState({
        status: "ready",
        client: normalizeClient(unwrap(clientResponse)),
        matters: asList(casesResponse).map(normalizeMatter),
        summary: unwrap(summaryResponse),
        message: "",
      });
    } catch (error) {
      setState({ status: "error", client: null, matters: [], summary: null, message: error?.userMessage || "We could not load this client right now." });
    }
  }

  useEffect(() => {
    load();
  }, [clientId]);

  if (state.status === "loading") return <div className="grid gap-4 lg:grid-cols-2"><SkeletonBlock /><SkeletonBlock /></div>;
  if (state.status === "error") return <StateCard state="error" title="Client needs attention" message={state.message} actionLabel="Retry" />;

  const client = state.client;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Client Overview</p>
            <h1 className="mt-1 break-words text-2xl font-bold text-primary md:text-3xl">{client.name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge tone="success">{client.status}</StatusBadge>
              <StatusBadge>{client.paymentTerms}</StatusBadge>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">{client.email || "Email not added yet"} · {client.phone || "Phone not added yet"}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/clients/${client.id}/contacts`}>
              <Users className="h-4 w-4" />
              Contacts
            </Link>
            <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/clients/${client.id}/billing`}>
              <ReceiptText className="h-4 w-4" />
              Billing
            </Link>
            <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryStrong" to={`/app/clients/${client.id}/edit`}>
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </div>
        </div>
      </section>

      <ClientSummaryTiles summary={state.summary} />

      <RelatedBillingList emptyText="No matters are connected to this client yet." items={state.matters} title="Related matters" />

      <div className="flex justify-end">
        <Button onClick={load} type="button" variant="secondary">Refresh client</Button>
      </div>
    </div>
  );
}
