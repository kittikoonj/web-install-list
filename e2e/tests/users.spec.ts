import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Users', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/users');
  });

  test('loads users page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
    await expect(page.getByText('e2e@example.com')).toBeVisible();
  });

  test('can open create user modal', async ({ page }) => {
    await page.getByRole('button', { name: /เพิ่ม User/ }).click();
    await expect(page.getByRole('heading', { name: /User/ })).toBeVisible();
  });
});
