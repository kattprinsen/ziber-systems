// @ts-check
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default tseslint.config(
  // Ignore build output and dependencies
  {
    ignores: ['**/dist/**', '**/node_modules/**'],
  },

  // Baseline JS rules
  eslint.configs.recommended,

  // TypeScript rules for all source files
  tseslint.configs.recommended,
  {
    files: ['client/src/**/*.{ts,tsx}', 'server/src/**/*.ts'],
    rules: {
      // Disallow any — use proper types or unknown
      '@typescript-eslint/no-explicit-any': 'error',
      // Unused variables (allow _ prefix for intentional ignores)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Nested ternaries are hard to read — extract to a function instead
      'no-nested-ternary': 'error',
    },
  },

  // Client: React hooks rules (the main thing tsc can't check)
  {
    files: ['client/src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Hooks must be called in the same order every render
      'react-hooks/rules-of-hooks': 'error',
      // useEffect/useCallback deps must be complete — stale closure detection
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Server: Node globals
  {
    files: ['server/src/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
)
