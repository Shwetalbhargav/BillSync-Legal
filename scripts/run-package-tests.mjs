import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const packagesDir = join(process.cwd(), 'packages');
const packageNames = readdirSync(packagesDir).filter((name) => statSync(join(packagesDir, name)).isDirectory());

let failed = false;
for (const name of packageNames) {
  const cwd = join(packagesDir, name);
  console.log(`\n==> ${name}`);
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(command, ['test'], { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) {
    console.error(result.error.message);
    failed = true;
    continue;
  }
  if (result.status !== 0) failed = true;
}

process.exit(failed ? 1 : 0);
