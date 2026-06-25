import { test, expect } from '@playwright/test';
import { loginAsAdmin, uniqueName } from './helpers';

test.describe('Install Lists', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/install-lists');
  });

  test('loads install lists page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Install Lists' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create List/ })).toBeVisible();
  });

  test('search works', async ({ page }) => {
    await page.getByPlaceholder('ค้นหาชื่อ list').fill('test');
    await page.getByRole('button', { name: 'ค้นหา' }).click();
    await expect(page.locator('.data-table')).toBeVisible();
  });

  test('can open create modal', async ({ page }) => {
    await page.getByRole('button', { name: /Create List/ }).click();
    await expect(page.getByRole('heading', { name: 'Create List' })).toBeVisible();
    await page.locator('.modal-header .icon-btn').click();
  });

  test('can create install list', async ({ page }) => {
    const listName = uniqueName('E2E List');
    await page.getByRole('button', { name: /Create List/ }).click();
    await page.locator('.modal input[type="text"]').first().fill(listName);

    const programChip = page.locator('.program-select-list label.chip').first();
    if (await programChip.count()) {
      await programChip.click();
    }

    await page.getByRole('button', { name: 'บันทึก' }).click();
    await expect(page.getByText(listName)).toBeVisible({ timeout: 15_000 });
  });
});
