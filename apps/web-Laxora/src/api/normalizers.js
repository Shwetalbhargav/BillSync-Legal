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
  return {
    id: toId(item),
    title: safeText(item.title || item.name || item.caseName || item.matterName, "Untitled matter"),
    client: safeText(item.clientName || item.client?.name || item.client, "Client not set"),
    status: safeText(item.status || item.stage, "Active"),
    owner: item.ownerName || item.owner?.name || "",
    updatedAt: item.updatedAt || item.lastActivityAt || item.createdAt || "",
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
