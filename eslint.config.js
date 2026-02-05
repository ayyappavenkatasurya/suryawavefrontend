import js from '@eslint/js'
import globals from 'globals'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks, // FIX: Register react-hooks plugin
      'react-refresh': reactRefresh, // FIX: Register react-refresh plugin
    },
    extends: [
      js.configs.recommended,
      reactPlugin.configs.recommended,
      reactHooks.configs.recommended, // FIX: Corrected from 'recommended-latest'
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
        react: {
            version: 'detect', // Automatically detect the React version
        }
    },
    rules: {
      'react/react-in-jsx-scope': 'off', // Not needed with modern JSX transform
      'react/prop-types': 'off', // Optional: disable prop-types if not using them
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }], // Your existing rule
      'react-refresh/only-export-components': 'warn', // FIX: Added rule for better HMR with Vite
    },
  },
])