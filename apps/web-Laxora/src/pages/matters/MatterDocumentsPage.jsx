import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadMatterDocuments } from "../../api/matterTabs";
import { DocumentList, MatterTabShell, SectionIssues } from "../../components/matters/MatterTabWidgets";
import { useMatterModuleAccess } from "./useMatterModuleAccess";
import { useDocumentModuleAccess } from "../storage/useDocumentModuleAccess";

export function MatterDocumentsPage() {
  const { matterId } = useParams();
  const access = useMatterModuleAccess();
  const documentAccess = useDocumentModuleAccess();
  const [state, setState] = useState({ loading: true, error: "", matter: null, documents: [], issues: [] });

  async function load() {
    if (access.unavailable || !access.canRead || documentAccess.unavailable || !documentAccess.canRead) {
      setState((current) => ({ ...current, loading: false, error: access.message || documentAccess.message || "You do not have access to this area." }));
      return;
    }
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await loadMatterDocuments(matterId);
      setState({ loading: false, error: "", ...data });
    } catch (error) {
      setState({ loading: false, error: error?.status === 403 ? "You do not have access to this matter." : (error?.userMessage || "We could not load this matter right now."), matter: null, documents: [], issues: [] });
    }
  }

  useEffect(() => {
    load();
  }, [matterId, access.status, access.unavailable, access.canRead, documentAccess.status, documentAccess.unavailable, documentAccess.canRead]);

  return (
    <MatterTabShell activeTab="documents" error={state.error} loading={state.loading} matter={state.matter} onRetry={load}>
      <SectionIssues issues={state.issues} />
      <DocumentList documents={state.documents} />
    </MatterTabShell>
  );
}
