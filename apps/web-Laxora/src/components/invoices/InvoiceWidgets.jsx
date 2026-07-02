import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock3, FileText, Landmark, Receipt, ReceiptText, Send, Share2, Sparkles, UserRound, WalletCards } from "lucide-react";
import { Button, Card, CardBody, CardHeader, DataTable, StateCard, StatusBadge } from "../common";

export const invoiceStatuses = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Partial", value: "partial" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
  { label: "Void", value: "void" },
];

export const paymentDueFilters = [
  { label: "All dues", value: "" },
  { label: "Payment due", value: "due" },
  { label: "Overdue", value: "overdue" },
  { label: "Paid", value: "paid" },
  { label: "Not due", value: "not_due" },
];

export function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function statusTone(status = "") {
  const value = String(status).toLowerCase();
  if (["paid", "sent"].includes(value)) return "success";
  if (["draft", "partial"].includes(value)) return "warning";
  if (["overdue", "void"].includes(value)) return "danger";
  return "neutral";
}

export function InvoiceHero({ count, total, draftCount, dueCount = 0, dueTotal = 0 }) {
  return (
    <section className="surface-card p-6">
      <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Invoices</p>
          <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Invoice workflows</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Build invoices from approved work, review totals, and send only when delivery details are ready.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[680px] xl:grid-cols-4">
          <MetricTile icon={ReceiptText} label="Invoices" value={count} />
          <MetricTile icon={Clock3} label="Drafts" value={draftCount} tone="warning" />
          <MetricTile icon={AlertCircle} label="Payment due" value={dueCount} tone="warning" />
          <MetricTile icon={FileText} label="Invoice value" value={formatMoney(total)} tone="success" />
        </div>
        {dueTotal > 0 ? <p className="text-xs font-semibold text-muted xl:text-right">Due balance: {formatMoney(dueTotal)}</p> : null}
      </div>
    </section>
  );
}

export function MetricTile({ icon: Icon, label, tone = "neutral", value }) {
  const toneClass = tone === "success" ? "bg-success/10 text-success" : tone === "warning" ? "bg-warning/10 text-warning" : "bg-blueSoft text-primary";
  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-words text-lg font-bold text-primary">{value}</p>
    </div>
  );
}

export function SectionIssues({ issues }) {
  if (!issues?.length) return null;
  return (
    <section className="rounded-lg border border-warning/30 bg-warning/10 p-4">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <p className="text-sm font-bold text-warning">Some invoice details need another refresh.</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-ink">
            {issues.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function InvoiceFilters({ clients, filters, matters, onChange, onReset }) {
  return (
    <section className="surface-card p-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="block text-sm font-semibold text-ink">
          Status
          <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("status", event.target.value)} value={filters.status}>
            {invoiceStatuses.map((status) => <option key={status.label} value={status.value}>{status.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Payment dues
          <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("paymentDue", event.target.value)} value={filters.paymentDue}>
            {paymentDueFilters.map((filter) => <option key={filter.label} value={filter.value}>{filter.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Client name
          <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("clientName", event.target.value)} placeholder="Search client" value={filters.clientName} />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Client
          <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("clientId", event.target.value)} value={filters.clientId}>
            <option value="">All clients</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Matter
          <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("caseId", event.target.value)} value={filters.caseId}>
            <option value="">All matters</option>
            {matters.map((matter) => <option key={matter.id} value={matter.id}>{matter.title}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-ink">
          Monthly
          <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("month", event.target.value)} type="month" value={filters.month} />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Issued from
          <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("issuedFrom", event.target.value)} type="date" value={filters.issuedFrom} />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Issued to
          <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("issuedTo", event.target.value)} type="date" value={filters.issuedTo} />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Due from
          <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("dueFrom", event.target.value)} type="date" value={filters.dueFrom} />
        </label>
        <label className="block text-sm font-semibold text-ink">
          Due to
          <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("dueTo", event.target.value)} type="date" value={filters.dueTo} />
        </label>
        <div className="flex items-end xl:col-start-5">
          <Button className="w-full" onClick={onReset} type="button" variant="secondary">Reset</Button>
        </div>
      </div>
    </section>
  );
}

export function ClientWiseInvoiceDashboard({ invoices }) {
  if (!invoices.length) {
    return <StateCard state="empty" title="No invoices found" message="Adjust the filters or create invoices from approved billables." />;
  }

  const groups = [...invoices.reduce((map, invoice) => {
    const key = invoice.client || "Client not set";
    const current = map.get(key) || { client: key, invoices: [], total: 0, dueTotal: 0 };
    const isDue = ["sent", "partial", "overdue"].includes(invoice.status);
    current.invoices.push(invoice);
    current.total += Number(invoice.total || 0);
    current.dueTotal += isDue ? Number(invoice.total || 0) : 0;
    map.set(key, current);
    return map;
  }, new Map()).values()].sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section className="surface-card p-5" key={group.client}>
          <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="break-words text-base font-bold text-primary">{group.client}</h2>
              <p className="mt-1 text-sm font-semibold text-muted">{group.invoices.length} invoice{group.invoices.length === 1 ? "" : "s"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="success">{formatMoney(group.total)}</StatusBadge>
              {group.dueTotal > 0 ? <StatusBadge tone="warning">Due {formatMoney(group.dueTotal)}</StatusBadge> : null}
            </div>
          </div>
          <InvoiceTable invoices={group.invoices} />
        </section>
      ))}
    </div>
  );
}

export function InvoiceTable({ invoices }) {
  if (!invoices.length) {
    return <StateCard state="empty" title="No invoices found" message="Create an invoice from approved work when the billing review is ready." />;
  }

  return (
    <DataTable
      columns={[
        { key: "number", label: "Invoice" },
        { key: "client", label: "Client" },
        { key: "status", label: "Status" },
        { key: "total", label: "Total" },
        { key: "issued", label: "Issued" },
        { key: "due", label: "Due" },
      ]}
      rows={invoices.map((invoice) => ({
        id: invoice.id,
        number: <Link className="font-bold text-primary hover:underline" to={`/app/invoices/${invoice.id}`}>{invoice.number}</Link>,
        client: invoice.client || "Client not set",
        status: <StatusBadge tone={statusTone(invoice.status)}>{invoice.status}</StatusBadge>,
        total: formatMoney(invoice.total),
        issued: formatDate(invoice.issuedAt),
        due: formatDate(invoice.dueAt),
      }))}
    />
  );
}

export function PipelineSummary({ pipeline, pendingByClient }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader title="Invoice pipeline" action={<StatusBadge>{pipeline.length}</StatusBadge>} />
        <CardBody className="space-y-3">
          {pipeline.length ? pipeline.map((item) => (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3" key={item.status}>
              <StatusBadge tone={statusTone(item.status)}>{item.status}</StatusBadge>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{formatMoney(item.total)}</p>
                <p className="text-xs font-semibold text-muted">{item.count} invoices</p>
              </div>
            </div>
          )) : <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">Pipeline totals will appear once invoices exist.</p>}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Pending by client" action={<StatusBadge>{pendingByClient.length}</StatusBadge>} />
        <CardBody className="space-y-3">
          {pendingByClient.length ? pendingByClient.map((item) => (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3" key={item.id}>
              <p className="min-w-0 break-words text-sm font-bold text-ink">{item.client}</p>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{formatMoney(item.totalPending)}</p>
                <p className="text-xs font-semibold text-muted">{item.invoiceCount} invoices</p>
              </div>
            </div>
          )) : <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">Pending client totals will appear after invoices are issued.</p>}
        </CardBody>
      </Card>
    </div>
  );
}

export function BuilderSourcePicker({ advocates = [], billables, clients, expenses = [], form, matters, onChange, onGenerate, saving, timeEntries }) {
  const matchesSelection = (item) => (
    (!form.clientId || item.clientId === form.clientId)
    && (!form.caseId || item.matterId === form.caseId)
  );
  const filteredBillables = billables.filter(matchesSelection);
  const filteredTimeEntries = timeEntries.filter(matchesSelection);
  const filteredExpenses = expenses.filter(matchesSelection);
  const filteredMatters = form.clientId ? matters.filter((matter) => matter.clientId === form.clientId) : matters;
  const sourceItems = form.source === "billables" ? filteredBillables : form.source === "time" ? filteredTimeEntries : [];
  const selectedWork = sourceItems.filter((item) => (form.source === "billables" ? form.billableIds : form.timeEntryIds).includes(item.id));
  const selectedExpenses = filteredExpenses.filter((expense) => form.expenseIds.includes(expense.id));
  const selectedClient = clients.find((client) => client.id === form.clientId);
  const selectedMatter = matters.find((matter) => matter.id === form.caseId);
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Invoice builder</p>
        <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">Create professional invoice</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Choose the template, billing parties, approved work, reimbursements, and tax treatment before creating the draft.</p>

        <BuilderStep icon={FileText} title="1. Choose invoice template">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-semibold text-ink">
              Template
              <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("templateType", event.target.value)} value={form.templateType || "standard"}>
                <option value="standard">Standard invoice</option>
                <option value="solo_advocate_fee_invoice">Solo advocate fee invoice</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              Source
              <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("source", event.target.value)} value={form.source}>
                <option value="billables">Approved billables</option>
                <option value="time">Approved time</option>
                <option value="manual">Manual professional fee</option>
              </select>
            </label>
          </div>
        </BuilderStep>

        <BuilderStep icon={Landmark} title="2. Select client, matter, and issuing advocate">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block text-sm font-semibold text-ink">
              Client
              <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("clientId", event.target.value)} value={form.clientId}>
                <option value="">Select client</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              Matter
              <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("caseId", event.target.value)} value={form.caseId}>
                <option value="">All selected work</option>
                {filteredMatters.map((matter) => <option key={matter.id} value={matter.id}>{matter.title}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              Issuing advocate
              <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("issuingAdvocateId", event.target.value)} value={form.issuingAdvocateId || ""}>
                <option value="">Use my profile</option>
                {advocates.map((advocate) => <option key={advocate.id} value={advocate.id}>{advocate.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              Due date
              <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("dueDate", event.target.value)} type="date" value={form.dueDate} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Period start
              <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("periodStart", event.target.value)} type="date" value={form.periodStart} />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Period end
              <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("periodEnd", event.target.value)} type="date" value={form.periodEnd} />
            </label>
          </div>
        </BuilderStep>

        <BuilderStep icon={Clock3} title="3. Select approved work entries">
          {form.clientId ? (
            <p className="mb-3 rounded-lg bg-blueSoft p-3 text-sm font-semibold text-primary">
              Matching approved work is selected automatically. Clear any item you do not want on this invoice.
            </p>
          ) : null}
          {form.source === "manual" ? (
            <ManualFeeFields form={form} onChange={onChange} />
          ) : (
            <SelectableWorkList form={form} items={sourceItems} onChange={onChange} source={form.source} />
          )}
        </BuilderStep>

        <BuilderStep icon={Receipt} title="4. Select approved reimbursable expenses">
          <SelectableExpenseList expenses={filteredExpenses} form={form} onChange={onChange} />
        </BuilderStep>

        <BuilderStep icon={WalletCards} title="5. Configure GST/RCM and payment details">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-semibold text-ink">
              GST/RCM treatment
              <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("taxTreatment", event.target.value)} value={form.taxTreatment || "gst_charged"}>
                <option value="gst_charged">GST charged</option>
                <option value="rcm_applicable">RCM applicable</option>
                <option value="gst_not_applicable">GST not applicable</option>
                <option value="gst_exempt">GST exempt</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-ink">
              Payment details note
              <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("paymentDetailsNote", event.target.value)} placeholder="Bank transfer, UPI, or portal note" value={form.paymentDetailsNote || ""} />
            </label>
            <label className="block text-sm font-semibold text-ink md:col-span-2">
              Tax note
              <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("taxNote", event.target.value)} value={form.taxNote || ""} />
            </label>
            <label className="block text-sm font-semibold text-ink md:col-span-2">
              Invoice notes
              <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3" onChange={(event) => onChange("invoiceNotes", event.target.value)} placeholder="Optional factual invoice note" value={form.invoiceNotes || ""} />
            </label>
          </div>
        </BuilderStep>

        <Button className="mt-6 w-full sm:w-auto" disabled={saving} isLoading={saving} onClick={onGenerate} type="button">Generate invoice</Button>
      </section>

      <InvoiceBuilderPreview
        client={selectedClient}
        expenses={selectedExpenses}
        form={form}
        matter={selectedMatter}
        work={selectedWork}
      />
    </div>
  );
}

function ManualFeeFields({ form, onChange }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="block text-sm font-semibold text-ink md:col-span-2">
        Professional fee description
        <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-app px-3 py-3" onChange={(event) => onChange("professionalDescription", event.target.value)} value={form.professionalDescription || ""} />
      </label>
      <label className="block text-sm font-semibold text-ink">
        Service date
        <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-app px-3 py-3" onChange={(event) => onChange("professionalServiceDate", event.target.value)} type="date" value={form.professionalServiceDate || ""} />
      </label>
      <label className="block text-sm font-semibold text-ink">
        Period label
        <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-app px-3 py-3" onChange={(event) => onChange("professionalPeriodLabel", event.target.value)} placeholder="June 2026" value={form.professionalPeriodLabel || ""} />
      </label>
      <label className="block text-sm font-semibold text-ink">
        Amount
        <input className="focus-ring mt-1 w-full rounded-lg border border-border bg-app px-3 py-3" min="0" onChange={(event) => onChange("professionalAmount", event.target.value)} placeholder="75000" type="number" value={form.professionalAmount || ""} />
      </label>
    </div>
  );
}

function BuilderStep({ children, icon: Icon, title }) {
  return (
    <section className="mt-6 rounded-lg border border-border bg-panel p-4">
      <div className="mb-4 flex items-center gap-3">
        <span className="rounded-lg bg-blueSoft p-2 text-primary"><Icon className="h-4 w-4" /></span>
        <h2 className="text-base font-bold text-primary">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SelectableWorkList({ form, items, onChange, source }) {
  if (!items.length) {
    return <StateCard state="empty" title="No approved work ready" message="Approved time or billable work will appear here when it is ready for invoicing." />;
  }

  const field = source === "billables" ? "billableIds" : "timeEntryIds";
  const selected = new Set(form[field]);

  function toggle(id) {
    const next = selected.has(id) ? form[field].filter((item) => item !== id) : [...form[field], id];
    onChange(field, next);
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {items.map((item) => (
        <label className="flex min-w-0 cursor-pointer gap-3 rounded-lg border border-border bg-panel p-4" key={item.id}>
          <input checked={selected.has(item.id)} className="mt-1 h-4 w-4" onChange={() => toggle(item.id)} type="checkbox" />
          <span className="min-w-0">
            <span className="block break-words text-sm font-bold text-primary">{item.description || item.title}</span>
            <span className="mt-1 block text-xs font-semibold text-muted">{item.client || "Client not set"} - {item.matter || "Matter not set"}</span>
            <span className="mt-1 block text-sm font-bold text-ink">{formatMoney(item.amount || 0)}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

export function TemplateShell({ canEdit = false, selectedTemplate = "standard" }) {
  const isAdvocate = selectedTemplate === "solo_advocate_fee_invoice";
  return (
    <section className="rounded-lg border border-border bg-panel p-5">
      <div className="flex gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <div className="min-w-0">
          <h2 className="text-base font-bold text-primary">{isAdvocate ? "Professional fee invoice preview is active" : "Standard invoice template"}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            {isAdvocate
              ? "The PDF will use advocate registration, client billing, matter, GST/RCM, payment, and signature snapshot sections."
              : canEdit ? "Firm defaults are preserved for the standard hourly invoice flow." : "Ask an administrator when template settings are available."}
          </p>
        </div>
      </div>
    </section>
  );
}

function SelectableExpenseList({ expenses, form, onChange }) {
  if (!expenses.length) {
    return <StateCard state="empty" title="No approved reimbursable expenses" message="Approved court fees, filing costs, travel, courier, and receipt-backed expenses will appear here when the expense API is available." />;
  }
  const selected = new Set(form.expenseIds || []);
  function toggle(id) {
    const next = selected.has(id) ? form.expenseIds.filter((item) => item !== id) : [...(form.expenseIds || []), id];
    onChange("expenseIds", next);
  }
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {expenses.map((expense) => (
        <label className="flex min-w-0 cursor-pointer gap-3 rounded-lg border border-border bg-app p-4" key={expense.id}>
          <input checked={selected.has(expense.id)} className="mt-1 h-4 w-4" onChange={() => toggle(expense.id)} type="checkbox" />
          <span className="min-w-0">
            <span className="block break-words text-sm font-bold text-primary">{expense.description}</span>
            <span className="mt-1 block text-xs font-semibold text-muted">{expense.client || "Client not set"} - {expense.matter || "Matter not set"}</span>
            <span className="mt-1 block text-sm font-bold text-ink">{formatMoney(expense.amount || 0)}</span>
            {expense.receiptDocumentId ? <span className="mt-1 block text-xs font-semibold text-muted">Receipt: {expense.receiptDocumentId}</span> : null}
          </span>
        </label>
      ))}
    </div>
  );
}

function InvoiceBuilderPreview({ client, expenses, form, matter, work }) {
  const workTotal = form.source === "manual"
    ? Number(form.professionalAmount || 0)
    : work.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const total = workTotal + expenseTotal;
  const taxLabel = {
    gst_charged: "GST charged",
    rcm_applicable: "RCM applicable",
    gst_not_applicable: "GST not applicable",
    gst_exempt: "GST exempt",
  }[form.taxTreatment] || "GST charged";
  return (
    <aside className="surface-card h-fit p-5 xl:sticky xl:top-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Preview</p>
          <h2 className="mt-1 text-lg font-bold text-primary">{form.templateType === "solo_advocate_fee_invoice" ? "Professional Fee Invoice" : "Standard Invoice"}</h2>
        </div>
        <StatusBadge tone={form.templateType === "solo_advocate_fee_invoice" ? "success" : "neutral"}>{taxLabel}</StatusBadge>
      </div>
      <div className="mt-5 space-y-4">
        <PreviewRow label="Client" value={client?.legalBillingName || client?.name || "Not selected"} />
        <PreviewRow label="Matter" value={matter?.title || "All selected work"} />
        <PreviewRow label="Due date" value={formatDate(form.dueDate)} />
        <PreviewRow label="Professional fees" value={`${form.source === "manual" ? 1 : work.length} item(s) - ${formatMoney(workTotal)}`} />
        <PreviewRow label="Reimbursable expenses" value={`${expenses.length} item(s) - ${formatMoney(expenseTotal)}`} />
        <div className="rounded-lg border border-border bg-panel p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Total payable preview</p>
          <p className="mt-1 text-2xl font-bold text-primary">{formatMoney(total)}</p>
        </div>
        <div className="rounded-lg border border-border p-3 text-xs leading-5 text-muted">
          {form.taxNote || "Tax treatment note will appear here."}
        </div>
      </div>
    </aside>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

export function InvoiceDetailPanel({ invoice, onSend, onVoid, saving, canSend = true, canVoid = true }) {
  return (
    <section className="surface-card p-6">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Invoice detail</p>
          <h1 className="mt-1 break-words text-2xl font-bold text-primary md:text-3xl">{invoice.number}</h1>
          <p className="mt-2 text-sm font-semibold text-muted">{invoice.client || "Client not set"} - {invoice.matter || "Matter not set"}</p>
        </div>
        <StatusBadge tone={statusTone(invoice.status)}>{invoice.status}</StatusBadge>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <MetricTile icon={FileText} label="Subtotal" value={formatMoney(invoice.subtotal)} />
        <MetricTile icon={ReceiptText} label="Tax" value={formatMoney(invoice.tax)} />
        <MetricTile icon={CheckCircle2} label="Total" value={formatMoney(invoice.total)} tone="success" />
        <MetricTile icon={Clock3} label="Due" value={formatDate(invoice.dueAt)} />
      </div>
      <DeliveryState invoice={invoice} />
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button disabled={!canSend || saving || invoice.status === "void"} isLoading={saving} onClick={onSend} type="button">
          <Send className="h-4 w-4" />
          Send invoice
        </Button>
        <Button disabled={!canVoid || saving || invoice.status === "void"} onClick={onVoid} type="button" variant="danger">Void invoice</Button>
      </div>
    </section>
  );
}

export function InvoiceChargeBreakup({ invoice }) {
  const lines = invoice.lines || [];
  const taxName = invoice.raw?.taxName || invoice.raw?.taxDetails?.taxName || "GST";
  const taxRatePct = Number(invoice.raw?.taxRatePct ?? invoice.raw?.taxDetails?.taxRatePct ?? 0);
  const taxInclusive = Boolean(invoice.raw?.taxInclusive ?? invoice.raw?.taxDetails?.inclusive);

  return (
    <section className="surface-card p-5">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Charge breakup</p>
          <h2 className="mt-1 text-xl font-bold text-primary">All charges</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Service lines, taxable amount, tax, and invoice total.</p>
        </div>
        <StatusBadge tone={taxInclusive ? "warning" : "neutral"}>{taxInclusive ? "Tax inclusive" : "Tax extra"}</StatusBadge>
      </div>

      {lines.length ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wide text-muted">
                <th className="border-b border-border px-3 py-2">Charge</th>
                <th className="border-b border-border px-3 py-2">Type</th>
                <th className="border-b border-border px-3 py-2 text-right">Hours</th>
                <th className="border-b border-border px-3 py-2 text-right">Rate</th>
                <th className="border-b border-border px-3 py-2">Tax category</th>
                <th className="border-b border-border px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <td className="border-b border-border px-3 py-3">
                    <p className="break-words font-semibold text-ink">{line.description}</p>
                    {line.receiptDocumentId ? <p className="mt-1 text-xs font-semibold text-muted">Receipt ref: {line.receiptDocumentId}</p> : null}
                  </td>
                  <td className="border-b border-border px-3 py-3 text-muted">{line.lineType === "reimbursable_expense" ? "Expense" : line.lineType === "professional_fee" ? "Professional fee" : "Hourly"}</td>
                  <td className="border-b border-border px-3 py-3 text-right font-semibold text-ink">{Number(line.qtyHours || 0).toFixed(2)}</td>
                  <td className="border-b border-border px-3 py-3 text-right text-muted">{formatMoney(line.rate)}</td>
                  <td className="border-b border-border px-3 py-3 text-muted">{line.taxCategory || taxName}</td>
                  <td className="border-b border-border px-3 py-3 text-right font-bold text-primary">{formatMoney(line.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <StateCard state="empty" title="No charge lines yet" message="Add invoice lines before sending the invoice." />
      )}

      <div className="mt-5 flex justify-end">
        <div className="w-full max-w-md rounded-lg border border-border bg-panel p-4">
          <BreakupRow label="Professional charges" value={formatMoney(invoice.subtotal)} />
          <BreakupRow label={`${taxName} (${taxRatePct.toLocaleString("en-IN", { maximumFractionDigits: 2 })}%)`} value={formatMoney(invoice.tax)} />
          {taxInclusive ? <BreakupRow label="Tax treatment" value="Included in line amounts" /> : null}
          <div className="mt-3 border-t border-border pt-3">
            <BreakupRow strong label="Invoice total" value={formatMoney(invoice.total)} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdvocateInvoiceSnapshot({ invoice }) {
  if (invoice.templateType !== "solo_advocate_fee_invoice") return null;
  const advocate = invoice.advocateSnapshot || {};
  const client = invoice.clientBillingSnapshot || {};
  const matter = invoice.matterSnapshot || {};
  const tax = invoice.taxTreatmentSnapshot || {};
  return (
    <section className="surface-card p-5">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Professional fee invoice</p>
          <h2 className="mt-1 text-xl font-bold text-primary">Issued snapshot</h2>
          <p className="mt-1 text-sm leading-6 text-muted">These details are preserved on finalised and sent invoices.</p>
        </div>
        <StatusBadge tone="success">Advocate format</StatusBadge>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <SnapshotBox title="Advocate" rows={[
          ["Name", advocate.name],
          ["Enrolment", advocate.enrolmentNo],
          ["State Bar Council", advocate.stateBarCouncil],
          ["PAN", advocate.pan],
          ["GSTIN", advocate.gstin || "Not applicable"],
          ["Address", advocate.address],
        ]} />
        <SnapshotBox title="Billed to" rows={[
          ["Legal name", client.name],
          ["Invoice email", client.email],
          ["GSTIN", client.gstin],
          ["Billing address", client.billingAddress],
        ]} />
        <SnapshotBox title="Matter and tax" rows={[
          ["Matter", matter.title],
          ["Case ref", matter.caseRefNo || matter.matterNumber],
          ["Court/Authority", matter.courtOrAuthority],
          ["Tax treatment", tax.treatment || invoice.taxTreatment],
          ["Tax note", tax.note || invoice.taxNote],
        ]} />
      </div>
    </section>
  );
}

export function AdvocateInvoiceDetailSections({ invoice }) {
  if (invoice.templateType !== "solo_advocate_fee_invoice") return null;
  const lines = invoice.lines || [];
  const professionalFees = lines.filter((line) => line.lineType !== "reimbursable_expense");
  const expenses = lines.filter((line) => line.lineType === "reimbursable_expense");
  const tax = invoice.taxTreatmentSnapshot || {};
  const payment = invoice.paymentDetailsSnapshot || {};
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <LineSection
        empty="Professional fee lines will appear after approved work or manual lines are added."
        lines={professionalFees}
        title="Professional fees"
      />
      <LineSection
        empty="Approved reimbursable expenses with receipt references will appear here."
        lines={expenses}
        showReceipts
        title="Reimbursable expenses"
      />
      <section className="surface-card p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">GST treatment</p>
        <h2 className="mt-1 text-xl font-bold text-primary">{tax.treatment || invoice.taxTreatment || "Not set"}</h2>
        <p className="mt-3 rounded-lg border border-border bg-panel p-3 text-sm leading-6 text-muted">{tax.note || invoice.taxNote || "No tax note added."}</p>
      </section>
      <section className="surface-card p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Payment details</p>
        <h2 className="mt-1 text-xl font-bold text-primary">{payment.currency || invoice.currency || "INR"}</h2>
        <p className="mt-3 rounded-lg border border-border bg-panel p-3 text-sm leading-6 text-muted">
          {payment.paymentPortalEnabled ? "Payment portal is enabled for this invoice." : "Payment portal is not enabled yet. Use the pay-now link action when available."}
        </p>
      </section>
    </div>
  );
}

function LineSection({ empty, lines, showReceipts = false, title }) {
  return (
    <section className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Invoice lines</p>
          <h2 className="mt-1 text-xl font-bold text-primary">{title}</h2>
        </div>
        <StatusBadge>{lines.length}</StatusBadge>
      </div>
      {lines.length ? (
        <div className="mt-4 space-y-3">
          {lines.map((line) => (
            <div className="rounded-lg border border-border bg-panel p-4" key={line.id}>
              <div className="flex min-w-0 items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold text-ink">{line.description}</p>
                  <p className="mt-1 text-xs font-semibold text-muted">{formatDate(line.serviceDate) !== "Not set" ? formatDate(line.serviceDate) : line.periodLabel || "Date not set"}</p>
                  {showReceipts && line.receiptDocumentId ? <p className="mt-1 text-xs font-semibold text-muted">Receipt: {line.receiptDocumentId}</p> : null}
                </div>
                <p className="shrink-0 text-sm font-bold text-primary">{formatMoney(line.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <StateCard state="empty" title={`No ${title.toLowerCase()}`} message={empty} />
      )}
    </section>
  );
}

function SnapshotBox({ rows, title }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <h3 className="text-sm font-bold text-primary">{title}</h3>
      <dl className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div className="grid gap-1" key={label}>
            <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
            <dd className="break-words text-sm font-semibold text-ink">{value || "Not set"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function BreakupRow({ label, strong = false, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className={strong ? "font-bold text-primary" : "font-semibold text-muted"}>{label}</span>
      <span className={strong ? "text-right text-lg font-bold text-primary" : "text-right font-bold text-ink"}>{value}</span>
    </div>
  );
}

export function DeliveryState({ invoice }) {
  if (invoice.deliveryStatus === "failed") {
    return (
      <div className="mt-5 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-ink">
        <p className="font-bold text-warning">Delivery needs attention</p>
        <p>The invoice was prepared, but the delivery confirmation did not complete. Review the recipient and try again.</p>
      </div>
    );
  }
  if (invoice.deliveryStatus === "sent") {
    return (
      <div className="mt-5 rounded-lg border border-success/25 bg-success/10 p-4 text-sm leading-6 text-ink">
        <p className="font-bold text-success">Invoice marked as sent</p>
        <p>Sent to {invoice.sentTo || "the selected recipient"} on {formatDate(invoice.sentAt)}.</p>
      </div>
    );
  }
  return <p className="mt-5 rounded-lg border border-border p-4 text-sm text-muted">This invoice has not been sent yet.</p>;
}

export function InvoiceLinesTable({ lines }) {
  if (!lines.length) return <StateCard state="empty" title="No invoice lines yet" message="Lines will appear after an invoice is generated or edited." />;
  return (
    <DataTable
      columns={[
        { key: "description", label: "Line" },
        { key: "hours", label: "Hours" },
        { key: "rate", label: "Rate" },
        { key: "amount", label: "Amount" },
      ]}
      rows={lines.map((line) => ({
        id: line.id,
        description: <span className="break-words font-semibold text-ink">{line.description}</span>,
        hours: Number(line.qtyHours || 0).toFixed(2),
        rate: formatMoney(line.rate),
        amount: formatMoney(line.amount),
      }))}
    />
  );
}

export function ShareShell() {
  return (
    <section className="rounded-lg border border-border bg-panel p-5">
      <div className="flex gap-3">
        <Share2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <h2 className="text-base font-bold text-primary">Client share link is not configured yet</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Use the send action for now. A secure client link can be added when the sharing workflow is available.</p>
        </div>
      </div>
    </section>
  );
}
