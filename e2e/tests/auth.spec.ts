import { test, expect } from '@playwright/test';
import { ADMIN, login, loginAsAdmin, logout } from './helpers';

test.describe('Authentication', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Install List Manager' })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill(ADMIN.email);
    await page.locator('#password').fill('wrong-password');
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
    await expect(page.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('admin can login and logout', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator('.sidebar-footer .user-name')).toHaveText('E2E Admin');
    await logout(page);
  });

  test('change password modal opens', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('button', { name: 'เปลี่ยนรหัสผ่าน' }).click();
    await expect(page.getByRole('heading', { name: 'เปลี่ยนรหัสผ่าน' })).toBeVisible();
    await page.getByRole('button', { name: 'ยกเลิก' }).click();
  });
});
