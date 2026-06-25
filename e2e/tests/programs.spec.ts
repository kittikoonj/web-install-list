import { test, expect } from '@playwright/test';
import { loginAsAdmin, uniqueName } from './helpers';

test.describe('Programs', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/programs');
  });

  test('loads programs page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Programs' })).toBeVisible();
    await expect(page.getByRole('button', { name: /เพิ่ม Program/ })).toBeVisible();
  });

  test('can create program', async ({ page }) => {
    const programName = uniqueName('E2E Program');
    await page.getByRole('button', { name: /เพิ่ม Program/ }).click();
    await page.locator('.modal input[type="text"]').first().fill(programName);
    await page.locator('.modal input[type="url"]').fill('https://github.com/example/repo');

    const methodChip = page.locator('.modal label.chip').first();
    if (await methodChip.count()) {
      await methodChip.click();
    }

    await page.getByRole('button', { name: 'บันทึก' }).click();
    await expect(page.getByText(programName)).toBeVisible({ timeout: 15_000 });
  });
});
