import { LogOut, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/common/Button";
import { StateCard } from "../components/common/StateCard";
import { StatusBadge } from "../components/common/StatusBadge";

function Detail({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <dt className="text-xs font-bold uppercase text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-ink">{value || "Not added yet"}</dd>
    </div>
  );
}

export function ProfilePage() {
  const { user, refreshCurrentUser, logout } = useAuth();
  const [message, setMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();

  async function handleRefresh() {
    setIsRefreshing(true);
    setMessage("");
    const latestUser = await refreshCurrentUser();
    setMessage(latestUser ? "Profile refreshed." : "Please sign in again to view your profile.");
    setIsRefreshing(false);
  }

  async function handleLogout() {
    setIsSigningOut(true);
    await logout();
    navigate("/login", { replace: true });
  }

  if (!user) {
    return <StateCard state="permission" title="Sign in needed" message="Please sign in to view your profile." />;
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="rounded-lg bg-blueSoft p-3 text-primary">
              <UserRound className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">My Profile</p>
              <h1 className="mt-1 break-words text-2xl font-bold text-primary md:text-3xl">{user.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge tone="success">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  Signed in
                </StatusBadge>
                <StatusBadge>{user.role}</StatusBadge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button isLoading={isRefreshing} onClick={handleRefresh} type="button" variant="secondary">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button isLoading={isSigningOut} onClick={handleLogout} type="button" variant="danger">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </section>

      {message ? <StateCard state={message.includes("refreshed") ? "success" : "permission"} title="Profile status" message={message} /> : null}

      <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Detail label="Name" value={user.name} />
        <Detail label="Role" value={user.role} />
        <Detail label="Mobile" value={user.mobile} />
        <Detail label="Work email" value={user.email} />
      </dl>
    </div>
  );
}
