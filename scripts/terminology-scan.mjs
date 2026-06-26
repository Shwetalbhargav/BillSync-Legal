import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const reportDir = path.join(root, 'audit-reports');
const reportPath = path.join(reportDir, 'terminology-scan.json');

const scanTargets = [
  'apps/web-Laxora/src',
  'apps/api-Lexora/src/modules/ai/services/appGuideService.js',
  'apps/api-Lexora/src/modules/workspace',
  'docs/operations',
];

const rawTechnicalTerms = [
  /\bworkspaceId\b/i,
  /\btenant\b/i,
  /\bdatabase\b/i,
  /\bbackend\b/i,
];

const legacyTenantTerms = [
  /\bfirm\b/i,
  /\bcompany\b/i,
  /\borganization\b/i,
];

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function filesUnder(target) {
  const absolute = path.join(root, target);
  if (!(await exists(absolute))) return [];
  const stat = await fs.stat(absolute);
  if (stat.isFile()) return [absolute];
  const entries = await fs.readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const child = path.join(absolute, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(path.relative(root, child)));
    else if (/\.(js|jsx|ts|tsx|md)$/.test(entry.name)) files.push(child);
  }
  return files;
}

function lineMatches(line, patterns) {
  return patterns.some((pattern) => pattern.test(line));
}

const files = (await Promise.all(scanTargets.map(filesUnder))).flat();
const findings = [];

for (const file of files) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const text = await fs.readFile(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    const rawTechnical = lineMatches(line, rawTechnicalTerms);
    const legacyTenant = lineMatches(line, legacyTenantTerms);
    if (!rawTechnical && !legacyTenant) return;
    findings.push({
      file: relative,
      line: index + 1,
      category: rawTechnical ? 'raw_technical_or_tenant_copy' : 'legacy_tenant_term',
      text: line.trim().slice(0, 220),
    });
  });
}

await fs.mkdir(reportDir, { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify({
  ok: true,
  generatedAt: new Date().toISOString(),
  scannedFiles: files.length,
  findingCount: findings.length,
  note: 'This scan is informational while legacy Firm copy is retired incrementally. New production copy should use Workspace and avoid raw technical terms.',
  findings,
}, null, 2)}\n`);

console.log(`Terminology scan complete: ${findings.length} findings written to ${path.relative(root, reportPath)}`);
