
import { test, expect } from '@playwright/test';

test('home renders header and chat', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('LOG_ON AI')).toBeVisible();
  await expect(page.getByText('Voice-Agent')).toBeVisible();
});
