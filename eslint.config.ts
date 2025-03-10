import js from '@eslint/js';
import tseslint from "typescript-eslint";
import tseslintParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config([
  {
    ignores: ['dist'],
  },
  {
    files: ['src/**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        project: true,
      },
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-prototype-builtins': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  eslintConfigPrettier,
]);
