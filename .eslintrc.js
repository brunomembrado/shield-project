/**
 * ESLint Configuration for Shield Platform
 * 
 * Based on Node.js Best Practices 3.1 & 3.2
 * Includes security rules from 6.1
 */

module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'security',
  ],
  rules: {
    // Best Practice 2.2: Extend Error class
    '@typescript-eslint/no-throw-literal': 'error',
    
    // Best Practice 3.3: Curly braces on same line
    'brace-style': ['error', '1tbs'],
    
    // Best Practice 3.4: Statement separation
    'semi': ['error', 'always'],
    'no-unexpected-multiline': 'error',
    
    // Best Practice 3.5: Named functions
    'func-names': ['warn', 'always'],
    
    // Best Practice 3.6: Naming conventions
    'camelcase': ['error', { 
      properties: 'always',
      ignoreDestructuring: false,
    }],
    
    // Best Practice 3.7: Prefer const
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Best Practice 3.8: Require at top
    '@typescript-eslint/no-use-before-define': ['error', { 
      functions: false,
      classes: true,
      variables: true,
    }],
    
    // Best Practice 3.10: Use ===
    'eqeqeq': ['error', 'always'],
    
    // Best Practice 3.11: Async-await
    'no-async-promise-executor': 'error',
    'prefer-promise-reject-errors': 'error',
    
    // Best Practice 3.13: Avoid effects outside functions
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Program > :not(FunctionDeclaration, VariableDeclaration, ImportDeclaration, ExportDeclaration)',
        message: 'Avoid code with side effects outside of functions',
      },
    ],
    
    // Security Best Practices
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-non-literal-require': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-pseudoRandomBytes': 'warn',
    
    // General code quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-unused-vars': 'off', // Using TypeScript version
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.js',
    '!*.config.js',
  ],
};

