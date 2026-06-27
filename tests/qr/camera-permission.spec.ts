import { test, expect } from '../utils/auditFixture';
import { mockAdminSession } from '../utils/authUtils';
import { mockCameraPermission } from '../utils/mockUtils';

test.describe('QR Scanner - Camera Permissions', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminSession(page);
    await page.route('**/api/admin/bookings', route => route.fulfill({ status: 200, json: { bookings: [] } }));
    await page.route('**/api/admin/comedians', route => route.fulfill({ status: 200, json: { comedians: [] } }));
    await page.route('**/api/admin/payments', route => route.fulfill({ status: 200, json: { payments: [], stats: {} } }));
    await page.route('**/api/admin/contact-messages', route => route.fulfill({ status: 200, json: { messages: [] } }));
    await page.route('**/api/admin/feedbacks', route => route.fulfill({ status: 200, json: { feedbacks: [] } }));
  });

  test('TC-004: Should show permission error on NotAllowedError', async ({ page }) => {
    await mockCameraPermission(page, 'denied', 'NotAllowedError');
    await page.goto('/admin');
    await page.click('button:has-text("QR Scanner")');

    // Expected UI should show some error state
    // Let's assume there's a text "Camera Access Denied" or similar in QRScanner
    // we can check if video is NOT visible, and an error message is visible
    await expect(page.locator('video').first()).not.toBeVisible();
    
    // In QRScanner component, usually it sets permissionError state
    // Let's look for text related to permissions
    const permissionText = page.locator('text=/camera access|permission denied/i');
    await expect(permissionText).toBeVisible({ timeout: 10000 });
  });

  test('TC-005: Should handle NotReadableError (hardware in use)', async ({ page }) => {
    await mockCameraPermission(page, 'denied', 'NotReadableError');
    await page.goto('/admin');
    await page.click('button:has-text("QR Scanner")');

    await expect(page.locator('video').first()).not.toBeVisible();
    
    // We expect a general failure or permission error
    const errorText = page.locator('text=/camera in use|not readable/i');
    await expect(errorText.or(page.locator('text=/camera access|permission denied/i'))).toBeVisible({ timeout: 10000 });
  });
});
