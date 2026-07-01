import { Link } from "react-router-dom";
import { AlertCircle, Archive, CloudOff, DatabaseBackup, ExternalLink, FileText, FolderOpen, Settings, UploadCloud } from "lucide-react";
import { Button, DataTable, StateCard, StatusBadge } from "../common";

const providerLabels = {
  local: "BillSync record",
  zoho_workdrive: "Zoho WorkDrive",
  google_drive: "Google Drive",
  onedrive: "OneDrive",
  s3: "Firm storage",
  external: "External link",
};

const typeLabels = {
  pleading: "Pleading",
  contract: "Contract",
  evidence: "Evidence",
  correspondence: "Correspondence",
  invoice: "Invoice",
  research: "Research",
  note: "Note",
  other: "Other",
};

export function StorageHero({ canCreate = true, title = "Document storage" }) {
  return (
    <section className="surface-card p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Documents</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Keep matter documents visible, linked to the right client work, and clear about which storage provider is ready.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canCreate ? (
            <Link to="/app/document-storage/upload">
              <Button type="button">
                <UploadCloud className="h-4 w-4" />
                Add document
              </Button>
            </Link>
          ) : null}
          <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-panel px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to="/app/storage-settings">
            <Settings className="h-4 w-4" />
            Storage settings
          </Link>
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

export function ProviderNotConnected() {
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-5">
      <div className="flex gap-3">
        <CloudOff className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div className="min-w-0">
          <h2 className="text-base font-bold text-warning">Some storage providers are not connected yet</h2>
          <p className="mt-1 text-sm leading-6 text-ink">
            BillSync can show saved document records now. Provider setup is needed before files can move directly into connected storage.
          </p>
        </div>
      </div>
    </section>
  );
}

export function StorageSummary({ documents = [], providers = [] }) {
  const linked = documents.filter((doc) => doc.status === "linked").length;
  const readyProviders = providers.filter((provider) => provider.status === "available").length;
  const cards = [
    { label: "Documents", value: documents.length, icon: FileText },
    { label: "Linked records", value: linked, icon: FolderOpen },
    { label: "Ready providers", value: readyProviders, icon: DatabaseBackup },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map(({ icon: Icon, label, value }) => (
        <div className="rounded-lg border border-border bg-panel p-4" key={label}>
          <div className="mb-3 inline-flex rounded-lg bg-blueSoft p-2 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-1 text-xl font-bold text-primary">{value}</p>
        </div>
      ))}
    </div>
  );
}

export function ProviderCards({ providers = [] }) {
  return (
    <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {providers.map((provider) => (
        <section className="flex h-full min-h-[168px] min-w-0 flex-col rounded-lg border border-border bg-panel p-4" key={provider.id}>
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-base font-bold text-primary">{provider.name}</p>
            </div>
            <StatusBadge tone={provider.status === "available" ? "success" : "warning"}>{provider.status === "available" ? "Ready" : "Needs setup"}</StatusBadge>
          </div>
          <p className="mt-4 min-w-0 flex-1 break-words text-sm leading-6 text-muted">{provider.detail}</p>
        </section>
      ))}
    </div>
  );
}

export function DocumentTable({ documents = [] }) {
  if (!documents.length) {
    return <StateCard state="empty" title="No documents found" message="Documents linked to matters will appear here after they are saved." />;
  }
  return (
    <DataTable
      columns={[
        { key: "title", label: "Document" },
        { key: "matter", label: "Matter" },
        { key: "type", label: "Type" },
        { key: "provider", label: "Storage" },
        { key: "status", label: "Status" },
        { key: "updated", label: "Updated" },
      ]}
      rows={documents.map((doc) => ({
        id: doc.id,
        title: <Link className="font-bold text-primary hover:underline" to={`/app/document-storage/${doc.id}`}>{doc.title}</Link>,
        matter: doc.matter || "Matter not set",
        type: typeLabels[doc.type] || doc.type,
        provider: providerLabels[doc.provider] || "Storage",
        status: <StatusBadge tone={doc.status === "stored" || doc.status === "linked" ? "success" : "neutral"}>{doc.status}</StatusBadge>,
        updated: formatDate(doc.updatedAt),
      }))}
    />
  );
}

export function UploadReadinessPanel() {
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
      <div className="flex gap-3">
        <UploadCloud className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="text-sm font-bold text-warning">File transfer is waiting on provider setup</h2>
          <p className="mt-1 text-sm leading-6 text-ink">
            You can save a document record and link it to a matter now. Direct file transfer will be enabled after storage setup is complete.
          </p>
        </div>
      </div>
    </section>
  );
}

export function DocumentViewer({ canDelete = true, document, onArchive, archiving }) {
  if (!document) return null;
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="surface-card min-h-[360px] p-6">
        <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-blueSoft/40 p-6 text-center">
          <FileText className="h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-bold text-primary">{document.title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            A secure in-app preview is not ready for this document yet. Use the linked location when one is available, or review the saved details on the right.
          </p>
          {document.url ? (
            <a className="focus-ring mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryStrong" href={document.url} rel="noreferrer" target="_blank">
              <ExternalLink className="h-4 w-4" />
              Open linked location
            </a>
          ) : null}
        </div>
      </section>
      <aside className="surface-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Document details</p>
            <h2 className="mt-1 text-xl font-bold text-primary">Record summary</h2>
          </div>
          <StatusBadge>{document.status}</StatusBadge>
        </div>
        <dl className="mt-5 space-y-3 text-sm">
          <Detail label="Matter" value={document.matter || "Matter not set"} />
          <Detail label="Client" value={document.client || "Client not set"} />
          <Detail label="Type" value={typeLabels[document.type] || document.type} />
          <Detail label="Storage" value={providerLabels[document.provider] || "Storage"} />
          <Detail label="File name" value={document.fileName || "Not added"} />
          <Detail label="Size" value={formatBytes(document.sizeBytes)} />
          <Detail label="Updated" value={formatDate(document.updatedAt)} />
        </dl>
        <Button className="mt-6 w-full" disabled={!canDelete || archiving || document.status === "archived"} isLoading={archiving} onClick={onArchive} type="button" variant="secondary">
          <Archive className="h-4 w-4" />
          Mark archived
        </Button>
      </aside>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-ink">{value}</dd>
    </div>
  );
}

export function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatBytes(value) {
  const size = Number(value || 0);
  if (!size) return "Not added";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export { providerLabels, typeLabels };
