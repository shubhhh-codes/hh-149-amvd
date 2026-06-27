import { test, expect } from '@playwright/test';

test.describe('General UX and Layout @smoke', () => {
  test('UX-001: First page load and navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/Humours Hub/i);
    
    // Check navigation links
    await expect(page.locator('a:has-text("Shows")')).toBeVisible();
    await expect(page.locator('a:has-text("Gallery")')).toBeVisible();
    
    // Check responsive layout (desktop)
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('UX-002: 404 Error State', async ({ page }) => {
    const res = await page.goto('/non-existent-page-1234');
    expect(res?.status()).toBe(404);
    await expect(page.locator('text=404')).toBeVisible();
  });

  test('UX-003: Mobile menu toggle', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    
    const menuButton = page.locator('button[aria-label="Toggle menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      // Should show mobile nav
      await expect(page.locator('a:has-text("Shows")').nth(1)).toBeVisible();
    }
  });
});
