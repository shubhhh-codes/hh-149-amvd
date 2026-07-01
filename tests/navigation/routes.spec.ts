/**
 * NAVIGATION TESTS -- All routes, links, 404 handling
 */
import { test, expect } from '../utils/auditFixture';
import type { Route } from '@playwright/test';

const PUBLIC_ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/shows', name: 'Shows' },
  { path: '/gallery', name: 'Gallery' },
  { path: '/about', name: 'About' },
  { path: '/contact', name: 'Contact' },
  { path: '/feedback', name: 'Feedback' },
  { path: '/perform-with-us', name: 'Perform With Us' },
  { path: '/book-tickets', name: 'Book Tickets' },
  { path: '/retrieve-tickets', name: 'Retrieve Tickets' },
  { path: '/policies', name: 'Policies' },
  { path: '/support', name: 'Support' },
  { path: '/auth/login', name: 'Login' },
];

test.describe('Navigation - All Public Routes Load @smoke', () => {
  for (const route of PUBLIC_ROUTES) {
    test('NAV-' + route.name + ': ' + route.path + ' returns 200', async ({ page }) => {
      await page.route('**/api/analytics/visit', (r: Route) => r.fulfill({ status: 200, json: {} }));
      await page.route('**/api/shows/current-tiers', (r: Route) => r.fulfill({ status: 200, json: { tiers: [] } }));
      await page.route('**/api/bookings/venue-status', (r: Route) => r.fulfill({ status: 200, json: { seatsRemaining: 100, isSoldOut: false } }));

      const res = await page.goto(route.path);
      await page.waitForLoadState('networkidle');

      expect(res?.status(), route.path + ' returned non-200 status').toBeLessThan(400);
      const bodyText = await page.textContent('body');
      expect(bodyText?.trim().length).toBeGreaterThan(50);
    });
  }

  test('NAV-Booking-Success: /booking-success renders', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    const res = await page.goto('/booking-success?id=HH-TEST-001');
    await page.waitForLoadState('networkidle');
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Navigation - Footer Links @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('NAV-FOOTER-001: Footer links do not lead to 404', async ({ page }) => {
    const footerLinks = await page.locator('footer a[href^="/"]').all();
    for (const link of footerLinks) {
      const href = await link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        const res = await page.request.get('http://localhost:3000' + href);
        expect(res.status(), 'Footer link ' + href + ' returned ' + res.status()).toBeLessThan(400);
      }
    }
  });
});

test.describe('Navigation - Back Navigation @ux', () => {
  test('NAV-BACK-001: Browser back button works from Contact to Home', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.goto('/');
    await page.goto('/contact');
    await page.goBack();
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/?$/);
  });

  test('NAV-BACK-002: Browser back button from login goes to previous page', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.goto('/shows');
    await page.waitForLoadState('networkidle');
    await page.goto('/auth/login');
    await page.goBack();
    await expect(page).toHaveURL(/\/shows/);
  });
});

test.describe('Navigation - Edge Cases @ux', () => {
  test('NAV-EDGE-001: Random unknown path returns 404', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    const res = await page.goto('/absolutely-nonexistent-page-qa-777');
    expect(res?.status()).toBe(404);
  });

  test('NAV-EDGE-002: API path returns JSON', async ({ page }) => {
    const res = await page.goto('/api/bookings/venue-status');
    expect(res?.status()).toBe(200);
    const body = await page.textContent('body');
    expect(body).toMatch(/seats|capacity|booked/i);
  });

  test('NAV-EDGE-003: Booking-success without query params still renders', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    const res = await page.goto('/booking-success');
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });
});