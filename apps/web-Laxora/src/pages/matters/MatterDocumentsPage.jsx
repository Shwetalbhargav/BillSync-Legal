import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadMatterDocuments } from "../../api/matterTabs";
import { DocumentList, MatterTabShell, SectionIssues } from "../../components/matters/MatterTabWidgets";

export function MatterDocumentsPage() {
  const { matterId } = useParams();
  const [state, setState] = useState({ loading: true, error: "", matter: null, documents: [], issues: [] });

  async function load() {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await loadMatterDocuments(matterId);
      setState({ loading: false, error: "", ...data });
    } catch (error) {
      setState({ loading: false, error: error?.userMessage || "We could not load this matter right now.", matter: null, documents: [], issues: [] });
    }
  }

  useEffect(() => {
    load();
  }, [matterId]);

  return (
    <MatterTabShell activeTab="documents" error={state.error} loading={state.loading} matter={state.matter} onRetry={load}>
      <SectionIssues issues={state.issues} />
      <DocumentList documents={state.documents} />
    </MatterTabShell>
  );
}
