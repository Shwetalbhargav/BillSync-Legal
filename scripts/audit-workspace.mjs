import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const workspaces = [
  ['api', 'apps/api-Lexora'],
  ['web', 'apps/web-Laxora'],
  ['desktop', 'apps/desktop-Lexora'],
  ['extension', 'apps/extension'],
];

const reportsDir = 'audit-reports';

function runAudit(name, cwd) {
  return new Promise((done) => {
    const command = process.platform === 'win32' ? 'cmd.exe' : 'npm';
    const args =
      process.platform === 'win32'
        ? ['/d', '/s', '/c', 'npm audit --audit-level=high --json']
        : ['audit', '--audit-level=high', '--json'];
    const child = spawn(command, args, {
      cwd: resolve(cwd),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('close', (code) => {
      done({ name, cwd, code, stdout, stderr });
    });
  });
}

function summarize(report) {
  const metadata = report.metadata?.vulnerabilities ?? {};
  const critical = metadata.critical ?? 0;
  const high = metadata.high ?? 0;
  const moderate = metadata.moderate ?? 0;
  const low = metadata.low ?? 0;
  return { critical, high, moderate, low };
}

await mkdir(reportsDir, { recursive: true });

let hasHighOrCritical = false;
for (const [name, cwd] of workspaces) {
  const result = await runAudit(name, cwd);
  const reportPath = join(reportsDir, `${name}.audit.json`);
  let report;

  try {
    report = JSON.parse(result.stdout || '{}');
  } catch {
    report = {
      error: 'npm audit did not produce valid JSON',
      stdout: result.stdout,
      stderr: result.stderr,
    };
  }

  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  const counts = summarize(report);
  if (counts.critical || counts.high) {
    hasHighOrCritical = true;
  }

  console.log(
    `${name}: critical=${counts.critical} high=${counts.high} moderate=${counts.moderate} low=${counts.low} report=${reportPath}`
  );

  if (result.stderr.trim()) {
    console.warn(result.stderr.trim());
  }
}

if (hasHighOrCritical) {
  console.log('High or critical advisories were found. Review docs/operations/dependency-risk-register.md before pilot approval.');
}
