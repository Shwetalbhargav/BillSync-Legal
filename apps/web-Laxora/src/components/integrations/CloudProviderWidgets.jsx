import { AlertCircle, CloudOff, DatabaseBackup, FolderOpen, HardDrive, ShieldCheck } from "lucide-react";
import { Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";

const providerLabels = {
  google_drive: "Google Drive",
  s3: "AWS firm storage",
};

export function CloudProviderHero({ title = "Cloud storage providers" }) {
  return (
    <section className="surface-card p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Cloud Integrations</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Review Google Drive and AWS setup readiness before moving matter files into connected storage.
          </p>
        </div>
        <div className="rounded-lg bg-blueSoft p-3 text-primary">
          <DatabaseBackup className="h-6 w-6" />
        </div>
      </div>
    </section>
  );
}

export function SectionIssues({ issues = [] }) {
  if (!issues.length) return null;
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="text-sm font-bold text-warning">Cloud storage needs setup.</h2>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-ink">
            {issues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function CloudProviderNotConnected({ providerName = "Cloud storage" }) {
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-5">
      <div className="flex gap-3">
        <CloudOff className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="text-base font-bold text-warning">{providerName} is not connected yet</h2>
          <p className="mt-1 text-sm leading-6 text-ink">
            BillSync can save document records now. Direct file transfer will be available after setup is complete.
          </p>
        </div>
      </div>
    </section>
  );
}

export function CloudProviderCards({ providers = [] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {providers.map((provider) => (
        <Card key={provider.id}>
          <CardHeader
            title={provider.name}
            action={<StatusBadge tone={provider.status === "connected" ? "success" : "warning"}>{provider.status === "connected" ? "Connected" : "Needs setup"}</StatusBadge>}
          />
          <CardBody>
            <p className="text-sm leading-6 text-muted">{provider.detail}</p>
            <div className="mt-4 rounded-lg border border-border p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Linked records</p>
              <p className="mt-1 text-2xl font-bold text-primary">{provider.documentCount}</p>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export function ProviderRequirementGrid({ provider }) {
  const requirements = provider?.requirements || [];
  return (
    <section className="surface-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg bg-blueSoft p-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">{provider?.name || "Provider"} setup requirements</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Complete these checks before enabling direct file movement.</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {requirements.map((item) => (
          <div className="rounded-lg border border-border p-4" key={item}>
            <p className="font-bold text-ink">{item}</p>
            <p className="mt-1 text-sm leading-6 text-muted">Waiting for provider setup.</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CloudDocumentTable({ documents = [], providerId }) {
  const filtered = providerId ? documents.filter((document) => document.provider === providerId) : documents.filter((document) => ["google_drive", "s3"].includes(document.provider));
  if (!filtered.length) {
    return <StateCard state="empty" title="No cloud storage records yet" message="Documents linked to Google Drive or AWS firm storage will appear here after setup." />;
  }

  return (
    <DataTable
      columns={[
        { key: "title", label: "Document" },
        { key: "matter", label: "Matter" },
        { key: "provider", label: "Provider" },
        { key: "status", label: "Status" },
      ]}
      rows={filtered.map((document) => ({
        id: document.id,
        title: <span className="font-bold text-primary">{document.title}</span>,
        matter: document.matter || "Matter not set",
        provider: providerLabels[document.provider] || "Cloud storage",
        status: <StatusBadge tone={document.status === "linked" || document.status === "stored" ? "success" : "warning"}>{document.status}</StatusBadge>,
      }))}
    />
  );
}

export function SetupModePanel({ provider }) {
  const Icon = provider?.id === "s3" ? HardDrive : FolderOpen;
  return (
    <section className="surface-card p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blueSoft p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">Provider setup state</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            {provider?.name || "This provider"} is visible for planning and tester review. Setup controls stay disabled until provider support is added.
          </p>
        </div>
      </div>
    </section>
  );
}
