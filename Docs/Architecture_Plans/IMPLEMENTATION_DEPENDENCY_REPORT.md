    # IMPLEMENTATION DEPENDENCY REPORT

    This document outlines the disposition of every frontend and backend file in the repository to support the transition to a guest-booking architecture.

    | File Path | Action | Reason |
    | :--- | :--- | :--- |
    | `pages/_app.tsx` | Modify | Remove `SessionProvider` wrapper as customer auth is deprecated. |
    | `pages/index.tsx` | Modify | Remove `useSession` hook. Update CTA links to point to guest booking. |
    | `pages/book-tickets.tsx` | Modify | Remove auth checks, `useSession`. Isolate comedian signup logic. Convert form to guest data collection. |
    | `pages/dashboard.tsx` | Delete | Customer dashboards are deprecated. |
    | `pages/profile.tsx` | Delete | Customer profiles are deprecated. |
    | `pages/auth/login.tsx` | Modify | Strip customer language. Keep only as a protected entrance for `admin@humorshub.com`. |
    | `pages/auth/signup.tsx` | Delete | Customer account creation is deprecated. |
    | `pages/admin/index.tsx` | Modify | Remove "Users" tab. Remove password reset logic. Update bookings table for Attendance and manual Cancellations. |
    | `pages/shows.tsx` | Keep | Informational public page. |
    | `pages/perform-with-us.tsx` | Modify | Fix broken form handler to connect to `/api/comedians/register` without auth. |
    | `pages/gallery.tsx` | Keep | Informational public page. |
    | `pages/about.tsx` | Keep | Informational public page. |
    | `pages/policies.tsx` | Keep | Informational public page. |
    | `pages/booking-success.tsx` | New | Dedicated success page displaying the `bookingId` and triggering auto-download. |
    | `pages/retrieve-tickets.tsx`| New | Public portal for querying bookings via Email and Phone. |
    | `components/Navbar.tsx` | Modify | Remove auth conditional rendering (`useSession`, `signOut`). Add "Retrieve Tickets" button. |
    | `components/Profile.tsx` | Delete | Component is deprecated. |
    | `components/TicketPDF.tsx`| Modify | Replace MongoDB ObjectId with human-friendly `bookingId`. |
    | `components/admin/SiteCMS.tsx`| Keep | Admin functionality remains intact. |
    | `middleware.ts` | Modify | Remove customer route protection. Only protect `/admin` routes. |
    | `pages/api/auth/[...nextauth].ts` | Modify | Restrict credentials exclusively to admin. Remove any user registration checks. |
    | `pages/api/auth/signup.ts` | Delete | Account creation deprecated. |
    | `pages/api/bookings/create.ts`| Modify | Remove `users` collection check. Generate unique `bookingId`. Add `attended: false`. |
    | `pages/api/bookings/user.ts` | Delete | Authenticated fetch deprecated. |
    | `pages/api/bookings/[id].ts` | Delete | Customer cancellation deprecated. |
    | `pages/api/bookings/retrieve.ts`| New | Public endpoint to fetch bookings matching Email + Phone. |
    | `pages/api/payments/create-order.ts`| Modify | Remove any `getToken` or session checks. |
    | `pages/api/payments/verify.ts`| Modify | Update booking using the new `bookingId` instead of relying on `userId`. Remove session checks. |
    | `pages/api/payments/user.ts` | Delete | Authenticated fetch deprecated. |
    | `pages/api/user/update-profile.ts`| Delete | Profile edits deprecated. |
    | `pages/api/users/change-password.ts`| Delete | Customer passwords deprecated. |
    | `pages/api/users/profile.ts` | Delete | Customer profiles deprecated. |
    | `pages/api/admin/users.ts` | Delete | Customer management deprecated. |
    | `pages/api/admin/reset-password.ts`| Delete | Customer password resets deprecated. |
    | `pages/api/admin/bookings.ts` | Modify | Add logic for marking attendance and executing soft-delete cancellations. Add support for creating complimentary bookings. |
    | `pages/api/comedians/register.ts`| Modify | Remove `getToken` check. Make it a public endpoint for comedian applications. |
    | `pages/api/generate-ticket.ts`| Modify | Remove session checks. Verify booking by `bookingId`. |
