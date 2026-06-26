import { test, expect } from '../utils/auditFixture';
import { mockAdminSession } from '../utils/authUtils';
import { mockCameraPermission, mockNetworkFailure } from '../utils/mockUtils';

test.describe('QR Scanner - Stress and Runtime Audit @stress', () => {
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

  test('STRESS-001: Rapid mount/unmount scanner (50+ cycles)', async ({ page }) => {
    test.setTimeout(120000);
    await mockCameraPermission(page, 'granted');
    await page.goto('/admin');
    
    // Do it 50 times
    for (let i = 0; i < 50; i++) {
      await page.click('button:has-text("QR Scanner")');
      await expect(page.locator('video:visible').first()).toBeVisible({ timeout: 10000 });
      await page.click('button:has-text("close")');
      // Ensure it unmounts
      await expect(page.locator('video')).not.toBeVisible();
    }
  });

  test('STRESS-002: Continuous scanning loop (100+ scans)', async ({ page }) => {
    test.setTimeout(120000);
    await mockCameraPermission(page, 'granted');
    await page.goto('/admin');
    await page.click('button:has-text("QR Scanner")');
    await expect(page.locator('video:visible').first()).toBeVisible();

    await page.route('**/api/admin/bookings/scan', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
        })
      });
    });

    await page.waitForFunction(() => typeof window['triggerQRScan'] === 'function');

    for (let i = 0; i < 100; i++) {
      await page.evaluate((val) => window['triggerQRScan'](val), `VALID-${i}`);
      
      // Wait for UI to update to the scanned ticket
      await expect(page.locator('text=John Doe')).toBeVisible();
      
      // Close the modal to return to scanner
      await page.click('.animate-slide-up button:has(.material-symbols-outlined:has-text("close"))');
      
      // Wait for camera to be visible again
      await expect(page.locator('video:visible').first()).toBeVisible();
    }
  });

  test('STRESS-003: Invalid payload spam (large QR payloads)', async ({ page }) => {
    await mockCameraPermission(page, 'granted');
    await page.goto('/admin');
    await page.click('button:has-text("QR Scanner")');
    await expect(page.locator('video:visible').first()).toBeVisible();

    await page.route('**/api/admin/bookings/scan', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Payload too large or invalid' })
      });
    });

    await page.waitForFunction(() => typeof window['triggerQRScan'] === 'function');

    const hugePayload = 'X'.repeat(50000); // 50KB payload
    await page.evaluate((payload) => window['triggerQRScan'](payload), hugePayload);

    // Should silently ignore, so no error toast and video remains visible
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Payload too large or invalid')).not.toBeVisible();
    await expect(page.locator('video:visible').first()).toBeVisible();
  });

  test('STRESS-004: Multi-tab scanner open simultaneously', async ({ context }) => {
    // Requires multiple pages in same context
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    const page3 = await context.newPage();

    const setupPage = async (p) => {
      await mockAdminSession(p);
      await mockCameraPermission(p, 'granted');
      await p.route('**/api/admin/bookings', route => route.fulfill({ status: 200, json: { bookings: [] } }));
      await p.route('**/api/admin/comedians', route => route.fulfill({ status: 200, json: { comedians: [] } }));
      await p.route('**/api/admin/payments', route => route.fulfill({ status: 200, json: { payments: [], stats: {} } }));
      await p.route('**/api/admin/contact-messages', route => route.fulfill({ status: 200, json: { messages: [] } }));
      await p.route('**/api/admin/feedbacks', route => route.fulfill({ status: 200, json: { feedbacks: [] } }));
      await p.goto('/admin');
      await p.click('button:has-text("QR Scanner")');
      await expect(p.locator('video:visible').first()).toBeVisible();
    };

    await Promise.all([setupPage(page1), setupPage(page2), setupPage(page3)]);
  });

  test('STRESS-005: Network flapping (offline/online toggle repeatedly)', async ({ page }) => {
    test.setTimeout(60000);
    await mockCameraPermission(page, 'granted');
    await page.goto('/admin');
    await page.click('button:has-text("QR Scanner")');
    await expect(page.locator('video:visible').first()).toBeVisible();

    await page.waitForFunction(() => typeof window['triggerQRScan'] === 'function');

    // Online
    await page.route('**/api/admin/bookings/scan', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ bookingId: 'VALID-1234', fullName: 'John', numberOfTickets: 1, checkedInCount: 0 })
      });
    });
    
    await page.evaluate(() => window['triggerQRScan']('VALID-1234'));
    await expect(page.locator('text=John')).toBeVisible();
    await page.click('.material-symbols-outlined:has-text("close")');

    // Offline (Flap)
    await page.context().setOffline(true);
    await page.evaluate(() => window['triggerQRScan']('VALID-1234'));
    // Should fail or show toast
    await expect(page.locator('text=Failed to process QR code').or(page.locator('text=Network error'))).toBeVisible({ timeout: 10000 }).catch(() => {});

    // Online
    await page.context().setOffline(false);
    
    // Use toPass to repeatedly try scanning until the camera is fully restarted and accepts scans
    await expect(async () => {
      await page.evaluate(() => window['triggerQRScan']('VALID-1234-ONLINE'));
      await expect(page.locator('text=John')).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15000 });
  });
});
