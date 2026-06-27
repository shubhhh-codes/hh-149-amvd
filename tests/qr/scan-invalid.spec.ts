import { test, expect } from '../utils/auditFixture';
import { mockAdminSession } from '../utils/authUtils';
import { mockCameraPermission } from '../utils/mockUtils';

test.describe('QR Scanner - Invalid Scanning Flows', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminSession(page);
    await page.route('**/api/admin/bookings', route => route.fulfill({ status: 200, json: { bookings: [] } }));
    await page.route('**/api/admin/comedians', route => route.fulfill({ status: 200, json: { comedians: [] } }));
    await page.route('**/api/admin/payments', route => route.fulfill({ status: 200, json: { payments: [], stats: {} } }));
    await page.route('**/api/admin/contact-messages', route => route.fulfill({ status: 200, json: { messages: [] } }));
    await page.route('**/api/admin/feedbacks', route => route.fulfill({ status: 200, json: { feedbacks: [] } }));
    
    // Inject mock BarcodeDetector
    await page.addInitScript(() => {
      window['BarcodeDetector'] = class MockBD {
        constructor() {}
        async detect() {
          return new Promise(resolve => {
            window['triggerQRScan'] = (val: string) => {
              resolve([{ rawValue: val, boundingBox: { x: 0, y: 0, width: 100, height: 100 }, cornerPoints: [] }]);
            };
          });
        }
        static async getSupportedFormats() { return ['qr_code']; }
      } as any;
    });
  });

  test('TC-007: Should show error for invalid ticket / 404', async ({ page }) => {
    await mockCameraPermission(page, 'granted');
    await page.goto('/admin');
    await page.click('button:has-text("QR Scanner")');

    await page.route('**/api/admin/bookings/scan', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Ticket Not Found' })
      });
    });

    await expect(page.locator('video').first()).toBeVisible();

    await page.waitForFunction(() => typeof window['triggerQRScan'] === 'function');
    await page.evaluate(() => {
      window['triggerQRScan']('INVALID-1234');
    });

    // The UI should display the error
    await expect(page.locator('text=Ticket Not Found')).toBeVisible({ timeout: 10000 });
  });

  test('TC-008: Should show error for already fully used ticket', async ({ page }) => {
    await mockCameraPermission(page, 'granted');
    await page.goto('/admin');
    await page.click('button:has-text("QR Scanner")');

    // Return a ticket with 0 seats remaining
    const mockBookingData = {
      bookingId: 'USED-1234',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '1234567890',
      bookingType: 'paid',
      numberOfTickets: 2,
      checkedInCount: 2,
      cart: [],
      amountPaid: 1000,
      attended: true
    };

    await page.route('**/api/admin/bookings/scan', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockBookingData)
      });
    });

    await expect(page.locator('video').first()).toBeVisible();

    await page.waitForFunction(() => typeof window['triggerQRScan'] === 'function');
    await page.evaluate(() => {
      window['triggerQRScan']('USED-1234');
    });

    await expect(page.locator('text=Ticket Fully Used (0 Seats Remaining)')).toBeVisible({ timeout: 10000 });
  });
});
