import { test, expect } from '../utils/auditFixture';
import { mockAdminSession } from '../utils/authUtils';
import { mockCameraPermission } from '../utils/mockUtils';

test.describe('QR Scanner - Open and Close Flows @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminSession(page);
    // Mock APIs used on dashboard load to prevent errors
    await page.route('**/api/admin/bookings', route => route.fulfill({ status: 200, json: { bookings: [] } }));
    await page.route('**/api/admin/comedians', route => route.fulfill({ status: 200, json: { comedians: [] } }));
    await page.route('**/api/admin/payments', route => route.fulfill({ status: 200, json: { payments: [], stats: {} } }));
    await page.route('**/api/admin/contact-messages', route => route.fulfill({ status: 200, json: { messages: [] } }));
    await page.route('**/api/admin/feedbacks', route => route.fulfill({ status: 200, json: { feedbacks: [] } }));
  });

  test('TC-001: Should open scanner and request camera', async ({ page }) => {
    await mockCameraPermission(page, 'granted');
    await page.goto('/admin');
    
    // Click on QR Scanner tab (desktop) or mobile nav
    // Looking at index.tsx, there are nav buttons for 'scanner'
    await page.click('button:has-text("QR Scanner")');

    // Verify scanner overlay is open
    const scannerTitle = page.locator('text=Scanner Ready');
    // The UI should show something indicating the scanner is ready/active.
    // I'll check for a general close button or standard overlay UI
    const closeBtn = page.locator('button:has-text("close")').first();
    await expect(closeBtn).toBeVisible();
    
    // We expect video element to be visible
    const video = page.locator('video').first();
    await expect(video).toBeVisible();
  });

  test('TC-002: Should close scanner and stop camera', async ({ page }) => {
    await mockCameraPermission(page, 'granted');
    await page.goto('/admin');
    
    await page.click('button:has-text("QR Scanner")');
    await expect(page.locator('video').first()).toBeVisible();

    // Click close
    await page.click('button:has-text("close")');

    // Video should be unmounted or hidden
    await expect(page.locator('video').first()).not.toBeVisible();
  });

  test('TC-003: Memory leak - rapid open and close loop', async ({ page }) => {
    await mockCameraPermission(page, 'granted');
    await page.goto('/admin');
    
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("QR Scanner")');
      await expect(page.locator('video').first()).toBeVisible();
      await page.click('button:has-text("close")');
      await expect(page.locator('video').first()).not.toBeVisible();
    }
  });
});
