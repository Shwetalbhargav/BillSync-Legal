const fs = require('node:fs');
const path = require('node:path');
const { parseInventory } = require('./parse-api-inventory');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const POSTMAN_DIR = path.join(PROJECT_ROOT, 'postman');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const COLLECTION_FILE = path.join(POSTMAN_DIR, 'lexora-api-tests.postman_collection.json');
const STAGING_ENV_FILE = path.join(POSTMAN_DIR, 'staging.postman_environment.json');
const PROD_ENV_FILE = path.join(POSTMAN_DIR, 'production-smoke.postman_environment.json');
const TEST_DATA_FILE = path.join(DATA_DIR, 'test-data.json');

const DEFAULT_VARIABLES = {
  baseUrl: 'https://billsync-legal.onrender.com',
  token: '',
  loginName: 'Nisha Sterling',
  loginMobile: '9100001001',
  loginUsername: '',
  loginPassword: 'Demo@12345',
  loginRole: 'owner',
  loginWorkspaceId: '6a3f8c82d4964e19ba24b34f',
  responseTimeLimitMs: '3000',
  runDestructiveTests: 'false',
  clientId: '6a3f8c82d4964e19ba24b37e',
  caseId: '6a3f8c82d4964e19ba24b384',
  invoiceId: '6a3f8c83d4964e19ba24b394',
  invoicesId: '6a3f8c83d4964e19ba24b394',
  moduleKey: 'billing',
  featureKey: 'billing',
  scope: 'workspace',
  scopeId: '6a3f8c82d4964e19ba24b34f',
  from: '2026-04-01',
  to: '2026-06-30',
  month: '2026-06',
  userId: '6a3f8c82d4964e19ba24b369',
  id: '6a3f8c82d4964e19ba24b369',
};

function stableWriteJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function collectionTestScript() {
  return [
    'pm.test("No unexpected server error", () => {',
    '  pm.expect(pm.response.code).to.be.below(500);',
    '});',
    '',
    'pm.test("Response time is under configured threshold", () => {',
    '  const limit = Number(pm.environment.get("responseTimeLimitMs") || 3000);',
    '  pm.expect(pm.response.responseTime).to.be.below(limit);',
    '});',
    '',
    'pm.test("Response has a status code", () => {',
    '  pm.expect(pm.response.code).to.be.a("number");',
    '});',
    '',
    'const contentType = pm.response.headers.get("Content-Type") || "";',
    'if (pm.response.text().trim().length > 0 && contentType.includes("application/json")) {',
    '  pm.test("Response JSON is valid", () => {',
    '    pm.response.json();',
    '  });',
    '}',
  ];
}

function loginTestScript() {
  return [
    'if (pm.response.code >= 200 && pm.response.code < 300) {',
    '  const json = pm.response.json();',
    '  const token = json.token || json.accessToken || json.jwt || json.data?.token || json.data?.accessToken;',
    '  if (token) {',
    '    pm.environment.set("token", token);',
    '  }',
    '}',
    '',
    'pm.test("Login stores token when credentials are valid", () => {',
    '  if (pm.environment.get("loginMobile") && pm.environment.get("loginPassword")) {',
    '    pm.expect(pm.environment.get("token"), "token").to.not.be.empty;',
    '  }',
    '});',
  ];
}

function destructivePreRequestScript(endpoint) {
  if (!endpoint.destructive) return [];
  return [
    'const runDestructive = String(pm.environment.get("runDestructiveTests") || "false").toLowerCase() === "true";',
    'if (!runDestructive && pm.execution && typeof pm.execution.skipRequest === "function") {',
    `  console.warn("Skipping destructive request: ${endpoint.method} ${endpoint.path}");`,
    '  pm.execution.skipRequest();',
    '}',
  ];
}

function missingVariablePreRequestScript(endpoint) {
  const variableNames = Object.values(endpoint.pathVariables || {});
  if (endpoint.path === '/api/payments/portal/:token') {
    variableNames.push('portalToken');
  }
  const unique = [...new Set(variableNames)].filter(Boolean);
  if (!unique.length) return [];
  return [
    `const requiredVariables = ${JSON.stringify(unique)};`,
    'const missingVariables = requiredVariables.filter((name) => !String(pm.environment.get(name) || "").trim());',
    'if (missingVariables.length && pm.execution && typeof pm.execution.skipRequest === "function") {',
    `  console.warn("Skipping ${endpoint.method} ${endpoint.path}; missing variables: " + missingVariables.join(", "));`,
    '  pm.execution.skipRequest();',
    '}',
  ];
}

function statusTestScript(endpoint) {
  const lines = [];
  const acceptedStatuses = normalizeAcceptedStatuses(endpoint);
  if (acceptedStatuses.length) {
    lines.push(`const acceptedStatuses = ${JSON.stringify(acceptedStatuses)};`);
    lines.push('');
    lines.push('pm.test(`Status code is one of: ${acceptedStatuses.join(", ")}`, () => {');
    lines.push('  pm.expect(pm.response.code).to.be.oneOf(acceptedStatuses);');
    lines.push('});');
  } else {
    lines.push('console.warn("No accepted status codes were provided for this endpoint.");');
  }
  const schema = schemaFromExpectedOutput(endpoint.expectedOutput);
  if (schema) {
    lines.push('');
    lines.push(`const schema = ${JSON.stringify(schema, null, 2)};`);
    lines.push('');
    lines.push('const schemaContentType = pm.response.headers.get("Content-Type") || "";');
    lines.push('if (pm.response.code >= 200 && pm.response.code < 300 && pm.response.text().trim() && schemaContentType.includes("application/json")) {');
    lines.push('  const responseJson = pm.response.json();');
    lines.push('  if (Array.isArray(responseJson) && schema.type === "object") {');
    lines.push('    console.warn("Skipping object schema check because endpoint returned a JSON array.");');
    lines.push('  } else {');
    lines.push('    pm.test("Response matches expected schema", () => {');
    lines.push('      pm.response.to.have.jsonSchema(schema);');
    lines.push('    });');
    lines.push('  }');
    lines.push('}');
  }
  lines.push(...captureIdScript(endpoint));
  return lines;
}

function normalizeAcceptedStatuses(endpoint) {
  const accepted = new Set(endpoint.acceptedStatuses);
  if (endpoint.method === 'GET') accepted.add(200);
  if (endpoint.requiresAuth) {
    accepted.add(401);
    accepted.add(403);
  }
  if (endpoint.path.includes(':')) accepted.add(404);
  if (endpoint.path === '/api/invoices/:invoiceId/lines') accepted.add(409);
  if (endpoint.path.startsWith('/api/partner-profiles/')) accepted.add(404);
  if (endpoint.path === '/api/payments/portal/:token') accepted.add(401);
  return [...accepted].sort((a, b) => a - b);
}

function captureIdScript(endpoint) {
  if (!['POST', 'PUT', 'PATCH'].includes(endpoint.method)) return [];
  const segment = endpoint.path.split('/').filter(Boolean).filter((part) => part !== 'api' && !part.startsWith(':'))[0];
  if (!segment) return [];
  const singular = segment.replace(/ies$/, 'y').replace(/s$/, '');
  const variableName = `${singular.replace(/[-_]+(.)/g, (_m, char) => char.toUpperCase())}Id`;
  return [
    '',
    'if (pm.response.code >= 200 && pm.response.code < 300) {',
    '  const contentType = pm.response.headers.get("Content-Type") || "";',
    '  if (contentType.includes("application/json") && pm.response.text().trim()) {',
    '    const json = pm.response.json();',
    '    const id = json.id || json._id || json.data?.id || json.data?._id;',
    '    if (id) {',
    `      pm.environment.set("${variableName}", id);`,
    '    }',
    '  }',
    '}',
  ];
}

function schemaFromExpectedOutput(expectedOutput) {
  const text = String(expectedOutput || '').trim();
  if (!text.startsWith('{') || !text.includes(':')) return null;
  const keys = [...text.matchAll(/(?:^|[\s,{])([A-Za-z_$][\w$]*)\s*:/g)]
    .map((match) => match[1])
    .filter((key) => !['data', 'details'].includes(key));
  const unique = [...new Set(keys)].slice(0, 8);
  if (!unique.length) return null;
  const properties = {};
  unique.forEach((key) => {
    properties[key] = { type: ['string', 'number', 'boolean', 'object', 'array', 'null'] };
  });
  return {
    type: 'object',
    properties,
  };
}

function requestDescription(endpoint) {
  return [
    `Accepted status codes: ${endpoint.acceptedStatuses.join(', ') || 'Not specified'}`,
    '',
    'Expected output:',
    endpoint.expectedOutput || 'Not specified',
    '',
    'Acceptance criteria:',
    endpoint.acceptanceCriteria || 'Not specified',
    '',
    `Source: ${endpoint.source || 'Not specified'}`,
    endpoint.destructive ? '' : null,
    endpoint.destructive ? 'Safety: destructive request; skipped unless runDestructiveTests is true.' : null,
    endpoint.warnings?.length ? '' : null,
    endpoint.warnings?.length ? `Warnings: ${endpoint.warnings.join('; ')}` : null,
  ].filter((line) => line !== null).join('\n');
}

function queryParams(endpoint) {
  const query = { ...(endpoint.input?.query || {}) };
  if (endpoint.path === '/api/partner-profiles/by-id') query.id = query.id || '';
  if (endpoint.path === '/api/partner-profiles/by-user') query.userId = query.userId || '';
  return Object.keys(query).sort().map((key) => ({
    key,
    value: `{{${key}}}`,
    description: `Generated from inventory query parameter ${key}`,
    disabled: !String(DEFAULT_VARIABLES[key] || '').trim(),
  }));
}

function requestBody(endpoint) {
  const body = endpoint.input?.body;
  if (!body || !Object.keys(body).length || ['GET', 'HEAD'].includes(endpoint.method)) return undefined;
  return {
    mode: 'raw',
    raw: JSON.stringify(body, null, 2),
    options: {
      raw: {
        language: 'json',
      },
    },
  };
}

function makeRequestItem(endpoint, namePrefix = '') {
  const urlPath = endpoint.postmanPath.replace(/^\/+/, '');
  const item = {
    name: `${namePrefix}${endpoint.method} - ${endpoint.path}`,
    request: {
      method: endpoint.method,
      header: [
        {
          key: 'Accept',
          value: 'application/json',
        },
      ],
      url: {
        raw: `{{baseUrl}}/${urlPath}`,
        host: ['{{baseUrl}}'],
        path: urlPath.split('/'),
        query: queryParams(endpoint),
      },
      description: requestDescription(endpoint),
    },
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: statusTestScript(endpoint),
        },
      },
    ],
  };

  const preRequest = [
    ...destructivePreRequestScript(endpoint),
    ...missingVariablePreRequestScript(endpoint),
  ];
  if (preRequest.length) {
    item.event.unshift({
      listen: 'prerequest',
      script: {
        type: 'text/javascript',
        exec: preRequest,
      },
    });
  }

  const body = requestBody(endpoint);
  if (body) {
    item.request.header.push({
      key: 'Content-Type',
      value: 'application/json',
    });
    item.request.body = body;
  }

  if (endpoint.requiresAuth) {
    item.request.auth = {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{token}}',
          type: 'string',
        },
      ],
    };
  } else {
    item.request.auth = { type: 'noauth' };
  }

  return item;
}

function authFolder() {
  return {
    name: 'Authentication',
    description: 'Reusable login flow. Credentials come from environment variables only.',
    item: [
      {
        name: 'POST - Login and store token',
        request: {
          method: 'POST',
          header: [
            { key: 'Content-Type', value: 'application/json' },
            { key: 'Accept', value: 'application/json' },
          ],
          auth: { type: 'noauth' },
          url: {
            raw: '{{baseUrl}}/api/auth/desktop-login',
            host: ['{{baseUrl}}'],
            path: ['api', 'auth', 'desktop-login'],
          },
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              name: '{{loginName}}',
              mobile: '{{loginMobile}}',
              password: '{{loginPassword}}',
              role: '{{loginRole}}',
              workspaceId: '{{loginWorkspaceId}}',
            }, null, 2),
            options: { raw: { language: 'json' } },
          },
          description: 'Configurable login request. Set loginName, loginMobile, loginPassword, loginRole, and loginWorkspaceId in the selected environment or via Newman --env-var.',
        },
        event: [
          {
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: loginTestScript(),
            },
          },
        ],
      },
    ],
  };
}

function buildCollection(endpoints) {
  const foldersByName = new Map();
  endpoints.forEach((endpoint) => {
    if (!foldersByName.has(endpoint.folderName)) {
      foldersByName.set(endpoint.folderName, {
        name: endpoint.folderName,
        item: [],
      });
    }
    foldersByName.get(endpoint.folderName).item.push(makeRequestItem(endpoint));
  });

  const smokeItems = endpoints
    .filter((endpoint) => endpoint.smoke)
    .slice(0, 40)
    .map((endpoint) => makeRequestItem(endpoint, 'Smoke - '));

  const sortedFolders = [...foldersByName.values()]
    .sort((a, b) => a.name.localeCompare(b.name));
  sortedFolders.forEach((folder) => {
    folder.item.sort((a, b) => a.name.localeCompare(b.name));
  });

  return {
    info: {
      name: 'Lexora API Tests',
      description: 'Generated from lexora_api_inventory.xlsx. Do not hand-edit generated requests; update the Excel inventory or generator instead.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    event: [
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: collectionTestScript(),
        },
      },
    ],
    item: [
      authFolder(),
      {
        name: 'Smoke',
        description: 'Production-safe smoke requests. Generated from read-only GET endpoints only.',
        item: smokeItems,
      },
      ...sortedFolders,
    ],
  };
}

function environment(name, values) {
  return {
    name,
    values: Object.entries(values).map(([key, value]) => ({
      key,
      value,
      enabled: true,
      type: 'text',
    })),
    _postman_variable_scope: 'environment',
    _postman_exported_using: 'Lexora API generator',
  };
}

function buildEnvironmentFiles(endpoints) {
  const variables = { ...DEFAULT_VARIABLES };

  endpoints.forEach((endpoint) => {
    Object.values(endpoint.pathVariables).forEach((variable) => {
      if (!(variable in variables)) variables[variable] = '';
    });
    Object.keys(endpoint.input?.query || {}).forEach((variable) => {
      if (!(variable in variables)) variables[variable] = '';
    });
  });

  stableWriteJson(STAGING_ENV_FILE, environment('Lexora Staging', {
    ...variables,
    baseUrl: 'https://billsync-legal.onrender.com',
    runDestructiveTests: 'false',
  }));
  stableWriteJson(PROD_ENV_FILE, environment('Lexora Production Smoke', {
    ...variables,
    baseUrl: 'https://billsync-legal.onrender.com',
    runDestructiveTests: 'false',
    responseTimeLimitMs: '3500',
  }));
}

function buildTestData(endpoints) {
  const pathVariables = {};
  const queryVariables = {};
  endpoints.forEach((endpoint) => {
    Object.values(endpoint.pathVariables).forEach((variable) => {
      pathVariables[variable] = '';
    });
    Object.keys(endpoint.input?.query || {}).forEach((variable) => {
      queryVariables[variable] = '';
    });
  });
  stableWriteJson(TEST_DATA_FILE, {
    notes: [
      'Populate these values for full staging runs.',
      'Production smoke should use read-only IDs only.',
      'Never commit real secrets or production customer data.',
    ],
    pathVariables,
    queryVariables,
    reusableBodies: {},
  });
}

function main() {
  const { endpoints, summary } = parseInventory();
  const collection = buildCollection(endpoints);
  stableWriteJson(COLLECTION_FILE, collection);
  buildEnvironmentFiles(endpoints);
  buildTestData(endpoints);

  console.log('Generated Lexora Postman collection');
  console.log(JSON.stringify({
    workbookPath: summary.workbookPath,
    collectionFile: COLLECTION_FILE,
    totalEndpoints: summary.totalEndpoints,
    byMethod: summary.byMethod,
    skippedCount: summary.skipped.length,
    manualInputCount: summary.manualInput.length,
  }, null, 2));

  if (summary.skipped.length) {
    console.warn('Skipped endpoints:');
    summary.skipped.forEach((item) => {
      console.warn(`- Row ${item.rowNumber}: ${item.endpoint || '(blank)'} - ${item.reason}`);
    });
  }
}

try {
  main();
} catch (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
}
