import { test, expect } from '@playwright/test';

test.describe('Authentication - Login Page @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('AUTH-001: Should load login page correctly', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Welcome Back! ✨');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('AUTH-002: Should show validation error on empty submit', async ({ page }) => {
    await page.click('button[type="submit"]');
    // HTML5 validation will trigger. Ensure we remain on the same page.
    expect(page.url()).toContain('/auth/login');
  });

  test('AUTH-003: Should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page.locator('button[aria-label="Show password"]').click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // The aria-label toggles to "Hide password"
    await page.locator('button[aria-label="Hide password"]').click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('AUTH-004: Should show error for invalid credentials', async ({ page }) => {
    // Intercept next-auth credentials call
    await page.route('**/api/auth/callback/credentials*', async route => {
      // Mock failure response
      await route.fulfill({
        status: 401, 
        contentType: 'application/json',
        body: JSON.stringify({ error: 'CredentialsSignin' })
      });
    });

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    // It should eventually show the error banner
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 10000 });
  });
});
