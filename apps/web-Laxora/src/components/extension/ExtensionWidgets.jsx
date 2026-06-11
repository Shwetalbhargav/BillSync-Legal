import { Link } from "react-router-dom";
import { CheckCircle2, ClipboardCheck, HelpCircle, Plug, RefreshCw, ShieldCheck, WifiOff } from "lucide-react";
import { Button, Card, CardBody, CardHeader, StateCard, StatusBadge } from "../common";

export const setupSteps = [
  { title: "Download the extension folder", detail: "Use the folder shared by your firm administrator." },
  { title: "Open Chrome extensions", detail: "Open Chrome, choose Extensions, then Manage Extensions." },
  { title: "Turn on developer mode", detail: "Use the switch in the top-right corner of the Chrome extensions page." },
  { title: "Load the folder", detail: "Choose Load unpacked and select the BillSync extension folder." },
  { title: "Pin BillSync", detail: "Pin the BillSync icon so it is easy to find while reviewing email." },
  { title: "Sign in from BillSync", detail: "Use the status page here to check that your workspace link is ready." },
];

export function ExtensionHero({ title, subtitle }) {
  return (
    <section className="surface-card p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">Chrome Extension</p>
      <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{subtitle}</p>
    </section>
  );
}

export function ExtensionConnectionCard({ link, onRefresh, status = "ready" }) {
  const connected = Boolean(link?.available);
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-ink">Workspace link</h2>
            <StatusBadge tone={connected ? "success" : "warning"}>{connected ? "Ready" : "Needs attention"}</StatusBadge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">
            {connected ? "Your workspace can authorize the extension for secure capture." : "Check the link after signing in, then refresh this status."}
          </p>
          {link?.expiresIn ? <p className="mt-2 text-xs font-semibold text-muted">Check expires in {link.expiresIn}.</p> : null}
        </div>
        <Button isLoading={status === "saving"} onClick={onRefresh} type="button" variant="secondary">
          <RefreshCw className="h-4 w-4" />
          Test connection
        </Button>
      </div>
    </Card>
  );
}

export function SetupChecklist() {
  return (
    <Card>
      <CardHeader title="Load unpacked setup" action={<StatusBadge>{setupSteps.length} steps</StatusBadge>} />
      <CardBody className="space-y-3">
        {setupSteps.map((step, index) => (
          <div className="flex gap-3 rounded-lg border border-border p-4" key={step.title}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blueSoft text-sm font-bold text-primary">{index + 1}</div>
            <div className="min-w-0">
              <p className="break-words text-sm font-bold text-ink">{step.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{step.detail}</p>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

export function RecentCaptureList({ captures }) {
  if (!captures.length) {
    return <StateCard state="empty" title="No captured work yet" message="Once the extension records email or research work, recent items will appear here." />;
  }

  return (
    <Card>
      <CardHeader title="Recent captured work" action={<StatusBadge>{captures.length}</StatusBadge>} />
      <CardBody className="space-y-3">
        {captures.map((capture) => (
          <div className="rounded-lg border border-border p-4" key={capture.id}>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="break-words text-sm font-bold text-primary">{capture.title}</p>
                <p className="mt-1 text-xs font-semibold text-muted">{capture.source} {capture.recipient ? `- ${capture.recipient}` : ""}</p>
              </div>
              <StatusBadge>{capture.status}</StatusBadge>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

export function TroubleshootingList() {
  const items = [
    { icon: Plug, title: "BillSync icon is missing", detail: "Open Chrome extensions and pin BillSync from the extensions menu." },
    { icon: WifiOff, title: "Status says not connected", detail: "Return to BillSync, sign in again, then run Test connection." },
    { icon: ClipboardCheck, title: "Captured item is missing", detail: "Keep the tab open for a moment after finishing email work, then refresh captured work." },
    { icon: ShieldCheck, title: "Chrome blocks the folder", detail: "Ask your firm administrator for the latest approved extension folder." },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card className="p-5" key={item.title}>
            <div className="flex gap-3">
              <div className="rounded-lg bg-blueSoft p-3 text-primary"><Icon className="h-5 w-5" /></div>
              <div className="min-w-0">
                <p className="break-words text-sm font-bold text-ink">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function ExtensionNavActions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link className="focus-ring inline-flex justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryStrong" to="/app/extension/status">
        View status
      </Link>
      <Link className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary hover:bg-blueSoft" to="/app/extension/troubleshooting">
        <HelpCircle className="h-4 w-4" />
        Troubleshooting
      </Link>
    </div>
  );
}

export function ConnectedSuccess() {
  return (
    <div className="rounded-lg border border-success/25 bg-success/10 p-4 text-sm font-semibold text-success">
      <CheckCircle2 className="mr-2 inline h-4 w-4" />
      Extension connection check completed.
    </div>
  );
}
