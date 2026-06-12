import { ExternalLink, FolderSymlink, Plug, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";

export function ZohoHero({ title = "Zoho integration" }) {
  return (
    <section className="surface-card p-6">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Integrations</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Connect Zoho, review sync readiness, link WorkDrive folders, and track recent activity in one place.
          </p>
        </div>
      </div>
    </section>
  );
}

export function SectionIssues({ issues = [] }) {
  if (!issues.length) return null;
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
      <h2 className="text-sm font-bold text-warning">Zoho needs attention.</h2>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-ink">
        {issues.map((issue) => <li key={issue}>{issue}</li>)}
      </ul>
    </section>
  );
}

export function ZohoStatusCard({ connectUrl = "", status = {} }) {
  const connected = Boolean(status.connected);
  return (
    <Card>
      <CardHeader
        title="Zoho connection"
        action={<StatusBadge tone={connected ? "success" : "warning"}>{connected ? "Connected" : "Needs setup"}</StatusBadge>}
      />
      <CardBody>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blueSoft p-2 text-primary">
                {connected ? <ShieldCheck className="h-5 w-5" /> : <Plug className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-bold text-ink">{connected ? "Zoho is connected" : "Connect Zoho to start syncing"}</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {connected ? `${status.userName || "Zoho user"} ${status.userEmail ? `- ${status.userEmail}` : ""}` : "Your firm can connect Zoho when the administrator is ready."}
                </p>
              </div>
            </div>
            {status.scopes?.length ? <p className="mt-4 text-xs font-semibold text-muted">{status.scopes.length} access areas enabled</p> : null}
          </div>
          <a
            className={`focus-ring inline-flex justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${connectUrl ? "bg-primary text-white hover:bg-primaryStrong" : "border border-border text-muted"}`}
            href={connectUrl || "#"}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" />
            {connected ? "Reconnect Zoho" : "Connect Zoho"}
          </a>
        </div>
      </CardBody>
    </Card>
  );
}

export function ZohoSyncActions({ onSync, result, status }) {
  const actions = [
    { id: "clients", label: "Sync clients", help: "Send client records to Zoho." },
    { id: "matters", label: "Sync matters", help: "Send matter records to Zoho." },
    { id: "invoices", label: "Sync invoices", help: "Send invoice records to Zoho." },
  ];

  return (
    <Card>
      <CardHeader title="Sync actions" action={<StatusBadge tone="warning">Review before sync</StatusBadge>} />
      <CardBody className="space-y-3">
        {actions.map((action) => (
          <div className="rounded-lg border border-border p-4" key={action.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-ink">{action.label}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{action.help}</p>
              </div>
              <Button disabled={status === "saving"} onClick={() => onSync(action.id)} type="button" variant="secondary">
                <RefreshCw className={status === "saving" ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                Run
              </Button>
            </div>
          </div>
        ))}
        {result ? (
          <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm leading-6 text-success">
            Sync finished: {result.succeeded} completed, {result.failed} need review.
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

export function ZohoModulesTable({ modules = [] }) {
  if (!modules.length) {
    return <StateCard state="empty" title="No Zoho modules available yet" message="Module details will appear after Zoho is connected." />;
  }

  return (
    <DataTable
      columns={[
        { key: "name", label: "Module" },
        { key: "apiName", label: "Zoho name" },
        { key: "status", label: "Status" },
      ]}
      rows={modules.map((module) => ({
        id: module.id || module.apiName || module.name,
        name: <span className="font-bold text-primary">{module.name}</span>,
        apiName: module.apiName || "Not listed",
        status: <StatusBadge tone={module.enabled ? "success" : "warning"}>{module.enabled ? "Available" : "Needs review"}</StatusBadge>,
      }))}
    />
  );
}

export function WorkDriveLinkPanel({ form, matters = [], message, onChange, onSubmit, status }) {
  return (
    <Card>
      <CardHeader title="WorkDrive link" action={<StatusBadge>Folder setup</StatusBadge>} />
      <CardBody>
        {message ? <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm font-semibold text-warning">{message}</div> : null}
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-semibold text-ink">
            Matter
            <select className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("caseId", event.target.value)} value={form.caseId}>
              <option value="">Select matter</option>
              {matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.title}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Folder id
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("folderId", event.target.value)} placeholder="WorkDrive folder id" value={form.folderId} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Folder link
            <input className="focus-ring mt-1 w-full rounded-lg border border-border px-3 py-3" onChange={(event) => onChange("folderUrl", event.target.value)} placeholder="WorkDrive folder link" value={form.folderUrl} />
          </label>
          <Button isLoading={status === "saving"} type="submit">
            <FolderSymlink className="h-4 w-4" />
            Save WorkDrive link
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

export function ZohoLogsTable({ logs = [] }) {
  if (!logs.length) {
    return <StateCard state="empty" title="No Zoho sync logs yet" message="Recent Zoho activity will appear here after sync actions run." />;
  }

  return (
    <DataTable
      columns={[
        { key: "title", label: "Activity" },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "When" },
        { key: "detail", label: "Details" },
      ]}
      rows={logs.map((log) => ({
        id: log.id,
        title: <span className="font-bold text-primary">{log.title}</span>,
        status: <StatusBadge tone={log.status === "success" ? "success" : log.status === "failed" ? "danger" : "warning"}>{log.status}</StatusBadge>,
        createdAt: log.createdAt ? new Date(log.createdAt).toLocaleString("en-IN") : "Not set",
        detail: log.detail || "No extra detail",
      }))}
    />
  );
}

export function AttachmentReviewShell() {
  return (
    <Card>
      <CardHeader title="Attachment review" action={<StatusBadge tone="warning">Use record details</StatusBadge>} />
      <CardBody>
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blueSoft p-2 text-primary">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-ink">Attachments are available from linked Zoho records.</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Open a linked client, matter, or invoice record to review attachments after Zoho connection is complete.
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
