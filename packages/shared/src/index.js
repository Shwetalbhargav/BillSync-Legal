export function idText(value) {
  return value == null ? '' : String(value);
}

export function uniq(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function normalizeKey(value) {
  return String(value || '').trim().toLowerCase();
}

export function normalizeArray(values = []) {
  return Array.isArray(values) ? values.filter(Boolean).map((value) => normalizeKey(value)) : [];
}

export function containsId(values = [], id) {
  const target = idText(id);
  return Array.isArray(values) && values.map(idText).includes(target);
}

export function byKey(items = []) {
  return new Map(items.map((item) => [item.key, item]));
}

export function packageBoundary(name, ownedAreas = []) {
  return {
    name,
    ownedAreas,
    tenantBoundary: 'Workspace',
    status: 'ready_for_extraction',
  };
}
