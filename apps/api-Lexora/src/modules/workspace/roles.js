export const COMMERCIAL_ROLES = ['owner', 'lawyer', 'billing_assistant', 'accountant'];

export const LEGACY_ROLE_MAP = {
  admin: 'owner',
  partner: 'owner',
  associate: 'lawyer',
  intern: 'lawyer',
  lawyer: 'lawyer',
  owner: 'owner',
  billing_assistant: 'billing_assistant',
  accountant: 'accountant',
};

export function normalizeRole(role) {
  return LEGACY_ROLE_MAP[String(role || '').toLowerCase()] || String(role || '').toLowerCase();
}

export function isOwner(role) {
  return normalizeRole(role) === 'owner';
}

export function canManageMembership(role) {
  return isOwner(role);
}

export function canMutateLegalWork(role) {
  return ['owner', 'lawyer'].includes(normalizeRole(role));
}

export function canMutateFinancialRecords(role) {
  return ['owner', 'billing_assistant'].includes(normalizeRole(role));
}

export function canReadFinancialRecords(role) {
  return ['owner', 'billing_assistant', 'accountant'].includes(normalizeRole(role));
}

