const target = process.env.LOAD_TEST_TARGET_URL;
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY || 10);
const requests = Number(process.env.LOAD_TEST_REQUESTS || 50);

if (!target) {
  console.log('Load smoke not configured. Set LOAD_TEST_TARGET_URL to run against staging.');
  process.exit(0);
}

const url = new URL('/healthz', target).toString();
let completed = 0;
let failed = 0;
const started = Date.now();

async function worker() {
  while (completed + failed < requests) {
    try {
      const response = await fetch(url, { headers: { 'x-request-id': `load-smoke-${completed + failed}` } });
      if (!response.ok) failed += 1;
      else completed += 1;
    } catch {
      failed += 1;
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
const durationMs = Date.now() - started;
console.log(JSON.stringify({ ok: failed === 0, url, requests, completed, failed, durationMs }, null, 2));
if (failed) process.exit(1);
