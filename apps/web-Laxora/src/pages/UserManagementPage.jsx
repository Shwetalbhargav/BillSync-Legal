import { RefreshCw, UserCog, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { usersApi } from "../api/users.js";
import { asList, normalizeUser } from "../api/normalizers.js";
import { Button } from "../components/common/Button";
import { DataTable } from "../components/common/DataTable";
import { Skeleton } from "../components/common/Skeleton";
import { StateCard } from "../components/common/StateCard";
import { StatusBadge } from "../components/common/StatusBadge";

const columns = [
  { key: "name", label: "Name" },
  { key: "role", label: "Role" },
  { key: "email", label: "Work email" },
  { key: "mobile", label: "Mobile" },
];

function toRow(user) {
  return {
    id: user.id || `${user.name}-${user.mobile}`,
    name: user.name,
    role: <StatusBadge>{user.role}</StatusBadge>,
    email: user.email || "Not added yet",
    mobile: user.mobile || "Not added yet",
  };
}

export function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async () => {
    setStatus("loading");
    setMessage("");
    try {
      const response = await usersApi.list({ limit: 50 });
      const normalizedUsers = asList(response).map(normalizeUser);
      setUsers(normalizedUsers);
      setStatus(normalizedUsers.length ? "ready" : "empty");
    } catch (error) {
      setUsers([]);
      setStatus("error");
      setMessage(error?.userMessage || "We could not load the team list right now. Please try again.");
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="rounded-lg bg-blueSoft p-3 text-primary">
              <UserCog className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">Admin</p>
              <h1 className="mt-1 text-2xl font-bold text-primary md:text-3xl">User Management</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Review firm members, roles, and contact details before deeper access tools are added.
              </p>
            </div>
          </div>
          <Button isLoading={status === "loading"} onClick={loadUsers} type="button" variant="secondary">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </section>

      {status === "loading" ? (
        <section className="surface-card space-y-3 p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </section>
      ) : null}

      {status === "empty" ? (
        <StateCard state="empty" title="No firm members found" message="When users are added to the firm, they will appear here for review." />
      ) : null}

      {status === "error" ? <StateCard state="error" title="Team list needs attention" message={message} actionLabel="Retry" /> : null}

      {status === "ready" ? (
        <section className="surface-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted">
            <Users className="h-4 w-4" />
            {users.length} team member{users.length === 1 ? "" : "s"}
          </div>
          <DataTable columns={columns} rows={users.map(toRow)} />
        </section>
      ) : null}
    </div>
  );
}
