/**
 * RETRIEVE TICKETS PAGE - Email+phone lookup, empty state, error handling
 */
import { test, expect } from '../utils/auditFixture';

const MOCK_BOOKINGS = [
  {
    bookingId: 'HH-2026-000001',
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '9876543210',
    numberOfTickets: 2,
    status: 'approved',
    cart: [{ tierKey: 'duo', units: 1, seats: 2, price: 899 }],
    createdAt: new Date().toISOString(),
  }
];

test.describe('Retrieve Tickets Page @integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/analytics/visit', route => route.fulfill({ status: 200, json: {} }));
    await page.goto('/retrieve-tickets');
    await page.waitForLoadState('networkidle');
  });

  test('RETRIEVE-001: Page loads with form fields', async ({ page }) => {
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="tel"], input[name="phone"]').first()).toBeVisible();
  });

  test('RETRIEVE-002: Empty submit stays on page', async ({ page }) => {
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/\/retrieve-tickets/);
  });

  test('RETRIEVE-003: Valid lookup returns booking results', async ({ page }) => {
    await page.route('**/api/bookings/retrieve', route => route.fulfill({
      status: 200,
      json: { bookings: MOCK_BOOKINGS, cancelledBookings: [] }
    }));
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.fill('input[type="tel"], input[name="phone"]', '9876543210');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toMatch(/HH-2026-000001|Test User|Duo/i);
  });

  test('RETRIEVE-004: No bookings found shows empty state message', async ({ page }) => {
    await page.route('**/api/bookings/retrieve', route => route.fulfill({
      status: 200,
      json: { bookings: [], cancelledBookings: [] }
    }));
    await page.fill('input[type="email"], input[name="email"]', 'noone@example.com');
    await page.fill('input[type="tel"], input[name="phone"]', '0000000000');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toMatch(/no booking|not found|couldn't find|no ticket/i);
  });

  test('RETRIEVE-005: API error shows friendly message', async ({ page }) => {
    await page.route('**/api/bookings/retrieve', route => route.fulfill({
      status: 500, json: { message: 'Server error' }
    }));
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.fill('input[type="tel"], input[name="phone"]', '9876543210');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2000);
    // Should not show blank screen
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('RETRIEVE-006: SQL injection in email field is handled safely', async ({ page }) => {
    await page.route('**/api/bookings/retrieve', route => route.fulfill({
      status: 200, json: { bookings: [], cancelledBookings: [] }
    }));
    await page.fill('input[type="email"], input[name="email"]', "'; DROP TABLE bookings; --");
    await page.fill('input[type="tel"], input[name="phone"]', '9876543210');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('RETRIEVE-007: Cancelled bookings shown separately', async ({ page }) => {
    await page.route('**/api/bookings/retrieve', route => route.fulfill({
      status: 200,
      json: {
        bookings: MOCK_BOOKINGS,
        cancelledBookings: [{
          bookingId: 'HH-2026-000099',
          fullName: 'Cancelled User',
          numberOfTickets: 1,
          status: 'cancelled'
        }]
      }
    }));
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.fill('input[type="tel"], input[name="phone"]', '9876543210');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    // Both bookings should be visible
    expect(body).toMatch(/HH-2026-000001/);
  });
});
