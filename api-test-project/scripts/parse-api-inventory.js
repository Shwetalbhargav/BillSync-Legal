const fs = require('node:fs');
const path = require('node:path');
const xlsx = require('xlsx');

const REQUIRED_COLUMNS = [
  'API Endpoint',
  'Input in JSON Format',
  'Status Code Accepted',
  'Output Expected',
  'Acceptance Criteria',
  'Source',
];

function defaultWorkbookPath() {
  return path.resolve(__dirname, '..', '..', 'outputs', 'api_inventory', 'lexora_api_inventory.xlsx');
}

function titleCase(value) {
  return String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function parseEndpoint(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(.+)$/i);
  if (!match) {
    throw new Error(`Invalid API Endpoint value: "${raw}"`);
  }
  return {
    method: match[1].toUpperCase(),
    path: match[2].trim(),
  };
}

function parseAcceptedStatuses(value) {
  const statuses = [...String(value || '').matchAll(/\b\d{3}\b/g)]
    .map((match) => Number(match[0]))
    .filter((code) => code >= 100 && code <= 599);
  return [...new Set(statuses)].sort((a, b) => a - b);
}

function safeJsonParse(value) {
  const text = String(value || '').trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    return {
      __parseError: error.message,
      __raw: text,
    };
  }
}

function firstMeaningfulSegment(apiPath) {
  const parts = String(apiPath || '')
    .split('/')
    .filter(Boolean)
    .filter((segment) => segment !== 'api' && !segment.startsWith(':'));
  return parts[0] || 'misc';
}

function folderNameForPath(apiPath) {
  return titleCase(firstMeaningfulSegment(apiPath));
}

function paramToVariableName(paramName, routeSegment, apiPath = '') {
  const clean = String(paramName || 'id').replace(/[^a-zA-Z0-9]+/g, ' ');
  const previous = String(routeSegment || '').replace(/[^a-zA-Z0-9]+/g, ' ');
  if (String(paramName).toLowerCase() === 'token' && String(apiPath).includes('/payments/portal/')) {
    return 'portalToken';
  }
  const base = clean.toLowerCase() === 'id' && previous
    ? `${previous} id`
    : clean;
  return base
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\s+/g, '')
    .replace(/^\w/, (char) => char.toLowerCase());
}

function extractPathVariables(apiPath, input) {
  const explicit = input && typeof input === 'object' ? input.pathParams || input.pathParameters || {} : {};
  const variables = new Map();
  const segments = String(apiPath || '').split('/').filter(Boolean);
  segments.forEach((segment, index) => {
    if (!segment.startsWith(':')) return;
    const param = segment.slice(1);
    const previous = segments[index - 1] || '';
    variables.set(param, paramToVariableName(param, previous, apiPath));
  });
  Object.keys(explicit).forEach((param) => {
    if (!variables.has(param)) {
      variables.set(param, paramToVariableName(param, '', apiPath));
    }
  });
  return variables;
}

function toPostmanPath(apiPath, variables) {
  return String(apiPath || '').replace(/:([A-Za-z0-9_]+)/g, (_match, param) => {
    return `{{${variables.get(param) || paramToVariableName(param, '', apiPath)}}}`;
  });
}

function normalizeInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  if (input.__parseError) return input;
  const query = input.queryParams || input.query || {};
  const body = input.body || {};
  const pathParams = input.pathParams || input.pathParameters || {};
  return {
    ...input,
    query,
    body,
    pathParams,
  };
}

function isPublicEndpoint(method, apiPath) {
  const safePath = String(apiPath || '').toLowerCase();
  return [
    /^\/api\/ops\/readyz$/,
    /^\/api\/auth\/login$/,
    /^\/api\/auth\/register$/,
    /^\/api\/admin\/login$/,
    /^\/api\/payments\/portal\//,
    /^\/api\/integrations\/zoho\/callback$/,
  ].some((pattern) => pattern.test(safePath));
}

function requiresAuth(method, apiPath) {
  return !isPublicEndpoint(method, apiPath);
}

function isDestructive(method, apiPath) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return true;
  return /\/(delete|remove|rebuild|expire|revoke|void|finalise|revise|approve|reject|pay|sync)\b/i.test(apiPath);
}

function isSmokeCandidate(endpoint) {
  if (endpoint.method !== 'GET') return false;
  if (isDestructive(endpoint.method, endpoint.path)) return false;
  const pathValue = endpoint.path.toLowerCase();
  return [
    '/api/ops/readyz',
    '/api/auth',
    '/api/workspace/context',
    '/api/workspace/permissions',
    '/api/workspace/modules',
    '/api/workspace/navigation',
    '/api/clients',
    '/api/cases',
    '/api/invoices',
    '/api/payments/finance-summary',
    '/api/reports',
    '/api/kpi/summary',
  ].some((prefix) => pathValue === prefix || pathValue.startsWith(`${prefix}/`));
}

function parseInventory(workbookPath = process.env.API_INVENTORY_FILE || defaultWorkbookPath()) {
  const resolvedWorkbookPath = path.resolve(workbookPath);
  if (!fs.existsSync(resolvedWorkbookPath)) {
    throw new Error(`API inventory workbook not found: ${resolvedWorkbookPath}`);
  }

  const workbook = xlsx.readFile(resolvedWorkbookPath, { cellDates: false });
  const sheet = workbook.Sheets['API Inventory'];
  if (!sheet) {
    throw new Error('Workbook is missing required "API Inventory" sheet.');
  }

  const matrix = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  const headerIndex = matrix.findIndex((row) => {
    const values = row.map((cell) => String(cell || '').trim());
    return REQUIRED_COLUMNS.every((column) => values.includes(column));
  });
  if (headerIndex < 0) {
    throw new Error(`API Inventory sheet is missing columns: ${REQUIRED_COLUMNS.join(', ')}`);
  }
  const headers = matrix[headerIndex].map((cell) => String(cell || '').trim());
  const rows = matrix.slice(headerIndex + 1)
    .filter((row) => row.some((cell) => String(cell || '').trim()))
    .map((row) => headers.reduce((acc, header, columnIndex) => {
      if (header) acc[header] = row[columnIndex] ?? '';
      return acc;
    }, {}));
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !Object.prototype.hasOwnProperty.call(rows[0] || {}, column));
  if (missingColumns.length) {
    throw new Error(`API Inventory sheet is missing columns: ${missingColumns.join(', ')}`);
  }

  const endpoints = [];
  const skipped = [];
  const manualInput = [];

  rows.forEach((row, index) => {
    const excelRow = headerIndex + index + 2;
    try {
      const parsed = parseEndpoint(row['API Endpoint']);
      const acceptedStatuses = parseAcceptedStatuses(row['Status Code Accepted']);
      const input = normalizeInput(safeJsonParse(row['Input in JSON Format']));
      const pathVariables = extractPathVariables(parsed.path, input);
      const endpoint = {
        rowNumber: excelRow,
        method: parsed.method,
        path: parsed.path,
        postmanPath: toPostmanPath(parsed.path, pathVariables),
        folderName: folderNameForPath(parsed.path),
        input,
        acceptedStatuses,
        expectedOutput: String(row['Output Expected'] || '').trim(),
        acceptanceCriteria: String(row['Acceptance Criteria'] || '').trim(),
        source: String(row.Source || '').trim(),
        pathVariables: Object.fromEntries(pathVariables),
      };
      endpoint.requiresAuth = requiresAuth(endpoint.method, endpoint.path);
      endpoint.destructive = isDestructive(endpoint.method, endpoint.path);
      endpoint.smoke = isSmokeCandidate(endpoint);
      if (!acceptedStatuses.length) {
        endpoint.warnings = ['No numeric accepted status code found; request-level status validation will be skipped.'];
      }
      if (input.__parseError) {
        endpoint.warnings = endpoint.warnings || [];
        endpoint.warnings.push(`Input JSON parse error: ${input.__parseError}`);
      }
      if (Object.values(endpoint.pathVariables).length) {
        manualInput.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          variables: Object.values(endpoint.pathVariables),
        });
      }
      endpoints.push(endpoint);
    } catch (error) {
      skipped.push({
        rowNumber: excelRow,
        endpoint: row['API Endpoint'],
        reason: error.message,
      });
    }
  });

  const summary = {
    workbookPath: resolvedWorkbookPath,
    totalRows: rows.length,
    totalEndpoints: endpoints.length,
    skipped,
    manualInput,
    byMethod: endpoints.reduce((acc, endpoint) => {
      acc[endpoint.method] = (acc[endpoint.method] || 0) + 1;
      return acc;
    }, {}),
  };

  return { endpoints, summary };
}

module.exports = {
  REQUIRED_COLUMNS,
  defaultWorkbookPath,
  parseAcceptedStatuses,
  parseEndpoint,
  parseInventory,
  paramToVariableName,
};
