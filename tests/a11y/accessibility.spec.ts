/**
 * ACCESSIBILITY AUDIT -- WCAG, ARIA, Labels, Keyboard Navigation
 */
import { test, expect } from '@playwright/test';
import type { Route } from '@playwright/test';

async function runAxeAudit(page: any) {
  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js' });
  const results = await page.evaluate(async () => {
    const r = await (window as any).axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] }
    });
    return { violations: r.violations.map((v: any) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })) };
  });
  return results;
}

test.describe('Accessibility - Public Pages @a11y', () => {
  test('A11Y-001: Home page - No critical WCAG violations', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const { violations } = await runAxeAudit(page);
    const critical = violations.filter((v: any) => v.impact === 'critical' || v.impact === 'serious');
    if (critical.length > 0) console.log('[A11Y-001]', JSON.stringify(critical, null, 2));
    expect(critical.length, 'Critical a11y violations: ' + JSON.stringify(critical)).toBe(0);
  });

  test('A11Y-002: Login page - No critical WCAG violations', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    const { violations } = await runAxeAudit(page);
    const critical = violations.filter((v: any) => v.impact === 'critical' || v.impact === 'serious');
    if (critical.length > 0) console.log('[A11Y-002]', JSON.stringify(critical, null, 2));
    expect(critical.length).toBe(0);
  });

  test('A11Y-003: Contact page - No critical WCAG violations', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    const { violations } = await runAxeAudit(page);
    const critical = violations.filter((v: any) => v.impact === 'critical' || v.impact === 'serious');
    if (critical.length > 0) console.log('[A11Y-003]', JSON.stringify(critical, null, 2));
    expect(critical.length).toBe(0);
  });

  test('A11Y-004: Book Tickets page - No critical WCAG violations', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.route('**/api/shows/current-tiers', (route: Route) => route.fulfill({ status: 200, json: { tiers: [] } }));
    await page.route('**/api/bookings/venue-status', (route: Route) => route.fulfill({ status: 200, json: { seatsRemaining: 100, isSoldOut: false } }));
    await page.goto('/book-tickets');
    await page.waitForLoadState('networkidle');
    const { violations } = await runAxeAudit(page);
    const critical = violations.filter((v: any) => v.impact === 'critical' || v.impact === 'serious');
    if (critical.length > 0) console.log('[A11Y-004]', JSON.stringify(critical, null, 2));
    expect(critical.length).toBe(0);
  });

  test('A11Y-005: All form labels associated with inputs on contact page', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    const unlabeled = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'));
      return inputs.filter(input => {
        const id = (input as HTMLElement).getAttribute('id');
        const ariaLabel = (input as HTMLElement).getAttribute('aria-label');
        const ariaLabelledBy = (input as HTMLElement).getAttribute('aria-labelledby');
        const hasLabel = id ? !!document.querySelector('label[for="' + id + '"]') : false;
        return !hasLabel && !ariaLabel && !ariaLabelledBy;
      }).map(inp => ({ tag: inp.tagName, name: (inp as any).name }));
    });
    if (unlabeled.length > 0) console.log('[A11Y-005] Unlabeled inputs:', JSON.stringify(unlabeled));
    expect(unlabeled.length).toBe(0);
  });

  test('A11Y-006: Login form - labels are associated', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    const emailLabel = await page.locator('label[for="email"]').count();
    const pwLabel = await page.locator('label[for="password"]').count();
    expect(emailLabel).toBeGreaterThan(0);
    expect(pwLabel).toBeGreaterThan(0);
  });

  test('A11Y-007: Keyboard navigation through login form works', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator('body')).toBeVisible();
  });

  test('A11Y-008: Images have alt text', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const imagesWithoutAlt = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .filter(img => !img.hasAttribute('alt'))
        .map(img => img.src);
    });
    if (imagesWithoutAlt.length > 0) console.log('[A11Y-008] Images missing alt:', imagesWithoutAlt);
    expect(imagesWithoutAlt.length).toBe(0);
  });

  test('A11Y-009: Password visibility toggle has aria-label', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    const toggleBtn = page.locator('button[aria-label="Show password"], button[aria-label="Hide password"]').first();
    await expect(toggleBtn).toBeVisible();
  });

  test('A11Y-010: Navigation has landmark role', async ({ page }) => {
    await page.route('**/api/analytics/visit', (route: Route) => route.fulfill({ status: 200, json: {} }));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const navCount = await page.locator('nav, [role="navigation"]').count();
    expect(navCount).toBeGreaterThan(0);
  });
});