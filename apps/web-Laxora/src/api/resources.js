import { activitiesApi } from "./activities.js";
import { adminApi } from "./admin.js";
import { aiApi } from "./ai.js";
import { analyticsApi } from "./analytics.js";
import { arApi } from "./ar.js";
import { authApi } from "./auth.js";
import { billablesApi } from "./billables.js";
import { caseAssignmentsApi } from "./caseAssignments.js";
import { clientsApi } from "./clients.js";
import { documentStorageApi } from "./documentStorage.js";
import { emailEntriesApi } from "./emailEntries.js";
import { firmsApi } from "./firms.js";
import { backendGapAdapters } from "./gaps.js";
import { integrationLogsApi } from "./integrations.js";
import { invoicesApi } from "./invoices.js";
import { kpiApi, kpiSnapshotsApi } from "./kpi.js";
import { mattersApi } from "./matters.js";
import { paymentsApi } from "./payments.js";
import { associateProfilesApi, internProfilesApi, lawyerProfilesApi, partnerProfilesApi } from "./profiles.js";
import { rateCardsApi } from "./rateCards.js";
import { reportsApi } from "./reports.js";
import { revenueApi } from "./revenue.js";
import { tasksApi } from "./tasks.js";
import { timeEntriesApi } from "./timeEntries.js";
import { usersApi } from "./users.js";
import { workSessionsApi } from "./workSessions.js";
import { zohoApi } from "./zoho.js";

export const resources = {
  activities: activitiesApi,
  admin: adminApi,
  ai: aiApi,
  analytics: analyticsApi,
  ar: arApi,
  auth: authApi,
  billables: billablesApi,
  caseAssignments: caseAssignmentsApi,
  matters: mattersApi,
  clients: clientsApi,
  documentStorage: documentStorageApi,
  emailEntries: emailEntriesApi,
  firms: firmsApi,
  integrationLogs: integrationLogsApi,
  invoices: invoicesApi,
  kpi: kpiApi,
  kpiSnapshots: kpiSnapshotsApi,
  payments: paymentsApi,
  partnerProfiles: partnerProfilesApi,
  lawyerProfiles: lawyerProfilesApi,
  associateProfiles: associateProfilesApi,
  internProfiles: internProfilesApi,
  rateCards: rateCardsApi,
  reports: reportsApi,
  revenue: revenueApi,
  tasks: tasksApi,
  timeEntries: timeEntriesApi,
  users: usersApi,
  workSessions: workSessionsApi,
  zoho: zohoApi,
};

export { backendGapAdapters };
