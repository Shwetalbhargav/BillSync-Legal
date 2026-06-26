import { AlertTriangle, Bell, Building2, CheckCircle2, CreditCard, DatabaseBackup, Lock, ReceiptText, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { Button } from "../common/Button";
import { StatusBadge } from "../common/StatusBadge";

export function SettingsHero({ firm, role, variant = "settings" }) {
  const labels = {
    settings: "Firm settings",
    security: "Security and access",
    compliance: "Compliance settings",
    firm: "Firm setup",
    admin: "Admin controls",
    invoice: "Invoice defaults",
    storage: "Storage defaults",
    notifications: "Notification defaults",
  };

  return (
    <section className="surface-card p-6">
      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="rounded-lg bg-blueSoft p-3 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Settings</p>
            <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">{labels[variant] || labels.settings}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Manage firm setup, access rules, and shared defaults from one place. Controls that need more setup are shown clearly before they can be used.
            </p>
          </div>
        </div>
        <div className="grid min-w-0 gap-2 rounded-lg border border-border bg-app p-3 text-sm text-muted">
          <span className="font-semibold text-ink">{firm?.name || "Firm not named yet"}</span>
          <span>{firm?.currency || "INR"} defaults</span>
          <span>{role || "workspace"} access</span>
        </div>
      </div>
    </section>
  );
}

export function SectionIssues({ issues = [] }) {
  if (!issues.length) return null;
  return (
    <section className="surface-card p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-warning">
        <AlertTriangle className="h-4 w-4" />
        Setup items
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {issues.map((issue) => (
          <div className="rounded-lg border border-border bg-app p-4" key={issue.title}>
            <p className="font-semibold text-ink">{issue.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted">{issue.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SettingsSummary({ firm, roleSummary = {} }) {
  const cards = [
    { label: "Currency", value: firm.currency || "INR", icon: CreditCard },
    { label: "Tax label", value: firm.taxSettings?.taxName || "GST", icon: ReceiptText },
    { label: "Default rate", value: `${firm.billingPreferences?.defaultRate || 0}/hr`, icon: CheckCircle2 },
    { label: "Team roles", value: Object.keys(roleSummary).length || "Not added", icon: Lock },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div className="surface-card p-5" key={card.label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-muted">{card.label}</p>
              <Icon className="h-5 w-5 text-accent" />
            </div>
            <p className="mt-3 text-xl font-bold text-primary">{card.value}</p>
          </div>
        );
      })}
    </section>
  );
}

export function FirmSetupForm({ form, onChange, onSubmit, saving }) {
  return (
    <section className="surface-card p-5">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-accent" />
        <h2 className="text-xl font-bold text-primary">Firm setup</h2>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-ink md:col-span-2">
          Firm name
          <input className="form-input" value={form.name} onChange={(event) => onChange("name", event.target.value)} placeholder="Example Legal LLP" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Currency
          <select className="form-input" value={form.currency} onChange={(event) => onChange("currency", event.target.value)}>
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="AED">AED</option>
          </select>
        </label>
      </div>
      <div className="mt-5">
        <Button isLoading={saving} onClick={onSubmit} type="button">
          <Save className="h-4 w-4" />
          Save firm setup
        </Button>
      </div>
    </section>
  );
}

export function BillingDefaultsForm({ form, onChange, onSubmit, saving }) {
  return (
    <section className="surface-card p-5">
      <div className="flex items-center gap-2">
        <ReceiptText className="h-5 w-5 text-accent" />
        <h2 className="text-xl font-bold text-primary">Invoice and billing defaults</h2>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Default hourly rate
          <input className="form-input" min="0" type="number" value={form.defaultRate} onChange={(event) => onChange("defaultRate", event.target.value)} />
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-border p-4 text-sm font-semibold text-ink md:col-span-2">
          <input checked={form.autoSync} onChange={(event) => onChange("autoSync", event.target.checked)} type="checkbox" />
          Send approved work toward billing review automatically
        </label>
      </div>
      <div className="mt-5">
        <Button isLoading={saving} onClick={onSubmit} type="button">
          <Save className="h-4 w-4" />
          Save billing defaults
        </Button>
      </div>
    </section>
  );
}

export function TaxDefaultsForm({ form, onChange, onSubmit, saving }) {
  return (
    <section className="surface-card p-5">
      <div className="flex items-center gap-2">
        <ReceiptText className="h-5 w-5 text-accent" />
        <h2 className="text-xl font-bold text-primary">Tax defaults</h2>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Tax name
          <input className="form-input" value={form.taxName} onChange={(event) => onChange("taxName", event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-ink">
          Tax rate %
          <input className="form-input" min="0" max="100" type="number" value={form.taxRatePct} onChange={(event) => onChange("taxRatePct", event.target.value)} />
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-border p-4 text-sm font-semibold text-ink">
          <input checked={form.inclusive} onChange={(event) => onChange("inclusive", event.target.checked)} type="checkbox" />
          Amounts include tax
        </label>
      </div>
      <div className="mt-5">
        <Button isLoading={saving} onClick={onSubmit} type="button">
          <Save className="h-4 w-4" />
          Save tax defaults
        </Button>
      </div>
    </section>
  );
}

function usageRow(usage = {}, key, fallbackLabel) {
  const item = usage[key] || {};
  return {
    label: item.label || fallbackLabel,
    used: Number(item.used || 0),
    included: Number(item.included || 0),
    remaining: Number(item.remaining || 0),
    overage: Number(item.overage || 0),
  };
}

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function InlineNotice({ actionLabel, message, onAction, title, tone = "muted" }) {
  const toneClass = tone === "warning" ? "border-warning/30 bg-warning/10" : "border-border bg-app";
  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{message}</p>
      {onAction ? (
        <Button className="mt-3" onClick={onAction} type="button" variant="secondary">
          {actionLabel || "Try again"}
        </Button>
      ) : null}
    </div>
  );
}

export function PlatformBillingPanel({ billing = {}, onCreateInvoice, onMarkFailed, saving }) {
  const usageRows = [
    usageRow(billing.usage, "seats", "Seats"),
    usageRow(billing.usage, "storage", "Storage"),
    usageRow(billing.usage, "aiCredits", "AI credits"),
  ];
  const latestOpenInvoice = billing.invoices?.find((invoice) => ["open", "past_due"].includes(invoice.status));
  const providerMessage = billing.provider?.message || "Subscription payment setup is not connected yet.";

  return (
    <section className="surface-card p-5">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Lexora subscription</p>
          <h2 className="mt-1 text-xl font-bold text-primary">{billing.planName || "Plan not selected"}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">This is Lexora subscription billing for the workspace. It is separate from client invoices and client payments.</p>
        </div>
        <StatusBadge tone={billing.status === "active" ? "success" : billing.status === "past_due" ? "warning" : "muted"}>{billing.status || "Not configured"}</StatusBadge>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-app p-4">
          <p className="text-sm font-semibold text-muted">Plan price</p>
          <p className="mt-2 text-xl font-bold text-primary">{billing.price || "Not set"}</p>
          <p className="mt-1 text-sm text-muted">per {billing.interval || "month"}</p>
        </div>
        {usageRows.map((row) => (
          <div className="rounded-lg border border-border bg-app p-4" key={row.label}>
            <p className="text-sm font-semibold text-muted">{row.label}</p>
            <p className="mt-2 text-xl font-bold text-primary">{row.used} / {row.included}</p>
            <p className={row.overage > 0 ? "mt-1 text-sm text-warning" : "mt-1 text-sm text-muted"}>{row.overage > 0 ? `${row.overage} over included amount` : `${row.remaining} remaining`}</p>
          </div>
        ))}
      </div>

      {!billing.provider?.configured ? <div className="mt-5"><InlineNotice title="Subscription payments are not connected" message={providerMessage} /></div> : null}
      {billing.paymentState?.status === "failed" ? (
        <div className="mt-5">
          <InlineNotice tone="warning" title="Subscription payment needs attention" message={billing.paymentState.message || "The latest Lexora subscription payment did not go through."} actionLabel="Check again" onAction={() => latestOpenInvoice && onMarkFailed(latestOpenInvoice)} />
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button isLoading={saving === "platform-invoice"} onClick={onCreateInvoice} type="button" variant="secondary">
          <ReceiptText className="h-4 w-4" />
          Prepare subscription invoice
        </Button>
        {latestOpenInvoice ? (
          <Button isLoading={saving === "platform-payment"} onClick={() => onMarkFailed(latestOpenInvoice)} type="button" variant="secondary">
            <RefreshCw className="h-4 w-4" />
            Check payment state
          </Button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="font-bold text-ink">Platform invoices</h3>
          <div className="mt-3 space-y-3">
            {billing.invoices?.length ? billing.invoices.map((invoice) => (
              <div className="rounded-lg border border-border bg-app p-4" key={invoice.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{invoice.number}</p>
                    <p className="mt-1 text-sm text-muted">Due {formatDate(invoice.dueAt)}</p>
                  </div>
                  <StatusBadge tone={invoice.status === "paid" ? "success" : invoice.status === "past_due" ? "warning" : "muted"}>{invoice.status}</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-muted">Total {invoice.total} · Balance {invoice.balance}</p>
              </div>
            )) : <InlineNotice title="No Lexora subscription invoices yet" message="Prepare a subscription invoice when this workspace is ready for platform billing review." />}
          </div>
        </div>
        <div>
          <h3 className="font-bold text-ink">Platform payments</h3>
          <div className="mt-3 space-y-3">
            {billing.payments?.length ? billing.payments.map((payment) => (
              <div className="rounded-lg border border-border bg-app p-4" key={payment.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{payment.amount}</p>
                    <p className="mt-1 text-sm text-muted">{formatDate(payment.receivedAt)}</p>
                  </div>
                  <StatusBadge tone={payment.status === "succeeded" ? "success" : payment.status === "failed" ? "warning" : "muted"}>{payment.status}</StatusBadge>
                </div>
                {payment.failureMessage ? <p className="mt-2 text-sm text-warning">{payment.failureMessage}</p> : null}
              </div>
            )) : <InlineNotice title="No Lexora subscription payments yet" message="Subscription payment records will appear here after checkout or provider sync is connected." />}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PermissionsMatrix({ permissions, roleSummary = {} }) {
  const roles = ["admin", "partner", "lawyer", "associate", "intern"];
  const modules = ["dashboard", "clients", "matters", "tasks", "work", "billing", "finance", "people", "settings", "assistant", "extension", "support"];

  function hasAccess(role, module) {
    const grants = permissions[role] || [];
    return grants.includes("all") || grants.includes(module);
  }

  return (
    <section className="surface-card p-5">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">Permissions matrix</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Review which roles can open each workspace area. Edits will be enabled after managed permissions are configured.</p>
        </div>
        <StatusBadge tone="warning">Read only</StatusBadge>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-3 pr-4 font-semibold">Area</th>
              {roles.map((role) => (
                <th className="px-3 py-3 font-semibold capitalize" key={role}>
                  {role}
                  {roleSummary[role.charAt(0).toUpperCase() + role.slice(1)] ? (
                    <span className="ml-1 text-xs font-normal text-muted">({roleSummary[role.charAt(0).toUpperCase() + role.slice(1)]})</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((module) => (
              <tr className="border-b border-border/70" key={module}>
                <td className="py-3 pr-4 font-semibold capitalize text-ink">{module}</td>
                {roles.map((role) => (
                  <td className="px-3 py-3" key={`${role}-${module}`}>
                    <span className={hasAccess(role, module) ? "text-success" : "text-muted"}>{hasAccess(role, module) ? "Allowed" : "Limited"}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function UnavailableDefaults({ defaults = {} }) {
  const cards = [
    { key: "notifications", title: "Notification defaults", icon: Bell, message: "Firm-wide alert rules and digest timing are waiting for setup." },
    { key: "storage", title: "Storage defaults", icon: DatabaseBackup, message: "Matter folder rules and provider defaults are waiting for setup." },
    { key: "invoices", title: "Invoice templates", icon: ReceiptText, message: "Invoice branding, numbering, and reminder defaults are waiting for setup." },
    { key: "permissions", title: "Managed permissions", icon: Lock, message: "Role editing is read-only until managed access controls are configured." },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon;
        const state = defaults[card.key];
        return (
          <div className="surface-card p-5" key={card.key}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="rounded-lg bg-blueSoft p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-ink">{card.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{card.message}</p>
                </div>
              </div>
              <StatusBadge tone="warning">{state?.status === "ready" ? "Ready" : "Not configured"}</StatusBadge>
            </div>
          </div>
        );
      })}
    </section>
  );
}
