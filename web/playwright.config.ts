import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  use: {
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    // Login credentials and bearer tokens must never be captured in artifacts.
    trace: 'off',
    video: 'off',
    screenshot: 'off',
    launchOptions: process.env['CHROMIUM_PATH']
      ? { executablePath: process.env['CHROMIUM_PATH'] }
      : {},
  },
});
