import globals from 'globals'
import pluginReact from 'eslint-plugin-react'

export default [
  { ignores: ['dist/**', 'build/**', 'node_modules/**'] },

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react: pluginReact },
    rules: {
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
    },
    settings: { react: { version: 'detect' } },
  },

  {
    files: ['tests/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser, ...globals.vitest },
    },
  },
]
