import { Outlet } from "react-router-dom";
import { GlobalAssistantButton } from "../assistant/GlobalAssistantButton";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { PageContainer } from "./PageContainer";
import { Sidebar } from "./Sidebar";

export function AppShell({ role, onRoleChange }) {
  return (
    <div className="min-h-screen bg-app">
      <Sidebar role={role} />
      <div className="lg:pl-64">
        <Header role={role} onRoleChange={onRoleChange} />
        <PageContainer>
          <Outlet />
        </PageContainer>
      </div>
      <GlobalAssistantButton />
      <BottomNav role={role} />
    </div>
  );
}
