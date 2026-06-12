import { Outlet } from "react-router-dom";
import { GlobalAssistantButton } from "../assistant/GlobalAssistantButton";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { PageContainer } from "./PageContainer";
import { Sidebar } from "./Sidebar";

export function AppShell({ role, user, onLogout }) {
  return (
    <div className="min-h-screen min-w-0 bg-app">
      <a className="focus-ring sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary focus:shadow-soft" href="#main-content">
        Skip to main content
      </a>
      <Sidebar role={role} />
      <div className="min-w-0 lg:pl-64">
        <Header role={role} user={user} onLogout={onLogout} />
        <PageContainer>
          <Outlet />
        </PageContainer>
      </div>
      <GlobalAssistantButton />
      <BottomNav role={role} />
    </div>
  );
}
