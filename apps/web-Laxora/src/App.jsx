import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "./components/layout/AuthLayout";
import { AppShell } from "./components/layout/AppShell";
import { defaultRole } from "./constants/roles";
import { allRoutes, appRoutes, fallbackRoutes } from "./routes/routeConfig";
import { ComponentGalleryPage } from "./pages/ComponentGalleryPage";
import { FallbackStatePage } from "./pages/FallbackStatePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { PublicPlaceholderPage } from "./pages/PublicPlaceholderPage";

function App() {
  const [role, setRole] = useState(defaultRole);

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<PublicPlaceholderPage title="Accept Invite" />} />
        <Route path="/forgot-password" element={<PublicPlaceholderPage title="Forgot Password" />} />
        <Route path="/reset-password" element={<PublicPlaceholderPage title="Reset Password" />} />
      </Route>

      <Route element={<AppShell role={role} onRoleChange={setRole} />}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        {appRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={route.path === "/app/design-system" ? <ComponentGalleryPage /> : <PlaceholderPage route={route} />}
          />
        ))}
        {fallbackRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={<FallbackStatePage route={route} />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export { allRoutes };
export default App;
