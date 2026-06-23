# GUEST BOOKING MIGRATION PLAN

This master document serves as the high-level plan for stripping out customer authentication and migrating to a guest-only booking architecture.

## 1. Files Disposition Summary
### Files to Delete
- `pages/auth/signup.tsx`
- `pages/profile.tsx`
- `pages/dashboard.tsx`
- `components/Profile.tsx`
- `pages/api/auth/signup.ts`
- `pages/api/bookings/user.ts`
- `pages/api/bookings/[id].ts`
- `pages/api/payments/user.ts`
- `pages/api/user/update-profile.ts`
- `pages/api/users/change-password.ts`
- `pages/api/users/profile.ts`
- `pages/api/admin/users.ts`
- `pages/api/admin/reset-password.ts`

### Files to Modify
- `pages/_app.tsx` (Remove `SessionProvider`)
- `pages/index.tsx` (Remove `useSession`)
- `pages/book-tickets.tsx` (Remove `useSession`, update to guest data collection)
- `pages/auth/login.tsx` (Restrict to admin only)
- `pages/admin/index.tsx` (Update bookings table, remove users tab)
- `pages/perform-with-us.tsx` (Attach standalone comedian API)
- `components/Navbar.tsx` (Remove auth links, add "Retrieve Tickets")
- `components/TicketPDF.tsx` (Use `bookingId` string format)
- `middleware.ts` (Protect `/admin` only)
- `pages/api/auth/[...nextauth].ts` (Admin-only JWT or Credentials)
- `pages/api/bookings/create.ts` (Generate `bookingId`, guest payload)
- `pages/api/payments/create-order.ts` (Remove session checks)
- `pages/api/payments/verify.ts` (Verify against new `bookingId` model)
- `pages/api/admin/bookings.ts` (Add attend/cancel logic)
- `pages/api/comedians/register.ts` (Make public endpoint)
- `pages/api/generate-ticket.ts` (Remove token checks)

### Files to Keep (Unaffected)
- `pages/shows.tsx`
- `pages/gallery.tsx`
- `pages/about.tsx`
- `pages/policies.tsx`
- `components/admin/SiteCMS.tsx`
- `/api/admin/cms/*` endpoints
- All UI component shells (`Footer.tsx`, `ParticleBackground.tsx`, etc.)

## 2. Replacement Architecture
* **Auth**: Dropped entirely for customers. NextAuth becomes exclusively a tool for `admin@humorshub.com`.
* **Booking**: Handled purely via public guest endpoints. The user receives a human-readable `bookingId` (e.g., `HH-2026-000001`).
* **Retrieval**: Customers retrieve historical bookings by entering their `Email` and `Phone` exactly as submitted during booking.
* **New Pages**:
  * `/booking-success`: Displays `bookingId` and auto-downloads the PDF ticket.
  * `/retrieve-tickets`: The lookup portal replacing the customer dashboard.
* **Admin Controls**: Cancellations are purely admin-driven (soft delete). Admin manually marks attendance via a boolean toggle.

## 3. Database Changes
* **Drop**: `users` collection (pending the migration of `comedian` profiles to a separate collection).
* **`bookings` updates**:
  * Add: `bookingId` (String), `bookingType` ('paid'|'complimentary'), `attended` (Boolean), `attendedAt` (Date).
  * Remove: `userId`, `isComedianBooking`, `comedianId`.
* **`payments` updates**:
  * Add: `bookingId` (String).
  * Remove: `userId`, nested `user` details.

## 4. API Changes
* **Obsolete**: All `/api/users/*` and authenticated endpoints matching active user sessions for fetching or deleting data.
* **Modified**: `/api/bookings/create` now creates guest documents. `/api/payments/verify` updates booking by `bookingId` without user matching.
* **New**: `/api/bookings/retrieve` (POST) to return all bookings matching a given Email and Phone.

## 5. Migration Risks
* **Data Loss**: Dropping the `users` collection risks destroying existing comedian applications. **Mitigation**: Extract comedian logic to a dedicated schema and perform a migration script beforehand.
* **Race Conditions**: Sequence generation of `HH-2026-XXXXXX` must be atomic (via MongoDB `$inc` counters) to avoid duplicates.
* **Data Exposure**: Public ticket retrieval could leak data if someone guesses an Email/Phone combo. **Mitigation**: Only display safe metadata and rely strictly on PDF generation for the ticket itself.

---
*For granular file-by-file breakdowns, please see the `Architecture_Plans` and `Audit_Reports` directories.*
