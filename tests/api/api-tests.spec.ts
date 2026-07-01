/**
 * API TESTS -- Bookings & Payments endpoints (contract, validation, security)
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('API - Bookings @api', () => {
  test('API-BOOK-001: POST /api/bookings/create - returns 405 for GET', async ({ request }) => {
    const res = await request.get(BASE + '/api/bookings/create');
    expect(res.status()).toBe(405);
  });

  test('API-BOOK-002: POST /api/bookings/create - returns 400 for missing fields', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/create', { data: {} });
    expect([400, 422]).toContain(res.status());
  });

  test('API-BOOK-003: POST /api/bookings/create - returns 400 for tickets=0', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/create', {
      data: { fullName: 'Test', email: 'test@test.com', phone: '9999999999', numberOfTickets: 0, cart: [] }
    });
    expect([400, 422]).toContain(res.status());
  });

  test('API-BOOK-004: POST /api/bookings/create - returns 400 for empty cart', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/create', {
      data: { fullName: 'Test', email: 'test@test.com', phone: '9999999999', numberOfTickets: 1, cart: [] }
    });
    expect([400, 422]).toContain(res.status());
  });

  test('API-BOOK-005: POST /api/bookings/create - tickets > 50 returns 400', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/create', {
      data: { fullName: 'Test', email: 'test@test.com', phone: '9999', numberOfTickets: 51, cart: [{ tierKey: 'solo', units: 51, seats: 51, price: 499 }] }
    });
    expect([400, 422]).toContain(res.status());
  });

  test('API-BOOK-006: GET /api/bookings/venue-status - returns seats data', async ({ request }) => {
    const res = await request.get(BASE + '/api/bookings/venue-status');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('seatsRemaining');
  });

  test('API-BOOK-007: POST /api/bookings/retrieve - returns 400 without email', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/retrieve', { data: {} });
    expect([400, 422]).toContain(res.status());
  });

  test('API-BOOK-008: POST /api/bookings/retrieve - returns response with email+phone', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/retrieve', {
      data: { email: 'nonexistent_qa@test.com', phone: '0000000000' }
    });
    expect([200]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty('bookings');
  });

  test('API-BOOK-009: XSS in create body not reflected in response', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/create', {
      data: { fullName: '<script>alert(1)</script>', email: 'test@test.com', phone: '<img src=x>', numberOfTickets: 1, cart: [] }
    });
    const text = await res.text();
    expect(text).not.toContain('<script>alert(1)</script>');
  });

  test('API-BOOK-010: Large payload handled gracefully', async ({ request }) => {
    const hugeString = 'A'.repeat(100000);
    const res = await request.post(BASE + '/api/bookings/create', {
      data: { fullName: hugeString, email: 'test@test.com', phone: '9999999999', numberOfTickets: 1, cart: [] }
    });
    expect([400, 413, 422]).toContain(res.status());
  });

  test('API-BOOK-011: Malformed JSON body returns 400 or 500 not uncaught', async ({ request }) => {
    const res = await request.post(BASE + '/api/bookings/create', {
      headers: { 'Content-Type': 'application/json' },
      data: 'this is not json{'
    });
    expect([400, 500]).toContain(res.status());
  });
});

test.describe('API - Payments @api @security', () => {
  test('API-PAY-001: POST /api/payments/create-order - returns 405 for GET', async ({ request }) => {
    const res = await request.get(BASE + '/api/payments/create-order');
    expect(res.status()).toBe(405);
  });

  test('API-PAY-002: POST /api/payments/create-order - empty cart returns error', async ({ request }) => {
    const res = await request.post(BASE + '/api/payments/create-order', {
      data: { numberOfTickets: 1, cart: [] }
    });
    expect([400, 422, 500]).toContain(res.status());
  });

  test('API-PAY-003: POST /api/payments/verify - missing fields returns 400', async ({ request }) => {
    const res = await request.post(BASE + '/api/payments/verify', { data: {} });
    expect([400, 422]).toContain(res.status());
  });

  test('API-PAY-004: POST /api/payments/verify - fake signature returns 400', async ({ request }) => {
    const res = await request.post(BASE + '/api/payments/verify', {
      data: {
        razorpay_order_id: 'order_fake123',
        razorpay_payment_id: 'pay_fake456',
        razorpay_signature: 'invalidsignaturexyz',
        bookingId: 'HH-2026-000001'
      }
    });
    expect([400, 422, 500]).toContain(res.status());
    const body = await res.json();
    const msg = JSON.stringify(body).toLowerCase();
    expect(msg).toMatch(/invalid|signature|failed|missing/i);
  });

  test('API-PAY-005: POST /api/payments/verify - replay attack rejected', async ({ request }) => {
    const payload = {
      razorpay_order_id: 'order_replay_test',
      razorpay_payment_id: 'pay_replay_test',
      razorpay_signature: 'fakereplayssig',
      bookingId: 'HH-RACE-REPLAY'
    };
    const res1 = await request.post(BASE + '/api/payments/verify', { data: payload });
    const res2 = await request.post(BASE + '/api/payments/verify', { data: payload });
    expect([400, 404, 500]).toContain(res1.status());
    expect([400, 404, 500]).toContain(res2.status());
  });
});

test.describe('API - Shows @api', () => {
  test('API-SHOWS-001: GET /api/shows/current-tiers - returns tier array', async ({ request }) => {
    const res = await request.get(BASE + '/api/shows/current-tiers');
    expect([200]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty('tiers');
  });

  test('API-SHOWS-002: Tiers have required fields', async ({ request }) => {
    const res = await request.get(BASE + '/api/shows/current-tiers');
    if (res.status() === 200) {
      const body = await res.json();
      const tiers = body.tiers || [];
      for (const tier of tiers) {
        expect(tier).toHaveProperty('key');
        expect(tier).toHaveProperty('price');
        expect(typeof tier.price).toBe('number');
      }
    }
  });
});

test.describe('API - Contact @api', () => {
  test('API-CONTACT-001: Unknown contact path returns 404 or 405', async ({ request }) => {
    const res = await request.get(BASE + '/api/contact/submit');
    expect([404, 405]).toContain(res.status());
  });
});