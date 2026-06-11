import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { clientsApi } from "../../api/clients";
import { asList, normalizeClient, normalizeInvoice, normalizePayment } from "../../api/normalizers";
import { SkeletonBlock, StateCard } from "../../components/common";
import { ClientSummaryTiles, RelatedBillingList } from "../../components/clients/ClientWidgets";

function unwrap(response) {
  return response?.data || response;
}

export function ClientBillingPage() {
  const { clientId } = useParams();
  const [state, setState] = useState({ status: "loading", client: null, summary: null, invoices: [], payments: [], message: "" });

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const [clientResponse, summaryResponse, invoicesResponse, paymentsResponse] = await Promise.all([
        clientsApi.get(clientId),
        clientsApi.summary(clientId),
        clientsApi.invoices(clientId, { limit: 8 }),
        clientsApi.payments(clientId, { limit: 8 }),
      ]);
      setState({
        status: "ready",
        client: normalizeClient(unwrap(clientResponse)),
        summary: unwrap(summaryResponse),
        invoices: asList(invoicesResponse).map(normalizeInvoice),
        payments: asList(paymentsResponse).map(normalizePayment),
        message: "",
      });
    } catch (error) {
      setState({ status: "error", client: null, summary: null, invoices: [], payments: [], message: error?.userMessage || "We could not load billing details right now." });
    }
  }

  useEffect(() => {
    load();
  }, [clientId]);

  if (state.status === "loading") return <div className="grid gap-4 lg:grid-cols-2"><SkeletonBlock /><SkeletonBlock /></div>;
  if (state.status === "error") return <StateCard state="error" title="Billing summary needs attention" message={state.message} />;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Client Billing</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{state.client.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Review work in progress, billed value, paid value, and receivables for this client.</p>
      </section>
      <ClientSummaryTiles summary={state.summary} />
      <div className="grid gap-6 xl:grid-cols-2">
        <RelatedBillingList emptyText="No invoices are linked to this client yet." items={state.invoices} title="Invoices" />
        <RelatedBillingList emptyText="No payments are linked to this client yet." items={state.payments} title="Payments" />
      </div>
      <Link className="focus-ring inline-flex rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/clients/${clientId}`}>
        Back to client
      </Link>
    </div>
  );
}
