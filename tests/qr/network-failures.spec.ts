import { test, expect } from '../utils/auditFixture';
import { mockAdminSession } from '../utils/authUtils';
import { mockCameraPermission, mockNetworkFailure } from '../utils/mockUtils';

test.describe('QR Scanner - Network Failures', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminSession(page);
    await page.route('**/api/admin/bookings', route => route.fulfill({ status: 200, json: { bookings: [] } }));
    await page.route('**/api/admin/comedians', route => route.fulfill({ status: 200, json: { comedians: [] } }));
    await page.route('**/api/admin/payments', route => route.fulfill({ status: 200, json: { payments: [], stats: {} } }));
    await page.route('**/api/admin/contact-messages', route => route.fulfill({ status: 200, json: { messages: [] } }));
    await page.route('**/api/admin/feedbacks', route => route.fulfill({ status: 200, json: { feedbacks: [] } }));
    
    // Inject mock BarcodeDetector
    await page.addInitScript(() => {
      (window as any)['BarcodeDetector'] = class MockBD {
        constructor() {}
        async detect() {
          return new Promise(resolve => {
            (window as any)['triggerQRScan'] = (val: string) => {
              resolve([{ rawValue: val, boundingBox: { x: 0, y: 0, width: 100, height: 100 }, cornerPoints: [] }]);
            };
          });
        }
        static async getSupportedFormats() { return ['qr_code']; }
      } as any;
    });
  });

  test('TC-009: Should handle 500 Internal Server Error', async ({ page }) => {
    await mockCameraPermission(page, 'granted');
    await page.goto('/admin');
    await page.click('button:has-text("QR Scanner")');

    await mockNetworkFailure(page, '**/api/admin/bookings/scan', 500);

    await expect(page.locator('video').first()).toBeVisible();

    await page.waitForFunction(() => typeof (window as any)['triggerQRScan'] === 'function');
    await page.evaluate(() => {
      (window as any)['triggerQRScan']('SERVER-ERROR-1234');
    });

    // Code shows 'Failed to process QR code' on catch
    await expect(page.locator('text=Failed to process QR code').or(page.locator('text=Server Error'))).toBeVisible({ timeout: 10000 });
  });

  test('TC-010: Should handle offline/network drop during scan', async ({ page }) => {
    await mockCameraPermission(page, 'granted');
    await page.goto('/admin');
    await page.click('button:has-text("QR Scanner")');

    await mockNetworkFailure(page, '**/api/admin/bookings/scan', 0); // 0 means abort

    await expect(page.locator('video').first()).toBeVisible();

    await page.waitForFunction(() => typeof (window as any)['triggerQRScan'] === 'function');
    await page.evaluate(() => {
      (window as any)['triggerQRScan']('OFFLINE-1234');
    });

    await expect(page.locator('text=/network error|timed out|poor connection/i')).toBeVisible({ timeout: 10000 });
  });
});
