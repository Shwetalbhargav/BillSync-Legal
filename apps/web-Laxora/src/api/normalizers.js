export function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.docs)) return data.docs;
  if (Array.isArray(data?.cases)) return data.cases;
  if (Array.isArray(data?.clients)) return data.clients;
  if (Array.isArray(data?.tasks)) return data.tasks;
  return [];
}

export function asPage(data) {
  return {
    items: asList(data),
    nextCursor: data?.nextCursor || data?.pagination?.nextCursor || data?.pageInfo?.endCursor || null,
    hasMore: Boolean(data?.hasMore ?? data?.pagination?.hasMore ?? data?.pageInfo?.hasNextPage),
    total: Number(data?.total ?? data?.pagination?.total ?? 0),
    raw: data,
  };
}

export function safeText(value, fallback = "Not available yet") {
  return value == null || value === "" ? fallback : String(value);
}

export function toId(value) {
  return value?._id || value?.id || value?.caseId || value?.clientId || "";
}

export function normalizeUser(user = {}) {
  return {
    id: toId(user),
    name: safeText(user.name, "Team member"),
    email: user.email || "",
    mobile: user.mobile || "",
    role: user.role || "lawyer",
    firmId: user.firmId || user.firm?._id || "",
    raw: user,
  };
}

export function normalizeMatter(item = {}) {
  const client = item.clientId || item.client || {};
  const primary = item.primaryLawyerId || item.primaryLawyer || {};
  return {
    id: toId(item),
    title: safeText(item.title || item.name || item.caseName || item.matterName, "Untitled matter"),
    client: safeText(client.displayName || item.clientName || item.client?.name || item.client, "Client not set"),
    clientId: toId(client) || item.clientId || "",
    status: safeText(item.status || item.stage, "Active"),
    owner: primary.name || item.ownerName || item.owner?.name || "",
    billingType: item.billingType || "hourly",
    matterType: item.case_type || "",
    description: item.description || "",
    openedAt: item.openedAt || "",
    closedAt: item.closedAt || "",
    assignedUsers: Array.isArray(item.assignedUsers) ? item.assignedUsers : [],
    updatedAt: item.updatedAt || item.lastActivityAt || item.createdAt || "",
    raw: item,
  };
}

export function normalizeAssignment(item = {}) {
  const user = item.userId || item.user || {};
  const matter = item.caseId || item.matter || {};
  return {
    id: toId(item),
    matterId: toId(matter) || item.caseId || "",
    matterTitle: matter.title || item.matterTitle || "Matter",
    userId: toId(user) || item.userId || "",
    userName: user.name || item.userName || "Team member",
    userRole: user.role || "",
    email: user.email || "",
    role: item.role || "associate",
    status: item.status || "active",
    startAt: item.startAt || "",
    endAt: item.endAt || "",
    raw: item,
  };
}

export function normalizeClient(item = {}) {
  const owner = item.ownerUserId || item.owner || {};
  return {
    id: toId(item),
    name: safeText(item.displayName || item.name || item.clientName, "Unnamed client"),
    email: item.email || "",
    phone: item.phone || item.mobile || "",
    status: item.status || "Active",
    paymentTerms: item.paymentTerms || "NET30",
    firmId: item.firmId || "",
    ownerName: owner.name || item.ownerName || "",
    ownerEmail: owner.email || "",
    contacts: Array.isArray(item.contacts) ? item.contacts : [],
    createdAt: item.createdAt || "",
    raw: item,
  };
}

export function normalizeTask(item = {}) {
  const matter = item.caseId || item.case || {};
  const client = item.clientId || item.client || {};
  const assigned = item.assignedTo || item.assignee || {};
  const createdBy = item.createdBy || {};
  return {
    id: toId(item),
    title: safeText(item.title || item.description || item.name, "Untitled task"),
    description: item.description || "",
    matter: matter.title || matter.name || item.caseName || item.matterName || "",
    matterId: toId(matter) || item.caseId || "",
    client: client.displayName || client.name || item.clientName || "",
    clientId: toId(client) || item.clientId || "",
    assignee: assigned.name || item.assigneeName || "Team member",
    assigneeId: toId(assigned) || item.assignedTo || "",
    createdBy: createdBy.name || "",
    status: item.status || "Open",
    dueDate: item.dueDate || item.deadline || "",
    priority: item.priority || "Normal",
    checklist: Array.isArray(item.checklist) ? item.checklist : [],
    completedAt: item.completedAt || "",
    updatedAt: item.updatedAt || item.createdAt || "",
    raw: item,
  };
}

export function normalizeMoney(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

export function normalizeBillable(item = {}) {
  const matter = item.caseId || item.case || {};
  const client = item.clientId || item.client || {};
  const user = item.userId || item.user || {};
  return {
    id: toId(item),
    subject: item.subject || "",
    description: safeText(item.description || item.narrative || item.title || item.subject, "Billable work"),
    client: client.displayName || client.name || item.clientName || "",
    clientId: toId(client) || item.clientId || "",
    matter: matter.title || matter.name || item.caseName || item.matterName || "",
    matterId: toId(matter) || item.caseId || "",
    user: user.name || item.userName || "",
    userId: toId(user) || item.userId || "",
    category: item.category || "",
    activityCode: item.activityCode || "",
    minutes: Number(item.durationMinutes ?? item.minutes ?? 0),
    hours: Number(item.hours || item.durationHours || item.quantity || Number(item.durationMinutes || 0) / 60),
    rate: normalizeMoney(item.rate),
    amount: normalizeMoney(item.amount || item.total),
    status: String(item.status || "pending").toLowerCase(),
    date: item.date || item.createdAt || "",
    approvedAt: item.approvedAt || "",
    rejectedAt: item.rejectedAt || "",
    rejectionReason: item.rejectionReason || "",
    invoiceId: item.invoiceId || "",
    raw: item,
  };
}

export function normalizeRateCard(item = {}) {
  const matter = item.caseId || item.case || {};
  const user = item.userId || item.user || {};
  return {
    id: toId(item),
    user: user.name || item.userName || "Team member",
    userId: toId(user) || item.userId || "",
    matter: matter.title || matter.name || item.caseName || "",
    matterId: toId(matter) || item.caseId || "",
    activityCode: item.activityCode || "",
    ratePerHour: normalizeMoney(item.ratePerHour),
    effectiveFrom: item.effectiveFrom || "",
    effectiveTo: item.effectiveTo || "",
    raw: item,
  };
}

export function normalizeInvoice(item = {}) {
  const client = item.clientId || item.client || {};
  const matter = item.caseId || item.case || {};
  const createdBy = item.createdBy || {};
  const lines = Array.isArray(item.lines) ? item.lines : Array.isArray(item.items) ? item.items : [];
  return {
    id: toId(item),
    number: item.number || item.invoiceNumber || `Invoice ${String(toId(item)).slice(-6)}`,
    client: client.displayName || client.name || item.clientName || "",
    clientId: toId(client) || item.clientId || "",
    matter: matter.title || matter.name || item.caseName || "",
    matterId: toId(matter) || item.caseId || "",
    createdBy: createdBy.name || item.createdByName || "",
    status: String(item.status || "draft").toLowerCase(),
    subtotal: normalizeMoney(item.subtotal),
    tax: normalizeMoney(item.tax || item.taxDetails?.taxAmount),
    total: normalizeMoney(item.total || item.amount),
    currency: item.currency || "INR",
    issuedAt: item.issueDate || item.issuedAt || item.createdAt || "",
    dueAt: item.dueDate || "",
    sentAt: item.sentAt || "",
    sentTo: item.sentTo || "",
    deliveryStatus: item.deliveryStatus || "not_sent",
    deliveryError: item.deliveryError || "",
    pdfUrl: item.pdfUrl || "",
    lines: lines.map(normalizeInvoiceLine),
    raw: item,
  };
}

export function normalizeInvoiceLine(item = {}) {
  return {
    id: toId(item),
    description: safeText(item.description, "Professional services"),
    qtyHours: Number(item.qtyHours ?? Number(item.durationMinutes || 0) / 60),
    rate: normalizeMoney(item.rate),
    amount: normalizeMoney(item.amount),
    taxCategory: item.taxCategory || "GST",
    timeEntryId: item.timeEntryId?._id || item.timeEntryId || "",
    billableId: item.billableId?._id || item.billableId || "",
    raw: item,
  };
}

export function normalizePayment(item = {}) {
  const invoice = item.invoiceId || item.invoice || {};
  return {
    id: toId(item),
    invoiceId: toId(invoice) || item.invoiceId || "",
    invoiceNumber: invoice.invoiceNumber || invoice.number || item.invoiceNumber || "",
    client: item.clientName || item.client?.name || "",
    status: String(item.status || "recorded").toLowerCase(),
    method: item.method || "",
    transactionType: item.transactionType || "payment",
    reference: item.reference || "",
    notes: item.notes || "",
    amount: normalizeMoney(item.amount),
    paidAt: item.receivedDate || item.paidAt || item.createdAt || "",
    payerName: item.portal?.payerName || "",
    payerEmail: item.portal?.payerEmail || "",
    submittedByClient: Boolean(item.portal?.submittedByClient),
    raw: item,
  };
}

export function normalizeActivity(item = {}) {
  const matter = item.caseId || item.case || {};
  const client = item.clientId || item.client || {};
  return {
    id: toId(item),
    title: safeText(item.narrative || item.activityCode || item.activityType, "Captured work"),
    type: item.activityType || "work",
    source: item.workTool || item.source || "BillSync",
    status: item.status || "Captured",
    minutes: Number(item.roundedDurationMinutes ?? item.durationMinutes ?? 0),
    billable: Boolean(item.billable),
    matter: matter.title || matter.name || item.caseName || "",
    matterId: toId(matter) || item.caseId || "",
    client: client.displayName || client.name || item.clientName || "",
    clientId: toId(client) || item.clientId || "",
    conversionStatus: item.conversionStatus || "",
    occurredAt: item.workDate || item.startedAt || item.createdAt || "",
    raw: item,
  };
}

export function normalizeEmailEntry(item = {}) {
  const client = item.clientId || item.mappedClientId || item.client || {};
  const matter = item.caseId || item.mappedCaseId || item.case || {};
  return {
    id: toId(item),
    title: safeText(item.subject || item.billableSummary || item.selectedText, "Captured work"),
    recipient: item.recipient || "",
    body: item.body || item.selectedText || "",
    summary: item.billableSummary || "",
    source: item.source || "extension",
    status: item.status || "captured",
    minutes: Number(item.typingTimeMinutes ?? item.durationMinutes ?? item.minutes ?? 0),
    client: client.displayName || client.name || item.clientName || "",
    clientId: toId(client) || item.clientId || item.mappedClientId || "",
    matter: matter.title || matter.name || item.caseName || item.matterName || "",
    matterId: toId(matter) || item.caseId || item.mappedCaseId || "",
    domain: item.domain || "",
    url: item.url || "",
    createdAt: item.createdAt || item.workDate || item.date || "",
    convertedAt: item.convertedAt || "",
    raw: item,
  };
}

export function normalizeTimeEntry(item = {}) {
  const matter = item.caseId || item.case || {};
  const client = item.clientId || item.client || {};
  return {
    id: toId(item),
    title: safeText(item.description || item.narrative || item.notes, "Time entry"),
    status: item.status || "Draft",
    minutes: Number(item.durationMinutes ?? item.billableMinutes ?? item.nonbillableMinutes ?? item.minutes ?? 0),
    amount: normalizeMoney(item.amount || item.total),
    matter: matter.title || matter.name || item.caseName || "",
    matterId: toId(matter) || item.caseId || "",
    client: client.displayName || client.name || item.clientName || "",
    clientId: toId(client) || item.clientId || "",
    occurredAt: item.workDate || item.date || item.createdAt || "",
    raw: item,
  };
}

export function normalizeWorkSession(item = {}) {
  const matter = item.caseId || item.case || {};
  const client = item.clientId || item.client || {};
  const task = item.taskId || item.task || {};
  return {
    id: toId(item),
    title: safeText(item.narrative || item.calendarEvent?.title || item.activityType, "Work session"),
    activityType: item.activityType || "",
    matter: matter.title || matter.name || "",
    matterId: toId(matter) || item.caseId || "",
    client: client.displayName || client.name || "",
    clientId: toId(client) || item.clientId || "",
    task: task.title || item.taskTitle || "",
    taskId: toId(task) || item.taskId || "",
    workTool: item.workTool || "",
    activityCode: item.activityCode || "",
    billable: item.billable !== false,
    status: item.status || "running",
    minutes: Number(item.durationMinutes || 0),
    activityPercent: Number(item.activityPercent ?? item.activitySummary?.activityPercent ?? item.summary?.activityPercent ?? 0),
    activitySummary: item.activitySummary || item.summary || null,
    appUsageSummary: item.appUsageSummary || null,
    appUsageTimeline: item.appUsageTimeline || [],
    startedAt: item.startedAt || item.createdAt || "",
    endedAt: item.endedAt || "",
    calendarEvent: item.calendarEvent || null,
    raw: item,
  };
}

export function normalizeAppUsageTimeline(item = {}) {
  const summary = item.summary || item;
  const events = asList(item.events).map((event) => ({
    id: toId(event),
    appName: event.appName || "Unknown app",
    domain: event.domain || "",
    url: event.url || "",
    title: event.title || "",
    startedAt: event.startedAt || "",
    endedAt: event.endedAt || "",
    durationSeconds: Number(event.durationSeconds || 0),
    platform: event.platform || "",
    sourceApp: event.sourceApp || "",
    raw: event,
  }));
  return {
    eventCount: Number(summary.eventCount || 0),
    durationSeconds: Number(summary.durationSeconds || 0),
    apps: asList(summary.apps).map((row) => ({
      name: row.name || row.appName || "Unknown app",
      durationSeconds: Number(row.durationSeconds || 0),
    })),
    domains: asList(summary.domains).map((row) => ({
      name: row.name || row.domain || "Website",
      durationSeconds: Number(row.durationSeconds || 0),
    })),
    events,
    raw: item,
  };
}

export function normalizeActivitySummary(item = {}) {
  const summary = item.summary || item;
  return {
    sampleCount: Number(summary.sampleCount || 0),
    sampleSeconds: Number(summary.sampleSeconds || 0),
    activeSeconds: Number(summary.activeSeconds || 0),
    inactiveSeconds: Number(summary.inactiveSeconds || 0),
    keyboardCount: Number(summary.keyboardCount || 0),
    mouseCount: Number(summary.mouseCount || 0),
    activityPercent: Number(summary.activityPercent || 0),
    samples: asList(item.samples).map((sample) => ({
      id: toId(sample),
      windowStart: sample.windowStart || "",
      windowEnd: sample.windowEnd || "",
      activeSeconds: Number(sample.activeSeconds || 0),
      inactiveSeconds: Number(sample.inactiveSeconds || 0),
      keyboardCount: Number(sample.keyboardCount || 0),
      mouseCount: Number(sample.mouseCount || 0),
      activityPercent: Number(sample.activityPercent || 0),
      sourceDevice: sample.sourceDevice || "",
      sourceApp: sample.sourceApp || "",
      raw: sample,
    })),
    raw: item,
  };
}

export function normalizeStoredDocument(item = {}) {
  const matter = item.caseId || item.case || {};
  const client = item.clientId || item.client || {};
  const uploadedBy = item.uploadedBy || {};
  return {
    id: toId(item),
    title: safeText(item.title || item.originalFileName, "Matter document"),
    type: item.documentType || "other",
    provider: item.provider || "local",
    status: item.status || "stored",
    fileName: item.originalFileName || "",
    sizeBytes: Number(item.sizeBytes || 0),
    description: item.description || "",
    matter: matter.title || matter.name || item.matterName || "",
    matterId: toId(matter) || item.caseId || "",
    client: client.displayName || client.name || item.clientName || "",
    clientId: toId(client) || item.clientId || "",
    uploadedBy: uploadedBy.name || item.uploadedByName || "",
    tags: Array.isArray(item.tags) ? item.tags : [],
    updatedAt: item.updatedAt || item.createdAt || "",
    createdAt: item.createdAt || "",
    lastAccessedAt: item.lastAccessedAt || "",
    url: item.externalUrl || "",
    auditTrail: Array.isArray(item.auditTrail) ? item.auditTrail : [],
    raw: item,
  };
}

export function normalizeIntegrationLog(item = {}) {
  return {
    id: toId(item),
    title: item.platform ? `${item.platform} activity` : "Workspace activity",
    status: item.status || "pending",
    platform: item.platform || "BillSync",
    createdAt: item.createdAt || "",
    detail: item.message || item.note || "",
    raw: item,
  };
}
