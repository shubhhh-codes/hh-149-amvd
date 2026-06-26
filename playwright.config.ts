import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/qr',
  
  // Global timeout for standard tests
  timeout: 30 * 1000,
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  forbidOnly: isCI,
  
  /* Retries: 1 for CI to track and handle flaky tests, 0 for local */
  retries: isCI ? 1 : 0,
  
  /* Parallelism limits */
  workers: isCI ? (process.env.STRESS_RUN ? 1 : 2) : undefined,
  
  /* Reporter to use. Adds custom Failure Intelligence Reporter and GitHub step summary */
  reporter: [
    ['html', { outputFolder: 'test-artifacts/html-report', open: 'never' }],
    ['json', { outputFile: 'test-artifacts/results.json' }],
    ['./tests/utils/FailureIntelligenceReporter.ts'],
    ...(isCI ? [['github'] as const] : [['list'] as const])
  ],
  
  outputDir: 'test-artifacts/artifacts',
  
  /* Shared settings */
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    contextOptions: {
      permissions: ['camera']
    }
  },

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
  },
});
