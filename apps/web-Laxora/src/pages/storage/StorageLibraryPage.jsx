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
  if (state.status === "error") return <StateCard state="error" title="Document storage needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <StorageHero title="Storage library" />
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
