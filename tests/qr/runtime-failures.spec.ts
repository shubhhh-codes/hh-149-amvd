import { test, expect } from '../utils/auditFixture';
import { mockAdminSession } from '../utils/authUtils';
import { mockCameraPermission } from '../utils/mockUtils';

test.describe('QR Scanner - Runtime Failures', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminSession(page);
    await page.route('**/api/admin/bookings', route => route.fulfill({ status: 200, json: { bookings: [] } }));
    await page.route('**/api/admin/comedians', route => route.fulfill({ status: 200, json: { comedians: [] } }));
    await page.route('**/api/admin/payments', route => route.fulfill({ status: 200, json: { payments: [], stats: {} } }));
    await page.route('**/api/admin/contact-messages', route => route.fulfill({ status: 200, json: { messages: [] } }));
    await page.route('**/api/admin/feedbacks', route => route.fulfill({ status: 200, json: { feedbacks: [] } }));
  });

  test('TC-011: Should ignore crash in BarcodeDetector and fallback/recover gracefully', async ({ page }) => {
    // Inject a crashing BarcodeDetector
    await page.addInitScript(() => {
      (window as any)['BarcodeDetector'] = class MockBD {
        constructor() {}
        async detect(): Promise<any[]> {
          throw new Error('Simulated decoder crash');
        }
        static async getSupportedFormats() { return ['qr_code']; }
      } as any;
    });

    await mockCameraPermission(page, 'granted');
    await page.goto('/admin');
    await page.click('button:has-text("QR Scanner")');

    // The scanner shouldn't crash the whole app. Video should be visible.
    await expect(page.locator('video').first()).toBeVisible();

    // Verify there is no uncaught exception causing white screen
    // The admin panel wrapper should still be there or at least no next-error overlay
    await expect(page.locator('#__next-build-watcher')).not.toBeVisible(); 
  });
});
