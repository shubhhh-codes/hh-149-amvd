# API DEPENDENCY MATRIX

This matrix audits every route under `pages/api` and outlines its future state in the guest-booking architecture.

| Route | Methods | Used By | Auth Req? | Collections Touched | Future State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/signup` | POST | Customer Signup | No | `users` | **DELETE** |
| `/api/auth/[...nextauth]`| GET/POST | Login | Yes | `users` | **MODIFY** (Admin only) |
| `/api/bookings/create` | POST | Book Tickets | *Remove* | `bookings`, `users` | **MODIFY** (Remove `users` dependency, add `bookingId` logic) |
| `/api/bookings/user` | GET | Dashboard | Yes | `bookings` | **DELETE** |
| `/api/bookings/[id]` | DELETE | Dashboard | Yes | `bookings` | **DELETE** |
| `/api/bookings/retrieve`| POST | Retrieve Tickets| No | `bookings` | **NEW API** |
| `/api/payments/create-order`| POST | Book Tickets | *Remove* | none (Razorpay) | **MODIFY** (Make guest compatible) |
| `/api/payments/verify` | POST | Book Tickets | *Remove* | `payments`, `bookings`| **MODIFY** (Make guest compatible) |
| `/api/payments/user` | GET | Dashboard | Yes | `payments` | **DELETE** |
| `/api/user/update-profile`| PUT | Profile | Yes | `users` | **DELETE** |
| `/api/users/change-password`| POST | Profile | Yes | `users` | **DELETE** |
| `/api/users/profile` | GET/PUT | Profile | Yes | `users` | **DELETE** |
| `/api/comedians/register`| POST | Perform With Us | *Remove* | `users` (Needs fix)| **MODIFY** (Public submission, isolate from core `users` collection) |
| `/api/admin/users` | GET | Admin Dashboard | Admin | `users` | **DELETE** |
| `/api/admin/reset-password`| POST | Admin Dashboard | Admin | `users` | **DELETE** |
| `/api/admin/bookings` | GET/PUT/POST| Admin Dashboard | Admin | `bookings` | **MODIFY** (Add attend, cancel, complimentary actions) |
| `/api/admin/payments` | GET | Admin Dashboard | Admin | `payments` | **KEEP** |
| `/api/admin/comedians` | GET/PUT | Admin Dashboard | Admin | `users` | **KEEP** (Adjust collection if comedians move from `users`) |
| `/api/admin/cms/*` | All | Admin CMS | Admin | `homepage_content`| **KEEP** |
| `/api/generate-ticket` | POST/GET | Bookings/Dashboard| *Remove* | `bookings` | **MODIFY** (Validate via `bookingId` instead of session) |
