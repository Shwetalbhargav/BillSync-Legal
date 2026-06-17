import { Outlet } from "react-router-dom";
import { useState } from "react";
import { GlobalAssistantDrawer } from "../assistant/GlobalAssistantDrawer";
import { GlobalAssistantButton } from "../assistant/GlobalAssistantButton";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { PageContainer } from "./PageContainer";
import { Sidebar } from "./Sidebar";

export function AppShell({ role, user, onLogout }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  return (
    <div className="min-h-screen min-w-0 bg-app">
      <a className="focus-ring sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary focus:shadow-soft" href="#main-content">
        Skip to main content
      </a>
      <Sidebar collapsed={isSidebarCollapsed} onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)} role={role} />
      <div className={isSidebarCollapsed ? "min-w-0 lg:pl-20" : "min-w-0 lg:pl-64"}>
        <Header onLogout={onLogout} role={role} user={user} />
        <PageContainer>
          <Outlet />
        </PageContainer>
      </div>
      <GlobalAssistantButton onClick={() => setIsAssistantOpen(true)} />
      <GlobalAssistantDrawer isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
      <BottomNav role={role} />
    </div>
  );
}
