import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard');
  });

  test('loads dashboard stats', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.locator('.stat-card').first()).toBeVisible();
    await expect(page.getByText('ติดตั้งไม่เสร็จ')).toBeVisible();
    await expect(page.getByText('Issues ตาม Status')).toBeVisible();
  });
});
