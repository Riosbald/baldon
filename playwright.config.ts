
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  retries: 0,
  use: { baseURL: 'http://localhost:12000' },
  webServer: [
    {
      command: 'npm run build && npm run start',
      url: 'http://localhost:12000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
