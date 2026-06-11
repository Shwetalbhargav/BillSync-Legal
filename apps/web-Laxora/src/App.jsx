import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { AppShell } from "./components/layout/AppShell";
import { AuthLayout } from "./components/layout/AuthLayout";
import { StateCard } from "./components/common/StateCard";
import { canAccess } from "./constants/permissions";
import { allRoutes, appRoutes, fallbackRoutes } from "./routes/routeConfig";
import { ComponentGalleryPage } from "./pages/ComponentGalleryPage";
import { FallbackStatePage } from "./pages/FallbackStatePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PasswordHelpPage } from "./pages/PasswordHelpPage";
import { PermissionDeniedPage } from "./pages/PermissionDeniedPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterInvitePage } from "./pages/RegisterInvitePage";
import { UserManagementPage } from "./pages/UserManagementPage";

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
  if (route.path === "/app/profile") return <ProfilePage />;
  if (route.path === "/app/admin/users") return <UserManagementPage />;
  return <PlaceholderPage route={route} />;
}

function AppRoutes() {
  return (
    <Routes>
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
        {fallbackRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={<FallbackStatePage route={route} />} />
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
