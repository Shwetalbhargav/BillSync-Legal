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
  return {
    id: toId(item),
    title: safeText(item.title || item.description || item.name, "Untitled task"),
    matter: item.caseName || item.matterName || item.case?.name || "",
    status: item.status || "Open",
    dueDate: item.dueDate || item.deadline || "",
    priority: item.priority || "Normal",
    raw: item,
  };
}

export function normalizeMoney(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

export function normalizeBillable(item = {}) {
  return {
    id: toId(item),
    description: safeText(item.description || item.narrative || item.title, "Billable work"),
    client: item.clientName || item.client?.name || "",
    matter: item.caseName || item.matterName || "",
    hours: Number(item.hours || item.durationHours || item.quantity || 0),
    amount: normalizeMoney(item.amount || item.total),
    status: item.status || "Draft",
    raw: item,
  };
}

export function normalizeInvoice(item = {}) {
  return {
    id: toId(item),
    number: item.number || item.invoiceNumber || "",
    client: item.clientName || item.client?.name || "",
    status: item.status || "Draft",
    total: normalizeMoney(item.total || item.amount),
    issuedAt: item.issuedAt || item.createdAt || "",
    raw: item,
  };
}

export function normalizePayment(item = {}) {
  return {
    id: toId(item),
    client: item.clientName || item.client?.name || "",
    status: item.status || "Recorded",
    amount: normalizeMoney(item.amount),
    paidAt: item.paidAt || item.createdAt || "",
    raw: item,
  };
}

export function normalizeActivity(item = {}) {
  return {
    id: toId(item),
    title: safeText(item.narrative || item.activityCode || item.activityType, "Captured work"),
    type: item.activityType || "work",
    source: item.workTool || item.source || "BillSync",
    status: item.status || "Captured",
    minutes: Number(item.roundedDurationMinutes ?? item.durationMinutes ?? 0),
    billable: Boolean(item.billable),
    occurredAt: item.workDate || item.startedAt || item.createdAt || "",
    raw: item,
  };
}

export function normalizeTimeEntry(item = {}) {
  return {
    id: toId(item),
    title: safeText(item.description || item.narrative || item.notes, "Time entry"),
    status: item.status || "Draft",
    minutes: Number(item.durationMinutes ?? item.minutes ?? 0),
    amount: normalizeMoney(item.amount || item.total),
    occurredAt: item.workDate || item.date || item.createdAt || "",
    raw: item,
  };
}

export function normalizeStoredDocument(item = {}) {
  return {
    id: toId(item),
    title: safeText(item.title || item.originalFileName, "Matter document"),
    type: item.documentType || "other",
    provider: item.provider || "local",
    status: item.status || "stored",
    fileName: item.originalFileName || "",
    sizeBytes: Number(item.sizeBytes || 0),
    description: item.description || "",
    updatedAt: item.updatedAt || item.createdAt || "",
    url: item.externalUrl || "",
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
