export function parseIndianDate(text) {
  if (!text) return null;
  const clean = String(text).trim();
  const ddmmyyyy = clean.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);

  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00.000Z`);
  }

  const parsed = Date.parse(clean);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}
