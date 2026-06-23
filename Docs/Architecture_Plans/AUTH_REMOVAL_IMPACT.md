# AUTHENTICATION REMOVAL IMPACT

This document maps every location in the repository that currently depends on `next-auth` and outlines the replacement strategy.

| File Path | Line | Dependency | Purpose | Replacement Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `pages/_app.tsx` | 8, 18, 32 | `SessionProvider` | Wraps the entire application in auth context. | Remove `SessionProvider` entirely. |
| `pages/index.tsx` | 2, 53 | `useSession` | Conditionally renders elements based on login. | Remove hook. Hardcode to public view. |
| `pages/book-tickets.tsx` | 9, 18 | `useSession` | Links booking to user session. | Remove hook. Collect user details directly from the form. |
| `pages/profile.tsx` | 8, 43 | `useSession` | Fetches logged-in user profile. | **Delete File.** |
| `pages/dashboard.tsx` | 9, 42 | `useSession` | Fetches logged-in user bookings. | **Delete File.** |
| `pages/auth/login.tsx` | 9, 47 | `signIn` | Authenticates user. | Restrict to admin access only. |
| `components/Navbar.tsx` | 3, 20, 80, 130| `useSession`, `signOut`| Toggles Login/Profile vs Logout. | Remove hooks. Use static links (e.g., "Retrieve Tickets"). |
| `components/Profile.tsx`| 7, 12 | `useSession` | Displays user avatar/details. | **Delete Component.** |
| `middleware.ts` | 33 | `signIn` route | Protects dashboard/profile pages. | Update matcher to only protect `/admin/*` routes. |
| `pages/api/auth/[...nextauth].ts`| 81 | `signIn` config | Redirects unauthenticated users. | Keep for admin, but remove user DB validation. |
| `pages/api/bookings/[id].ts` | 8, 21 | `getToken` | Validates session before cancellation. | **Delete File.** |
| `pages/api/bookings/user.ts` | 8, 21 | `getToken` | Fetches user bookings by session. | **Delete File.** |
| `pages/api/user/update-profile.ts`| 8, 21 | `getToken` | Validates session before edit. | **Delete File.** |
| `pages/api/payments/user.ts` | 2, 14 | `getToken` | Fetches user payments by session. | **Delete File.** |
| `pages/api/payments/verify.ts` | 2, 16 | `getToken` | Associates payment with user session. | Remove `getToken`. Verify via Razorpay signature and `bookingId`. |
| `pages/api/generate-ticket.ts` | 2, 7 | `getToken` | Secures PDF generation. | Remove `getToken`. Allow generation via valid `bookingId`. |
| `pages/api/comedians/register.ts`| 8, 20 | `getToken` | Secures comedian signup. | Remove `getToken`. Allow public submissions for review. |
