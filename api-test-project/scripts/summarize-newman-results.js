const fs = require('node:fs');
const path = require('node:path');

const file = process.argv[2] || path.join(__dirname, '..', 'reports', 'results.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

function folderFromCursor(cursor = {}) {
  const ref = cursor.ref || '';
  const parts = ref.split('/').filter(Boolean);
  return parts[0] || 'Unknown';
}

const failures = (data.run?.failures || []).map((failure) => ({
  folder: folderFromCursor(failure.cursor),
  request: failure.source?.name || failure.parent?.name || 'Unknown request',
  assertion: failure.error?.test || failure.error?.name || 'Unknown assertion',
  message: failure.error?.message || '',
}));

const byFolder = {};
for (const failure of failures) {
  byFolder[failure.folder] ||= { count: 0, requests: new Set(), messages: [] };
  byFolder[failure.folder].count += 1;
  byFolder[failure.folder].requests.add(failure.request);
  if (byFolder[failure.folder].messages.length < 5) {
    byFolder[failure.folder].messages.push(`${failure.request}: ${failure.assertion} - ${failure.message}`);
  }
}

const executions = data.run?.executions || [];
const executedByFolder = {};
for (const execution of executions) {
  const folder = execution.item?.name?.startsWith('Smoke -') ? 'Smoke' : folderFromCursor(execution.cursor);
  executedByFolder[folder] = (executedByFolder[folder] || 0) + 1;
}

const summary = {
  stats: data.run?.stats,
  timings: data.run?.timings,
  failureCount: failures.length,
  failedFolders: Object.fromEntries(Object.entries(byFolder).map(([folder, value]) => [
    folder,
    {
      assertions: value.count,
      requests: [...value.requests],
      examples: value.messages,
    },
  ])),
  executedByFolder,
};

console.log(JSON.stringify(summary, null, 2));
