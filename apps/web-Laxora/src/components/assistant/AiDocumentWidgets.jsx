import { AlertCircle, Bot, FilePlus2, FileText, ListChecks, MessageSquareText, Sparkles } from "lucide-react";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";

export function AiDocumentHero({ title = "AI documents" }) {
  return (
    <section className="surface-card p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Assistant documents</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Add matter notes, summarize source text, create first drafts, and ask matter-specific questions with a visible review trail.
          </p>
        </div>
        <div className="rounded-lg bg-blueSoft p-3 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
      </div>
    </section>
  );
}

export function SectionIssues({ issues }) {
  if (!issues?.length) return null;
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="text-sm font-bold text-warning">Some document details need another refresh.</h2>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-ink">
            {issues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function IndexingRequired({ documents = [] }) {
  if (documents.length) return null;
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
      <div className="flex gap-3">
        <ListChecks className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="text-sm font-bold text-warning">Add source documents before asking matter questions</h2>
          <p className="mt-1 text-sm leading-6 text-ink">
            Matter Q&A uses saved source notes. Add a document summary first so answers have material to cite.
          </p>
        </div>
      </div>
    </section>
  );
}

export function MatterSelect({ matters, onChange, value }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">Matter</span>
      <select className="form-input mt-2" onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">Choose matter</option>
        {matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.title}</option>)}
      </select>
    </label>
  );
}

export function MatterDocumentTable({ documents }) {
  if (!documents.length) {
    return <StateCard state="empty" title="No source documents yet" message="Add a source note or pasted document text before asking matter-specific questions." />;
  }
  return (
    <DataTable
      columns={[
        { key: "title", label: "Document" },
        { key: "type", label: "Type" },
        { key: "summary", label: "Summary" },
        { key: "updated", label: "Updated" },
      ]}
      rows={documents.map((doc) => ({
        id: doc.id,
        title: <span className="font-bold text-primary">{doc.title}</span>,
        type: <StatusBadge>{doc.type}</StatusBadge>,
        summary: doc.summary || "Summary will appear after saving source text.",
        updated: formatDate(doc.updatedAt),
      }))}
    />
  );
}

export function SourceDocumentForm({ form, matters, onChange, onSubmit, saving }) {
  return (
    <form className="surface-card space-y-4 p-5" onSubmit={onSubmit}>
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blueSoft p-2 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">Document summary</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Paste source text to save a matter note and prepare a concise summary.</p>
        </div>
      </div>
      <MatterSelect matters={matters} onChange={(value) => onChange("caseId", value)} value={form.caseId} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input className="form-input" value={form.title} onChange={(event) => onChange("title", event.target.value)} />
        </Field>
        <Field label="Type">
          <select className="form-input" value={form.documentType} onChange={(event) => onChange("documentType", event.target.value)}>
            <option value="note">Note</option>
            <option value="brief">Brief</option>
            <option value="draft">Draft</option>
            <option value="order">Order</option>
            <option value="evidence">Evidence</option>
            <option value="correspondence">Correspondence</option>
            <option value="research">Research</option>
            <option value="other">Other</option>
          </select>
        </Field>
      </div>
      <Field label="Source text">
        <textarea className="form-input min-h-56 resize-y" value={form.content} onChange={(event) => onChange("content", event.target.value)} />
      </Field>
      <Button disabled={saving} isLoading={saving} type="submit">
        <FilePlus2 className="h-4 w-4" />
        Save and summarize
      </Button>
    </form>
  );
}

export function GenerateDocumentForm({ form, matters, onChange, onSubmit, saving }) {
  return (
    <form className="surface-card space-y-4 p-5" onSubmit={onSubmit}>
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blueSoft p-2 text-primary">
          <FilePlus2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">Create document draft</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Generate an editable first draft from saved matter notes and your instructions.</p>
        </div>
      </div>
      <MatterSelect matters={matters} onChange={(value) => onChange("caseId", value)} value={form.caseId} />
      <Field label="Document type">
        <input className="form-input" value={form.documentType} onChange={(event) => onChange("documentType", event.target.value)} placeholder="brief, note, draft, order" />
      </Field>
      <Field label="Instructions">
        <textarea className="form-input min-h-44 resize-y" value={form.instructions} onChange={(event) => onChange("instructions", event.target.value)} />
      </Field>
      <Button disabled={saving} isLoading={saving} type="submit">
        <Sparkles className="h-4 w-4" />
        Create editable draft
      </Button>
    </form>
  );
}

export function MatterQuestionForm({ disabled, form, matters, onChange, onSubmit, saving }) {
  return (
    <form className="surface-card space-y-4 p-5" onSubmit={onSubmit}>
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blueSoft p-2 text-primary">
          <MessageSquareText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">Matter document Q&A</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Ask only after saving matter source notes so the answer can show citations.</p>
        </div>
      </div>
      <MatterSelect matters={matters} onChange={(value) => onChange("caseId", value)} value={form.caseId} />
      <Field label="Question">
        <textarea className="form-input min-h-36 resize-y" value={form.question} onChange={(event) => onChange("question", event.target.value)} />
      </Field>
      <Button disabled={disabled || saving} isLoading={saving} type="submit">
        <Bot className="h-4 w-4" />
        Ask from source notes
      </Button>
    </form>
  );
}

export function EditableResult({ result, onChange }) {
  if (!result.text) {
    return <StateCard state="empty" title="No draft yet" message="Create a summary, document draft, or matter answer. The result will appear here for review." />;
  }
  return (
    <section className="surface-card p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Editable result</p>
          <h2 className="text-xl font-bold text-primary">{result.title || "Draft"}</h2>
        </div>
        <StatusBadge tone="success">Editable</StatusBadge>
      </div>
      <textarea className="form-input min-h-80 resize-y font-mono text-sm leading-6" value={result.text} onChange={(event) => onChange(event.target.value)} />
      <CitationList citations={result.citations || []} />
    </section>
  );
}

export function CitationList({ citations }) {
  if (!citations.length) {
    return <p className="mt-3 text-sm leading-6 text-muted">No citations were returned. Review the source material before relying on this draft.</p>;
  }
  return (
    <div className="mt-4 rounded-lg border border-border p-4">
      <p className="text-sm font-bold text-primary">Citations</p>
      <div className="mt-3 space-y-3">
        {citations.map((citation) => (
          <div className="rounded-lg bg-blueSoft p-3 text-sm" key={citation.documentId || citation.title}>
            <p className="font-bold text-ink">{citation.title}</p>
            <p className="mt-1 text-muted">{citation.documentType || "Source"} {citation.excerpt ? `- ${citation.excerpt}` : ""}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ children, label }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
