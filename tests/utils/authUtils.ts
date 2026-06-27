import { Page } from '@playwright/test';

export async function mockAdminSession(page: Page) {
  // Add a cookie to bypass middleware
  await page.context().addCookies([{ name: 'playwright-test', value: 'admin', url: 'http://localhost:3000' }]);

  // Intercept NextAuth session API to return an admin session
  await page.route('**/api/auth/session', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin'
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
    });
  });

  // Intercept the CSRF token endpoint as well just in case NextAuth checks it
  await page.route('**/api/auth/providers', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({})
    });
  });
}
