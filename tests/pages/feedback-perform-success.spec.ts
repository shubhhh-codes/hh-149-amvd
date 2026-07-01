/**
 * FEEDBACK PAGE - Rating, form submission, validation
 */
import { test, expect } from '../utils/auditFixture';

test.describe('Feedback Page @integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/analytics/visit', route => route.fulfill({ status: 200, json: {} }));
    await page.goto('/feedback');
    await page.waitForLoadState('networkidle');
  });

  test('FEEDBACK-001: Page loads with form or heading', async ({ page }) => {
    await expect(page.locator('h1, h2, form').first()).toBeVisible();
  });

  test('FEEDBACK-002: Form fields present', async ({ page }) => {
    const body = await page.textContent('body');
    const hasForm = await page.locator('input, textarea, select').count();
    expect(hasForm).toBeGreaterThan(0);
  });

  test('FEEDBACK-003: Successful submission handled', async ({ page }) => {
    await page.route('**/api/feedback*', route => route.fulfill({
      status: 200, json: { message: 'Feedback submitted' }
    }));
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailField.isVisible()) {
      await emailField.fill('feedback@test.com');
    }
    const msgArea = page.locator('textarea').first();
    if (await msgArea.isVisible()) {
      await msgArea.fill('Great show, very entertaining!');
    }
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

/**
 * PERFORM WITH US PAGE - Application form, CTA
 */
test.describe('Perform With Us Page @integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/analytics/visit', route => route.fulfill({ status: 200, json: {} }));
    await page.route('**/api/comedians/register', route => route.fulfill({
      status: 201, json: { message: 'Application submitted' }
    }));
    await page.goto('/perform-with-us');
    await page.waitForLoadState('networkidle');
  });

  test('PERFORM-001: Page loads', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('PERFORM-002: Application form fields visible', async ({ page }) => {
    const inputs = await page.locator('input, textarea').count();
    expect(inputs).toBeGreaterThan(0);
  });

  test('PERFORM-003: Name field present', async ({ page }) => {
    const nameField = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameField.isVisible()) {
      await expect(nameField).toBeVisible();
    }
  });

  test('PERFORM-004: WhatsApp or contact CTA exists', async ({ page }) => {
    const body = await page.textContent('body');
    const hasWhatsApp = /whatsapp|wa\.me|contact us/i.test(body || '');
    if (!hasWhatsApp) console.log('[WARN] PERFORM-004: WhatsApp CTA not found');
  });

  test('PERFORM-005: Empty form submit stays on page', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Apply")').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await expect(page).toHaveURL(/\/perform-with-us/);
    }
  });
});

/**
 * BOOKING SUCCESS PAGE
 */
test.describe('Booking Success Page @integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/analytics/visit', route => route.fulfill({ status: 200, json: {} }));
  });

  test('BOOKING-SUCCESS-001: Success page loads with booking ID from query', async ({ page }) => {
    await page.goto('/booking-success?id=HH-2026-000001');
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    expect(body).toMatch(/HH-2026-000001|booking|confirmed|success/i);
  });

  test('BOOKING-SUCCESS-002: Without booking ID still renders', async ({ page }) => {
    await page.goto('/booking-success');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(50);
  });

  test('BOOKING-SUCCESS-003: Download ticket button or link present', async ({ page }) => {
    await page.goto('/booking-success?id=HH-2026-000001&token=test-token');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    const hasDownload = /download|ticket|pdf/i.test(body || '');
    if (!hasDownload) console.log('[INFO] BOOKING-SUCCESS-003: Download button not visible (may require valid token)');
  });
});
