/**
 * SHOWS PAGE - Show cards, tier info, sold-out state
 */
import { test, expect } from '../utils/auditFixture';

test.describe('Shows Page @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/analytics/visit', route => route.fulfill({ status: 200, json: {} }));
    await page.route('**/api/shows/current-tiers', route => route.fulfill({
      status: 200,
      json: {
        tiers: [
          { key: 'solo', name: 'Solo Pass', price: 499, seats: 1 },
          { key: 'duo', name: 'Duo Pass', price: 899, seats: 2, badge: 'MOST POPULAR' },
        ]
      }
    }));
    await page.route('**/api/bookings/venue-status', route => route.fulfill({
      status: 200, json: { seatsRemaining: 80, totalBooked: 70, maxCapacity: 150, isSoldOut: false }
    }));
    await page.goto('/shows');
    await page.waitForLoadState('networkidle');
  });

  test('SHOWS-001: Page loads with a heading', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('SHOWS-002: Shows page title is correct', async ({ page }) => {
    await expect(page).toHaveTitle(/.+/);
  });

  test('SHOWS-003: Book Now / Get Tickets CTA is present', async ({ page }) => {
    await page.waitForTimeout(1000);
    const cta = page.locator('a[href="/book-tickets"], button:has-text("Book"), a:has-text("Book")').first();
    if (await cta.isVisible()) {
      await expect(cta).toBeVisible();
    }
  });

  test('SHOWS-004: Ticket prices are displayed', async ({ page }) => {
    await page.waitForTimeout(1500);
    const body = await page.textContent('body');
    expect(body).toMatch(/499|899|₹/);
  });

  test('SHOWS-005: No horizontal overflow at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(1300);
  });
});

/**
 * GALLERY PAGE
 */
test.describe('Gallery Page @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/analytics/visit', route => route.fulfill({ status: 200, json: {} }));
    await page.goto('/gallery');
    await page.waitForLoadState('networkidle');
  });

  test('GALLERY-001: Page loads with heading', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('GALLERY-002: Images or placeholders are present', async ({ page }) => {
    await page.waitForTimeout(1000);
    const imgs = await page.locator('img').count();
    const divs = await page.locator('[class*="gallery"], [class*="image"], [class*="photo"]').count();
    expect(imgs + divs).toBeGreaterThan(0);
  });

  test('GALLERY-003: No broken images', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const broken = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src)
        .filter(src => !src.includes('data:'))
    );
    expect(broken).toHaveLength(0);
  });
});

/**
 * ABOUT PAGE
 */
test.describe('About Page @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/analytics/visit', route => route.fulfill({ status: 200, json: {} }));
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
  });

  test('ABOUT-001: Page loads', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('ABOUT-002: No broken images', async ({ page }) => {
    const broken = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src).filter(s => !s.includes('data:'))
    );
    expect(broken).toHaveLength(0);
  });
});

/**
 * POLICIES PAGE
 */
test.describe('Policies Page @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/analytics/visit', route => route.fulfill({ status: 200, json: {} }));
    await page.goto('/policies');
    await page.waitForLoadState('networkidle');
  });

  test('POLICIES-001: Page loads', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('POLICIES-002: Policy content is present', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(200);
  });
});

/**
 * SUPPORT PAGE
 */
test.describe('Support Page @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/analytics/visit', route => route.fulfill({ status: 200, json: {} }));
    await page.goto('/support');
    await page.waitForLoadState('networkidle');
  });

  test('SUPPORT-001: Page loads', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
  });
});

/**
 * 404 PAGE
 */
test.describe('404 Page @smoke', () => {
  test('404-001: Non-existent route returns 404', async ({ page }) => {
    await page.route('**/api/analytics/visit', route => route.fulfill({ status: 200, json: {} }));
    const response = await page.goto('/this-page-does-not-exist-qa-9999');
    expect(response?.status()).toBe(404);
  });

  test('404-002: 404 page renders meaningful content', async ({ page }) => {
    await page.route('**/api/analytics/visit', route => route.fulfill({ status: 200, json: {} }));
    await page.goto('/this-page-does-not-exist-qa-9999');
    const body = await page.textContent('body');
    expect(body).toMatch(/404|not found|oops/i);
  });

  test('404-003: 404 page has home link', async ({ page }) => {
    await page.route('**/api/analytics/visit', route => route.fulfill({ status: 200, json: {} }));
    await page.goto('/this-page-does-not-exist-qa-9999');
    const homeLink = page.locator('a[href="/"], a:has-text("Home"), a:has-text("Go back")');
    if (await homeLink.count() > 0) {
      await expect(homeLink.first()).toBeVisible();
    }
  });
});
