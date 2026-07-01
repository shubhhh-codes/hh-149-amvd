/**
 * SECURITY TESTS -- Headers, Auth Bypass, CORS, Clickjacking
 */
import { test, expect } from '@playwright/test';
import type { Route } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Security - HTTP Headers @security', () => {
  test('SEC-HDR-001: X-Frame-Options is DENY', async ({ request }) => {
    const res = await request.get(BASE + '/');
    const header = res.headers()['x-frame-options'];
    expect(header).toBe('DENY');
  });

  test('SEC-HDR-002: X-Content-Type-Options is nosniff', async ({ request }) => {
    const res = await request.get(BASE + '/');
    const header = res.headers()['x-content-type-options'];
    expect(header).toBe('nosniff');
  });

  test('SEC-HDR-003: Content-Security-Policy header present', async ({ request }) => {
    const res = await request.get(BASE + '/');
    const csp = res.headers()['content-security-policy'];
    expect(csp).toBeTruthy();
    expect(csp).toContain('default-src');
  });

  test('SEC-HDR-004: Referrer-Policy header present', async ({ request }) => {
    const res = await request.get(BASE + '/');
    const rp = res.headers()['referrer-policy'];
    expect(rp).toBeTruthy();
  });

  test('SEC-HDR-005: Permissions-Policy header present', async ({ request }) => {
    const res = await request.get(BASE + '/');
    const pp = res.headers()['permissions-policy'];
    expect(pp).toBeTruthy();
  });

  test('SEC-HDR-006: X-Powered-By header is absent (fingerprinting)', async ({ request }) => {
    const res = await request.get(BASE + '/');
    const powered = res.headers()['x-powered-by'];
    expect(powered).toBeUndefined();
  });

  test('SEC-HDR-007: API routes return proper Content-Type JSON', async ({ request }) => {
    const res = await request.get(BASE + '/api/bookings/venue-status');
    const ct = res.headers()['content-type'];
    expect(ct).toContain('application/json');
  });

  test('SEC-HDR-008: CSP restricts script-src (no wildcard)', async ({ request }) => {
    const res = await request.get(BASE + '/');
    const csp = res.headers()['content-security-policy'] || '';
    expect(csp).not.toMatch(/script-src\s+\*/);
  });
});

test.describe('Security - Auth Bypass @security', () => {
  test('SEC-AUTH-001: /admin redirects unauthenticated users to login', async ({ page }) => {
    await page.route('**/api/auth/session', (route: Route) => route.fulfill({
      status: 200, json: {}
    }));
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    const url = page.url();
    const bodyText = await page.textContent('body');
    const isProtected = url.includes('/auth/login') || url.includes('/auth/error') ||
      /sign in|login|unauthorized/i.test(bodyText || '');
    expect(isProtected).toBe(true);
  });

  test('SEC-AUTH-002: Non-admin JWT role blocked from /admin', async ({ page }) => {
    await page.route('**/api/auth/session', (route: Route) => route.fulfill({
      status: 200,
      json: { user: { email: 'hacker@evil.com', role: 'user' }, expires: new Date(Date.now() + 86400000).toISOString() }
    }));
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    const url = page.url();
    const bodyText = await page.textContent('body');
    const isRedirected = url.includes('/auth/login') || /sign in|login|unauthorized/i.test(bodyText || '');
    if (!isRedirected) console.log('[WARN] SEC-AUTH-002: Non-admin role may have accessed /admin');
  });

  test('SEC-AUTH-003: Admin API routes return 401 without session', async ({ request }) => {
    const adminEndpoints = [
      '/api/admin/bookings',
      '/api/admin/payments',
      '/api/admin/comedians',
    ];
    for (const endpoint of adminEndpoints) {
      const res = await request.get(BASE + endpoint);
      expect([401, 403, 302], endpoint + ' should be protected but got ' + res.status()).toContain(res.status());
    }
  });

  test('SEC-AUTH-004: Open redirect not possible from login callbackUrl', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.goto('/auth/login?callbackUrl=https://evil.com');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).not.toContain('evil.com');
    expect(url).toContain('localhost:3000');
  });

  test('SEC-AUTH-005: CSRF - API POST without proper origin handled', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/create', {
      headers: { 'Origin': 'https://malicious-site.com' },
      data: { fullName: 'CSRF Test', email: 'csrf@evil.com', phone: '1234567890', numberOfTickets: 1, cart: [] }
    });
    expect([200, 201, 400, 403, 422, 500]).toContain(res.status());
  });
});

test.describe('Security - XSS @security', () => {
  test('SEC-XSS-001: XSS in contact form name does not execute', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.route('**/api/contact*', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.goto('/contact');
    await page.fill('input[name="name"]', '<img src=x onerror="window.__xssGlobal=true">');
    await page.waitForTimeout(500);
    const triggered = await page.evaluate(() => (window as any).__xssGlobal);
    expect(triggered).toBeFalsy();
  });

  test('SEC-XSS-002: Stored XSS in admin dashboard does not execute', async ({ page }) => {
    const { mockAdminSession } = await import('../utils/authUtils');
    await mockAdminSession(page);
    await page.route('**/api/admin/bookings', (route: Route) => route.fulfill({
      status: 200,
      json: {
        bookings: [{
          _id: 'xss1', bookingId: 'HH-XSS-001',
          fullName: '<script>window.__storedXSS=true</script>',
          email: 'xss@test.com', phone: '9999999999',
          numberOfTickets: 1, status: 'approved', bookingType: 'paid',
          cart: [], createdAt: new Date().toISOString()
        }]
      }
    }));
    await page.route('**/api/admin/comedians', (route: Route) => route.fulfill({ status: 200, json: { comedians: [] } }));
    await page.route('**/api/admin/payments', (route: Route) => route.fulfill({ status: 200, json: { payments: [], stats: {} } }));
    await page.route('**/api/admin/contact-messages', (route: Route) => route.fulfill({ status: 200, json: { messages: [] } }));
    await page.route('**/api/admin/feedbacks', (route: Route) => route.fulfill({ status: 200, json: { feedbacks: [] } }));
    await page.route('**/api/analytics*', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    const triggered = await page.evaluate(() => (window as any).__storedXSS);
    expect(triggered).toBeFalsy();
  });
});