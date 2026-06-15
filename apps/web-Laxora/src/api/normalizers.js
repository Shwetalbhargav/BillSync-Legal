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
    role: String(user.role || "lawyer").toLowerCase(),
    firmId: user.firmId || user.firm?._id || "",
    avatarUrl: user.avatarUrl || user.profilePhotoUrl || user.photoUrl || user.picture || user.imageUrl || "",
    address: user.address || "",
    qualifications: Array.isArray(user.qualifications) ? user.qualifications : [],
    createdAt: user.createdAt || "",
    updatedAt: user.updatedAt || "",
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
    contactInfo: item.contactInfo || "",
    status: item.status || "Active",
    paymentTerms: item.paymentTerms || "NET30",
    firmId: item.firmId || "",
    ownerId: toId(owner) || item.ownerUserId || "",
    ownerName: owner.name || item.ownerName || "",
    ownerEmail: owner.email || "",
    contacts: Array.isArray(item.contacts) ? item.contacts : [],
    integrations: item.integrations || {},
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
  const user = item.userId || item.user || {};
  const task = item.taskId || item.task || {};
  const activity = item.activityId || item.activity || {};
  const activitySummary = item.activitySummary || item.activitySampleSummary || {};
  const appUsageSummary = item.appUsageSummary || {};
  const idleSummary = item.idleSummary || activity.idleSummary || activity.webMeter?.idleSummary || {};
  const billableMinutes = Number(item.billableMinutes ?? item.durationMinutes ?? item.minutes ?? 0);
  const nonbillableMinutes = Number(item.nonbillableMinutes ?? 0);
  return {
    id: toId(item),
    title: safeText(item.description || item.narrative || item.notes, "Time entry"),
    status: item.status || "Draft",
    minutes: billableMinutes + nonbillableMinutes,
    billableMinutes,
    nonbillableMinutes,
    amount: normalizeMoney(item.amount || item.total),
    rateApplied: normalizeMoney(item.rateApplied || item.rate),
    activityCode: item.activityCode || activity.activityCode || "",
    workType: activity.activityType || item.activityType || item.workType || item.activityCode || "work",
    workTool: activity.workTool || item.workTool || "manual",
    matter: matter.title || matter.name || item.caseName || "",
    matterId: toId(matter) || item.caseId || "",
    client: client.displayName || client.name || item.clientName || "",
    clientId: toId(client) || item.clientId || "",
    user: user.name || item.userName || "Team member",
    userId: toId(user) || item.userId || "",
    task: task.title || item.taskTitle || "",
    taskId: toId(task) || item.taskId || "",
    keyboardCount: Number(activitySummary.keyboardCount || 0),
    mouseCount: Number(activitySummary.mouseCount || 0),
    activityPercent: Number(activitySummary.activityPercent || 0),
    appUsageSummary,
    appUsageSeconds: Number(appUsageSummary.durationSeconds || 0),
    topApp: appUsageSummary.topApp || appUsageSummary.apps?.[0]?.name || "",
    topAppSeconds: Number(appUsageSummary.topAppSeconds || appUsageSummary.apps?.[0]?.durationSeconds || 0),
    idleSeconds: Number(idleSummary.discardedSeconds ?? idleSummary.totalSeconds ?? activity.webMeter?.inactiveSeconds ?? 0),
    submittedAt: item.submittedAt || "",
    reviewedAt: item.reviewedAt || "",
    rejectionReason: item.rejectionReason || "",
    occurredAt: item.workDate || item.date || item.createdAt || "",
    raw: item,
  };
}

export function normalizeWorkSession(item = {}) {
  const matter = item.caseId || item.case || {};
  const client = item.clientId || item.client || {};
  const task = item.taskId || item.task || {};
  const worker = item.userId || item.user || {};
  const stoppedBy = item.stoppedBy || {};
  const timeEntry = item.timeEntry || {};
  const approvedBy = timeEntry.reviewedBy || item.reviewedBy || {};
  const submittedBy = timeEntry.submittedBy || item.submittedBy || {};
  return {
    id: toId(item),
    title: safeText(item.narrative || item.calendarEvent?.title || item.activityType, "Work session"),
    activityType: item.activityType || "",
    matter: matter.title || matter.name || "",
    matterId: toId(matter) || item.caseId || "",
    client: client.displayName || client.name || "",
    clientId: toId(client) || item.clientId || "",
    user: worker.name || item.userName || "",
    userId: toId(worker) || item.userId || "",
    completedBy: stoppedBy.name || worker.name || item.completedByName || "",
    approvedBy: approvedBy.name || item.approvedByName || "",
    submittedBy: submittedBy.name || item.submittedByName || "",
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
    idleSummary: item.idleSummary || null,
    idleIntervals: item.idleIntervals || [],
    payableMinutes: Number(item.payableDurationMinutes ?? item.payableMinutes ?? item.durationMinutes ?? 0),
    rateApplied: normalizeMoney(timeEntry.rateApplied ?? item.rateApplied),
    amount: normalizeMoney(timeEntry.amount ?? item.amount),
    timeEntryStatus: timeEntry.status || item.timeEntryStatus || "",
    timeEntryId: toId(timeEntry) || item.timeEntryId || "",
    submittedAt: timeEntry.submittedAt || item.submittedAt || "",
    reviewedAt: timeEntry.reviewedAt || item.reviewedAt || "",
    startedAt: item.startedAt || item.createdAt || "",
    endedAt: item.endedAt || "",
    calendarEvent: item.calendarEvent || null,
    raw: item,
  };
}

export function normalizeWorkforceAnalytics(data = {}) {
  const summary = data.summary || {};
  const secondsToMinutes = (seconds) => Math.round(Number(seconds || 0) / 60);
  return {
    range: data.range || {},
    summary: {
      trackedMinutes: Number(summary.trackedMinutes || 0),
      billableMinutes: Number(summary.billableMinutes || 0),
      nonbillableMinutes: Number(summary.nonbillableMinutes || 0),
      billablePercent: Number(summary.billablePercent || 0),
      activityPercent: Number(summary.activityPercent || 0),
      idlePercent: Number(summary.idlePercent || 0),
      utilizationPercent: Number(summary.utilizationPercent || 0),
      payrollReadyMinutes: Number(summary.payrollReadyMinutes || 0),
      payrollReadyAmount: normalizeMoney(summary.payrollReadyAmount),
      approvalSlaHours: Number(summary.approvalSlaHours || 0),
      approvalStatus: summary.approvalStatus || {},
      attendance: summary.attendance || {},
      sessions: Number(summary.sessions || 0),
      people: Number(summary.people || 0),
    },
    people: asList(data.people).map((person) => ({
      id: person.id || person.userId || person.name,
      name: person.name || "Team member",
      trackedMinutes: Number(person.trackedMinutes || 0),
      activityPercent: Number(person.activityPercent || 0),
      idlePercent: Number(person.idlePercent || 0),
      sessions: Number(person.sessions || 0),
    })),
    appUsage: asList(data.appUsage).map((item) => ({
      id: item.name,
      name: item.name || "App",
      minutes: secondsToMinutes(item.seconds),
    })),
    domainUsage: asList(data.domainUsage).map((item) => ({
      id: item.name,
      name: item.name || "Domain",
      minutes: secondsToMinutes(item.seconds),
    })),
    rows: asList(data.rows).map((row) => ({
      id: row.id,
      userId: row.userId || "",
      userName: row.userName || "Team member",
      clientId: row.clientId || "",
      clientName: row.clientName || "Client not set",
      matterId: row.matterId || "",
      matterName: row.matterName || "Matter not set",
      taskId: row.taskId || "",
      taskName: row.taskName || "",
      date: row.date || "",
      activityType: row.activityType || "work",
      trackedMinutes: Number(row.trackedMinutes || 0),
      activityPercent: Number(row.activityPercent || 0),
      idlePercent: Number(row.idlePercent || 0),
      idleSeconds: Number(row.idleSeconds || 0),
      discardedIdleSeconds: Number(row.discardedIdleSeconds || 0),
      topApp: row.topApp || "",
      topDomain: row.topDomain || "",
      approvalStatus: row.approvalStatus || "not submitted",
      attendanceStatus: row.attendanceStatus || "not recorded",
      payrollReady: Boolean(row.payrollReady),
      billableReady: Boolean(row.billableReady),
      raw: row,
    })),
    filters: {
      users: asList(data.filters?.users),
      clients: asList(data.filters?.clients),
      matters: asList(data.filters?.matters),
      tasks: asList(data.filters?.tasks),
      teamEnabled: Boolean(data.filters?.teamEnabled),
    },
    gaps: asList(data.gaps),
    privacy: data.privacy || {},
  };
}

export function normalizeAttendanceSummary(item = {}) {
  return {
    total: Number(item.total || 0),
    present: Number(item.present || 0),
    absent: Number(item.absent || 0),
    late: Number(item.late || 0),
    leave: Number(item.leave || 0),
    holiday: Number(item.holiday || 0),
    raw: item,
  };
}

export function normalizeAttendanceDay(item = {}) {
  const user = item.userId || item.user || {};
  return {
    id: toId(item),
    userId: toId(user) || item.userId || "",
    userName: user.name || item.userName || "Team member",
    role: user.role || "",
    date: item.date || "",
    status: String(item.status || "absent").toLowerCase(),
    firstActivityAt: item.firstActivityAt || "",
    lastActivityAt: item.lastActivityAt || "",
    expectedStart: item.expectedStart || "09:30",
    expectedEnd: item.expectedEnd || "18:00",
    minutesWorked: Number(item.minutesWorked || 0),
    lateMinutes: Number(item.lateMinutes || 0),
    source: item.source || "",
    raw: item,
  };
}

export function normalizeLeaveRequest(item = {}) {
  const user = item.userId || item.user || {};
  return {
    id: toId(item),
    userId: toId(user) || item.userId || "",
    userName: user.name || item.userName || "Team member",
    role: user.role || "",
    startDate: item.startDate || "",
    endDate: item.endDate || "",
    leaveType: item.leaveType || "vacation",
    reason: item.reason || "",
    status: String(item.status || "pending").toLowerCase(),
    reviewNote: item.reviewNote || "",
    affectsPayroll: item.affectsPayroll !== false,
    createdAt: item.createdAt || "",
    raw: item,
  };
}

export function normalizeHoliday(item = {}) {
  return {
    id: toId(item),
    date: item.date || "",
    name: item.name || "Holiday",
    region: item.region || "firm",
    paid: item.paid !== false,
    raw: item,
  };
}

export function normalizeIdleSummary(item = {}) {
  const summary = item.summary || item;
  const intervals = asList(item.intervals).map((interval) => ({
    id: toId(interval),
    workSessionId: interval.workSessionId || "",
    status: interval.status || "pending",
    reason: interval.reason || "",
    intervalStart: interval.intervalStart || "",
    intervalEnd: interval.intervalEnd || "",
    durationSeconds: Number(interval.durationSeconds || 0),
    thresholdSeconds: Number(interval.thresholdSeconds || 0),
    detectionSource: interval.detectionSource || "",
    payableImpactSeconds: Number(interval.payableImpactSeconds || 0),
    raw: interval,
  }));
  return {
    count: Number(summary.count || intervals.length || 0),
    totalSeconds: Number(summary.totalSeconds || intervals.reduce((sum, interval) => sum + interval.durationSeconds, 0)),
    pendingSeconds: Number(summary.pendingSeconds || intervals.filter((interval) => interval.status === "pending").reduce((sum, interval) => sum + interval.durationSeconds, 0)),
    discardedSeconds: Number(summary.discardedSeconds || intervals.filter((interval) => interval.status === "discarded").reduce((sum, interval) => sum + interval.durationSeconds, 0)),
    keptSeconds: Number(summary.keptSeconds || intervals.filter((interval) => interval.status === "kept").reduce((sum, interval) => sum + interval.durationSeconds, 0)),
    payableMinutes: Number(summary.payableMinutes || 0),
    intervals,
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
