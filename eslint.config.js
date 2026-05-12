import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const tsRules = {
  ...tseslint.configs.recommended.rules,
  '@typescript-eslint/no-explicit-any': 'warn',
  'vue/multi-word-component-names': 'off',
  'simple-import-sort/imports': 'error',
  'simple-import-sort/exports': 'error',
}

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  prettier,
  {
    files: ['api/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {},
      globals: globals.node,
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'simple-import-sort': simpleImportSort,
    },
    rules: tsRules,
  },
  {
    files: ['client/**/*.ts', 'client/**/*.vue', 'shared/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        extraFileExtensions: ['.vue'],
      },
      globals: globals.browser,
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'simple-import-sort': simpleImportSort,
    },
    rules: tsRules,
  },
  {
    files: ['client/**/*.vue'],
    languageOptions: {
      parser: (await import('vue-eslint-parser')).default,
      parserOptions: {
        parser: tsparser,
      },
      globals: globals.browser,
    },
  },
  {
    ignores: ['dist/', '.netlify/', 'node_modules/', 'tools/**', 'scripts/**'],
  },
]
