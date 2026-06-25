import { test, expect } from '@playwright/test';
import { loginAsAdmin, uniqueName } from './helpers';

test.describe('Issues', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/issues');
  });

  test('loads issues page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Issues' })).toBeVisible();
    await expect(page.getByRole('button', { name: /เพิ่ม Issue/ })).toBeVisible();
  });

  test('status filter works', async ({ page }) => {
    await page.locator('select').nth(1).selectOption('open');
    await page.getByRole('button', { name: 'ค้นหา' }).click();
    await expect(page.locator('.data-table')).toBeVisible();
  });

  test('can open create issue modal', async ({ page }) => {
    await page.getByRole('button', { name: /เพิ่ม Issue/ }).click();
    await expect(page.getByRole('heading', { name: /Issue/ })).toBeVisible();
  });
});
