# IMPLEMENTATION PLAN

This is the master execution blueprint for migrating to a guest-booking architecture. Every task is traceable back to findings in Phases 1–4. No code has been written — this is the plan only.

---

## PRIORITY 1 — CRITICAL FIXES (Auth Removal & Core Plumbing)

These changes must happen first because every other priority depends on the auth layer being stripped from public-facing code.

---

### Task 1.1 — Strip `SessionProvider` from App Entry

| Field | Value |
| :--- | :--- |
| **File** | [_app.tsx](file:///c:/Users/shubh/Downloads/hh-149-amvd/pages/_app.tsx) |
| **Reason** | `SessionProvider` wraps the entire app in NextAuth context. Every public page currently initialises a session check on mount. Removing it is the foundational step. |
| **Exact Change** | Remove `import { SessionProvider }` (L8). Remove `<SessionProvider session={session}>` wrapper (L18, L32). Destructure `pageProps` directly without extracting `session`. |
| **Dependencies** | None — but every other task that removes `useSession` calls depends on this being done first. |
| **Risk** | **HIGH** — If done before stripping `useSession` from child pages, those pages will crash at runtime. Must be coordinated with Tasks 1.2–1.5. |

---

### Task 1.2 — Rewrite Middleware (Admin-Only Protection)

| Field | Value |
| :--- | :--- |
| **File** | [middleware.ts](file:///c:/Users/shubh/Downloads/hh-149-amvd/middleware.ts) |
| **Reason** | Currently protects `/dashboard`, `/profile`, and `/admin` using `withAuth` from `next-auth/middleware` (L7, L10). The `authorized` callback (L25–30) blocks unauthenticated users from all matched routes. Customer routes must be unprotected. |
| **Exact Change** | Remove `/dashboard` and `/profile` from the `matcher` array (L40–41). Keep only `/admin` and `/admin/:path*`. Update the `authorized` callback to only check `admin@humorshub.com`. |
| **Dependencies** | Task 1.1 (SessionProvider removal). |
| **Risk** | **MEDIUM** — If the matcher is misconfigured, admin routes could become publicly accessible. Test admin route protection immediately after change. |

---

### Task 1.3 — Strip Auth from Navbar

| Field | Value |
| :--- | :--- |
| **File** | [Navbar.tsx](file:///c:/Users/shubh/Downloads/hh-149-amvd/components/Navbar.tsx) |
| **Reason** | Uses `useSession` (L3, L20) and `signOut` (L3, L80, L130) to conditionally render Login/Signup/Profile/Logout links. Session-based conditional logic spans L62, L74–87 (desktop) and L124–137 (mobile). |
| **Exact Change** | Remove `import { useSession, signOut }` (L3). Remove `const { data: session } = useSession()` (L20). Remove the `session ? (...)` ternary blocks at L74–87 (desktop) and L124–137 (mobile). Replace with a static "My Tickets" link pointing to `/retrieve-tickets`. Remove `UserCircle`, `LogOut`, `LogIn`, `UserPlus`, `LayoutDashboard` icons (L10–13) as they are no longer needed. |
| **Dependencies** | Task 1.1. |
| **Risk** | **LOW** — Pure UI change with no backend impact. |

---

### Task 1.4 — Strip Auth from Homepage

| Field | Value |
| :--- | :--- |
| **File** | [index.tsx](file:///c:/Users/shubh/Downloads/hh-149-amvd/pages/index.tsx) |
| **Reason** | Imports `useSession` (L2) and calls it at L53. The session data is not used for any rendering logic beyond the Navbar (which is separately addressed). |
| **Exact Change** | Remove `import { useSession }` (L2). Remove `const { data: session } = useSession()` (L53). |
| **Dependencies** | Task 1.1. |
| **Risk** | **LOW** — Session was unused in the homepage render logic itself. |

---

### Task 1.5 — Restrict NextAuth to Admin Only

| Field | Value |
| :--- | :--- |
| **File** | [[...nextauth].ts](file:///c:/Users/shubh/Downloads/hh-149-amvd/pages/api/auth/%5B...nextauth%5D.ts) |
| **Reason** | The `authorize` function (L20–48) validates any user in the `users` collection. It must be restricted so only `admin@humorshub.com` can authenticate. |
| **Exact Change** | In the `authorize` function, after finding the user (L27), add a guard: `if (user.email !== 'admin@humorshub.com') throw new Error('Admin access only')`. Strip non-admin fields from the return object (L38–47): remove `userId`, `createdAt`, etc. Simplify JWT/session callbacks (L52–78) to only pass `id`, `email`, and `role`. |
| **Dependencies** | None. |
| **Risk** | **HIGH** — If the guard is wrong, admin could be locked out. Test admin login immediately. |

---

### Task 1.6 — Delete Deprecated Customer Files

| Field | Value |
| :--- | :--- |
| **Files** | `pages/auth/signup.tsx`, `pages/profile.tsx`, `pages/dashboard.tsx`, `components/Profile.tsx`, `pages/api/auth/signup.ts`, `pages/api/bookings/user.ts`, `pages/api/bookings/[id].ts`, `pages/api/payments/user.ts`, `pages/api/user/update-profile.ts`, `pages/api/users/change-password.ts`, `pages/api/users/profile.ts`, `pages/api/admin/users.ts`, `pages/api/admin/reset-password.ts`, `pages/api/admin/users/[id].ts` |
| **Reason** | All these files serve customer account management, which is being removed entirely. |
| **Exact Change** | Delete the files listed above. |
| **Dependencies** | Tasks 1.1–1.5 must be completed first so no remaining code imports from these. |
| **Risk** | **MEDIUM** — Must verify zero remaining imports to these files. A missed import will crash the build. Run `npm run build` after deletion. |

---

## PRIORITY 2 — BOOKING FLOW (Guest Architecture)

With auth stripped, these tasks build the new guest-only booking pipeline.

---

### Task 2.1 — Create Booking ID Counter Collection Logic

| Field | Value |
| :--- | :--- |
| **File** | NEW: `lib/bookingId.ts` |
| **Reason** | Sequential human-friendly IDs (`HH-2026-000001`) require an atomic counter to prevent race conditions. MongoDB's `findOneAndUpdate` with `$inc` on a `counters` collection is the safe approach. |
| **Exact Change** | Create a utility function `generateBookingId()` that: (1) Calls `findOneAndUpdate` on `counters` collection with `{ _id: 'bookingId' }`, incrementing `seq` by 1, with `upsert: true`. (2) Formats as `HH-${year}-${seq.toString().padStart(6, '0')}`. |
| **Dependencies** | `lib/mongodb.ts` (DB connector). |
| **Risk** | **LOW** — Isolated utility. |

---

### Task 2.2 — Rewrite `/api/bookings/create.ts` for Guest Booking

| Field | Value |
| :--- | :--- |
| **File** | [create.ts](file:///c:/Users/shubh/Downloads/hh-149-amvd/pages/api/bookings/create.ts) |
| **Reason** | Currently checks the `users` collection (L41–44) and stores `userId` (L65, L119). Also branches into comedian booking logic (L46–82) which must be removed. |
| **Exact Change** | Remove `users` collection lookup (L41–44). Remove comedian booking branch (L46–82). Import and call `generateBookingId()` from Task 2.1. Set `bookingType: 'paid'`, `attended: false`, `attendedAt: null`. Store the generated `bookingId` string on the document. Return `{ bookingId: 'HH-2026-000001' }` in the response. Update capacity constant from `50` to `150` (L111). |
| **Dependencies** | Task 2.1 (`lib/bookingId.ts`). |
| **Risk** | **HIGH** — This is the core booking endpoint. Must be tested end-to-end with Razorpay. |

---

### Task 2.3 — Make Payment Create-Order Guest-Compatible

| Field | Value |
| :--- | :--- |
| **File** | [create-order.ts](file:///c:/Users/shubh/Downloads/hh-149-amvd/pages/api/payments/create-order.ts) |
| **Reason** | Currently has no auth checks (already guest-compatible). However, `receipt` (L40) uses `Date.now()` and should be updated to use the `bookingId`. |
| **Exact Change** | Accept `bookingId` in `req.body`. Set `receipt: bookingId` in the Razorpay options. |
| **Dependencies** | Task 2.2. |
| **Risk** | **LOW** — Additive change only. |

---

### Task 2.4 — Rewrite Payment Verify for Guest Flow

| Field | Value |
| :--- | :--- |
| **File** | [verify.ts](file:///c:/Users/shubh/Downloads/hh-149-amvd/pages/api/payments/verify.ts) |
| **Reason** | Uses `getToken` (L2, L16) to enforce authentication. Looks up the `users` collection (L66–70) to attach `userId` to the payment record (L88). The booking is found via `ObjectId` (L56–58). |
| **Exact Change** | Remove `getToken` import and auth check (L2, L16–19). Remove `users` lookup (L66–70). Find booking by `bookingId` string field instead of `ObjectId` (L56–58). Remove `userId` and `email` from the payment record (L88–89). Store `bookingId` string on the payment document. Keep Razorpay signature verification logic intact (L40–50). |
| **Dependencies** | Tasks 2.1, 2.2. |
| **Risk** | **HIGH** — Payment verification is money-critical. Must be validated with a test Razorpay transaction. |

---

### Task 2.5 — Rewrite Book-Tickets Page for Guest Form

| Field | Value |
| :--- | :--- |
| **File** | [book-tickets.tsx](file:///c:/Users/shubh/Downloads/hh-149-amvd/pages/book-tickets.tsx) |
| **Reason** | Uses `useSession` (L9, L18) and redirects unauthenticated users to `/auth/login` (L38–41). Pre-fills email from session (L27, L163). Comedian registration is mixed into the same form (L173–199). On success, redirects to `/dashboard` (L110). |
| **Exact Change** | Remove `useSession` import and call (L9, L18). Remove login redirect (L38–41). Make `email` a user-editable text field (L27 → empty string). Remove the comedian tab and its form/submission logic (all `bookingType === 'joinAsComedian'` branches). Change the Razorpay prefill to use `formData.email` instead of `session?.user?.email` (L118). Change post-payment redirect from `/dashboard` (L110) to `/booking-success?id=${bookingId}`. |
| **Dependencies** | Tasks 2.2, 2.4. |
| **Risk** | **MEDIUM** — Large UI refactor but functionally straightforward. |

---

### Task 2.6 — Create Success Page

| Field | Value |
| :--- | :--- |
| **File** | NEW: `pages/booking-success.tsx` |
| **Reason** | After payment verification, the user must see their `bookingId` and auto-download a PDF. Currently the flow redirects to `/dashboard` which is being deleted. |
| **Exact Change** | Create a page that reads `bookingId` from `router.query.id`. Display the booking ID prominently. Include a "Download Ticket" button. Add a note: "Save your Booking ID or use your Email + Phone to retrieve tickets later." |
| **Dependencies** | Task 2.5 (redirect target). |
| **Risk** | **LOW** — New page, no existing code affected. |

---

### Task 2.7 — Create Ticket Retrieval API

| Field | Value |
| :--- | :--- |
| **File** | NEW: `pages/api/bookings/retrieve.ts` |
| **Reason** | Customers must be able to retrieve their bookings without an account, using email + phone. |
| **Exact Change** | Create a POST endpoint. Accept `{ email, phone }`. Query `bookings` collection for all documents matching both fields (case-insensitive email). Return two arrays: `activeBookings` (status !== 'cancelled') and `cancelledBookings` (status === 'cancelled'). |
| **Dependencies** | Task 2.2 (new booking schema). |
| **Risk** | **LOW** — New endpoint. Security consideration: only returns non-sensitive booking metadata. |

---

### Task 2.8 — Create Ticket Retrieval Page

| Field | Value |
| :--- | :--- |
| **File** | NEW: `pages/retrieve-tickets.tsx` |
| **Reason** | Replaces the deleted customer `/dashboard`. Provides a public form for guests to find their bookings. |
| **Exact Change** | Create a page with an Email + Phone form. On submit, call `/api/bookings/retrieve`. Display active bookings with "Download Ticket" buttons. Display cancelled bookings in a separate section (read-only). |
| **Dependencies** | Task 2.7. |
| **Risk** | **LOW** — New page. |

---

### Task 2.9 — Update Venue Status API

| Field | Value |
| :--- | :--- |
| **File** | [venue-status.ts](file:///c:/Users/shubh/Downloads/hh-149-amvd/pages/api/bookings/venue-status.ts) |
| **Reason** | Currently hardcodes capacity at `50` (L10). The `$match` pipeline filters by `isComedianBooking` (L29) which is being deprecated. |
| **Exact Change** | Change `VENUE_CAPACITY` from `50` to `150` (L10). Remove the `isComedianBooking: { $ne: true }` filter (L29). |
| **Dependencies** | None. |
| **Risk** | **LOW** — Simple constant and filter change. |

---

### Task 2.10 — Update Generate-Ticket API for Guest Access

| Field | Value |
| :--- | :--- |
| **File** | [generate-ticket.ts](file:///c:/Users/shubh/Downloads/hh-149-amvd/pages/api/generate-ticket.ts) |
| **Reason** | Uses `getToken` (L2, L7) to enforce auth and validates email ownership (L20–22). Guests won't have a token. |
| **Exact Change** | Remove `getToken` import and auth check (L2, L7–10). Remove email ownership check (L19–22). Instead, validate that a `bookingId` query param is provided and exists in the `bookings` collection. Pull booking details from DB instead of query params for security. Add `bookingId` to the PDF content. |
| **Dependencies** | Task 2.2. |
| **Risk** | **MEDIUM** — PDF generation needs to work on Vercel serverless. Verify function timeout limits. |

---

## PRIORITY 3 — ADMIN FLOW (Enhanced Management)

These tasks extend the admin panel to support the new booking model.

---

### Task 3.1 — Update Admin Bookings API (Attendance + Cancellation + Complimentary)

| Field | Value |
| :--- | :--- |
| **File** | [admin/bookings.ts](file:///c:/Users/shubh/Downloads/hh-149-amvd/pages/api/admin/bookings.ts) |
| **Reason** | Currently supports GET (list) and PUT (status update). Needs: (1) PATCH for toggling `attended` boolean, (2) POST for creating complimentary bookings, (3) capacity check updated to 150, (4) `isComedianBooking` filter removal (L53, L60). |
| **Exact Change** | Add `PATCH` handler: accepts `{ bookingId, attended: true }`, sets `attended: true` and `attendedAt: new Date()`. Add `POST` handler: accepts guest details, calls `generateBookingId()`, sets `bookingType: 'complimentary'`, `status: 'approved'`. Update capacity constant from `50` to `150` (L70). Remove `isComedianBooking` filter (L53, L60). Change booking lookup from `ObjectId` to string `bookingId` (L44–46, L78–79). |
| **Dependencies** | Task 2.1 (`lib/bookingId.ts`). |
| **Risk** | **MEDIUM** — Admin-facing. Must verify the `getServerSession` guard (L17–21) still works after NextAuth changes. |

---

### Task 3.2 — Update Admin Dashboard UI

| Field | Value |
| :--- | :--- |
| **File** | [admin/index.tsx](file:///c:/Users/shubh/Downloads/hh-149-amvd/pages/admin/index.tsx) |
| **Reason** | Contains a "Users" tab (L274–277, L420–455), "Reset Password" logic (L199–225, L447, L586–626), and displays bookings by MongoDB `ObjectId`. |
| **Exact Change** | Remove `users` state, `fetchUsers`, and `handleResetUserPassword` functions. Remove "Users" tab button and its content section (L274–277, L420–455). Remove the password reset modal (L586–626). Remove `users` from the `activeTab` type union (L75). Remove `selectedUser`, `passwordResetModal`, `newPassword` state variables (L88–90). Update the bookings table to display the `bookingId` string instead of date/ObjectId. Add an "Attendance" column with a toggle button calling PATCH. Add a "Create Complimentary Booking" button/modal that POSTs to the admin bookings API. Display `bookingType` badge (`paid` / `complimentary`). |
| **Dependencies** | Task 3.1. |
| **Risk** | **MEDIUM** — Large UI refactor but limited to admin-only page. |

---

### Task 3.3 — Update Admin Payments Display

| Field | Value |
| :--- | :--- |
| **File** | [admin/index.tsx](file:///c:/Users/shubh/Downloads/hh-149-amvd/pages/admin/index.tsx) (Payments tab) |
| **Reason** | Payments table displays `payment.user?.email` (L553) which will no longer exist after migration. |
| **Exact Change** | Replace `payment.user?.email` with data from the linked booking's `email` field. Alternatively, ensure the payment record stores `fullName` and `email` at creation time (Task 2.4). |
| **Dependencies** | Task 2.4. |
| **Risk** | **LOW** — Display-only change. |

---

## PRIORITY 4 — CLEANUP & HARDENING

---

### Task 4.1 — Remove Comedian Logic from Booking Flow

| Field | Value |
| :--- | :--- |
| **File** | [comedians/register.ts](file:///c:/Users/shubh/Downloads/hh-149-amvd/pages/api/comedians/register.ts) |
| **Reason** | Uses `getToken` (L8, L20) for auth. Comedian registration should be a standalone public endpoint, not tied to customer auth. |
| **Exact Change** | Remove `getToken` import and auth check (L8, L20–23). Remove the email ownership check (L38–40). Accept public submissions. Keep server-side enforcement of `status: 'pending'` (L46). |
| **Dependencies** | Task 1.1 (auth removal). |
| **Risk** | **MEDIUM** — Opening this to public submissions means spam risk. Consider adding rate limiting or CAPTCHA in a future phase. |

---

### Task 4.2 — Fix Perform-With-Us Page Handlers

| Field | Value |
| :--- | :--- |
| **File** | [perform-with-us.tsx](file:///c:/Users/shubh/Downloads/hh-149-amvd/pages/perform-with-us.tsx) |
| **Reason** | Per the Frontend Action Audit, the "Send Application" button calls `e.preventDefault()` but has **no fetch logic**. The "WhatsApp Us" button has **no onClick handler**. |
| **Exact Change** | Wire the form submission to POST to `/api/comedians/register` with the collected form data. Add an `onClick` or `href` to the WhatsApp button pointing to a WhatsApp URL (e.g., `https://wa.me/91XXXXXXXXXX`). |
| **Dependencies** | Task 4.1. |
| **Risk** | **LOW** — Additive feature work. |

---

### Task 4.3 — Clean Up Admin Login Page

| Field | Value |
| :--- | :--- |
| **File** | [auth/login.tsx](file:///c:/Users/shubh/Downloads/hh-149-amvd/pages/auth/login.tsx) |
| **Reason** | Currently styled as a generic customer login with a "Don't have an account? Sign up" link. |
| **Exact Change** | Remove "Sign Up" link. Update page title/copy to "Admin Login". Optionally move file to `pages/admin/login.tsx` and update `[...nextauth].ts` pages config accordingly. |
| **Dependencies** | Task 1.5. |
| **Risk** | **LOW** — Cosmetic. |

---

### Task 4.4 — Update `package.json` Dependencies

| Field | Value |
| :--- | :--- |
| **File** | [package.json](file:///c:/Users/shubh/Downloads/hh-149-amvd/package.json) |
| **Reason** | If NextAuth is still needed for admin auth, keep `next-auth`. If replaced with custom JWT, remove `next-auth` and `bcryptjs`. Evaluate whether `pdfkit` is still needed or if client-side PDF generation is preferred. |
| **Exact Change** | Audit and remove unused packages. Run `npm prune`. |
| **Dependencies** | All prior tasks. |
| **Risk** | **LOW** — Final cleanup. |

---

### Task 4.5 — Full Build Verification

| Field | Value |
| :--- | :--- |
| **File** | Entire repository |
| **Reason** | After all deletions and modifications, the project must compile without errors. |
| **Exact Change** | Run `npm run build`. Fix any TypeScript errors or missing imports. Verify all pages render correctly. Test the full booking flow end-to-end: Homepage → Book Tickets → Pay → Success → Retrieve. Test admin login, booking management, attendance marking, and complimentary booking creation. |
| **Dependencies** | All tasks. |
| **Risk** | **HIGH** — Integration test. This is where hidden dependencies surface. |

---

## Execution Order Summary

```
PRIORITY 1 (Auth Removal)
  1.1 _app.tsx (SessionProvider)
  1.2 middleware.ts (Admin-only matcher)
  1.3 Navbar.tsx (Auth links)
  1.4 index.tsx (useSession)
  1.5 [...nextauth].ts (Admin-only credentials)
  1.6 Delete all deprecated files

PRIORITY 2 (Guest Booking Flow)
  2.1 lib/bookingId.ts (Counter utility)          ← NEW
  2.2 /api/bookings/create.ts (Guest rewrite)
  2.3 /api/payments/create-order.ts (Receipt ID)
  2.4 /api/payments/verify.ts (Guest rewrite)
  2.5 book-tickets.tsx (Guest form)
  2.6 booking-success.tsx                          ← NEW
  2.7 /api/bookings/retrieve.ts                    ← NEW
  2.8 retrieve-tickets.tsx                         ← NEW
  2.9 venue-status.ts (Capacity update)
  2.10 generate-ticket.ts (Guest access)

PRIORITY 3 (Admin Enhancements)
  3.1 /api/admin/bookings.ts (Attend/Cancel/Comp)
  3.2 admin/index.tsx (UI overhaul)
  3.3 admin/index.tsx (Payments display fix)

PRIORITY 4 (Cleanup)
  4.1 /api/comedians/register.ts (Public endpoint)
  4.2 perform-with-us.tsx (Wire handlers)
  4.3 auth/login.tsx (Admin-only copy)
  4.4 package.json (Dependency audit)
  4.5 Full build verification
```
