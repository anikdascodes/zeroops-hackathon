import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      DATABASE_URL: 'postgres://test:test@localhost:5432/zerops_tutor_test',
    },
  },
});