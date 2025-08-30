import next from 'eslint-config-next';

export default [
  ...next, // includes "next/core-web-vitals"
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },
];
