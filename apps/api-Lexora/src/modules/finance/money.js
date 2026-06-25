export const PAISE_PER_RUPEE = 100;

export function toPaise(value) {
  if (value == null || value === '') return 0;
  if (Number.isInteger(value) && Math.abs(value) > 999999) return value;
  return Math.round(Number(value || 0) * PAISE_PER_RUPEE);
}

export function fromPaise(paise) {
  return Math.round(Number(paise || 0)) / PAISE_PER_RUPEE;
}

export function roundPaise(value) {
  return Math.round(Number(value || 0));
}

export function calculateLineAmountPaise({ qtyHours, durationMinutes, ratePerHourPaise, amountPaise, adjustmentPaise = 0 }) {
  if (amountPaise != null) return roundPaise(Number(amountPaise) + Number(adjustmentPaise || 0));
  const hours = qtyHours != null ? Number(qtyHours) : Number(durationMinutes || 0) / 60;
  return roundPaise(Number(ratePerHourPaise || 0) * hours + Number(adjustmentPaise || 0));
}

export function calculateTax({ grossOrNetPaise, taxRatePct = 0, inclusive = false }) {
  const source = roundPaise(grossOrNetPaise);
  const rate = Number(taxRatePct || 0) / 100;
  if (rate <= 0) {
    return { subtotalPaise: source, taxPaise: 0, totalPaise: source };
  }

  if (inclusive) {
    const subtotalPaise = roundPaise(source / (1 + rate));
    const taxPaise = source - subtotalPaise;
    return { subtotalPaise, taxPaise, totalPaise: source };
  }

  const taxPaise = roundPaise(source * rate);
  return { subtotalPaise: source, taxPaise, totalPaise: source + taxPaise };
}

export function addPaise(rows = [], field = 'amountPaise') {
  return rows.reduce((sum, row) => sum + roundPaise(row?.[field] || 0), 0);
}

