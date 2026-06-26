import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { storageWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard, Toast } from "../../components/common";
import { DocumentViewer, SectionIssues, StorageHero } from "../../components/storage/StorageWidgets";
import { useDocumentModuleAccess } from "./useDocumentModuleAccess";

export function DocumentViewerPage() {
  const { documentId } = useParams();
  const access = useDocumentModuleAccess();
  const [state, setState] = useState({ status: "loading", document: null, issues: [], message: "" });
  const [archiving, setArchiving] = useState(false);
  const [notice, setNotice] = useState(null);

  async function load() {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await storageWorkspaceApi.loadDocument(documentId);
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", document: null, issues: [], message: error?.userMessage || "We could not load this document right now." });
    }
  }

  useEffect(() => {
    load();
  }, [documentId]);

  async function archive() {
    setArchiving(true);
    setNotice(null);
    try {
      const document = await storageWorkspaceApi.archiveDocument(documentId, "Archived from document viewer");
      setState((current) => ({ ...current, document }));
      setNotice({ tone: "success", title: "Document archived", message: "The document record has been marked archived." });
    } catch (error) {
      setNotice({ tone: "warning", title: "Document was not archived", message: error?.userMessage || "Please try again." });
    } finally {
      setArchiving(false);
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (access.unavailable) return <StateCard state="empty" title="Document is not available" message={access.message} />;
  if (!access.canRead) return <StateCard state="permission" title="Document is not available" message="You do not have access to this area." />;
  if (state.status === "error") return <StateCard state="error" title="Document needs attention" message={state.message} actionLabel="Retry" onAction={load} />;

  return (
    <div className="space-y-6">
      <StorageHero canCreate={access.canCreate} title="Document viewer" />
      {notice ? <Toast tone={notice.tone} title={notice.title} message={notice.message} /> : null}
      {access.readOnly ? <StateCard state="empty" title="Document is read-only" message={access.message} /> : null}
      <SectionIssues issues={state.issues} />
      <DocumentViewer archiving={archiving} canDelete={access.canDelete} document={state.document} onArchive={archive} />
    </div>
  );
}
