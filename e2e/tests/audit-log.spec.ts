import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Audit Log', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/audit-log');
  });

  test('loads audit log page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();
  });
});
