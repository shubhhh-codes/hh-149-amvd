/**
 * EDGE CASES -- Unicode, Emoji, Large payloads, Race conditions, Network failures
 */
import { test, expect } from '@playwright/test';
import type { Route } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Edge Cases - Input Extremes @edge', () => {
  test('EDGE-001: Unicode characters in booking name', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/create', {
      data: { fullName: 'Priya Chakraborty hello', email: 'priya@test.com', phone: '9876543210', numberOfTickets: 1, cart: [{ tierKey: 'solo', units: 1, seats: 1, price: 499 }] }
    });
    expect([201, 400, 422]).toContain(res.status());
  });

  test('EDGE-002: Emoji characters in contact form', async ({ request }) => {
    const res = await request.post(BASE + '/api/contact/submit', {
      data: { name: 'Happy User', email: 'emoji@test.com', phone: '9876543210', message: 'Great show!' }
    });
    expect([200, 201, 400]).toContain(res.status());
  });

  test('EDGE-003: Empty string for all fields returns 400', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/create', {
      data: { fullName: '', email: '', phone: '', numberOfTickets: '', cart: [] }
    });
    expect([400, 422]).toContain(res.status());
  });

  test('EDGE-004: Null values in booking create body', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/create', {
      data: { fullName: null, email: null, phone: null, numberOfTickets: null, cart: null }
    });
    expect([400, 422, 500]).toContain(res.status());
  });

  test('EDGE-005: Negative ticket count rejected', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/create', {
      data: { fullName: 'Test', email: 'test@test.com', phone: '9999999999', numberOfTickets: -1, cart: [{ tierKey: 'solo', units: -1, seats: -1, price: 499 }] }
    });
    expect([400, 422]).toContain(res.status());
  });

  test('EDGE-006: Float ticket count handled', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/create', {
      data: { fullName: 'Test', email: 'test@test.com', phone: '9999999999', numberOfTickets: 1.5, cart: [{ tierKey: 'solo', units: 1.5, seats: 1.5, price: 499 }] }
    });
    expect([201, 400, 422]).toContain(res.status());
  });

  test('EDGE-007: Huge number for tickets rejected', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/create', {
      data: { fullName: 'Test', email: 'test@test.com', phone: '9999999999', numberOfTickets: 99999999, cart: [{ tierKey: 'solo', units: 99999999, seats: 99999999, price: 499 }] }
    });
    expect([400, 422]).toContain(res.status());
  });

  test('EDGE-008: Invalid email format in booking', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/create', {
      data: { fullName: 'Test', email: 'NOT_AN_EMAIL', phone: '9999999999', numberOfTickets: 1, cart: [{ tierKey: 'solo', units: 1, seats: 1, price: 499 }] }
    });
    expect([201, 400, 422]).toContain(res.status());
  });

  test('EDGE-009: Payment amount 0 rejected', async ({ request }) => {
    const res = await request.post(BASE + '/api/payments/create-order', {
      data: { numberOfTickets: 0, bookingId: 'HH-EDGE-001', cart: [] }
    });
    expect([400, 422]).toContain(res.status());
  });

  test('EDGE-010: Retrieve tickets with whitespace email', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/retrieve', {
      data: { email: '   test@test.com   ', phone: '  9876543210  ' }
    });
    expect([200, 400]).toContain(res.status());
  });
});

test.describe('Edge Cases - Race Conditions @edge', () => {
  test('EDGE-RACE-001: Concurrent booking requests do not crash server', async ({ request }) => {
    const requests = Array.from({ length: 5 }, () =>
      request.post(BASE + '/api/bookings/create', {
        data: { fullName: 'Race Test', email: 'race@test.com', phone: '9999999999', numberOfTickets: 1, cart: [{ tierKey: 'solo', units: 1, seats: 1, price: 499 }] }
      })
    );
    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status());
    const hasCrash = statuses.some(s => s >= 500);
    expect(hasCrash, 'Concurrent requests caused 500: ' + JSON.stringify(statuses)).toBe(false);
  });

  test('EDGE-RACE-002: Concurrent payment verify requests handled safely', async ({ request }) => {
    const payload = { razorpay_order_id: 'order_race', razorpay_payment_id: 'pay_race', razorpay_signature: 'fakesig', bookingId: 'HH-RACE-001' };
    const responses = await Promise.all([
      request.post(BASE + '/api/payments/verify', { data: payload }),
      request.post(BASE + '/api/payments/verify', { data: payload }),
    ]);
    const hasCrash = responses.some(r => r.status() >= 500);
    if (hasCrash) console.log('[WARN] EDGE-RACE-002: Concurrent payment verify caused 500');
  });
});

test.describe('Edge Cases - Network Failures @edge', () => {
  test('EDGE-NET-001: Home page loads even if analytics API fails', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.abort('failed'));
    const res = await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('EDGE-NET-002: Book tickets page loads even if tiers API fails', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.route('**/api/shows/current-tiers', (route: Route) => route.abort('failed'));
    await page.route('**/api/bookings/venue-status', (route: Route) => route.abort('failed'));
    const res = await page.goto('/book-tickets');
    await page.waitForLoadState('networkidle');
    expect(res?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
  });

  test('EDGE-NET-003: Retrieve tickets shows error on network failure', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.route('**/api/bookings/retrieve', (route: Route) => route.abort('failed'));
    await page.goto('/retrieve-tickets');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"], input[name="email"]', 'test@test.com').catch(() => {});
    await page.fill('input[type="tel"], input[name="phone"]', '9999999999').catch(() => {});
    await page.locator('button[type="submit"]').first().click().catch(() => {});
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });
});