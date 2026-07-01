/**
 * HOME PAGE -- Full UI/UX/SEO test suite
 */
import { test, expect } from '../utils/auditFixture';
import type { Route } from '@playwright/test';

test.describe('Home Page @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('HOME-001: SEO - Title contains brand name', async ({ page }) => {
    await expect(page).toHaveTitle(/Humours Hub|Humors Hub/i);
  });

  test('HOME-002: SEO - Meta description exists', async ({ page }) => {
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveCount(1);
    const content = await metaDesc.getAttribute('content');
    expect(content?.length).toBeGreaterThan(10);
  });

  test('HOME-003: SEO - Single H1 on page', async ({ page }) => {
    const count = await page.locator('h1').count();
    expect(count).toBe(1);
  });

  test('HOME-004: Navbar is visible', async ({ page }) => {
    await expect(page.locator('nav').first()).toBeVisible();
  });

  test('HOME-005: Shows nav link navigates correctly', async ({ page }) => {
    const showsLink = page.locator('nav').first().locator('a[href="/shows"]').first();
    if (await showsLink.isVisible()) {
      await showsLink.click();
      await expect(page).toHaveURL(/\/shows/);
    }
  });

  test('HOME-006: Hero headline is visible', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('HOME-007: No broken images on load', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);
    });
    const appBrokenImages = brokenImages.filter((src: string) => !src.includes('data:'));
    expect(appBrokenImages, 'Broken images: ' + appBrokenImages.join(', ')).toHaveLength(0);
  });

  test('HOME-008: Footer is visible and has copyright', async ({ page }) => {
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
    const text = await footer.textContent();
    expect(text).toMatch(/copyright|humours|humors/i);
  });

  test('HOME-009: No console errors on initial load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.reload();
    await page.waitForLoadState('networkidle');
    const appErrors = errors.filter(e =>
      !e.includes('extension') && !e.includes('favicon') &&
      !e.includes('ERR_BLOCKED_BY_CLIENT') && !e.includes('analytics')
    );
    expect(appErrors, 'Console errors:\n' + appErrors.join('\n')).toHaveLength(0);
  });

  test('HOME-010: 1440px - No horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(1460);
  });

  test('HOME-011: Mobile 375px - Page is usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('HOME-012: No hydration mismatch errors', async ({ page }) => {
    const hydrationErrors: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('hydration') || msg.text().includes('Minified React error')) {
        hydrationErrors.push(msg.text());
      }
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(hydrationErrors).toHaveLength(0);
  });

  test('HOME-013: Theme color meta tag present', async ({ page }) => {
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveCount(1);
  });
});