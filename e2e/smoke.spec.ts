import { expect, test } from '@playwright/test';
test('public landing and demo login are reachable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /serve faster/i })).toBeVisible();
  await page.getByRole('link', { name: /open demo/i }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});
