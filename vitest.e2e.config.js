import { defineConfig } from 'vitest/config';

// End-to-end tests run against live local servers (Azurite + Functions host + Vite).
// Start them with `npm run test:e2e`, which manages their lifecycle.
export default defineConfig({
  test: {
    include: ['e2e/**/*.e2e.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000
  }
});
