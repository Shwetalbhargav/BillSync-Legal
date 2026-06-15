const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'this', 'from', 'have', 'will', 'what', 'when',
  'where', 'which', 'there', 'their', 'about', 'into', 'your', 'how', 'does', 'work',
  'app', 'user', 'users', 'guide', 'help',
]);

const APP_GUIDE_ENTRIES = [
  {
    id: 'chrome-extension',
    title: 'Chrome extension capture',
    routes: ['/app/extension/setup', '/app/extension/status', '/app/extension/troubleshooting', '/app/gmail-review'],
    keywords: ['google', 'chrome', 'extension', 'gmail', 'capture', 'browser', 'setup', 'connect', 'icon'],
    answer: [
      'The Chrome extension helps users capture work from Gmail and browser research so it can be reviewed inside BillSync.',
      'Start at Extension Setup to load the unpacked extension and check the workspace connection. The app uses the extension token check plus recent captured Gmail or extension entries as the current readiness signal.',
      'After capture, go to Gmail Capture Review or Research Capture Review, map the item to a client and matter, generate a narrative if needed, then convert it into a time entry or captured work item.',
      'If it does not work, open Extension Troubleshooting and check the extension icon, backend URL, signed-in session, and whether new captured items appear in the review queue.',
    ],
  },
  {
    id: 'daily-work',
    title: 'Daily work flow',
    routes: ['/app/tasks', '/app/my-work-today', '/app/work-meter', '/app/captured-work', '/app/submit-work'],
    keywords: ['daily', 'today', 'tasks', 'task', 'work', 'meter', 'capture', 'captured', 'submit', 'approval', 'time'],
    answer: [
      'For daily work, start from My Tasks or My Work Today to see assigned work, priority, due date, client, and matter context.',
      'When starting focused work, open Work Meter, select the client and matter, optionally choose a task, then start the timer. You can pause, resume, stop, save as draft, or submit for review.',
      'Captured Work is the review queue for meter sessions, extension captures, and manual activity. Review the matter mapping and narrative before converting or submitting.',
      'Use Submit Work when entries are ready for approval. Approved time can then move toward billing review.',
    ],
  },
  {
    id: 'matters',
    title: 'Client and matter work',
    routes: ['/app/clients', '/app/matters', '/app/matters/new', '/app/document-storage'],
    keywords: ['client', 'clients', 'matter', 'matters', 'case', 'cases', 'document', 'storage', 'timeline', 'team'],
    answer: [
      'Clients hold the business relationship, contacts, billing settings, and linked matters. Matters hold the legal work, team, status, billing type, timeline, documents, and audit trail.',
      'Create or open a client first, then create a matter with title, description, matter type, billing type, opened date, and assigned team context.',
      'Use the matter tabs for overview, team, timeline, documents, billing, and audit. Document Storage lists linked document metadata and provider references.',
      'For matter-specific AI answers, add source notes in Assistant Documents, then ask from Matter Document Q&A so citations can point back to the saved notes.',
    ],
  },
  {
    id: 'assistant-rag',
    title: 'Assistant and RAG',
    routes: ['/app/assistant', '/app/assistant/documents', '/app/assistant/documents/qa', '/app/assistant/documents/create'],
    keywords: ['assistant', 'ai', 'rag', 'chatbot', 'chat', 'question', 'summary', 'summarize', 'draft', 'citation', 'citations'],
    answer: [
      'The global assistant is for app guidance, daily-work coaching, summaries, checklists, and drafts from the current screen.',
      'Matter Document Q&A is the source-backed RAG area. Save matter source notes first, then ask a question against those notes. Answers include citations from the saved source material.',
      'Document Summary stores source notes against a matter. Document Creation can generate a draft using the indexed matter notes.',
      'Use the global assistant for workflow help; use Matter Q&A when the answer must be grounded in matter documents.',
    ],
  },
  {
    id: 'billing',
    title: 'Billing and finance',
    routes: ['/app/billables', '/app/billables/approval', '/app/invoices', '/app/payments', '/app/finance'],
    keywords: ['billing', 'billable', 'billables', 'invoice', 'invoices', 'payment', 'finance', 'rate', 'approval', 'receivable'],
    answer: [
      'Billing starts from reviewed work and billables. Users can review billable details, rates, status, and approval readiness.',
      'Reviewer roles use the approval queue to approve or reject billables. Approved billables can feed invoice preparation.',
      'Invoices cover invoice lists, invoice builder, invoice detail, and invoice lines. Payments and reconciliation track payment status and receivables.',
      'Finance dashboards summarize revenue, KPI snapshots, reports, audit logs, payments, and receivables for firm review.',
    ],
  },
  {
    id: 'admin-setup',
    title: 'Admin setup and integrations',
    routes: ['/app/settings', '/app/admin/users', '/app/integrations/zoho', '/app/integrations/cloud-storage'],
    keywords: ['admin', 'settings', 'setup', 'permissions', 'roles', 'users', 'zoho', 'cloud', 'storage', 'google', 'aws'],
    answer: [
      'Admin setup lives in Settings and User Management. Admins can review firm defaults, invoice and tax settings, notifications, storage defaults, permissions, and users.',
      'Integration readiness lives under Extension Setup, Zoho Integration, and Cloud Storage. Current screens show connection guidance and calm not-configured states when provider-specific backend routes are still planned.',
      'For Zoho, the app supports connection and sync surfaces for client, matter, invoice, CRM, and WorkDrive style workflows where routes are available.',
      'For cloud storage, the app can show linked document records today, while direct provider health and binary transfer routes are tracked as backend gaps.',
    ],
  },
];

function tokenize(value = '') {
  return String(value)
    .toLowerCase()
    .match(/[a-z0-9]{3,}/g)
    ?.filter((word) => !STOP_WORDS.has(word)) || [];
}

function scoreEntry(entry, queryTokens, context = {}) {
  const haystack = `${entry.title} ${entry.keywords.join(' ')} ${entry.routes.join(' ')} ${entry.answer.join(' ')}`.toLowerCase();
  const tokenScore = queryTokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
  const pathScore = entry.routes.some((route) => String(context.currentPath || '').startsWith(route)) ? 2 : 0;
  const query = queryTokens.join(' ');
  const intentBoost =
    entry.id === 'chrome-extension' && (query.includes('extension') || query.includes('gmail') || query.includes('chrome')) ? 4 :
    entry.id === 'daily-work' && (query.includes('daily') || query.includes('today') || query.includes('meter')) ? 4 :
    entry.id === 'assistant-rag' && (query.includes('rag') || query.includes('chatbot') || query.includes('citation')) ? 4 :
    0;
  return tokenScore + pathScore + intentBoost;
}

function selectEntries(input, context) {
  const queryTokens = tokenize(input);
  const ranked = APP_GUIDE_ENTRIES
    .map((entry) => ({ entry, score: scoreEntry(entry, queryTokens, context) }))
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));

  const matches = ranked.filter((item) => item.score > 0).slice(0, 2).map((item) => item.entry);
  return matches.length ? matches : [APP_GUIDE_ENTRIES.find((entry) => entry.id === 'daily-work')];
}

function formatRoutes(routes) {
  return routes.slice(0, 4).map((route) => `- ${route}`).join('\n');
}

export function buildAppGuideAnswer({ input, context = {} }) {
  const matches = selectEntries(input, context);
  const primary = matches[0];
  const secondary = matches[1];
  const currentPath = context.currentPath ? `\n\nCurrent screen: ${context.currentPath}` : '';
  const secondaryText = secondary
    ? `\n\nRelated area: ${secondary.title}\n${secondary.answer.slice(0, 2).join('\n')}\nRoutes:\n${formatRoutes(secondary.routes)}`
    : '';

  return {
    title: primary.title,
    text: [
      primary.answer.join('\n'),
      '',
      'Open these screens:',
      formatRoutes(primary.routes),
      currentPath,
      secondaryText,
    ].filter(Boolean).join('\n'),
    citations: matches.map((entry) => ({
      source: 'BillSync app guide',
      title: entry.title,
      routes: entry.routes,
    })),
  };
}

export { APP_GUIDE_ENTRIES };
