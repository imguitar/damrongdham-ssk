import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

// ESLint flat config — frontend (React 18 + Vite, JS/JSX)
// รันด้วย: npm run lint  (แก้อัตโนมัติ: npm run lint:fix)
export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // กฎทดลองใหม่ของ react-hooks v7 — เตือนได้แต่ไม่ควรบล็อกโค้ดเดิม
      // (การ setState ใน effect หลัง fetch เป็นแพตเทิร์นที่ยอมรับได้ในโปรเจกต์นี้)
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];
