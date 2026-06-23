# FRONTEND CHANGE REPORT

This report documents the necessary architectural UI changes required to strip out customer authentication and transition fully to the guest-booking architecture.

## 1. Navbar Component (`components/Navbar.tsx`)
* **Current Behavior:** Displays "Login", "Profile", and "Dashboard" links conditionally based on `useSession()`.
* **Required Behavior:** Remove all `next-auth` hooks. Replace auth links with a static "Retrieve Tickets" or "My Tickets" button pointing to the new retrieval page.
* **APIs Affected:** Removes dependency on `/api/auth/session`.

## 2. Authentication Pages (`pages/auth/login.tsx`, `pages/auth/signup.tsx`)
* **Current Behavior:** Allows standard user registration and login.
* **Required Behavior:** Delete `signup.tsx`. Update `login.tsx` to serve as a hidden/restrictive admin-only portal (e.g., move to `pages/admin/login.tsx`), entirely removing customer-facing verbiage.

## 3. Book Tickets Page (`pages/book-tickets.tsx`)
* **Current Behavior:** Features tabs for "Show Tickets" and "Join as Comedian". Booking assumes a user profile exists.
* **Required Behavior:**
  - Remove all authentication checks.
  - Separate comedian registration from ticket booking (comedians are performers, not guests buying tickets).
  - Simplify the form: Name, Email, Phone, Number of Tickets.
  - Implement a capacity check warning if `sold_out` threshold (150) is reached (display warning, but do not block submission).
* **APIs Affected:** Modifies payload sent to `/api/bookings/create`.

## 4. Success Page (NEW: `pages/booking-success.tsx`)
* **Current Behavior:** Currently redirects the user to the `/dashboard` upon successful Razorpay verification.
* **Required Behavior:**
  - Create a dedicated success page accessible via `?bookingId=HH-2026-XXXXXX`.
  - Prominently display the Human Friendly Booking ID (`HH-2026-XXXXXX`).
  - Provide an immediate "Download Ticket (PDF)" button.
  - Instruct the user to save their Booking ID or use their Email/Phone to retrieve it later.
* **Components Affected:** Integrates `TicketPDF.tsx`.

## 5. Retrieve Tickets Page (NEW: `pages/retrieve-tickets.tsx`)
* **Current Behavior:** Users currently rely on the authenticated `/dashboard` to view tickets.
* **Required Behavior:**
  - Create a public page with a form requiring two inputs: `Email` and `Phone`.
  - On submit, display all historical bookings associated with that email+phone combination.
  - Visually separate "Active Bookings" from "Cancelled Bookings".
  - Provide a "Download Ticket" button for active bookings.
* **APIs Affected:** Calls new `/api/bookings/retrieve.ts`.

## 6. Profile & Dashboard (`pages/profile.tsx`, `pages/dashboard.tsx`)
* **Current Behavior:** Allows customers to edit bio, view stats, cancel bookings, and change passwords.
* **Required Behavior:** Delete entirely. Customer cancellation is explicitly NOT supported. Rescheduling, transfers, and refunds are NOT supported.

## 7. Admin Dashboard (`pages/admin/index.tsx`)
* **Current Behavior:** Displays "Users" tab, handles customer password resets, views generic booking ObjectId.
* **Required Behavior:**
  - **Remove Users Tab:** Customer accounts no longer exist.
  - **Booking ID:** Update bookings table to prominently display the new human-friendly `bookingId` (e.g., `HH-2026-000001`) instead of the MongoDB `ObjectId`.
  - **Attendance:** Add a "Mark Attended" button/toggle to record attendance timestamp manually (no QR scanning implementation).
  - **Cancellations:** Ensure the "Decline" or "Cancel" action executes a soft delete (`status = 'cancelled'`).
  - **Complimentary Tickets:** Add a "Create Complimentary Booking" button that bypasses payment and issues an immediate active ticket marked as `bookingType: 'complimentary'`.
