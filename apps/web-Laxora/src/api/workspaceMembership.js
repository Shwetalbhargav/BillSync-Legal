import { request } from "./client.js";
import { asList, normalizeUser, toId } from "./normalizers.js";

export const workspaceRoles = [
  { value: "owner", label: "Owner" },
  { value: "lawyer", label: "Lawyer" },
  { value: "billing_assistant", label: "Billing Assistant" },
  { value: "accountant", label: "Accountant" },
];

export const planOptions = [
  {
    key: "solo",
    name: "Solo",
    summary: "For one person setting up a private workspace.",
    memberLimit: 1,
  },
  {
    key: "professional",
    name: "Professional",
    summary: "For a small team with shared clients, matters, billing, and reports.",
    memberLimit: 5,
  },
];

export function normalizeWorkspace(workspace = {}) {
  return {
    id: toId(workspace),
    name: workspace.name || "Workspace",
    status: workspace.status || "active",
    slug: workspace.slug || "",
    limits: workspace.limits || {},
    onboarding: workspace.onboarding || {},
    raw: workspace,
  };
}

export function normalizeMembership(membership = {}) {
  return {
    id: toId(membership),
    workspaceId: membership.workspaceId || membership.workspace?.id || toId(membership.workspace),
    role: membership.role || "lawyer",
    status: membership.status || "active",
    permissions: membership.permissions || [],
    workspace: normalizeWorkspace(membership.workspace || {}),
    user: membership.user ? normalizeUser(membership.user) : null,
    raw: membership,
  };
}

export function normalizeInvitation(invitation = {}) {
  return {
    id: toId(invitation),
    workspaceId: invitation.workspaceId,
    email: invitation.email || "",
    role: invitation.role || "lawyer",
    status: invitation.status || "pending",
    expiresAt: invitation.expiresAt || null,
    inviteCode: invitation.token || invitation.inviteCode || "",
    raw: invitation,
  };
}

function unwrapData(response) {
  return response?.data || response || {};
}

export const workspaceMembershipApi = {
  async context() {
    const data = unwrapData(await request("/api/workspace/context"));
    return {
      workspace: normalizeWorkspace(data.workspace || {}),
      memberships: asList(data.memberships).map(normalizeMembership),
      activeMembership: data.activeMembership ? normalizeMembership(data.activeMembership) : null,
    };
  },
  async switchWorkspace(workspaceId) {
    const data = await request("/api/auth/switch-workspace", { method: "POST", body: { workspaceId } });
    return {
      user: data?.user ? normalizeUser(data.user) : null,
      membership: data?.membership ? normalizeMembership(data.membership) : null,
    };
  },
  async members() {
    return asList(await request("/api/workspace/memberships")).map(normalizeMembership);
  },
  async invite(body) {
    return normalizeInvitation(unwrapData(await request("/api/workspace/invitations", { method: "POST", body })));
  },
  async acceptInvite(body) {
    const { inviteCode, ...rest } = body || {};
    return unwrapData(await request("/api/workspace/invitations/accept", { method: "POST", body: { ...rest, token: inviteCode } }));
  },
};
