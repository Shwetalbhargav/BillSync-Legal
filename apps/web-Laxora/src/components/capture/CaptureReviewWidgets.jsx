import { CheckCircle2, FileText, Mail, Search, Sparkles } from "lucide-react";
import { Button, Card, CardBody, CardHeader, StateCard, StatusBadge } from "../common";

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function sourceIcon(source) {
  return source === "research" ? Search : Mail;
}

export function CaptureHero({ source }) {
  const isResearch = source === "research";
  return (
    <section className="surface-card p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">Capture Review</p>
      <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{isResearch ? "Research Capture Review" : "Gmail Capture Review"}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        {isResearch ? "Review captured research work, assign it to a matter, and convert it when it is ready." : "Review captured email work, map it to the right matter, and convert it when it is ready."}
      </p>
    </section>
  );
}

export function SectionIssues({ issues }) {
  if (!issues?.length) return null;
  return (
    <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-ink">
      <p className="font-bold text-warning">Some details need another refresh.</p>
      <ul className="mt-2 space-y-1">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
    </div>
  );
}

export function CaptureReviewList({ clients, entries, matters, onConvert, onGenerate, onMap, source }) {
  if (!entries.length) {
    return <StateCard state="empty" title={source === "research" ? "No research captured yet" : "No Gmail work captured yet"} message="New captured items will appear here after the extension records work." />;
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <CaptureReviewCard
          clients={clients}
          entry={entry}
          key={entry.id}
          matters={matters}
          onConvert={onConvert}
          onGenerate={onGenerate}
          onMap={onMap}
        />
      ))}
    </div>
  );
}

function CaptureReviewCard({ clients, entry, matters, onConvert, onGenerate, onMap }) {
  const Icon = sourceIcon(entry.source);
  const selectedMatter = matters.find((matter) => matter.id === entry.matterId);
  const clientId = entry.clientId || selectedMatter?.clientId || "";
  const matterId = entry.matterId || "";

  return (
    <Card className="p-5">
      <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blueSoft p-3 text-primary"><Icon className="h-5 w-5" /></div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-words text-base font-bold text-primary">{entry.title}</h3>
                <StatusBadge tone={entry.status === "converted" ? "success" : "neutral"}>{entry.status}</StatusBadge>
              </div>
              <p className="mt-1 text-xs font-semibold text-muted">{entry.recipient || entry.domain || entry.source} - {formatDate(entry.createdAt)}</p>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{entry.summary || entry.body || "No summary has been added yet."}</p>
            </div>
          </div>
        </div>
        <div className="w-full shrink-0 space-y-3 xl:w-96">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <label className="block text-sm font-semibold text-ink">
              Client
              <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-2" defaultValue={clientId} id={`client-${entry.id}`}>
                <option value="">Select client</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              Matter
              <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-2" defaultValue={matterId} id={`matter-${entry.id}`}>
                <option value="">Select matter</option>
                {matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.title}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => onGenerate(entry)} size="sm" type="button" variant="secondary">
              <Sparkles className="h-4 w-4" />
              Draft summary
            </Button>
            <Button onClick={() => onMap(entry, false)} size="sm" type="button" variant="secondary">
              <FileText className="h-4 w-4" />
              Save mapping
            </Button>
            <Button onClick={() => onConvert(entry)} size="sm" type="button">
              <CheckCircle2 className="h-4 w-4" />
              Convert
            </Button>
            <Button onClick={() => onMap(entry, true)} size="sm" type="button" variant="success">
              Map and convert
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function getSelectedMapping(entryId) {
  return {
    clientId: document.getElementById(`client-${entryId}`)?.value || "",
    matterId: document.getElementById(`matter-${entryId}`)?.value || "",
  };
}
