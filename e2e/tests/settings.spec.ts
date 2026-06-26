import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/settings');
  });

  test('loads settings page with master data tabs', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ตั้งค่า/ })).toBeVisible();
    await expect(page.getByText('Session Timeout')).toBeVisible();
    await expect(page.getByRole('button', { name: 'OS' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ชื่อ Program' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ชื่อลูกค้า' })).toBeVisible();
  });
});
