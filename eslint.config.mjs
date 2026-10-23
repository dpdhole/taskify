import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
export default [
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': hooks },
    rules: {
      ...hooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    ignores: [
      'verification/**',
      'docs/**',
      'node_modules/**',
      'dist/**',
      'dist-proof/**',
      'dist-compatibility/**',
      '.local/**',
    ],
  },
];
