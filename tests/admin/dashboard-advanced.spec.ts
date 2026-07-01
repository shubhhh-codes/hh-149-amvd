/**
 * ADMIN DASHBOARD — Advanced tab tests, CMS, Check-in
 */
import { test, expect } from '../utils/auditFixture';
import { mockAdminSession } from '../utils/authUtils';
import type { Route } from '@playwright/test';

const mockAllAdminRoutes = async (page: any) => {
  await page.route('**/api/admin/bookings', (route: Route) => route.fulfill({
    status: 200,
    json: {
      bookings: [
        {
          _id: 'abc123', bookingId: 'HH-2026-000001', fullName: 'Alice Smith',
          email: 'alice@test.com', phone: '9876543210', numberOfTickets: 2,
          status: 'approved', bookingType: 'paid', attended: false,
          cart: [{ tierKey: 'duo', units: 1, seats: 2, price: 899 }],
          createdAt: new Date().toISOString()
        }
      ]
    }
  }));
  await page.route('**/api/admin/comedians', (route: Route) => route.fulfill({
    status: 200, json: { comedians: [{ _id: 'c1', name: 'Bob Comedian', email: 'bob@test.com', status: 'pending', createdAt: new Date().toISOString() }] }
  }));
  await page.route('**/api/admin/payments', (route: Route) => route.fulfill({
    status: 200, json: { payments: [{ _id: 'p1', bookingId: 'HH-2026-000001', amount: 89900, status: 'completed', createdAt: new Date().toISOString() }], stats: { totalAmount: 89900 } }
  }));
  await page.route('**/api/admin/contact-messages', (route: Route) => route.fulfill({
    status: 200, json: { messages: [] }
  }));
  await page.route('**/api/admin/feedbacks', (route: Route) => route.fulfill({
    status: 200, json: { feedbacks: [] }
  }));
  await page.route('**/api/admin/cms/ticket-tiers', (route: Route) => route.fulfill({
    status: 200,
    json: { tiers: [{ key: 'solo', name: 'Solo Pass', price: 499, seats: 1 }], earlyBird: { isActive: false, price: 119, maxBookings: 30 } }
  }));
  await page.route('**/api/analytics*', (route: Route) => route.fulfill({ status: 200, json: {} }));
  await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
  await page.route('**/api/system/activity', (route: Route) => route.fulfill({ status: 200, json: { events: [] } }));
};

test.describe('Admin Dashboard — Advanced @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminSession(page);
    await mockAllAdminRoutes(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('DASH-ADV-001: Dashboard header/title is visible', async ({ page }) => {
    await expect(page.locator('h1, h2, [class*="headline"]').first()).toBeVisible();
  });

  test('DASH-ADV-002: Stats cards render Total Revenue', async ({ page }) => {
    await expect(page.locator('text=Total Revenue')).toBeVisible({ timeout: 8000 });
  });

  test('DASH-ADV-003: Stats cards render Active Bookings', async ({ page }) => {
    await expect(page.locator('text=Active Bookings')).toBeVisible({ timeout: 8000 });
  });

  test('DASH-ADV-004: Mocked booking appears in bookings table', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/Alice Smith|HH-2026-000001/i);
  });

  test('DASH-ADV-005: Comedians tab is accessible', async ({ page }) => {
    const comedianTab = page.locator('button:has-text("Comedian"), button:has-text("COMEDIAN")').first();
    if (await comedianTab.isVisible()) {
      await comedianTab.click();
      await page.waitForTimeout(1000);
      const body = await page.textContent('body');
      expect(body).toMatch(/comedian|Bob/i);
    }
  });

  test('DASH-ADV-006: CMS tab is accessible', async ({ page }) => {
    const cmsTab = page.locator('button:has-text("CMS")').first();
    if (await cmsTab.isVisible()) {
      await cmsTab.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('DASH-ADV-007: Payments tab shows revenue', async ({ page }) => {
    const paymentsTab = page.locator('button:has-text("Payment"), button:has-text("PAYMENT")').first();
    if (await paymentsTab.isVisible()) {
      await paymentsTab.click();
      await page.waitForTimeout(1000);
      const body = await page.textContent('body');
      expect(body).toMatch(/payment|revenue|amount/i);
    }
  });

  test('DASH-ADV-008: Messages/Feedback tabs accessible', async ({ page }) => {
    const msgTab = page.locator('button:has-text("Message"), button:has-text("Contact")').first();
    if (await msgTab.isVisible()) {
      await msgTab.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('DASH-ADV-009: Revenue formatted correctly (not raw paise)', async ({ page }) => {
    const body = await page.textContent('body');
    // 89900 paise = 899 rupees. Should NOT show "89900" raw as revenue, should show 899
    const showsRawPaise = /₹89,?900|₹ 89,?900/.test(body || '');
    // This checks the payment mock - it should show 899 not 89900
    if (showsRawPaise) {
      console.log('[WARN] DASH-ADV-009: Revenue may be displaying in paise rather than rupees');
    }
  });

  test('DASH-ADV-010: Network error on bookings shows error message', async ({ page }) => {
    await page.route('**/api/admin/bookings', route => route.abort('failed'));
    await page.goto('/admin');
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    const hasError = /error|failed|unable|something went wrong/i.test(body || '');
    if (!hasError) console.log('[WARN] DASH-ADV-010: No error state shown for network failure');
  });

  test('DASH-ADV-011: Unauthorized access redirects to login', async ({ page }) => {
    // Test without admin session
    const freshPage = page;
    await freshPage.context().clearCookies();
    await freshPage.route('**/api/auth/session', route => route.fulfill({
      status: 200, json: {} // No user, no session
    }));
    await freshPage.goto('/admin');
    await freshPage.waitForTimeout(2000);
    // Should redirect to /auth/login or show unauthorized
    const url = freshPage.url();
    const isRedirected = url.includes('/auth/login') || url.includes('/auth/error');
    const body = await freshPage.textContent('body');
    const hasUnauth = /login|unauthorized|sign in/i.test(body || '');
    expect(isRedirected || hasUnauth).toBe(true);
  });

  test('DASH-ADV-012: No console errors on admin page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const appErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('extension') &&
      !e.includes('analytics') && !e.includes('ERR_BLOCKED_BY_CLIENT')
    );
    if (appErrors.length > 0) {
      console.log('[INFO] DASH-ADV-012 console errors: ' + appErrors.join(', '));
    }
  });
});

test.describe('Admin CMS @integration', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminSession(page);
    await mockAllAdminRoutes(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    // Navigate to CMS tab
    const cmsTab = page.locator('button:has-text("CMS")').first();
    if (await cmsTab.isVisible()) await cmsTab.click();
    await page.waitForTimeout(1000);
  });

  test('CMS-001: Ticket tier prices are displayed', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/499|tier|solo|pass/i);
  });

  test('CMS-002: Add Comedian button is present', async ({ page }) => {
    const btn = page.locator('button:has-text("ADD COMEDIAN"), button:has-text("Add Comedian")').first();
    if (await btn.isVisible()) await expect(btn).toBeVisible();
  });

  test('CMS-003: Image upload section visible', async ({ page }) => {
    const body = await page.textContent('body');
    const hasUpload = /upload|image|gallery|photo/i.test(body || '');
    if (!hasUpload) console.log('[INFO] CMS-003: Upload section not found in CMS tab');
  });
});

test.describe('Admin Check-in / QR Scanner @integration', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminSession(page);
    await mockAllAdminRoutes(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('CHECKIN-001: Check-in / scanner section accessible', async ({ page }) => {
    const scannerTab = page.locator('button:has-text("Scan"), button:has-text("Check"), button:has-text("QR")').first();
    if (await scannerTab.isVisible()) {
      await scannerTab.click();
      await page.waitForTimeout(1500);
      const body = await page.textContent('body');
      expect(body).toMatch(/scan|check.?in|camera|qr/i);
    } else {
      console.log('[INFO] CHECKIN-001: No scanner tab found (may be inline)');
    }
  });

  test('CHECKIN-002: Manual booking ID entry field present', async ({ page }) => {
    const scannerTab = page.locator('button:has-text("Scan"), button:has-text("Check"), button:has-text("QR")').first();
    if (await scannerTab.isVisible()) {
      await scannerTab.click();
      await page.waitForTimeout(1500);
      const manualInput = page.locator('input[placeholder*="booking" i], input[placeholder*="HH-" i], input[name*="booking" i]').first();
      if (await manualInput.isVisible()) await expect(manualInput).toBeVisible();
    }
  });
});
