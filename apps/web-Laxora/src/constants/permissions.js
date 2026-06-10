export const permissions = {
  admin: ["all"],
  partner: ["dashboard", "clients", "matters", "tasks", "work", "billing", "finance", "settings", "assistant", "extension"],
  lawyer: ["dashboard", "clients", "matters", "tasks", "work", "billing", "assistant", "extension", "support"],
  associate: ["dashboard", "matters", "tasks", "work", "billing", "assistant", "extension", "support"],
  intern: ["dashboard", "matters", "tasks", "work", "assistant", "support"],
};

export function canAccess(role, moduleKey) {
  const grants = permissions[role] || [];
  return grants.includes("all") || grants.includes(moduleKey);
}
