import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Roles', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/roles');
  });

  test('loads roles permission matrix', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Roles & Permissions' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Super Admin' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Viewer' })).toBeVisible();
  });
});
