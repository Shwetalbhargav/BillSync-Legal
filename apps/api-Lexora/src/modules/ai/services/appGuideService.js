import User from '../../users/models/User.js';
import PartnerProfile from '../../users/models/PartnerProfile.js';
import LawyerProfile from '../../users/models/LawyerProfile.js';
import AssociateProfile from '../../users/models/AssociateProfile.js';
import InternProfile from '../../users/models/InternProfile.js';
import Firm from '../../firms/models/Firm.js';

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
      'If it does not work, open Extension Troubleshooting and check the extension icon, connection settings, signed-in session, and whether new captured items appear in the review queue.',
    ],
  },
  {
    id: 'people-firm',
    title: 'Firm and professional profiles',
    routes: ['/app/people', '/app/profile', '/app/settings', '/app/dashboard'],
    keywords: ['firm', 'team', 'people', 'user', 'users', 'partner', 'partners', 'parnter', 'lawyer', 'lawyers', 'associate', 'intern', 'profile', 'professional', 'career', 'experience'],
    answer: [
      'BillSync can help explain the firm, team roles, and saved professional profiles in plain language.',
      'For partners and lawyers, it can use saved details such as title, specializations, years of experience, landmark matters, achievements, publications, and standard billing rate.',
      'For interns, it can use saved details such as law school, graduation year, mentor, and internship focus.',
      'Use this for professional introductions, internal context, staffing awareness, and understanding who is best placed for a matter.',
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

function scoreEntry(entry, queryTokens, context = {}, input = '') {
  const haystack = `${entry.title} ${entry.keywords.join(' ')} ${entry.routes.join(' ')} ${entry.answer.join(' ')}`.toLowerCase();
  const tokenScore = queryTokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
  const wantsCurrentScreenHelp = /\b(here|screen|page|use|using|do|guide|help|workflow|where|how)\b/i.test(input);
  const pathScore = (tokenScore > 0 || wantsCurrentScreenHelp) && entry.routes.some((route) => String(context.currentPath || '').startsWith(route)) ? 2 : 0;
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
    .map((entry) => ({ entry, score: scoreEntry(entry, queryTokens, context, input) }))
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));

  const matches = ranked.filter((item) => item.score > 0).slice(0, 2).map((item) => item.entry);
  return matches;
}

const SCREEN_NAMES = {
  '/app/extension/setup': 'Extension Setup',
  '/app/extension/status': 'Extension Status',
  '/app/extension/troubleshooting': 'Extension Troubleshooting',
  '/app/gmail-review': 'Gmail Capture Review',
  '/app/research-review': 'Research Capture Review',
  '/app/tasks': 'My Tasks',
  '/app/my-work-today': 'My Work Today',
  '/app/work-meter': 'Work Meter',
  '/app/captured-work': 'Captured Work',
  '/app/submit-work': 'Submit Work',
  '/app/clients': 'Clients',
  '/app/matters': 'Matters',
  '/app/matters/new': 'New Matter',
  '/app/document-storage': 'Document Storage',
  '/app/assistant': 'Assistant',
  '/app/assistant/documents': 'Document Summary',
  '/app/assistant/documents/qa': 'Matter Q&A',
  '/app/assistant/documents/create': 'Document Creation',
  '/app/billables': 'Billables',
  '/app/billables/approval': 'Billable Approval',
  '/app/invoices': 'Invoices',
  '/app/payments': 'Payments',
  '/app/finance': 'Finance',
  '/app/settings': 'Settings',
  '/app/admin/users': 'User Management',
  '/app/integrations/zoho': 'Zoho Integration',
  '/app/integrations/cloud-storage': 'Cloud Storage',
  '/app/people': 'People Directory',
  '/app/profile': 'My Profile',
  '/app/dashboard': 'Dashboard',
};

function formatScreens(routes) {
  return routes.slice(0, 4).map((route) => `- ${SCREEN_NAMES[route] || route.replace('/app/', '').replace(/-/g, ' ')}`).join('\n');
}

const roleLabels = {
  admin: 'Admin',
  partner: 'Partner',
  lawyer: 'Lawyer',
  associate: 'Associate',
  intern: 'Intern',
};

function hasPeopleIntent(input = '') {
  return /\b(firm|team|people|user|users|partner|partners|parnter|lawyer|lawyers|associate|intern|profile|professional|profeesinonal|career|experience|achievement|publication|speciali[sz]ation)\b/i.test(input);
}

function compactList(items = [], getText) {
  return items.map(getText).filter(Boolean).slice(0, 4);
}

function profileUser(profile) {
  return profile?.userId && typeof profile.userId === 'object' ? profile.userId : {};
}

function profileName(profile) {
  return profileUser(profile).name || 'Team member';
}

function profileLine(profile, fallbackRole) {
  const user = profileUser(profile);
  const parts = [
    profileName(profile),
    profile.title || roleLabels[user.role] || fallbackRole,
    Array.isArray(profile.specialization) && profile.specialization.length ? `focuses on ${profile.specialization.join(', ')}` : '',
    profile.experienceYears ? `${profile.experienceYears} years of experience` : '',
  ].filter(Boolean);
  return parts.join(' - ');
}

function profileDetails(profile) {
  const lines = [];
  const landmarkCases = compactList(profile.landmarkCases, (item) => item.caseTitle ? `${item.caseTitle}${item.year ? ` (${item.year})` : ''}` : '');
  const achievements = compactList(profile.achievements, (item) => item.title ? `${item.title}${item.year ? ` (${item.year})` : ''}` : '');
  const publications = compactList(profile.publications, (item) => item.title ? `${item.title}${item.year ? ` (${item.year})` : ''}` : '');
  if (landmarkCases.length) lines.push(`Landmark work: ${landmarkCases.join('; ')}.`);
  if (achievements.length) lines.push(`Achievements: ${achievements.join('; ')}.`);
  if (publications.length) lines.push(`Publications: ${publications.join('; ')}.`);
  return lines;
}

function firmAddress(address = {}) {
  return [address.line1, address.line2, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(', ');
}

async function loadPeopleSnapshot(requestUser = {}) {
  const currentUser = requestUser.id
    ? await User.findById(requestUser.id).select('name email role firmId qualifications address').lean()
    : null;
  const firmId = currentUser?.firmId;
  const [firm, roleCounts, partners, lawyers, associates, interns] = await Promise.all([
    firmId ? Firm.findById(firmId).lean() : Firm.findOne().lean(),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    PartnerProfile.find().populate('userId', 'name email role qualifications').limit(8).lean(),
    LawyerProfile.find().populate('userId', 'name email role qualifications').limit(8).lean(),
    AssociateProfile.find().populate('userId', 'name email role qualifications').limit(8).lean(),
    InternProfile.find().populate('userId mentor', 'name email role').limit(8).lean(),
  ]);

  return {
    currentUser,
    firm,
    roleCounts: Object.fromEntries(roleCounts.map((item) => [item._id || 'unknown', item.count])),
    partners,
    lawyers,
    associates,
    interns,
  };
}

function buildPeopleAnswerFromSnapshot(snapshot = {}, input = '') {
  const firm = snapshot.firm;
  const roleCounts = snapshot.roleCounts || {};
  const query = String(input).toLowerCase();
  const wantsPartner = query.includes('partner') || query.includes('parnter');
  const wantsLawyer = query.includes('lawyer');
  const wantsIntern = query.includes('intern');
  const wantsFirm = query.includes('firm') || query.includes('company') || query.includes('office');
  const primaryProfiles = wantsPartner
    ? snapshot.partners || []
    : wantsLawyer
      ? snapshot.lawyers || []
      : wantsIntern
        ? snapshot.interns || []
        : [...(snapshot.partners || []), ...(snapshot.lawyers || []), ...(snapshot.associates || []), ...(snapshot.interns || [])];

  const lines = [];
  if (firm && (wantsFirm || !primaryProfiles.length)) {
    lines.push(`${firm.name || 'The firm'} is the firm saved in this workspace.`);
    const address = firmAddress(firm.address);
    if (address) lines.push(`Office details saved here: ${address}.`);
    if (firm.currency) lines.push(`The firm uses ${firm.currency} for billing and finance views.`);
    const counts = Object.entries(roleCounts)
      .filter(([, count]) => count)
      .map(([role, count]) => `${count} ${roleLabels[role] || role}${count === 1 ? '' : 's'}`);
    if (counts.length) lines.push(`Saved team shape: ${counts.join(', ')}.`);
  }

  if (primaryProfiles.length) {
    const heading = wantsPartner ? 'Partner professional profile details:' : wantsLawyer ? 'Lawyer professional profile details:' : wantsIntern ? 'Intern profile details:' : 'Professional profile details:';
    lines.push(heading);
    primaryProfiles.slice(0, 5).forEach((profile) => {
      lines.push(`- ${profileLine(profile, wantsIntern ? 'Intern' : 'Professional')}`);
      lines.push(...profileDetails(profile).map((detail) => `  ${detail}`));
      if (profile.lawSchool || profile.internshipFocus) {
        const internDetails = [
          profile.lawSchool,
          profile.graduationYear ? `Class of ${profile.graduationYear}` : '',
          profile.internshipFocus ? `focus: ${profile.internshipFocus}` : '',
        ].filter(Boolean);
        lines.push(`  ${internDetails.join(', ')}.`);
      }
    });
  }

  if (!lines.length) {
    lines.push('I could not find saved firm or professional profile details yet. Once profiles are filled in, I can explain partner experience, lawyer focus areas, achievements, publications, internship focus, and firm context in plain language.');
  }

  lines.push('I will keep this professional: firm context, role, experience, focus areas, achievements, publications, and work-related background.');

  return {
    title: wantsPartner ? 'Partner professional profile' : wantsFirm ? 'Firm overview' : 'Team professional profiles',
    text: lines.join('\n'),
    citations: [{ source: 'BillSync saved firm and profile details', title: 'Professional profile data' }],
  };
}

async function buildPeopleAnswer({ input, requestUser, snapshot }) {
  try {
    const resolvedSnapshot = snapshot || await loadPeopleSnapshot(requestUser);
    return buildPeopleAnswerFromSnapshot(resolvedSnapshot, input);
  } catch (_err) {
    return {
      title: 'Firm and professional profiles',
      text: 'I can help explain firm and team profile details in plain language, but I could not read the saved profile information right now. Try again after the profile or firm data has loaded.',
      citations: [],
    };
  }
}

export async function buildAppGuideAnswer({ input, context = {}, requestUser = {}, snapshot = null }) {
  if (hasPeopleIntent(input)) {
    return buildPeopleAnswer({ input, requestUser, snapshot });
  }

  const matches = selectEntries(input, context);
  if (!matches.length) {
    return {
      title: 'Question outside BillSync',
      text: 'I can only answer questions about BillSync Legal workflows, firm data, matters, tasks, work capture, documents, billing, finance, and app setup. Please ask a BillSync-related question.',
      citations: [],
    };
  }

  const primary = matches[0];
  const secondary = matches[1];
  const currentPath = context.currentPath ? `\n\nYou are currently on: ${SCREEN_NAMES[context.currentPath] || 'this screen'}` : '';
  const secondaryText = secondary
    ? `\n\nRelated area: ${secondary.title}\n${secondary.answer.slice(0, 2).join('\n')}\nUseful screens:\n${formatScreens(secondary.routes)}`
    : '';

  return {
    title: primary.title,
    text: [
      primary.answer.join('\n'),
      '',
      'Useful screens:',
      formatScreens(primary.routes),
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
