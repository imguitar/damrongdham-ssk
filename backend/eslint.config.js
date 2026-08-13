'use strict';

// ESLint flat config — backend (Node.js, CommonJS)
// รันด้วย: npm run lint  (แก้อัตโนมัติ: npm run lint:fix)
module.exports = [
  {
    ignores: ['node_modules/**', 'uploads/**', 'public/**', 'coverage/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        module: 'writable',
        require: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        fetch: 'readonly',
        AbortSignal: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^next$', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': 'warn',
      eqeqeq: ['warn', 'smart'],
      'no-var': 'error',
    },
  },
  {
    files: ['tests/**/*.js', '**/*.test.js', 'vitest.config.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: { global: 'readonly', process: 'readonly', console: 'readonly' },
    },
  },
];
