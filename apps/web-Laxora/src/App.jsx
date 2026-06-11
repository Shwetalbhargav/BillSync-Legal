import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { AppShell } from "./components/layout/AppShell";
import { AuthLayout } from "./components/layout/AuthLayout";
import { StateCard } from "./components/common/StateCard";
import { canAccess } from "./constants/permissions";
import { allRoutes, appRoutes, fallbackRoutes } from "./routes/routeConfig";
import { BillableApprovalPage } from "./pages/billing/BillableApprovalPage";
import { BillableDetailPage } from "./pages/billing/BillableDetailPage";
import { BillablesPage } from "./pages/billing/BillablesPage";
import { CalendarHearingsPage } from "./pages/calendar/CalendarHearingsPage";
import { CaptureReviewPage } from "./pages/capture/CaptureReviewPage";
import { ComponentGalleryPage } from "./pages/ComponentGalleryPage";
import { ClientBillingPage } from "./pages/clients/ClientBillingPage";
import { ClientContactsPage } from "./pages/clients/ClientContactsPage";
import { ClientDetailPage } from "./pages/clients/ClientDetailPage";
import { ClientFormPage } from "./pages/clients/ClientFormPage";
import { ClientListPage } from "./pages/clients/ClientListPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ExtensionSetupPage } from "./pages/extension/ExtensionSetupPage";
import { ExtensionStatusPage } from "./pages/extension/ExtensionStatusPage";
import { ExtensionTroubleshootingPage } from "./pages/extension/ExtensionTroubleshootingPage";
import { FallbackGalleryPage } from "./pages/FallbackGalleryPage";
import { FallbackStatePage } from "./pages/FallbackStatePage";
import { AuditLogsPage } from "./pages/finance/AuditLogsPage";
import { FinanceDashboardPage } from "./pages/finance/FinanceDashboardPage";
import { KpiSnapshotsPage } from "./pages/finance/KpiSnapshotsPage";
import { ReportsPage } from "./pages/finance/ReportsPage";
import { GlobalSearchPage } from "./pages/GlobalSearchPage";
import { HelpCenterPage } from "./pages/HelpCenterPage";
import { InvoiceBuilderPage } from "./pages/invoices/InvoiceBuilderPage";
import { InvoiceDetailPage } from "./pages/invoices/InvoiceDetailPage";
import { InvoiceLinesPage } from "./pages/invoices/InvoiceLinesPage";
import { InvoiceListPage } from "./pages/invoices/InvoiceListPage";
import { LoginPage } from "./pages/LoginPage";
import { ManualCourtTimeEntryPage } from "./pages/calendar/ManualCourtTimeEntryPage";
import { MatterAssignmentsPage } from "./pages/matters/MatterAssignmentsPage";
import { MatterAuditPage } from "./pages/matters/MatterAuditPage";
import { MatterBillingPage } from "./pages/matters/MatterBillingPage";
import { MatterDetailPage } from "./pages/matters/MatterDetailPage";
import { MatterDocumentsPage } from "./pages/matters/MatterDocumentsPage";
import { MatterFormPage } from "./pages/matters/MatterFormPage";
import { MatterListPage } from "./pages/matters/MatterListPage";
import { MatterTimelinePage } from "./pages/matters/MatterTimelinePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { NotificationCenterPage } from "./pages/NotificationCenterPage";
import { PasswordHelpPage } from "./pages/PasswordHelpPage";
import { ClientPaymentPortalPage } from "./pages/payments/ClientPaymentPortalPage";
import { PaymentDashboardPage } from "./pages/payments/PaymentDashboardPage";
import { PaymentReconciliationPage } from "./pages/payments/PaymentReconciliationPage";
import { EmployeeProfilePage } from "./pages/people/EmployeeProfilePage";
import { HrDashboardPage } from "./pages/people/HrDashboardPage";
import { TeamDirectoryPage } from "./pages/people/TeamDirectoryPage";
import { WorkloadOverviewPage } from "./pages/people/WorkloadOverviewPage";
import { PermissionDeniedPage } from "./pages/PermissionDeniedPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ReceivablesAgingPage } from "./pages/payments/ReceivablesAgingPage";
import { RecordingDetailPage } from "./pages/recordings/RecordingDetailPage";
import { RecordingLibraryPage } from "./pages/recordings/RecordingLibraryPage";
import { RegisterInvitePage } from "./pages/RegisterInvitePage";
import { RateCardsPage } from "./pages/billing/RateCardsPage";
import { SetupStatusPage } from "./pages/SetupStatusPage";
import { GstDashboardPage } from "./pages/tax/GstDashboardPage";
import { TdsDashboardPage } from "./pages/tax/TdsDashboardPage";
import { MyWorkTodayPage } from "./pages/tasks/MyWorkTodayPage";
import { TaskBoardPage } from "./pages/tasks/TaskBoardPage";
import { TaskDetailPage } from "./pages/tasks/TaskDetailPage";
import { TaskFormPage } from "./pages/tasks/TaskFormPage";
import { TaskListPage } from "./pages/tasks/TaskListPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { CapturedWorkReviewPage } from "./pages/work/CapturedWorkReviewPage";
import { ManualTimeEntryPage } from "./pages/work/ManualTimeEntryPage";
import { SubmitWorkPage } from "./pages/work/SubmitWorkPage";
import { WorkMeterPage } from "./pages/work/WorkMeterPage";
import { WorkSessionHistoryPage } from "./pages/work/WorkSessionHistoryPage";

function ProtectedShell() {
  const { isAuthenticated, isLoading, logout, role, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-app p-4 md:p-8">
        <StateCard state="loading" title="Opening workspace" message="Your workspace is being prepared." />
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  return <AppShell role={role} user={user} onLogout={handleLogout} />;
}

function ProtectedPage({ route }) {
  const { role } = useAuth();

  if (!canAccess(role, route.moduleKey)) {
    return <PermissionDeniedPage />;
  }

  if (route.path === "/app/design-system") return <ComponentGalleryPage />;
  if (route.path === "/app/dashboard") return <DashboardPage />;
  if (route.path === "/app/setup-status") return <SetupStatusPage />;
  if (route.path === "/app/extension/setup") return <ExtensionSetupPage />;
  if (route.path === "/app/extension/status") return <ExtensionStatusPage />;
  if (route.path === "/app/extension/troubleshooting") return <ExtensionTroubleshootingPage />;
  if (route.path === "/app/notifications") return <NotificationCenterPage />;
  if (route.path === "/app/search") return <GlobalSearchPage />;
  if (route.path === "/app/help") return <HelpCenterPage />;
  if (route.path === "/app/clients") return <ClientListPage />;
  if (route.path === "/app/clients/new") return <ClientFormPage />;
  if (route.path === "/app/clients/:clientId/edit") return <ClientFormPage />;
  if (route.path === "/app/clients/:clientId") return <ClientDetailPage />;
  if (route.path === "/app/clients/:clientId/contacts") return <ClientContactsPage />;
  if (route.path === "/app/clients/:clientId/billing") return <ClientBillingPage />;
  if (route.path === "/app/billables") return <BillablesPage />;
  if (route.path === "/app/billables/approval") return <BillableApprovalPage />;
  if (route.path === "/app/billables/:billableId") return <BillableDetailPage />;
  if (route.path === "/app/rate-cards") return <RateCardsPage />;
  if (route.path === "/app/matters") return <MatterListPage />;
  if (route.path === "/app/matters/new") return <MatterFormPage />;
  if (route.path === "/app/matters/:matterId/edit") return <MatterFormPage />;
  if (route.path === "/app/matters/:matterId" || route.path === "/app/matters/:matterId/overview") return <MatterDetailPage />;
  if (route.path === "/app/matters/:matterId/team") return <MatterAssignmentsPage />;
  if (route.path === "/app/matters/:matterId/timeline") return <MatterTimelinePage />;
  if (route.path === "/app/matters/:matterId/documents") return <MatterDocumentsPage />;
  if (route.path === "/app/matters/:matterId/billing") return <MatterBillingPage />;
  if (route.path === "/app/matters/:matterId/audit") return <MatterAuditPage />;
  if (route.path === "/app/case-assignments") return <MatterAssignmentsPage />;
  if (route.path === "/app/tasks") return <TaskListPage />;
  if (route.path === "/app/tasks/board") return <TaskBoardPage />;
  if (route.path === "/app/tasks/new") return <TaskFormPage />;
  if (route.path === "/app/tasks/:taskId/edit") return <TaskFormPage />;
  if (route.path === "/app/tasks/:taskId") return <TaskDetailPage />;
  if (route.path === "/app/my-work-today") return <MyWorkTodayPage />;
  if (route.path === "/app/calendar" || route.path === "/app/hearings") return <CalendarHearingsPage />;
  if (route.path === "/app/hearings/manual-time") return <ManualCourtTimeEntryPage />;
  if (route.path === "/app/work-meter") return <WorkMeterPage />;
  if (route.path === "/app/work-sessions") return <WorkSessionHistoryPage />;
  if (route.path === "/app/time-entry/new") return <ManualTimeEntryPage />;
  if (route.path === "/app/time-entries") return <WorkSessionHistoryPage />;
  if (route.path === "/app/captured-work" || route.path === "/app/activities") return <CapturedWorkReviewPage />;
  if (route.path === "/app/gmail-review") return <CaptureReviewPage source="gmail" />;
  if (route.path === "/app/research-review") return <CaptureReviewPage source="research" />;
  if (route.path === "/app/recordings") return <RecordingLibraryPage />;
  if (route.path === "/app/recordings/:recordingId") return <RecordingDetailPage />;
  if (route.path === "/app/invoices") return <InvoiceListPage />;
  if (route.path === "/app/invoices/new") return <InvoiceBuilderPage />;
  if (route.path === "/app/invoices/:invoiceId") return <InvoiceDetailPage />;
  if (route.path === "/app/invoices/:invoiceId/lines") return <InvoiceLinesPage />;
  if (route.path === "/app/payments") return <PaymentDashboardPage />;
  if (route.path === "/app/reconciliation") return <PaymentReconciliationPage />;
  if (route.path === "/app/ar-aging") return <ReceivablesAgingPage />;
  if (["/app/finance", "/app/revenue", "/app/kpi", "/app/analytics"].includes(route.path)) return <FinanceDashboardPage />;
  if (route.path === "/app/kpi-snapshots") return <KpiSnapshotsPage />;
  if (route.path === "/app/reports") return <ReportsPage />;
  if (route.path === "/app/integration-logs") return <AuditLogsPage />;
  if (route.path === "/app/gst") return <GstDashboardPage />;
  if (route.path === "/app/tds") return <TdsDashboardPage />;
  if (route.path === "/app/hr") return <HrDashboardPage />;
  if (route.path === "/app/people") return <TeamDirectoryPage />;
  if (route.path === "/app/people/:userId") return <EmployeeProfilePage />;
  if (route.path === "/app/workload" || route.path === "/app/attendance") return <WorkloadOverviewPage />;
  if (route.path === "/app/submit-work") return <SubmitWorkPage />;
  if (route.path === "/app/profile") return <ProfilePage />;
  if (route.path === "/app/admin/users") return <UserManagementPage />;
  return <PlaceholderPage route={route} />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/fallback-gallery" element={<FallbackGalleryPage />} />
      <Route path="/pay/:paymentCode" element={<ClientPaymentPortalPage />} />
      {fallbackRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={<FallbackStatePage route={route} />} />
      ))}

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterInvitePage />} />
        <Route path="/forgot-password" element={<PasswordHelpPage />} />
        <Route path="/reset-password" element={<PasswordHelpPage mode="reset" />} />
      </Route>

      <Route element={<ProtectedShell />}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        {appRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={<ProtectedPage route={route} />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export { allRoutes };
export default App;
