import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

const tsRules = {
  ...tseslint.configs.recommended.rules,
  '@typescript-eslint/no-explicit-any': 'warn',
  'vue/multi-word-component-names': 'off',
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
    },
    rules: tsRules,
  },
  {
    files: ['src/**/*.ts', 'src/**/*.vue', 'shared/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        extraFileExtensions: ['.vue'],
      },
      globals: globals.browser,
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: tsRules,
  },
  {
    files: ['src/**/*.vue'],
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
