import { test, expect } from '../utils/auditFixture';
import { mockAdminSession } from '../utils/authUtils';
import { mockCameraPermission } from '../utils/mockUtils';

test.describe('QR Scanner - Valid Scanning Flows', () => {
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

  test('TC-006: Should successfully scan and display valid ticket', async ({ page }) => {
    await mockCameraPermission(page, 'granted');
    await page.goto('/admin');
    await page.click('button:has-text("QR Scanner")');

    const mockBookingData = {
      bookingId: 'VALID-1234',
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      bookingType: 'paid',
      numberOfTickets: 2,
      checkedInCount: 0,
      cart: [],
      amountPaid: 1000,
      attended: false
    };

    await page.route('**/api/admin/bookings/scan', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockBookingData)
      });
    });

    // Wait for the scanner to be ready (video visible)
    await expect(page.locator('video').first()).toBeVisible();

    await page.waitForFunction(() => typeof (window as any)['triggerQRScan'] === 'function');
    await page.evaluate(() => {
      (window as any)['triggerQRScan']('VALID-1234');
    });

    // Wait for the booking details to show up
    await expect(page.locator('text=John Doe')).toBeVisible({ timeout: 10000 });
    
    // Check in button should be visible
    await expect(page.locator('button', { hasText: /Confirm Check-In/i })).toBeVisible();
  });
});
