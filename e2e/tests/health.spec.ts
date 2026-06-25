import { test, expect } from '@playwright/test';

test.describe('Health API', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get('http://127.0.0.1:3000/api/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.db).toBe('ok');
  });
});
