# 🎟️ Humours Hub — Ticket System Deep Dive

> **Full analysis of the PDF ticket generation pipeline, booking flow, retrieval system, all current issues, and a complete optimization roadmap.**

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Complete Booking Flow (User Books a Ticket)](#2-complete-booking-flow)
3. [Retrieve My Ticket — Page & API Flow](#3-retrieve-my-ticket-flow)
4. [PDF Generation Pipeline — How It Works](#4-pdf-generation-pipeline)
5. [QR Code Generation](#5-qr-code-generation)
6. [Current Issues & Pain Points](#6-current-issues--pain-points)
7. [Optimization Roadmap](#7-optimization-roadmap)
8. [Recommended File Changes](#8-recommended-file-changes)

---

## 1. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      Next.js 14 App                          │
│  Pages Router · Vercel (bom1 region) · MongoDB Atlas         │
└──────────────────────────────────────────────────────────────┘
         │                         │
   ┌─────▼──────┐          ┌───────▼────────┐
   │  /book-    │          │  /retrieve-    │
   │  tickets   │          │  tickets       │
   └─────┬──────┘          └───────┬────────┘
         │                         │
   ┌─────▼──────┐          ┌───────▼────────┐
   │  Razorpay  │          │  /api/bookings │
   │  Payment   │          │  /retrieve     │
   └─────┬──────┘          └───────┬────────┘
         │                         │
   ┌─────▼──────────────────────────▼────────┐
   │           MongoDB (bookings collection)  │
   └─────────────────┬────────────────────────┘
                     │
              ┌──────▼──────┐
              │  /api/      │
              │  generate-  │
              │  ticket     │
              └──────┬──────┘
                     │
         ┌───────────┼──────────────┐
         ▼           ▼              ▼
   lib/mongodb  lib/secure-qr  lib/ticket-template
         │           │              │
         └───────────┴──────────────┘
                     │
              ┌──────▼──────┐
              │  Puppeteer  │  (dev: full, prod: puppeteer-core
              │  + Chromium │   + @sparticuz/chromium)
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │  PDF Buffer  │
              │  → res.end() │
              └─────────────┘
```

### Key Files

| File | Role |
|------|------|
| `pages/book-tickets.tsx` | Booking form UI + Razorpay initialization |
| `pages/booking-success.tsx` | Post-payment confirmation + auto-download trigger |
| `pages/retrieve-tickets.tsx` | Ticket search & list UI |
| `pages/api/bookings/create.ts` | Creates a `pending` booking in MongoDB |
| `pages/api/bookings/retrieve.ts` | Queries bookings by email+phone or bookingId |
| `pages/api/payments/create-order.ts` | Creates Razorpay order |
| `pages/api/payments/verify.ts` | Verifies Razorpay signature → sets booking `approved` |
| `pages/api/generate-ticket.ts` | The PDF generation endpoint (Puppeteer) |
| `lib/ticket-template.ts` | HTML template for the ticket |
| `lib/secure-qr.ts` | HMAC-signed QR code generator |
| `lib/bookingId.ts` | Sequential human-friendly ID generator |
| `lib/mongodb.ts` | MongoDB connection with global caching |

---

## 2. Complete Booking Flow

### Step-by-Step Walkthrough

```
USER opens /book-tickets
         │
         ▼
[1] Fills form: fullName, email, phone, numberOfTickets (1–10)
         │
         ▼
[2] Clicks "Pay & Book Tickets"
  handleSubmit() fires
         │
         ▼
[3] Client-side validation:
    • fullName, email, phone all required
    • If Razorpay SDK not loaded → load it dynamically from CDN
         │
         ▼
[4] POST /api/bookings/create
    Body: { fullName, email, phone, numberOfTickets }
    
    Server:
    ├── Validates fields
    ├── Checks venue capacity (≤150 seats), warns if exceeded (doesn't block)
    ├── generateBookingId() → atomic MongoDB counter → "HH-2026-000XXX"
    └── Inserts booking with status: "pending"
    
    Returns: { bookingId, _id, capacityWarning }
         │
         ▼
[5] POST /api/payments/create-order
    Body: { numberOfTickets, bookingId }
    
    Server:
    ├── Initializes Razorpay with env credentials
    ├── Calculates amount = numberOfTickets × 14900 paise (₹149 each)
    └── Creates Razorpay order
    
    Returns: { keyId, amount, currency, orderId }
         │
         ▼
[6] Razorpay checkout modal opens in browser
    User pays via UPI / Card / NetBanking
         │
    ┌────▼────────────────────┐
    │  Payment Success        │
    │  → handler() callback   │
    └────┬────────────────────┘
         │
         ▼
[7] POST /api/payments/verify
    Body: { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId }
    
    Server:
    ├── Recreates HMAC SHA-256 signature
    ├── Compares with Razorpay signature
    ├── Checks for duplicate payment (idempotency)
    ├── Inserts payment record into "payments" collection
    └── Updates booking status: "pending" → "approved"
    
    Returns: { message: 'Payment verified successfully', bookingId }
         │
         ▼
[8] Client redirects:
    router.push(`/booking-success?id=${bookingId}`)
         │
         ▼
[9] /booking-success page:
    ├── Displays booking confirmation + bookingId
    ├── Copy-to-clipboard for bookingId
    └── Auto-triggers handleDownloadTicket() after 1500ms
         │
         ▼
[10] PDF Download triggered (see Section 4)
```

### MongoDB Document after Payment

```json
// bookings collection
{
  "_id": ObjectId("..."),
  "bookingId": "HH-2026-000013",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "numberOfTickets": 2,
  "bookingType": "paid",
  "status": "approved",
  "attended": false,
  "attendedAt": null,
  "paymentId": "pay_XXXXXX",
  "paymentStatus": "completed",
  "createdAt": ISODate("2026-06-24T00:00:00Z"),
  "updatedAt": ISODate("2026-06-24T00:00:01Z")
}
```

---

## 3. Retrieve My Ticket Flow

### Page UI

The `/retrieve-tickets` page has two search modes selectable via a sliding pill tab:

| Mode | Required Fields |
|------|----------------|
| **Email & Phone** | Both email AND phone |
| **Booking ID** | Booking ID + at least one of email/phone |

### Search API Flow

```
User submits form
       │
       ▼
POST /api/bookings/retrieve
Body: { email?, phone?, bookingId? }

Server:
├── Validates: email+phone (mode 1) OR bookingId+one-of-email/phone (mode 2)
├── Normalizes phone: strips +91, takes last 10 digits, uses $regex for suffix match
├── Builds MongoDB query accordingly
├── db.collection('bookings').find(query).sort({ createdAt: -1 })
└── Splits results into:
    • activeBookings  (status === 'approved')
    • cancelledBookings (status === 'cancelled')
    
Returns: { activeBookings[], cancelledBookings[], total }
       │
       ▼
UI renders:
├── "ACTIVE BOOKINGS" section with ticket cards
│   └── Each card has [Download] button
└── "PAST & CANCELLED" section (greyed out, no download)
       │
       ▼
User clicks [Download] on a booking card
       │
       ▼
handleDownload(bookingId, e) fires → PDF download (see Section 4)
```

### Download Button Behavior

The `handleDownload` function in `retrieve-tickets.tsx`:

1. Shows a spinner in the button and disables it
2. Creates a hidden `<a>` element pointing to `/api/generate-ticket?bookingId=X`
3. Programmatically clicks it and removes it
4. After 2 seconds: shows a green ✅ "DONE" state
5. After another 3 seconds: resets button to original state

> ⚠️ **Critical note:** Because it's an anchor tag download (not a fetch), the button state resets on a timer — **it does NOT know if the PDF actually succeeded or failed.** The user may see "DONE" even if the server returned an error.

---

## 4. PDF Generation Pipeline

This is the most complex and fragile part of the system.

### Full Pipeline

```
GET /api/generate-ticket?bookingId=HH-2026-000013
                │
                ▼
[1] Validate bookingId query param
                │
                ▼
[2] MongoDB lookup:
    db.collection('bookings').findOne({ bookingId })
                │
                ▼
[3] MongoDB lookup (CMS):
    db.collection('homepage_content').findOne({ type: 'next_show' })
    → Extracts: eventTitle, eventDate, eventDay, eventTime, eventLocation
    → Falls back to hardcoded defaults if CMS doc is missing
                │
                ▼
[4] Build QRBookingData object with all booking details
                │
                ▼
[5] generateSecureQRCode(qrData):
    lib/secure-qr.ts
    ├── JSON.stringify(qrData)
    ├── HMAC SHA-256 sign with NEXTAUTH_SECRET
    ├── QRCode.toDataURL(signedPayload, { width: 400, errorCorrection: 'M' })
    └── Returns: base64 PNG data URI
                │
                ▼
[6] Build TicketTemplateData object
                │
                ▼
[7] generateTicketHtml(templateData):
    lib/ticket-template.ts
    ├── Returns full HTML string with:
    │   ├── Google Fonts CDN links (Hind, DM Sans, Material Symbols)
    │   ├── Tailwind CDN (tailwindcss.com)
    │   ├── Custom Tailwind config (inline)
    │   └── Ticket card HTML with embedded QR as <img src="data:...">
    └── Returns: HTML string
                │
                ▼
[8] Puppeteer Browser Launch:
    DEV: puppeteer (full, cached browser instance via cachedBrowser module var)
    PROD: puppeteer-core + @sparticuz/chromium (new browser per request)
                │
                ▼
[9] page.setViewport({ width: 600, height: 1000 })
                │
                ▼
[10] page.setContent(htmlContent, {
      waitUntil: ['domcontentloaded', 'networkidle2'],
      timeout: 15000
    })
    → Puppeteer waits for all network requests to finish
    → This includes: Google Fonts + Tailwind CDN requests
                │
                ▼
[11] page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' }
    })
    → Returns: Uint8Array
                │
                ▼
[12] page.close()
     if PROD: browser.close()
     if DEV: browser stays open (cached)
                │
                ▼
[13] Buffer.from(pdfBuffer) → proper Node.js Buffer
                │
                ▼
[14] res.setHeader('Content-Type', 'application/pdf')
     res.setHeader('Content-Disposition', 'attachment; filename=HH-TICKET-...')
     res.setHeader('Content-Length', nodeBuffer.length)
     res.end(nodeBuffer)
```

### What's Inside the Ticket HTML Template

The template (`lib/ticket-template.ts`) generates a self-contained HTML page with:

- **Top stub section:** Ticket number (e.g., `#HH-2026-000013`) with perforation notch effect
- **Main body:** Event name, admittee name, date, time, venue
- **QR Code:** Embedded as a base64 PNG data URI (HMAC-signed JSON payload)
- **Fonts:** Google Fonts (Hind, DM Sans) loaded from CDN
- **Styling:** Tailwind CSS loaded from CDN + inline custom config

---

## 5. QR Code Generation

### What's Encoded

The QR code contains a **JSON payload** with an HMAC SHA-256 signature:

```json
{
  "data": {
    "bookingId": "HH-2026-000013",
    "ticketNumber": "HH-2026-000013",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "numberOfTickets": 2,
    "bookingType": "paid",
    "paymentId": "pay_XXXX",
    "paymentStatus": "approved",
    "eventName": "The Humours Hub: Open Mic Night",
    "eventDate": "24 Jun, Tue",
    "venue": "The Studio, SG Highway",
    "createdAt": "2026-06-24T00:00:00.000Z"
  },
  "signature": "a3f9b2c1d4e5..."
}
```

### Security Model

| Aspect | Current Implementation |
|--------|----------------------|
| Algorithm | HMAC SHA-256 |
| Secret | `NEXTAUTH_SECRET` (falls back to `JWT_SECRET`, then hardcoded string) |
| Verification | Not yet implemented on-server — QR is for event staff scanning |
| Tampering | Any modification breaks the signature |

---

## 6. Current Issues & Pain Points

### 🔴 Critical Issues

#### Issue 1: No Auth on PDF Endpoint — Anyone Can Download Any Ticket
**File:** `pages/api/generate-ticket.ts`  
**Problem:** The endpoint is completely public. Anyone who knows/guesses a booking ID (e.g., `HH-2026-000001`) can download someone else's ticket.  
**Impact:** Privacy violation. Zero-effort scraping of all attendee names, emails, phones embedded in QR codes.

---

#### Issue 2: External CDN Requests Break `networkidle2` → Timeout
**File:** `pages/api/generate-ticket.ts` (line 105), `lib/ticket-template.ts` (lines 22–27)  
**Problem:** The HTML template loads:
- Google Fonts (2 separate CDN requests)
- Tailwind CDN + plugins
- Google Material Symbols font

`waitUntil: ['domcontentloaded', 'networkidle2']` means Puppeteer waits for ALL of these. On Vercel's cold start, outbound requests from Puppeteer/Chromium to Google CDN can fail, be slow, or be blocked. This is the **#1 cause of invalid/empty PDFs and timeouts**.

**Impact:** Users get errors like "Failed to generate ticket" or a blank/broken PDF.

---

#### Issue 3: QR Code Payload Size is Excessive
**File:** `lib/secure-qr.ts` (line 46)  
**Problem:** `JSON.stringify(payload, null, 2)` uses **pretty-print with 2-space indentation**. The full signed JSON payload is approximately 600–800 bytes. At QR error correction level 'M' and `width: 400`, this creates a very dense QR code. More data = harder to scan.

---

#### Issue 4: Production Browser is Recreated Every Request
**File:** `pages/api/generate-ticket.ts` (lines 85–97)  
**Problem:** In production, a new `puppeteer-core` browser is launched **every single time** a ticket is downloaded. This is:
- Slow (~3–8 seconds cold launch on Vercel)
- Memory-intensive (Chromium is ~200MB+)
- A Vercel function timeout risk (default 10s, extended in vercel.json not configured)
- A likely cause of Lambda memory limit crashes

---

#### Issue 5: Download Button Shows "DONE" Even on Server Error
**File:** `pages/retrieve-tickets.tsx` (lines 88–113)  
**Problem:** The download is triggered via an anchor click, not `fetch()`. There is **no way to detect** if the server returned a 404/500 instead of a PDF. The button shows "DONE" 2 seconds later regardless.

**Impact:** Users think their ticket downloaded successfully but actually received an error response (often saved as a corrupted `.pdf` file containing JSON error text).

---

#### Issue 6: `booking-success.tsx` Auto-Downloads Before Page Data Loads
**File:** `pages/booking-success.tsx` (lines 35–42)  
**Problem:** The auto-download fires 1500ms after mount. On Vercel's cold start, the payment was *just* verified milliseconds before redirect. The `generate-ticket` endpoint immediately queries MongoDB — but the `approved` status write might not be fully propagated yet (eventual consistency window), causing a potential race condition where the ticket is requested before status is fully written.

---

#### Issue 7: `cachedBrowser` is Module-Level — Not Safe in Serverless
**File:** `pages/api/generate-ticket.ts` (lines 6, 77–84)  
**Problem:** `let cachedBrowser: any = null;` at module level works fine in dev but in serverless environments (Vercel), each function invocation may or may not get a warm instance. If the cached browser crashes silently, all subsequent requests in that instance will fail without any re-initialization attempt.

---

#### Issue 8: No Vercel `maxDuration` Set for `generate-ticket`
**File:** `vercel.json`  
**Problem:** The `generate-ticket` API route uses Puppeteer + Chromium and can easily take 10–20 seconds on a cold start. Vercel's default function timeout is **10 seconds** for Hobby plans and **60 seconds** for Pro. Without explicit `maxDuration`, cold starts will silently timeout and users get errors.

---

### 🟡 Medium Issues

#### Issue 9: QR Payload Contains PII (email, phone) in Plain Sight
**File:** `lib/secure-qr.ts`  
**Problem:** The QR code contains full email and phone number in plaintext JSON. Anyone with a QR scanner app at the venue can read all attendee PII. The signature prevents tampering but not reading.

---

#### Issue 10: `numberOfTickets` in booking-success is not displayed
**File:** `pages/booking-success.tsx`  
**Problem:** The success page shows the booking ID but not how many tickets were booked. Users need to re-retrieve their tickets to see this.

---

#### Issue 11: No Rate Limiting on Retrieve or Generate Endpoints
**Files:** `pages/api/bookings/retrieve.ts`, `pages/api/generate-ticket.ts`  
**Problem:** No rate limiting, no IP throttling. The retrieve endpoint could be brute-forced (try all 10-digit phone numbers against a known email). The generate-ticket endpoint could be hammered to exhaust Chromium memory.

---

#### Issue 12: `pending` bookings are invisible in Retrieve
**File:** `pages/api/bookings/retrieve.ts` (line 54)  
**Problem:** Only `approved` bookings show in "Active". If payment failed mid-flow or Razorpay webhook wasn't delivered, the booking stays `pending` forever and the user sees "No active bookings found" — confusing.

---

### 🟢 Minor Issues

#### Issue 13: Tailwind CDN in ticket template is for prototyping only
**File:** `lib/ticket-template.ts` (line 27)  
**Problem:** `<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries">` — Tailwind's CDN version is not production-ready. It loads the entire Tailwind runtime in-browser and dynamically generates CSS. In Puppeteer, this adds significant rendering time and is fragile.

---

#### Issue 14: Font loading race condition in Puppeteer
**File:** `lib/ticket-template.ts` (lines 22–25)  
**Problem:** Google Fonts are loaded via `<link>` tags. Even with `networkidle2`, there's no guarantee that fonts are fully parsed and applied before PDF generation. If fonts fail to load, the PDF will use system fallback fonts, looking broken.

---

#### Issue 15: `res.send()` vs `res.end()` — already fixed but fragile
**File:** `pages/api/generate-ticket.ts` (line 128)  
**Note:** This was previously a bug (using `res.send()` which serializes Buffer as JSON). Now uses `res.end()` correctly. But the comment in the code warns of this — it should be a test case to prevent regression.

---

## 7. Optimization Roadmap

### Priority 1 — Immediate (Fix Errors / Security)

#### OPT-1: Inline All CSS — Eliminate External CDN Dependency ⭐⭐⭐⭐⭐

**Problem solved:** Issues #2, #13, #14 (timeouts, blank PDFs, font failures)

Replace the CDN-loaded Tailwind + Google Fonts in `lib/ticket-template.ts` with **fully inlined CSS**. This is the single most impactful fix. The template should be 100% self-contained.

```typescript
// lib/ticket-template.ts — NEW APPROACH

// Embed fonts as base64 data URIs OR use system fonts
// Replace Tailwind CDN with hand-written CSS that covers only what the ticket uses

// In generateTicketHtml(), instead of CDN links:
const INLINED_CSS = `
  @font-face {
    font-family: 'Hind';
    font-weight: 400;
    src: url('data:font/woff2;base64,...') format('woff2');
  }
  /* ... only the ~50 CSS rules actually used in the ticket */
`;
```

**In `page.setContent()`, change `waitUntil` to:**
```typescript
await page.setContent(htmlContent, {
  waitUntil: 'domcontentloaded', // No more networkidle2 wait
  timeout: 10000,
});
```

**Result:** PDF generation drops from ~8–15s to ~2–4s. Zero external network calls. No CDN failure risk.

---

#### OPT-2: Add Token-Based Auth to `/api/generate-ticket` ⭐⭐⭐⭐⭐

**Problem solved:** Issue #1 (anyone can download any ticket)

Generate a short-lived signed token when the user retrieves their bookings, and require it for download:

```typescript
// In /api/bookings/retrieve.ts — add downloadToken to each booking
import crypto from 'crypto';

function generateDownloadToken(bookingId: string, email: string): string {
  const expires = Date.now() + 30 * 60 * 1000; // 30 min
  const payload = `${bookingId}:${email}:${expires}`;
  const sig = crypto.createHmac('sha256', process.env.NEXTAUTH_SECRET!).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

// Add to each booking in the response:
downloadToken: generateDownloadToken(b.bookingId, email)
```

```typescript
// In /api/generate-ticket.ts — verify token
const { bookingId, token } = req.query;
// decode, verify sig, check expiry, ensure bookingId matches
```

```typescript
// In retrieve-tickets.tsx — pass token in download URL
a.href = `/api/generate-ticket?bookingId=${bId}&token=${downloadToken}`;
```

---

#### OPT-3: Use `fetch()` for Downloads to Detect Errors ⭐⭐⭐⭐⭐

**Problem solved:** Issue #5 (button shows DONE on error)

Replace the anchor-click download with a proper `fetch()` → `blob()` approach:

```typescript
const handleDownload = async (bId: string, downloadToken: string, e: React.MouseEvent<HTMLButtonElement>) => {
  const btn = e.currentTarget;
  const originalHTML = btn.innerHTML;
  btn.innerHTML = `<div class="loader ..."></div>`;
  btn.disabled = true;

  try {
    const res = await fetch(`/api/generate-ticket?bookingId=${bId}&token=${downloadToken}`);
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: 'Download failed' }));
      throw new Error(errData.message || `Server error ${res.status}`);
    }

    const blob = await res.blob();
    
    // Validate it's actually a PDF
    if (blob.type !== 'application/pdf') {
      throw new Error('Invalid file received');
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HH-TICKET-${bId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url); // Clean up memory

    btn.innerHTML = `<span class="material-symbols-outlined">check</span> DONE`;
    btn.classList.add('bg-[#FF6B1A]', 'text-black', 'border-[#FF6B1A]');
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.classList.remove('bg-[#FF6B1A]', 'text-black', 'border-[#FF6B1A]');
      btn.disabled = false;
    }, 3000);

  } catch (err) {
    btn.innerHTML = `<span class="material-symbols-outlined">error</span> FAILED`;
    btn.classList.add('bg-red-900', 'text-red-200', 'border-red-700');
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.classList.remove('bg-red-900', 'text-red-200', 'border-red-700');
      btn.disabled = false;
    }, 4000);
    console.error('Download error:', err);
  }
};
```

---

#### OPT-4: Set Explicit Vercel Function Timeout ⭐⭐⭐⭐

**Problem solved:** Issue #8 (silent 10s timeout on Vercel)

Add to `vercel.json`:

```json
{
  "functions": {
    "pages/api/generate-ticket.ts": {
      "maxDuration": 60,
      "memory": 3008
    }
  }
}
```

> Note: `maxDuration: 60` requires Vercel Pro. On Hobby, max is 10s — and without OPT-1 (inline CSS), you *will* hit this limit on cold starts.

---

#### OPT-5: Fix Production Browser Caching ⭐⭐⭐⭐

**Problem solved:** Issue #4 (new browser every request in prod)

In production serverless, the module-level variable approach can work *if* the function instance is warm. Refactor to be safer:

```typescript
// pages/api/generate-ticket.ts

let _browser: any = null;
let _browserLastUsed = 0;
const BROWSER_TTL_MS = 60_000; // Reuse for up to 60s

async function getBrowser() {
  const now = Date.now();
  
  // Close stale browser
  if (_browser && now - _browserLastUsed > BROWSER_TTL_MS) {
    try { await _browser.close(); } catch {}
    _browser = null;
  }
  
  if (!_browser) {
    if (process.env.NODE_ENV === 'development') {
      const puppeteer = (await import('puppeteer')).default;
      _browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } else {
      const puppeteerCore = (await import('puppeteer-core')).default;
      const chromium = (await import('@sparticuz/chromium')).default;
      _browser = await puppeteerCore.launch({
        args: [...chromium.args, '--disable-dev-shm-usage'],
        defaultViewport: chromium.defaultViewport || { width: 1920, height: 1080 },
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    }
  }
  
  _browserLastUsed = now;
  return _browser;
}
```

---

### Priority 2 — Performance & UX

#### OPT-6: Reduce QR Code Payload Size ⭐⭐⭐

**Problem solved:** Issue #3 (dense/unreadable QR code)

1. Remove pretty-print: `JSON.stringify(payload)` instead of `JSON.stringify(payload, null, 2)`
2. Remove redundant fields from QR (ticketNumber === bookingId)
3. Use compact field names: `{ bid, n, e, t, ts, sig }` instead of full names
4. Consider encoding just `bookingId + signature` (8 bytes) and looking up rest server-side

```typescript
// Compact payload approach
const compactPayload = {
  bid: data.bookingId,          // "HH-2026-000013"
  n: data.numberOfTickets,      // 2
  ts: Math.floor(Date.now()/1000), // Unix timestamp
};
const sig = createSignature(compactPayload);
const finalPayload = JSON.stringify({ ...compactPayload, sig }); // ~80 bytes vs 600+ bytes
```

**Result:** Lower QR density, easier scan, faster generation.

---

#### OPT-7: PDF Caching with Short TTL ⭐⭐⭐

**Problem solved:** Issue #4 partially, repeated downloads

Cache the generated PDF buffer in-memory (or use Vercel KV/Redis) for ~10 minutes. If the same `bookingId` is downloaded again within that window, serve from cache.

```typescript
// In-memory cache (works for warm function instances)
const pdfCache = new Map<string, { buffer: Buffer; generatedAt: number }>();
const PDF_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Before generation:
const cached = pdfCache.get(bookingId);
if (cached && Date.now() - cached.generatedAt < PDF_CACHE_TTL) {
  // Serve from cache
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('X-Cache', 'HIT');
  res.end(cached.buffer);
  return;
}

// After generation:
pdfCache.set(bookingId, { buffer: nodeBuffer, generatedAt: Date.now() });
```

---

#### OPT-8: Show `pending` Bookings with "Payment Pending" Badge ⭐⭐⭐

**Problem solved:** Issue #12 (pending bookings invisible)

Update `retrieve.ts` to also return `pending` bookings:

```typescript
const pendingBookings = bookings.filter(b => b.status === 'pending');

// In response:
pendingBookings: pendingBookings.map(b => ({
  bookingId: b.bookingId,
  fullName: b.fullName,
  numberOfTickets: b.numberOfTickets,
  status: b.status,
  createdAt: b.createdAt,
})),
```

In the UI, show these with a yellow "PAYMENT PENDING" badge and no download button.

---

#### OPT-9: Pre-warm PDF on booking-success with Loading State ⭐⭐⭐

**Problem solved:** Issue #6 (race condition + UX)

Instead of silently auto-downloading after 1500ms, show an explicit loading state and use `fetch()`:

```typescript
// pages/booking-success.tsx
const [pdfState, setPdfState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

useEffect(() => {
  if (!bookingId) return;
  
  // Start pre-warming after 2s (allow MongoDB write propagation)
  const timer = setTimeout(async () => {
    setPdfState('loading');
    try {
      const res = await fetch(`/api/generate-ticket?bookingId=${bookingId}`);
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      setPdfBlob(blob);
      setPdfState('ready');
    } catch {
      setPdfState('error');
    }
  }, 2000);
  
  return () => clearTimeout(timer);
}, [bookingId]);

// Button becomes enabled + changes label once 'ready':
<button
  disabled={pdfState === 'loading'}
  onClick={() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HH-TICKET-${bookingId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }}
>
  {pdfState === 'loading' ? '⏳ Preparing your ticket...' : 
   pdfState === 'ready'   ? '⬇️ Download Ticket PDF' :
   pdfState === 'error'   ? '❌ Retry Download' : '⬇️ Download Ticket PDF'}
</button>
```

---

#### OPT-10: Add Rate Limiting to Sensitive Endpoints ⭐⭐

**Problem solved:** Issue #11

Use a simple in-memory rate limiter or Vercel's Edge Middleware:

```typescript
// lib/rate-limit.ts
const ipMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string, maxRequests = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }
  
  if (entry.count >= maxRequests) return false; // blocked
  
  entry.count++;
  return true; // allowed
}
```

```typescript
// In generate-ticket.ts:
const ip = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown';
if (!rateLimit(ip, 5, 60_000)) { // 5 downloads per minute
  return res.status(429).json({ message: 'Too many requests. Please wait.' });
}
```

---

#### OPT-11: Reduce QR PII — Store Minimal Data ⭐⭐

**Problem solved:** Issue #9

Only encode the `bookingId` + timestamp + HMAC signature. At scan time, the venue app queries the API to get booking details. This way the QR code doesn't expose user PII.

---

### Priority 3 — Polish & Reliability

#### OPT-12: Add PDF Integrity Check Before Sending ⭐⭐

Add a quick sanity check that the generated buffer is actually a valid PDF:

```typescript
// After generating pdfBuffer:
const nodeBuffer = Buffer.from(pdfBuffer);

// PDF magic bytes: %PDF
if (!nodeBuffer.slice(0, 4).equals(Buffer.from('%PDF'))) {
  console.error('Generated buffer is not a valid PDF!');
  return res.status(500).json({ message: 'PDF generation produced invalid output' });
}
```

---

#### OPT-13: Add Graceful Browser Recovery ⭐⭐

```typescript
// Wrap the whole Puppeteer block in try/catch with browser reset:
try {
  browser = await getBrowser();
  page = await browser.newPage();
  // ... rest of generation
} catch (err) {
  // If browser is crashed, reset it
  if (_browser) {
    try { await _browser.close(); } catch {}
    _browser = null;
  }
  throw err; // re-throw for outer catch
}
```

---

#### OPT-14: Add `Content-Security-Policy` for ticket iframe ⭐

If you ever want to preview the ticket in-browser (not just download), the current CSP in `next.config.js` blocks `data:` URIs for fonts — fix this to allow `font-src data:` which is already set, but ensure `frame-src 'self'` is also correct.

---

#### OPT-15: Add proper TypeScript types to `generate-ticket.ts` ⭐

The `cachedBrowser: any` type should be `Browser | null` from `puppeteer-core`:

```typescript
import type { Browser } from 'puppeteer-core';
let cachedBrowser: Browser | null = null;
```

---

## 8. Recommended File Changes

### Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `lib/ticket-template.ts` | Inline all CSS + embed fonts as base64 | 🔴 Critical |
| `pages/api/generate-ticket.ts` | Add auth token, browser caching, PDF validation, rate limit | 🔴 Critical |
| `pages/retrieve-tickets.tsx` | Use fetch() for download, show real errors | 🔴 Critical |
| `pages/booking-success.tsx` | Pre-warm with loading state, use fetch+blob | 🔴 Critical |
| `vercel.json` | Add `maxDuration: 60` for generate-ticket | 🔴 Critical |
| `pages/api/bookings/retrieve.ts` | Return downloadTokens, include pending bookings | 🟡 High |
| `lib/secure-qr.ts` | Compact payload, remove pretty-print | 🟡 High |
| `pages/api/generate-ticket.ts` | Add in-memory PDF cache | 🟡 High |
| `lib/rate-limit.ts` | New file: in-memory rate limiter | 🟡 High |
| `pages/api/generate-ticket.ts` | Apply rate limit | 🟡 High |

### New Files to Create

| File | Purpose |
|------|---------|
| `lib/rate-limit.ts` | Sliding window rate limiter for API endpoints |
| `lib/download-token.ts` | Token generation + verification for secure downloads |
| `lib/pdf-cache.ts` | In-memory PDF buffer cache with TTL |

---

## Quick Reference: End-to-End Timing (Current vs Optimized)

| Step | Current (Cold) | Optimized (Cold) | Optimized (Warm) |
|------|---------------|-----------------|-----------------|
| Page load (`/retrieve-tickets`) | ~300ms | ~300ms | ~300ms |
| Search API (`/api/bookings/retrieve`) | ~100–300ms | ~100–300ms | ~50ms |
| PDF API — DB fetch | ~100ms | ~100ms | ~50ms |
| PDF API — QR generation | ~50ms | ~30ms | ~20ms |
| PDF API — HTML template | ~5ms | ~3ms | ~3ms |
| PDF API — Browser launch | ~4000–8000ms | ~3000ms (cached) | ~0ms (warm) |
| PDF API — CDN font/CSS load | ~1000–3000ms | **0ms (inlined)** | **0ms** |
| PDF API — PDF render | ~1000ms | ~800ms | ~500ms |
| **Total (PDF generation)** | **6–14s** | **4–5s** | **0.5–1.5s** |

---

*Generated by: Code analysis of `hh-149-amvd` codebase · June 2026*  
*Author of analysis: Antigravity AI Assistant*
