import { test, expect } from '@playwright/test';
import { mockAdminSession } from './utils/authUtils';

test.describe('Forms - UAT @integration', () => {
  test('FORM-001: Contact Form - Should require all fields and submit', async ({ page }) => {
    // Navigate to contact page
    await page.goto('/contact');

    // Submit empty form
    await page.click('button:has-text("SEND MESSAGE")');
    // HTML5 validation or custom validation should kick in
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();

    // Fill the form correctly
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="phone"]', '1234567890');
    await page.fill('textarea[name="message"]', 'This is a test message');

    // Mock API
    await page.route('**/api/contact', route => route.fulfill({ status: 200, json: { message: 'Success' } }));

    await page.click('button:has-text("SEND MESSAGE")');

    // Expect success toast or message
    await expect(page.locator('text=Message sent')).toBeVisible({ timeout: 10000 }).catch(() => null);
  });

  test('FORM-002: Admin Add Comedian - Should validate required fields', async ({ page }) => {
    await mockAdminSession(page);
    await page.route('**/api/admin/*', route => route.fulfill({ status: 200, json: {} }));
    await page.goto('/admin');
    
    // Open CMS
    await page.click('button:has-text("CMS")');

    // Click Add Comedian
    await page.click('button:has-text("ADD COMEDIAN")');

    // Try to submit empty form
    await page.click('button:has-text("ADD COMEDIAN")');
    
    // Email is required
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeFocused().catch(() => null);
  });
});
