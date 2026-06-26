import { useEffect, useState } from "react";
import { storageWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard } from "../../components/common";
import {
  DocumentTable,
  ProviderCards,
  ProviderNotConnected,
  SectionIssues,
  StorageHero,
  StorageSummary,
} from "../../components/storage/StorageWidgets";
import { useDocumentModuleAccess } from "./useDocumentModuleAccess";

const initialState = {
  status: "loading",
  documents: [],
  providers: [],
  matters: [],
  clients: [],
  issues: [],
  message: "",
};

export function StorageLibraryPage() {
  const access = useDocumentModuleAccess();
  const [state, setState] = useState(initialState);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await storageWorkspaceApi.loadLibrary();
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ ...initialState, status: "error", message: error?.userMessage || "We could not load document storage right now." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state.status === "loading") return <SkeletonBlock />;
  if (access.unavailable) return <StateCard state="empty" title="Documents are not available" message={access.message} />;
  if (!access.canRead) return <StateCard state="permission" title="Documents are not available" message="You do not have access to this area." />;
  if (state.status === "error") return <StateCard state="error" title="Document storage needs attention" message={state.message} actionLabel="Retry" onAction={load} />;

  return (
    <div className="space-y-6">
      <StorageHero canCreate={access.canCreate} title="Storage library" />
      {access.readOnly ? <StateCard state="empty" title="Documents are read-only" message={access.message} /> : null}
      <SectionIssues issues={state.issues} />
      <ProviderNotConnected />
      <StorageSummary documents={state.documents} providers={state.providers} />
      <ProviderCards providers={state.providers} />
      <section className="surface-card p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-primary">Document library</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Review stored and linked document records across client matters.</p>
        </div>
        <DocumentTable documents={state.documents} />
      </section>
    </div>
  );
}
