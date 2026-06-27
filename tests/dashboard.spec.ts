import { test, expect } from './utils/auditFixture';
import { mockAdminSession } from './utils/authUtils';

test.describe('Admin Dashboard @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminSession(page);
  });

  test('DASH-001: Should load dashboard with data', async ({ page }) => {
    await page.route('**/api/admin/bookings', route => route.fulfill({ status: 200, json: { bookings: [{ status: 'approved', numberOfTickets: 2 }] } }));
    await page.route('**/api/admin/comedians', route => route.fulfill({ status: 200, json: { comedians: [] } }));
    await page.route('**/api/admin/payments', route => route.fulfill({ status: 200, json: { payments: [], stats: { totalAmount: 500000 } } })); // 5000.00
    await page.route('**/api/admin/contact-messages', route => route.fulfill({ status: 200, json: { messages: [] } }));
    await page.route('**/api/admin/feedbacks', route => route.fulfill({ status: 200, json: { feedbacks: [] } }));

    await page.goto('/admin');
    
    // Check for dashboard stats
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Active Bookings')).toBeVisible();
    
    // Check if the mocked data is displayed (e.g. 5000 for total amount, assuming formatCurrency formats it as ₹5,000 or $5,000)
    // The exact format depends on the locale, but '5,000' or '5000' should be present
    const content = await page.textContent('body');
    expect(content).toMatch(/5,000|5000/);
  });

  test('DASH-002: Should handle empty dashboard state gracefully', async ({ page }) => {
    await page.route('**/api/admin/bookings', route => route.fulfill({ status: 200, json: { bookings: [] } }));
    await page.route('**/api/admin/comedians', route => route.fulfill({ status: 200, json: { comedians: [] } }));
    await page.route('**/api/admin/payments', route => route.fulfill({ status: 200, json: { payments: [], stats: {} } }));
    await page.route('**/api/admin/contact-messages', route => route.fulfill({ status: 200, json: { messages: [] } }));
    await page.route('**/api/admin/feedbacks', route => route.fulfill({ status: 200, json: { feedbacks: [] } }));
    await page.goto('/admin');
    
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    // Since there are no bookings or payments, it should show 0
    await expect(page.locator('text=Total Tickets').locator('..').locator('span.font-headline-md')).toHaveText('0');
  });

  test('DASH-003: Should handle network error in dashboard', async ({ page }) => {
    await page.route('**/api/admin/bookings', route => route.abort('failed'));
    await page.route('**/api/admin/comedians', route => route.fulfill({ status: 200, json: { comedians: [] } }));
    await page.route('**/api/admin/payments', route => route.fulfill({ status: 200, json: { payments: [], stats: {} } }));
    await page.route('**/api/admin/contact-messages', route => route.fulfill({ status: 200, json: { messages: [] } }));
    await page.route('**/api/admin/feedbacks', route => route.fulfill({ status: 200, json: { feedbacks: [] } }));

    await page.goto('/admin');
    
    // It should display an error message
    await expect(page.locator('text=Failed to load data')).toBeVisible();
  });
});
