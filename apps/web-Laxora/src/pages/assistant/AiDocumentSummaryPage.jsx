import { useEffect, useMemo, useState } from "react";
import { aiDocumentsWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard, Toast } from "../../components/common";
import {
  AiDocumentHero,
  EditableResult,
  IndexingRequired,
  MatterDocumentTable,
  SectionIssues,
  SourceDocumentForm,
} from "../../components/assistant/AiDocumentWidgets";
import { useAiPlatformAccess } from "./useAiPlatformAccess";

const blankForm = { caseId: "", clientId: "", title: "", documentType: "note", content: "" };

export function AiDocumentSummaryPage() {
  const access = useAiPlatformAccess("ai.document");
  const [state, setState] = useState({ status: "loading", matters: [], documents: [], issues: [], message: "" });
  const [form, setForm] = useState(blankForm);
  const [result, setResult] = useState({ title: "", text: "", citations: [] });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const selectedMatter = useMemo(() => state.matters.find((matter) => matter.id === form.caseId), [form.caseId, state.matters]);

  async function load(caseId = form.caseId) {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await aiDocumentsWorkspaceApi.loadWorkspace(caseId);
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", matters: [], documents: [], issues: [], message: error?.userMessage || "We could not load document notes right now." });
    }
  }

  useEffect(() => {
    load("");
  }, []);

  async function update(field, value) {
    setNotice(null);
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "caseId") {
        const matter = state.matters.find((item) => item.id === value);
        next.clientId = matter?.clientId || "";
      }
      return next;
    });
    if (field === "caseId") await load(value);
  }

  async function save(event) {
    event.preventDefault();
    if (access.unavailable || access.readOnly || !access.canUse || access.creditDepleted) {
      setNotice({ tone: "warning", title: "Document AI is not available", message: access.message || "You do not have access to this AI tool." });
      return;
    }
    if (!form.caseId || !form.title.trim() || !form.content.trim()) {
      setNotice({ tone: "warning", title: "Add document details", message: "Choose a matter, add a title, and paste source text before saving." });
      return;
    }
    setSaving(true);
    try {
      const saved = await aiDocumentsWorkspaceApi.addMatterDocument({
        ...form,
        clientId: form.clientId || selectedMatter?.clientId,
        title: form.title.trim(),
        content: form.content.trim(),
      });
      setResult({ title: saved.title, text: saved.summary || "Summary saved.", citations: [{ documentId: saved.id, title: saved.title, documentType: saved.type }] });
      setNotice({ tone: "success", title: "Source note saved", message: "The summary is ready for review and matter questions." });
      access.refreshUsage();
      setForm((current) => ({ ...blankForm, caseId: current.caseId, clientId: current.clientId }));
      await load(form.caseId);
    } catch (error) {
      setNotice({ tone: "warning", title: "Source note was not saved", message: error?.userMessage || "Please review the details and try again." });
    } finally {
      setSaving(false);
    }
  }

  if (access.status === "loading") return <SkeletonBlock />;
  if (access.unavailable) return <StateCard state="empty" title="Document AI is not available" message={access.message} />;
  if (!access.canUse) return <StateCard state="permission" title="Document AI is not available" message="You do not have access to this AI tool." />;
  if (access.creditDepleted) return <StateCard state="retry" title="AI credits are used up" message={access.message} actionLabel="Refresh" onAction={access.refreshUsage} />;
  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Document notes need attention" message={state.message} actionLabel="Retry" onAction={() => load()} />;

  return (
    <div className="space-y-6">
      <AiDocumentHero title="Document summary" />
      {notice ? <Toast tone={notice.tone} title={notice.title} message={notice.message} /> : null}
      {access.readOnly ? <StateCard state="empty" title="Document AI is paused" message={access.message} /> : null}
      {access.usage.status === "error" ? <StateCard state="retry" title="AI usage could not be refreshed" message={access.usage.message} actionLabel="Retry" onAction={access.refreshUsage} /> : null}
      <SectionIssues issues={state.issues} />
      <IndexingRequired documents={state.documents} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-6">
          <SourceDocumentForm form={form} matters={state.matters} onChange={update} onSubmit={save} saving={saving} />
          <EditableResult result={result} onChange={(text) => setResult((current) => ({ ...current, text }))} />
        </div>
        <section className="surface-card p-5">
          <h2 className="text-xl font-bold text-primary">Saved source notes</h2>
          <p className="mt-1 text-sm leading-6 text-muted">These notes are the only material used for matter-specific answers in this branch.</p>
          <div className="mt-4">
            <MatterDocumentTable documents={state.documents} />
          </div>
        </section>
      </div>
    </div>
  );
}
