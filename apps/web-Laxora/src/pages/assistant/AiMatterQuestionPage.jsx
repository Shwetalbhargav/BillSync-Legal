import { useEffect, useState } from "react";
import { aiDocumentsWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard, Toast } from "../../components/common";
import {
  AiDocumentHero,
  EditableResult,
  IndexingRequired,
  MatterDocumentTable,
  MatterQuestionForm,
  SectionIssues,
} from "../../components/assistant/AiDocumentWidgets";
import { useAiPlatformAccess } from "./useAiPlatformAccess";

const blankForm = { caseId: "", question: "" };

export function AiMatterQuestionPage() {
  const access = useAiPlatformAccess("ai.matter");
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
      setState({ status: "error", matters: [], documents: [], issues: [], message: error?.userMessage || "We could not load matter Q&A right now." });
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

  async function ask(event) {
    event.preventDefault();
    if (access.unavailable || access.readOnly || !access.canUse || access.creditDepleted) {
      setNotice({ tone: "warning", title: "Matter AI is not available", message: access.message || "You do not have access to this AI tool." });
      return;
    }
    if (!form.caseId || !form.question.trim()) {
      setNotice({ tone: "warning", title: "Add a question", message: "Choose a matter and write the question before asking." });
      return;
    }
    if (!state.documents.length) {
      setNotice({ tone: "warning", title: "Add source notes first", message: "Matter Q&A needs saved source notes before it can answer with citations." });
      return;
    }
    setSaving(true);
    try {
      const answer = await aiDocumentsWorkspaceApi.askMatterQuestion(form);
      setResult(answer);
      setNotice({ tone: "success", title: "Answer ready", message: "Review the answer and citations before relying on it." });
      access.refreshUsage();
    } catch (error) {
      setNotice({ tone: "warning", title: "Answer was not prepared", message: error?.userMessage || "Please try again in a moment." });
    } finally {
      setSaving(false);
    }
  }

  if (access.status === "loading") return <SkeletonBlock />;
  if (access.unavailable) return <StateCard state="empty" title="Matter AI is not available" message={access.message} />;
  if (!access.canUse) return <StateCard state="permission" title="Matter AI is not available" message="You do not have access to this AI tool." />;
  if (access.creditDepleted) return <StateCard state="retry" title="AI credits are used up" message={access.message} actionLabel="Refresh" onAction={access.refreshUsage} />;
  if (state.status === "loading") return <SkeletonBlock />;
  if (state.status === "error") return <StateCard state="error" title="Matter Q&A needs attention" message={state.message} actionLabel="Retry" onAction={() => load()} />;

  return (
    <div className="space-y-6">
      <AiDocumentHero title="Matter document Q&A" />
      {notice ? <Toast tone={notice.tone} title={notice.title} message={notice.message} /> : null}
      {access.readOnly ? <StateCard state="empty" title="Matter AI is paused" message={access.message} /> : null}
      {access.usage.status === "error" ? <StateCard state="retry" title="AI usage could not be refreshed" message={access.usage.message} actionLabel="Retry" onAction={access.refreshUsage} /> : null}
      <SectionIssues issues={state.issues} />
      <IndexingRequired documents={state.documents} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-6">
          <MatterQuestionForm disabled={!state.documents.length} form={form} matters={state.matters} onChange={update} onSubmit={ask} saving={saving} />
          <EditableResult result={result} onChange={(text) => setResult((current) => ({ ...current, text }))} />
        </div>
        <section className="surface-card p-5">
          <h2 className="text-xl font-bold text-primary">Available source notes</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Answers use these saved notes and show citations when matches are found.</p>
          <div className="mt-4">
            <MatterDocumentTable documents={state.documents} />
          </div>
        </section>
      </div>
    </div>
  );
}
