module.exports = {
  root: true,
  ignorePatterns: [
    '**/node_modules/',
    '**/dist/',
    '**/build/',
    '**/coverage/',
    '**/.angular/'
  ],
  overrides: [
    {
      files: ['apps/api/**/*.ts', 'features/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      plugins: ['@typescript-eslint', 'import', 'prettier'],
      extends: ['airbnb-base', 'plugin:@typescript-eslint/recommended', 'prettier'],
      rules: {
        'import/extensions': [
          'error',
          'ignorePackages',
          { ts: 'never', tsx: 'never', js: 'never' }
        ],
        'prettier/prettier': 'error',
        'import/prefer-default-export': 'off',
        'class-methods-use-this': 'off',
        'no-console': 'off'
      },
      settings: {
        'import/resolver': {
          typescript: {}
        }
      }
    },
    {
      files: ['apps/web/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      plugins: ['@angular-eslint', '@typescript-eslint', 'prettier'],
      extends: ['plugin:@angular-eslint/recommended', 'prettier'],
      rules: {
        'prettier/prettier': 'error'
      }
    },
    {
      files: ['apps/web/**/*.html'],
      parser: '@angular-eslint/template-parser',
      plugins: ['@angular-eslint/template'],
      extends: ['plugin:@angular-eslint/template/recommended', 'prettier']
    }
  ]
};
