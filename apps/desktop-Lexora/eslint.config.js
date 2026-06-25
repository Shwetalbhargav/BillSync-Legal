import js from '@eslint/js';

const nodeGlobals = {
  Buffer: 'readonly',
  AbortController: 'readonly',
  console: 'readonly',
  clearInterval: 'readonly',
  clearTimeout: 'readonly',
  global: 'readonly',
  process: 'readonly',
  fetch: 'readonly',
  require: 'readonly',
  setInterval: 'readonly',
  setTimeout: 'readonly',
  URL: 'readonly',
};

const browserGlobals = {
  console: 'readonly',
  document: 'readonly',
  localStorage: 'readonly',
  navigator: 'readonly',
  window: 'readonly',
};

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['src/main/**/*.{js,cjs}', 'vite.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: nodeGlobals,
    },
  },
  {
    files: ['src/renderer/**/*.{js,jsx}'],
    rules: {
      'no-unused-vars': 'off',
    },
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      sourceType: 'module',
      globals: browserGlobals,
    },
  },
];
