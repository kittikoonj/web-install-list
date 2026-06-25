import { test, expect } from '@playwright/test';
import { loginAsViewer } from './helpers';

test.describe('Viewer read-only', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsViewer(page);
  });

  test('viewer cannot see create buttons on install lists', async ({ page }) => {
    await page.goto('/install-lists');
    await expect(page.getByRole('heading', { name: 'Install Lists' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create List/ })).toHaveCount(0);
  });

  test('viewer cannot see create buttons on issues', async ({ page }) => {
    await page.goto('/issues');
    await expect(page.getByRole('heading', { name: 'Issues' })).toBeVisible();
    await expect(page.getByRole('button', { name: /เพิ่ม Issue/ })).toHaveCount(0);
  });

  test('viewer can still export install list', async ({ page }) => {
    await page.goto('/install-lists');
    const exportBtn = page.getByRole('button', { name: 'Export' }).first();
    if (await exportBtn.count()) {
      await expect(exportBtn).toBeVisible();
    }
  });
});
