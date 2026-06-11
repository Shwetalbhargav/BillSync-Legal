import { AlertCircle, MessageCircle, Send, Smartphone, WalletCards } from "lucide-react";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";

export function CommunicationHero({ title = "Communications" }) {
  return (
    <section className="surface-card p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Communications</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Prepare WhatsApp and SMS workflows clearly, with setup status visible before any message is sent.
          </p>
        </div>
        <div className="rounded-lg bg-blueSoft p-3 text-primary">
          <MessageCircle className="h-6 w-6" />
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
          <h2 className="text-sm font-bold text-warning">Communication setup needs attention.</h2>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-ink">
            {issues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function ProviderNotConnected({ channel = "communication" }) {
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-5">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h2 className="text-base font-bold text-warning">{channel} is not connected yet</h2>
          <p className="mt-1 text-sm leading-6 text-ink">Provider setup is required before BillSync can send or receive these messages.</p>
        </div>
      </div>
    </section>
  );
}

export function ProviderCards({ providers = [] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {providers.map((provider) => (
        <Card key={provider.id}>
          <CardHeader
            title={provider.name}
            action={<StatusBadge tone={provider.status === "connected" ? "success" : "warning"}>{provider.status === "connected" ? "Connected" : "Needs setup"}</StatusBadge>}
          />
          <CardBody>
            <p className="text-sm leading-6 text-muted">{provider.detail}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export function TemplateTable({ templates = [] }) {
  if (!templates.length) {
    return <StateCard state="empty" title="No templates yet" message="Approved message templates will appear here after provider setup." />;
  }
  return (
    <DataTable
      columns={[
        { key: "name", label: "Template" },
        { key: "channel", label: "Channel" },
        { key: "status", label: "Status" },
        { key: "preview", label: "Preview" },
      ]}
      rows={templates.map((template) => ({
        id: template.id,
        name: <span className="font-bold text-primary">{template.name}</span>,
        channel: template.channel,
        status: <StatusBadge tone="warning">{template.status}</StatusBadge>,
        preview: template.preview,
      }))}
    />
  );
}

export function InboxShell({ channel, templates = [] }) {
  const Icon = channel === "SMS" ? Smartphone : MessageCircle;
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="surface-card p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-primary">{channel} inbox</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Messages will appear after the provider is connected and message history is available.</p>
        </div>
        <StateCard state="empty" title={`No ${channel} messages yet`} message="Nothing is sent or received from this screen until provider setup is complete." />
      </section>
      <section className="surface-card p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blueSoft p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">Compose preview</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Draft the message shape now. Sending stays unavailable until setup is complete.</p>
          </div>
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-ink">Recipient</span>
          <input className="form-input mt-2" placeholder="Client mobile number" disabled />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-ink">Message</span>
          <textarea className="form-input mt-2 min-h-32" placeholder={templates[0]?.preview || "Message draft"} disabled />
        </label>
        <Button className="mt-4 w-full" disabled type="button">
          <Send className="h-4 w-4" />
          Send after setup
        </Button>
      </section>
    </div>
  );
}

export function CommunicationLogs({ logs = [] }) {
  if (!logs.length) {
    return (
      <StateCard
        state="empty"
        title="No communication logs yet"
        message="Message delivery and reply history will appear after WhatsApp or SMS providers are connected."
      />
    );
  }
  return (
    <DataTable
      columns={[
        { key: "channel", label: "Channel" },
        { key: "recipient", label: "Recipient" },
        { key: "status", label: "Status" },
        { key: "when", label: "When" },
      ]}
      rows={logs}
    />
  );
}

export function SetupSteps() {
  const steps = ["Choose provider", "Approve templates", "Connect matter/client records", "Review delivery logs"];
  return (
    <section className="surface-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-blueSoft p-2 text-primary">
          <WalletCards className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">Setup checklist</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Complete these steps before client messaging is enabled.</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => (
          <div className="rounded-lg border border-border p-4" key={step}>
            <p className="font-bold text-ink">{step}</p>
            <p className="mt-1 text-sm leading-6 text-muted">Waiting on provider setup.</p>
          </div>
        ))}
      </div>
    </section>
  );
}
