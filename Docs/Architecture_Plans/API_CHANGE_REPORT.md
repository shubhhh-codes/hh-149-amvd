# API CHANGE REPORT

This report details the modifications, deprecations, and additions required across the API layer to support the final guest-booking architecture.

## 1. Obsolete APIs (To Be Deleted)

| API Path | Current Auth Dependency | Reason for Deletion |
| :--- | :--- | :--- |
| `/api/auth/signup.ts` | None | Customer accounts are completely removed. |
| `/api/bookings/user.ts` | NextAuth Session | Replaced by unauthenticated retrieval endpoint. |
| `/api/bookings/[id].ts` | NextAuth Session | Customer cancellations are strictly NOT supported. |
| `/api/payments/user.ts` | NextAuth Session | Customer accounts are removed. |
| `/api/user/update-profile.ts` | NextAuth Session | Customer profiles are removed. |
| `/api/users/change-password.ts` | NextAuth Session | Customer accounts are removed. |
| `/api/users/profile.ts` | NextAuth Session | Customer profiles are removed. |
| `/api/admin/reset-password.ts`| Admin Session | Customers do not have passwords to reset. |
| `/api/admin/users.ts` | Admin Session | Customer collection is deprecated. |

---

## 2. APIs Requiring Modification

### `/api/auth/[...nextauth].ts`
* **Current Auth Dependency:** Handles both user and admin authentication.
* **Required Change:** Strip out all customer-facing credential and OAuth logic. Restrict strictly to `admin@humorshub.com` or replace with a simpler custom JWT approach for admin.

### `/api/bookings/create.ts`
* **Current Auth Dependency:** Validates existence of user via email in `users` collection.
* **Current Request Schema:** `fullName`, `email`, `phone`, `numberOfTickets`, `isComedianBooking` (and comedian details).
* **Current Response Schema:** `{ message: string, bookingId: ObjectId }`
* **Required Change:**
  - Remove all database queries targeting the `users` collection.
  - Generate a unique, human-friendly `bookingId` (Format: `HH-2026-XXXXXX`).
  - Set default fields: `attended: false`, `bookingType: 'paid'`.
  - Strip comedian registration logic into a separate, dedicated endpoint if needed.
  - Return the new human-friendly `bookingId`.

### `/api/payments/create-order.ts`
* **Current Auth Dependency:** Likely relies on session or user validation.
* **Required Change:** Ensure full compatibility with unauthenticated guest requests.

### `/api/payments/verify.ts`
* **Current Auth Dependency:** None (usually Razorpay webhook/callback).
* **Required Change:** Ensure upon payment verification, the booking is retrieved via `ObjectId` or `bookingId` and status is updated to `approved` without attempting to link it to a user account.

### `/api/admin/bookings.ts`
* **Current Auth Dependency:** Admin Session.
* **Current Request Schema (PUT):** `{ bookingId: string, status: string }`
* **Required Change:**
  - Support `status: 'cancelled'` for soft deletes (refunds not supported).
  - Add support to toggle `attended: true` and record `attendedAt` timestamp.
  - Add `POST` method allowing admin to create a booking with `bookingType: 'complimentary'`.

---

## 3. New APIs to Implement

### `/api/bookings/retrieve.ts`
* **Auth Dependency:** None (Public Endpoint).
* **Request Schema:**
  ```json
  {
    "email": "customer@example.com",
    "phone": "9876543210"
  }
  ```
* **Response Schema:**
  ```json
  {
    "activeBookings": [
      { "bookingId": "HH-2026-000001", "status": "approved", "numberOfTickets": 2, ... }
    ],
    "cancelledBookings": [
      { "bookingId": "HH-2026-000002", "status": "cancelled", "numberOfTickets": 1, ... }
    ]
  }
  ```
* **Behavior:** Must match exactly on both `email` and `phone` to return the user's entire history (Multiple bookings allowed). No individual `bookingId` is required for access.
