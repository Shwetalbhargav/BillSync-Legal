export const GST_REGISTRATION_STATUSES = ['registered', 'unregistered', 'not_applicable'];

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function normalizeProfessionalRegistration(payload = {}) {
  const next = { ...payload };
  for (const field of ['stateBarCouncil', 'enrolmentNo', 'pan', 'gstin', 'gstRegistrationStatus', 'professionalAddress', 'signatureImageUrl']) {
    if (typeof next[field] === 'string') next[field] = next[field].trim();
  }
  if (next.pan) next.pan = next.pan.toUpperCase();
  if (next.gstin) next.gstin = next.gstin.toUpperCase();
  if (next.gstRegistrationStatus) next.gstRegistrationStatus = next.gstRegistrationStatus.toLowerCase();
  return next;
}

export function validateProfessionalRegistration(payload = {}) {
  const errors = [];
  if (payload.pan && !PAN_REGEX.test(payload.pan)) {
    errors.push({ field: 'pan', message: 'PAN must use the Indian PAN format, for example ABCDE1234F.' });
  }
  if (payload.gstin && !GSTIN_REGEX.test(payload.gstin)) {
    errors.push({ field: 'gstin', message: 'GSTIN must use the 15-character Indian GSTIN format.' });
  }
  if (payload.gstRegistrationStatus && !GST_REGISTRATION_STATUSES.includes(payload.gstRegistrationStatus)) {
    errors.push({ field: 'gstRegistrationStatus', message: 'GST registration status must be registered, unregistered, or not_applicable.' });
  }
  return errors;
}

export function maskSensitiveRegistrationValue(field, value) {
  if (!value) return '';
  const text = String(value);
  if (field === 'pan') return text.length > 5 ? `${text.slice(0, 3)}****${text.slice(-1)}` : '****';
  if (field === 'gstin') return text.length > 6 ? `${text.slice(0, 2)}***********${text.slice(-2)}` : '****';
  return text;
}

export function collectRegistrationAuditChanges(before = {}, after = {}, actorId) {
  const fields = ['stateBarCouncil', 'enrolmentNo', 'enrolmentDate', 'pan', 'gstin', 'gstRegistrationStatus', 'professionalAddress', 'signatureImageUrl'];
  return fields
    .filter((field) => String(before[field] ?? '') !== String(after[field] ?? ''))
    .map((field) => ({
      action: 'professional_registration_changed',
      field,
      actorId,
      at: new Date(),
      oldValue: maskSensitiveRegistrationValue(field, before[field]),
      newValue: maskSensitiveRegistrationValue(field, after[field]),
    }));
}
