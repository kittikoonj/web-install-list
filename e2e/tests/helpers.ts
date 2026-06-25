import { expect, Page } from '@playwright/test';

export const ADMIN = {
  email: 'e2e@example.com',
  password: 'e2e123',
};

export const VIEWER = {
  email: 'viewer@example.com',
  password: 'viewer123',
};

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

export async function loginAsAdmin(page: Page) {
  await login(page, ADMIN.email, ADMIN.password);
}

export async function loginAsViewer(page: Page) {
  await login(page, VIEWER.email, VIEWER.password);
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

export function uniqueName(prefix: string) {
  return `${prefix} ${Date.now()}`;
}
