// ESLint (flat config) — `npm run lint`
//
// Məqsəd: real xətaları tutmaq (hook qaydaları, tanınmayan dəyişənlər,
// istifadəsiz kod), üslub mübahisəsi yox. Formatlaşdırma qaydaları yoxdur.
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  {
    ignores: [
      'dist/**', 'node_modules/**', 'mobile/**', 'public/**',
      'test-results/**', 'playwright-report/**', 'blob-report/**',
      'scripts/.icon-preview/**', 'scripts/social/out/**',
    ],
  },

  js.configs.recommended,

  // ── Sayt (React, brauzer) ──
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      // JSX-də işlənən komponentlər/dəyişənlər "istifadəsiz" sayılmasın
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off',
      'react/jsx-key': 'error',
      'react/jsx-no-undef': 'error',
      'react/no-danger-with-children': 'error',
      'react/jsx-no-target-blank': 'error',

      // Hook qaydaları — əsas məqsəd
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // ── Server (Node, CommonJS) ──
  {
    files: ['server/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
  },

  // ── Skriptlər, konfiqlər, testlər (Node, ESM) ──
  {
    files: ['scripts/**/*.{js,mjs}', 'tests/**/*.js', '*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    // e2e testlərdə page.evaluate(() => …) brauzerdə işləyir
    files: ['tests/e2e/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    // sw.js — service worker
    files: ['public/sw.js'],
    languageOptions: { globals: { ...globals.serviceworker } },
  },

  // Ümumi
  {
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Ərəb/çoxdilli mətn emalı: regex-lərdə hərəkələr (birləşən simvollar),
      // BOM, NBSP və idarəetmə simvollarının təmizlənməsi qəsdəndir.
      'no-irregular-whitespace': ['error', { skipStrings: true, skipRegExps: true, skipTemplates: true, skipComments: true }],
      'no-misleading-character-class': 'off',
      'no-control-regex': 'off',
    },
    linterOptions: { reportUnusedDisableDirectives: 'warn' },
  },
]
