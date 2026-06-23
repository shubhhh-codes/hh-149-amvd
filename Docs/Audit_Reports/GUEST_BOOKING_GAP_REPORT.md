    # GUEST BOOKING GAP REPORT

    This report identifies all files that conflict with the final guest-booking architecture requirements, detailing their current behavior and what changes are necessary.

    | File Path | Current Behavior | Required Behavior | Severity |
    | :--- | :--- | :--- | :--- |
    | `pages/auth/signup.tsx` | Allows customers to create accounts. | Delete entirely. No customer accounts. | High |
    | `pages/auth/login.tsx` | Provides login for customers. | Delete or repurpose exclusively for Admin access. | High |
    | `pages/profile.tsx` | Customer profile management. | Delete entirely. | High |
    | `pages/dashboard.tsx` | Customer dashboard for viewing tickets. | Delete entirely. | High |
    | `pages/book-tickets.tsx` | Relies on customer authentication and combines comedian signup. | Remove auth dependency. Add auto-download PDF and success flow generating human-readable IDs. | High |
    | `components/Navbar.tsx` | Displays Profile/Login/Dashboard links based on session. | Remove all auth-related links. Add a new "Retrieve Tickets" link. | Medium |
    | `pages/api/auth/[...nextauth].ts` | NextAuth implementation for customers & admin. | Remove NextAuth entirely. Implement simple JWT strictly for `admin@humorshub.com`. | High |
    | `pages/api/auth/signup.ts` | Backend handler for account creation. | Delete entirely. | High |
    | `pages/api/users/profile.ts` | Fetches/Updates customer profile. | Delete entirely. | Medium |
    | `pages/api/users/change-password.ts` | Changes customer password. | Delete entirely (or move to admin). | Medium |
    | `pages/api/user/update-profile.ts` | Updates customer profile. | Delete entirely. | Medium |
    | `pages/api/bookings/create.ts` | Validates `users` collection, associates `userId`. | Remove user check. Generate unique `bookingId` (e.g., `HH-2026-000001`). Add `bookingType` field. | High |
    | `pages/api/bookings/user.ts` | Fetches bookings based on active session email. | Delete. Replace with `retrieve.ts` that takes `email` and `phone` via POST to find all matching bookings. | High |
    | `pages/api/bookings/[id].ts` | Customer cancellation endpoint. | Delete entirely. Customer cancellation is not supported. | High |
    | `pages/api/payments/user.ts` | Fetches payments for authenticated user. | Delete entirely. | Medium |
    | `pages/api/payments/create-order.ts` | Initiates Razorpay payment (might check auth). | Ensure full guest compatibility without session checks. | Medium |
    | `pages/api/payments/verify.ts` | Verifies payment and updates booking. | Ensure it updates the new guest booking model correctly. | Medium |
    | `pages/api/admin/bookings.ts` | Lists bookings for admin, allows status updates. | Add manual attendance marking (`attended: true`) and complimentary booking creation. | High |
    | `components/TicketPDF.tsx` | Generates PDF ticket. | Must prominently display the human-friendly `bookingId` and an informational QR code. | Medium |
    | `pages/api/admin/reset-password.ts` | Admin resetting customer passwords. | Delete entirely. | Low |
    | `pages/api/admin/users.ts` | Admin viewing customer lists. | Delete entirely (No customer accounts). | Low |
