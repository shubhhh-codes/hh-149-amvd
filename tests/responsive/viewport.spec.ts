/**
 * RESPONSIVE LAYOUT TESTS -- All breakpoints 320px to 1920px
 */
import { test, expect } from '@playwright/test';
import type { Route } from '@playwright/test';

const VIEWPORTS = [
  { name: '320px', width: 320, height: 568 },
  { name: '375px', width: 375, height: 812 },
  { name: '390px', width: 390, height: 844 },
  { name: '414px', width: 414, height: 896 },
  { name: '768px', width: 768, height: 1024 },
  { name: '820px', width: 820, height: 1180 },
  { name: '1024px', width: 1024, height: 768 },
  { name: '1280px', width: 1280, height: 800 },
  { name: '1440px', width: 1440, height: 900 },
  { name: '1920px', width: 1920, height: 1080 },
];

const PAGES_TO_TEST = [
  { route: '/', name: 'Home' },
  { route: '/auth/login', name: 'Login' },
  { route: '/contact', name: 'Contact' },
  { route: '/shows', name: 'Shows' },
];

for (const vp of VIEWPORTS) {
  test.describe('Responsive - ' + vp.name + ' @responsive', () => {
    for (const pg of PAGES_TO_TEST) {
      test('RESP-' + vp.width + '-' + pg.name + ': No horizontal overflow', async ({ page }) => {
        await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
        await page.route('**/api/shows/current-tiers', (route: Route) => route.fulfill({ status: 200, json: { tiers: [] } }));
        await page.route('**/api/bookings/venue-status', (route: Route) => route.fulfill({ status: 200, json: { seatsRemaining: 100, isSoldOut: false } }));

        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(pg.route);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const clientWidth = await page.evaluate(() => document.body.clientWidth);

        expect(scrollWidth,
          pg.name + ' at ' + vp.name + ' has horizontal overflow: scrollWidth=' + scrollWidth + ' > clientWidth=' + clientWidth
        ).toBeLessThanOrEqual(clientWidth + 5);
      });
    }

    test('RESP-' + vp.width + '-Navbar: Navbar is usable', async ({ page }) => {
      await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const nav = page.locator('nav, header').first();
      await expect(nav).toBeVisible();
    });

    test('RESP-' + vp.width + '-Text: H1 is visible', async ({ page }) => {
      await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();
    });
  });
}