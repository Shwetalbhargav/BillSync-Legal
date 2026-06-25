import { Scale } from "lucide-react";
import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-background p-4">
      <div className="w-full min-w-0 max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-accent">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">BillSync Legal</h1>
            <p className="text-sm text-muted">Workspace Management</p>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
