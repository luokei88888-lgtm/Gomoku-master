import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  server: {
    port: 5174,
    open: false,
  },
  build: {
    target: 'es2022',
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
