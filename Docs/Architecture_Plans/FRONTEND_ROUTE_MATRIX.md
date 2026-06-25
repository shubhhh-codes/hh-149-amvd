# FRONTEND ROUTE MATRIX

This matrix dictates the future state of all frontend pages.

| Route | Purpose | APIs Called | Auth Req? | Future State |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Homepage | None (SSR) | No | **KEEP** |
| `/shows` | List upcoming/past shows | None (SSR) | No | **KEEP** |
| `/perform-with-us` | Comedian applications | `/api/comedians/register` | No | **MODIFY** (Fix API connection) |
| `/gallery` | Photo gallery | None (SSR) | No | **KEEP** |
| `/about` | Brand story | None | No | **KEEP** |
| `/policies` | T&Cs / Privacy | None (SSR) | No | **KEEP** |
| `/book-tickets` | Booking flow | `/api/bookings/create`, `/api/payments/*` | No | **MODIFY** (Remove session logic, strict guest form) |
| `/auth/login` | Portal entry | `/api/auth/[...nextauth]` | No | **MODIFY** (Restrict to Admin UI only) |
| `/auth/signup` | Customer creation | `/api/auth/signup` | No | **DELETE** |
| `/profile` | Manage account | `/api/users/profile`, etc. | Yes | **DELETE** |
| `/dashboard` | View tickets | `/api/bookings/user`, etc. | Yes | **DELETE** |
| `/admin` | Admin control panel | `/api/admin/*` | Admin | **MODIFY** (Remove Users tab, add Attendance/Comps) |
| `/booking-success` | Post-payment UI | `/api/generate-ticket` | No | **NEW PAGE** |
| `/retrieve-tickets` | Guest ticket lookup | `/api/bookings/retrieve` | No | **NEW PAGE** |
