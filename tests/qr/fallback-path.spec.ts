import { test, expect } from '../utils/auditFixture';
import { mockAdminSession } from '../utils/authUtils';
import { mockCameraPermission } from '../utils/mockUtils';

test.describe('QR Scanner - Fallback Path @camera @integration', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminSession(page);
    
    // Force window.BarcodeDetector to undefined to trigger fallback path
    await page.addInitScript(() => {
      Object.defineProperty(window, 'BarcodeDetector', {
        get: () => undefined,
      });
    });

    // Mock APIs used on dashboard load to prevent errors
    await page.route('**/api/admin/bookings', route => route.fulfill({ status: 200, json: { bookings: [] } }));
    await page.route('**/api/admin/comedians', route => route.fulfill({ status: 200, json: { comedians: [] } }));
    await page.route('**/api/admin/payments', route => route.fulfill({ status: 200, json: { payments: [], stats: {} } }));
    await page.route('**/api/admin/contact-messages', route => route.fulfill({ status: 200, json: { messages: [] } }));
    await page.route('**/api/admin/feedbacks', route => route.fulfill({ status: 200, json: { feedbacks: [] } }));
  });

  test('TC-F1: Should switch to html5-qrcode and initialize successfully', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', err => errors.push(err));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Only push actual errors, ignore standard logs
        errors.push(new Error(msg.text()));
      }
    });

    await mockCameraPermission(page, 'granted');
    await page.goto('/admin');
    
    // Open scanner
    await page.click('button:has-text("QR Scanner")');

    // Wait for the scanner to be ready (close button visible)
    await expect(page.locator('button:has-text("close")').first()).toBeVisible();

    // Verify it switched to html5-qrcode fallback
    const qrReaderDiv = page.locator('#qr-reader');
    await expect(qrReaderDiv).toBeVisible();

    // Wait for the video element inside #qr-reader to be added by html5-qrcode
    const fallbackVideo = page.locator('#qr-reader video');
    await expect(fallbackVideo).toBeVisible();

    // Verify only one scanner video is rendered in the whole DOM
    const allVideos = page.locator('video');
    await expect(allVideos).toHaveCount(1);
    
    // Verify no runtime or console errors occurred
    expect(errors).toHaveLength(0);
  });

  test('TC-F2: Open -> Close -> Reopen works correctly with cleanup', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', err => errors.push(err));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(new Error(msg.text()));
      }
    });

    await mockCameraPermission(page, 'granted');
    await page.goto('/admin');
    
    // 1. Open scanner
    await page.click('button:has-text("QR Scanner")');
    await expect(page.locator('button:has-text("close")').first()).toBeVisible();
    await expect(page.locator('#qr-reader video')).toBeVisible();

    // 2. Close scanner
    await page.click('button:has-text("close")');
    
    // Verify cleanup removes injected DOM elements - #qr-reader is conditionally rendered in React so it should disappear
    await expect(page.locator('#qr-reader')).not.toBeVisible();
    
    // Verify no duplicate hidden <video> elements exist
    await expect(page.locator('video')).toHaveCount(0);

    // 3. Reopen scanner
    await page.click('button:has-text("QR Scanner")');
    await expect(page.locator('button:has-text("close")').first()).toBeVisible();
    await expect(page.locator('#qr-reader video')).toBeVisible();
    
    // Verify only one scanner video is rendered
    await expect(page.locator('video')).toHaveCount(1);
    
    expect(errors).toHaveLength(0);
  });
});
