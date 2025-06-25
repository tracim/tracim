import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import json from '@eslint/json'
// import css from '@eslint/css'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js, '@stylistic': stylistic },
    rules: {
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/max-len': ['error', {
        code: 120,
        ignorePattern: '^import\\s.+\\sfrom\\s.+;?$',
        ignoreUrls: true,
      }],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
    },
    extends: ['js/recommended'],
  },
  { files: ['**/*.{js,mjs,cjs,ts,mts,cts}'], languageOptions: { globals: globals.browser } },
  // { files: ['src/**/*.css'], plugins: { css }, language: 'css/css', extends: ['css/recommended'] },
  { files: ['locales/*/*.json'], plugins: { json }, language: 'json/json', extends: ['json/recommended'] },
  tseslint.configs.recommended,
  globalIgnores(['dist', 'build', 'webpack.config.js']),
])
