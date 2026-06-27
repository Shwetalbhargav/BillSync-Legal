export const permissions = {
  owner: ["dashboard", "clients", "matters", "tasks", "work", "billing", "finance", "analytics", "reports", "settings", "assistant", "ai", "documents", "court-sync", "integrations", "extension", "support"],
  admin: ["dashboard", "clients", "matters", "tasks", "work", "billing", "finance", "analytics", "reports", "settings", "assistant", "ai", "documents", "court-sync", "integrations", "extension", "support"],
  partner: ["dashboard", "clients", "matters", "tasks", "work", "billing", "finance", "analytics", "reports", "settings", "assistant", "ai", "documents", "court-sync", "integrations", "extension", "support"],
  lawyer: ["dashboard", "clients", "matters", "tasks", "work", "billing", "assistant", "ai", "documents", "court-sync", "extension", "support"],
  associate: ["dashboard", "matters", "tasks", "work", "billing", "assistant", "ai", "documents", "court-sync", "extension", "support"],
  intern: ["dashboard", "matters", "tasks", "work", "assistant", "ai", "documents", "court-sync", "extension", "support"],
  billing_assistant: ["dashboard", "clients", "billing", "finance", "reports", "settings", "support"],
  accountant: ["dashboard", "billing", "finance", "reports", "settings", "support"],
};

export function canAccess(role, moduleKey) {
  const grants = permissions[String(role || "").toLowerCase()] || [];
  return grants.includes("all") || grants.includes(moduleKey);
}
