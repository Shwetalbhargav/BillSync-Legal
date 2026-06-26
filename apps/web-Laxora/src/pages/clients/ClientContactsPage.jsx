import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { clientsApi } from "../../api/clients";
import { normalizeClient } from "../../api/normalizers";
import { SkeletonBlock, StateCard } from "../../components/common";
import { ContactList } from "../../components/clients/ClientWidgets";
import { useClientModuleAccess } from "./useClientModuleAccess";

function unwrap(response) {
  return response?.data || response;
}

export function ClientContactsPage() {
  const { clientId } = useParams();
  const access = useClientModuleAccess();
  const [state, setState] = useState({ status: "loading", client: null, contacts: [], message: "" });

  useEffect(() => {
    if (access.unavailable || !access.canRead) {
      setState({ status: "permission", client: null, contacts: [], message: access.message || "You do not have access to client contacts." });
      return;
    }
    clientsApi.get(clientId)
      .then(async (response) => {
        const client = normalizeClient(unwrap(response));
        const contacts = await clientsApi.contacts.load(client.raw);
        setState({ status: "ready", client, contacts, message: "" });
      })
      .catch((error) => setState({
        status: error?.status === 403 ? "permission" : "error",
        client: null,
        contacts: [],
        message: error?.status === 403 ? "You do not have access to client contacts." : (error?.userMessage || "We could not load client contacts right now."),
      }));
  }, [clientId, access.status, access.unavailable, access.canRead]);

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "permission") return <StateCard state="permission" title="Client contacts are not available" message={state.message} />;
  if (state.status === "error") return <StateCard state="error" title="Contacts need attention" message={state.message} />;

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Client Contacts</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{state.client.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Review saved people for this client. Contact editing is reserved until the workspace contact workflow is connected.</p>
      </section>
      <ContactList contacts={state.contacts} />
      <StateCard state="empty" title="Contact editing is not ready yet" message="Client contact editing is planned. For now, review contacts already saved with the client." />
      <Link className="focus-ring inline-flex rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to={`/app/clients/${clientId}`}>
        Back to client
      </Link>
    </div>
  );
}
