import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, '../../'),
  test: {
    environment: 'node', // Node.js environment for serverless functions
    globals: true,
    include: ['netlify/functions/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '**/*.test.ts',
        '**/*.config.ts',
        '**/*.example.ts',
      ],
    },
  },
});
