/**
 * CONTACT PAGE - Form validation, submission, XSS resistance
 */
import { test, expect } from '../utils/auditFixture';

test.describe('Contact Page @integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/analytics/visit', route => route.fulfill({ status: 200, json: {} }));
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
  });

  test('CONTACT-001: Page loads with heading', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('CONTACT-002: Name field is required', async ({ page }) => {
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeVisible();
    const required = await nameInput.getAttribute('required');
    expect(required).not.toBeNull();
  });

  test('CONTACT-003: Email field validation rejects invalid emails', async ({ page }) => {
    const emailInput = page.locator('input[name="email"]');
    await emailInput.fill('not-an-email');
    await page.locator('button[type="submit"], button:has-text("SEND")').first().click();
    // HTML5 or custom validation - should not navigate away or should show error
    await expect(page).toHaveURL(/\/contact/);
  });

  test('CONTACT-004: Empty form submit stays on page', async ({ page }) => {
    await page.locator('button[type="submit"], button:has-text("SEND")').first().click();
    await expect(page).toHaveURL(/\/contact/);
  });

  test('CONTACT-005: Successful form submission shows feedback', async ({ page }) => {
    await page.route('**/api/contact*', route => route.fulfill({
      status: 200, json: { message: 'Message sent successfully' }
    }));
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    const phoneInput = page.locator('input[name="phone"]');
    if (await phoneInput.isVisible()) await phoneInput.fill('9876543210');
    const msgArea = page.locator('textarea[name="message"]');
    if (await msgArea.isVisible()) await msgArea.fill('This is a test message from QA.');
    await page.locator('button[type="submit"], button:has-text("SEND")').first().click();
    // Should show toast or success message
    await page.waitForTimeout(2000);
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/sent|success|received|thank/i);
  });

  test('CONTACT-006: XSS payload in name field is not executed', async ({ page }) => {
    const xssPayload = '<script>window.__xss_triggered=true</script>';
    await page.fill('input[name="name"]', xssPayload);
    await page.waitForTimeout(500);
    const xssTriggered = await page.evaluate(() => (window as any).__xss_triggered);
    expect(xssTriggered).toBeFalsy();
  });

  test('CONTACT-007: XSS payload in message field is not executed', async ({ page }) => {
    const xssPayload = '<img src=x onerror="window.__xss2=true">';
    const msgArea = page.locator('textarea[name="message"]');
    if (await msgArea.isVisible()) {
      await msgArea.fill(xssPayload);
      await page.waitForTimeout(500);
      const xssTriggered = await page.evaluate(() => (window as any).__xss2);
      expect(xssTriggered).toBeFalsy();
    }
  });

  test('CONTACT-008: Very long name field handled gracefully', async ({ page }) => {
    const longStr = 'A'.repeat(1000);
    await page.fill('input[name="name"]', longStr);
    // Should not crash the page
    await expect(page.locator('body')).toBeVisible();
  });

  test('CONTACT-009: Unicode characters in fields are accepted', async ({ page }) => {
    await page.fill('input[name="name"]', 'Priya Chakraborty 😂 नमस्ते');
    await expect(page.locator('body')).toBeVisible();
  });

  test('CONTACT-010: API 500 shows error state not blank screen', async ({ page }) => {
    await page.route('**/api/contact*', route => route.fulfill({ status: 500, json: { error: 'Internal Server Error' } }));
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    const msgArea = page.locator('textarea[name="message"]');
    if (await msgArea.isVisible()) await msgArea.fill('Test message');
    await page.locator('button[type="submit"], button:has-text("SEND")').first().click();
    await page.waitForTimeout(2000);
    // Page should still be rendered (not blank)
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });
});
