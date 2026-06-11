import { AlertCircle, Bot, Clock3, FilePenLine, Mail, Search, Sparkles } from "lucide-react";
import { Button, Card, CardBody, CardHeader, StateCard, StatusBadge, Tabs } from "../common";

export const assistantModes = [
  { value: "assistant", label: "Assistant", icon: Bot },
  { value: "email", label: "Email writer", icon: Mail },
  { value: "research", label: "Research notes", icon: Search },
];

export const modeCopy = {
  assistant: {
    title: "AI assistant",
    subtitle: "Summarize a note, explain next steps, or turn rough text into a clearer draft.",
    inputLabel: "What should BillSync help with?",
    placeholder: "Paste notes or ask for a concise summary...",
    action: "Ask assistant",
    emptyTitle: "No assistant draft yet",
    emptyMessage: "Ask a question or paste text. The answer will appear here as an editable draft.",
    samples: [
      "Summarize these meeting notes for a matter update.",
      "Turn this rough note into a client-friendly update.",
      "Create a concise checklist from this instruction.",
    ],
  },
  email: {
    title: "AI email writer",
    subtitle: "Draft editable client and internal emails from plain instructions.",
    inputLabel: "Email instruction",
    placeholder: "Draft a polite follow-up about pending documents...",
    action: "Draft email",
    emptyTitle: "No email draft yet",
    emptyMessage: "Describe the email you need. The draft will stay editable before you use it.",
    samples: [
      "Draft a polite client follow-up asking for signed documents.",
      "Write an invoice follow-up with a calm tone.",
      "Draft an interview confirmation for a legal associate.",
    ],
  },
  research: {
    title: "AI research assistant",
    subtitle: "Analyze pasted research text and prepare editable working notes.",
    inputLabel: "Research text or question",
    placeholder: "Paste research notes, excerpts, or a question to analyze...",
    action: "Prepare notes",
    emptyTitle: "No research notes yet",
    emptyMessage: "Paste research text to get a working summary. Source-backed research is still being prepared.",
    samples: [
      "Analyze these notes and list the strongest arguments.",
      "Summarize this judgment excerpt into client-ready points.",
      "Create research notes from this statute excerpt.",
    ],
  },
};

export function AssistantHero({ mode }) {
  const copy = modeCopy[mode] || modeCopy.assistant;
  const Icon = assistantModes.find((item) => item.value === mode)?.icon || Bot;
  return (
    <section className="surface-card p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Assistant</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{copy.subtitle}</p>
        </div>
        <div className="rounded-lg bg-blueSoft p-3 text-primary">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </section>
  );
}

export function ModePicker({ mode, onModeChange }) {
  return <Tabs items={assistantModes} value={mode} onChange={onModeChange} />;
}

export function PromptPanel({ input, mode, onChange, onSubmit, isLoading }) {
  const copy = modeCopy[mode] || modeCopy.assistant;
  return (
    <form className="surface-card space-y-4 p-5" onSubmit={onSubmit}>
      <div>
        <h2 className="text-xl font-bold text-primary">{copy.inputLabel}</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Keep details clear and remove anything you do not want included before sending.</p>
      </div>
      <textarea
        className="form-input min-h-48 resize-y"
        onChange={(event) => onChange(event.target.value)}
        placeholder={copy.placeholder}
        value={input}
      />
      <Button disabled={isLoading} isLoading={isLoading} type="submit">
        <Sparkles className="h-4 w-4" />
        {copy.action}
      </Button>
    </form>
  );
}

export function SuggestedPromptCards({ mode, onPick }) {
  const samples = modeCopy[mode]?.samples || [];
  return (
    <Card>
      <CardHeader title="Suggested starts" description="Use one as-is or edit it before asking." />
      <CardBody className="space-y-3">
        {samples.map((sample) => (
          <button
            className="focus-ring w-full rounded-lg border border-border p-3 text-left text-sm leading-6 text-ink hover:bg-blueSoft"
            key={sample}
            onClick={() => onPick(sample)}
            type="button"
          >
            {sample}
          </button>
        ))}
      </CardBody>
    </Card>
  );
}

export function AssistantDelayState({ visible }) {
  if (!visible) return null;
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
      <div className="flex gap-3">
        <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="text-sm font-bold text-warning">This is taking a little longer</h2>
          <p className="mt-1 text-sm leading-6 text-ink">BillSync is still working. Longer notes can take a moment to prepare.</p>
        </div>
      </div>
    </section>
  );
}

export function ResearchSourceNotice({ mode }) {
  if (mode !== "research") return null;
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="text-sm font-bold text-warning">Source-backed research is not connected yet</h2>
          <p className="mt-1 text-sm leading-6 text-ink">Use this mode for pasted text and working notes. Check authorities before relying on the result.</p>
        </div>
      </div>
    </section>
  );
}

export function EditableOutput({ mode, output, onChange }) {
  const copy = modeCopy[mode] || modeCopy.assistant;
  if (!output.text) {
    return <StateCard state="empty" title={copy.emptyTitle} message={copy.emptyMessage} />;
  }
  return (
    <section className="surface-card p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Editable result</p>
          <h2 className="text-xl font-bold text-primary">{output.title || "Draft"}</h2>
        </div>
        <StatusBadge tone="success">Editable</StatusBadge>
      </div>
      <textarea
        className="form-input min-h-80 resize-y font-mono text-sm leading-6"
        onChange={(event) => onChange(event.target.value)}
        value={output.text}
      />
      <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted">
        <FilePenLine className="mt-0.5 h-4 w-4 shrink-0" />
        Review and edit before sharing with a client, court, or team member.
      </p>
    </section>
  );
}
