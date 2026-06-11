import { useEffect, useState } from "react";
import { aiDocumentsWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard, Toast } from "../../components/common";
import {
  AiDocumentHero,
  EditableResult,
  GenerateDocumentForm,
  IndexingRequired,
  MatterDocumentTable,
  SectionIssues,
} from "../../components/assistant/AiDocumentWidgets";

const blankForm = { caseId: "", documentType: "draft", instructions: "" };

export function AiDocumentCreatePage() {
  const [state, setState] = useState({ status: "loading", matters: [], documents: [], issues: [], message: "" });
  const [form, setForm] = useState(blankForm);
  const [result, setResult] = useState({ title: "", text: "", citations: [] });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  async function load(caseId = form.caseId) {
    setState((current) => ({ ...current, status: "loading", message: "" }));
    try {
      const data = await aiDocumentsWorkspaceApi.loadWorkspace(caseId);
      setState({ status: "ready", message: "", ...data });
    } catch (error) {
      setState({ status: "error", matters: [], documents: [], issues: [], message: error?.userMessage || "We could not load document drafting right now." });
    }
  }

  useEffect(() => {
    load("");
  }, []);

  async function update(field, value) {
    setNotice(null);
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "caseId") await load(value);
  }

  async function generate(event) {
    event.preventDefault();
    if (!form.caseId || !form.documentType.trim() || !form.instructions.trim()) {
      setNotice({ tone: "warning", title: "Add drafting details", message: "Choose a matter, name the document type, and add instructions." });
      return;
    }
    setSaving(true);
    try {
      const draft = await aiDocumentsWorkspaceApi.generateMatterDocument(form);
      setResult(draft);
      setNotice({ tone: "success", title: "Draft created", message: "Review the draft and citations before using it." });
    } catch (error) {
      setNotice({ tone: "warning", title: "Draft was not created", message: error?.userMessage || "Please try again in a moment." });
    } finally {
      setSaving(false);
    }
  }

  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Document drafting needs attention" message={state.message} actionLabel="Retry" />;

  return (
    <div className="space-y-6">
      <AiDocumentHero title="Document creation" />
      {notice ? <Toast tone={notice.tone} title={notice.title} message={notice.message} /> : null}
      <SectionIssues issues={state.issues} />
      <IndexingRequired documents={state.documents} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-6">
          <GenerateDocumentForm form={form} matters={state.matters} onChange={update} onSubmit={generate} saving={saving} />
          <EditableResult result={result} onChange={(text) => setResult((current) => ({ ...current, text }))} />
        </div>
        <section className="surface-card p-5">
          <h2 className="text-xl font-bold text-primary">Matter source notes</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Drafts are strongest when source notes exist for the selected matter.</p>
          <div className="mt-4">
            <MatterDocumentTable documents={state.documents} />
          </div>
        </section>
      </div>
    </div>
  );
}
