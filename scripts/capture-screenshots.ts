import { chromium, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:3000';
const outputDir = path.resolve(process.cwd(), 'docs', 'screenshots');

async function settle(page: Page, delay = 2500) {
  await page.waitForLoadState('domcontentloaded');
  await page.locator('.skeleton').first().waitFor({ state: 'detached', timeout: 45_000 }).catch(() => undefined);
  await page.waitForTimeout(delay);
}

async function capture(page: Page, route: string, fileName: string, fullPage = true) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await settle(page);
  await page.screenshot({ path: path.join(outputDir, fileName), fullPage });
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch();

  const publicContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const publicPage = await publicContext.newPage();
  await capture(publicPage, '/', '01-landing-page.png');
  await capture(publicPage, '/login', '02-login-page.png');
  await publicContext.close();

  const appContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await appContext.newPage();
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await settle(page, 1500);
  await page.getByLabel('Email address').fill('manager@dineflow.com');
  await page.locator('input[name="password"]').fill('Manager@123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/dashboard/);
  await settle(page, 3500);
  await page.screenshot({ path: path.join(outputDir, '03-dashboard.png'), fullPage: true });

  await capture(page, '/pos', '04-point-of-sale.png');
  await capture(page, '/kitchen', '05-kitchen-display.png', false);
  await capture(page, '/inventory', '06-inventory.png');
  await capture(page, '/reports', '07-reports.png');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await settle(page, 3000);
  await page.screenshot({ path: path.join(outputDir, '08-mobile-dashboard.png'), fullPage: true });

  await appContext.close();
  await browser.close();
  console.info(`Captured screenshots in ${outputDir}`);
}

void main();
