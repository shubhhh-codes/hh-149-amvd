# The Humours Hub - Technical & Product Handoff Report

This document serves as the single source of truth for The Humours Hub web application. It is designed to be exhaustively detailed so that any developer or AI coding assistant (Claude, ChatGPT, etc.) can understand the full system architecture, user flows, database schema, and product requirements without needing to ask follow-up questions.

---

## ━━━ SECTION 1: PROJECT IDENTITY ━━━

- **Project Name:** The Humours Hub
- **Live URL:** `https://thehumourshub.com` *(Update if different)*
- **Staging URL:** `https://staging.thehumourshub.com` *(Update if different)*
- **Tech Stack:**
  - **Framework:** Next.js (Pages Router)
  - **Language:** TypeScript
  - **Styling:** Tailwind CSS (Vanilla CSS for base styles)
  - **Database:** MongoDB (via Mongoose)
  - **Payment Gateway:** Razorpay
  - **Media Storage:** Cloudinary
  - **Authentication:** Custom session token approach for Admin; Guest access for users (NextAuth to be phased out for users).
- **Repository Structure:**
  - `/pages` — Next.js pages routing (e.g., `index.tsx`, `shows.tsx`, `/api/...`)
  - `/components` — Reusable React components (Navbar, Footer, ShowCard, etc.)
  - `/lib` / `/utils` — Utility functions, DB connection, Razorpay helpers
  - `/models` — Mongoose database schemas
  - `/public` — Static assets (images, fonts)
  - `/styles` — Global CSS (`globals.css`)
- **Deployment Platform:** Vercel
- **Environment Variables Needed (Names Only):**
  - `MONGODB_URI`
  - `NEXTAUTH_SECRET`
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `ADMIN_PASSWORD`
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `WHATSAPP_API_KEY`

---

## ━━━ SECTION 2: DESIGN SYSTEM ━━━

COLORS:
- Background: #0A0A0A
- Card Surface: #141414
- Primary Accent: #FF6B1A (orange — used sparingly)
- Border: rgba(255,255,255,0.07)
- Text Primary: #FFFFFF at 90% opacity
- Text Secondary: #FFFFFF at 45% opacity
- Success: #22c55e
- Danger: #ef4444
- Pending: #FF6B1A

TYPOGRAPHY:
- Headings: Hind (Bold 700, SemiBold 600)
  Supports Hindi + Latin in same render
- Body: DM Sans (Regular 400, Medium 500)
- Labels: Hind Bold, all-caps, 
  letter-spacing 0.1em

BUTTONS:
- Primary: #FF6B1A fill, #0A0A0A text, 
  rounded-full
- Secondary: transparent, 
  1px rgba(255,255,255,0.2) border, 
  white text, rounded-full

CARDS:
- Background: #141414
- Border: 1px rgba(255,255,255,0.07)
- Border radius: 4px or 8px max
- Accent left border: 4px #FF6B1A

INPUTS:
- Background: #1c1b1b
- Border: 1px rgba(255,255,255,0.1)
- Focus ring: #FF6B1A
- Text: white

LANGUAGE POLICY:
- All UI, buttons, labels, nav: English only
- Hindi permitted only as single flavour 
  phrase inside body copy paragraphs
- Never in headings, CTAs, or form fields

ANIMATIONS:
- Scroll entry: translateY(20px) to 0,
  opacity 0 to 1, 400ms ease-out
- Stagger siblings: 80ms delay each
- Card hover: translateY(-4px), 200ms
- No parallax, no cursor effects,
  no looping animations
---

## ━━━ SECTION 3: USER FLOWS ━━━

### FLOW 1 — TICKET PURCHASE (GUEST, NO LOGIN)
- **Step 1:** User lands on the homepage (`/`).
- **Step 2:** User clicks **"Book Tickets →"**.
- **Step 3:** User lands on the `/book-tickets` page.
- **Step 4:** System checks the Admin Toggle Setting. User sees either a booking form OR a BookMyShow redirect.
- **Step 5A (BookMyShow mode):** User is redirected to the external BookMyShow URL.
- **Step 5B (Own Website mode):** User fills out the booking form: `Full Name`, `Phone`, `Number of Tickets` (max 5). `Total Amount` is auto-calculated at ₹149/ticket.
- **Step 6B:** User clicks **"Pay & Book Tickets →"**.
- **Step 7B:** Razorpay checkout modal opens.
- **Step 8B:** Payment success → The booking is verified and saved to the database.
- **Step 9B:** Confirmation message/modal is shown on the page (no redirect to a dashboard, user is a guest).
- **Step 10B:** WhatsApp/SMS confirmation is sent.

### FLOW 2 — ADMIN LOGIN
- **Step 1:** Admin navigates to `/admin`.
- **Step 2:** Admin sees the password entry screen.
- **Step 3:** Admin enters the master admin password.
- **Step 4:** If correct → Admin is granted access and enters the admin dashboard.
- **Step 5:** If incorrect → Error message is shown; admin stays on the password screen.
- **Step 6:** Session persists securely for X hours.
- **Step 7:** Logout clears the session and returns the admin to the password screen.

### FLOW 3 — ADMIN BOOKING TOGGLE
- **Step 1:** Admin is in the Shows Manager view (`/admin/shows`).
- **Step 2:** Admin sees the **"BOOKING MODE"** toggle card.
- **Step 3:** Admin selects either **"BookMyShow"** OR **"Own Website (Razorpay)"**.
- **Step 4:** The change is saved to the database immediately.
- **Step 5:** Homepage and `/book-tickets` page reflect the new mode in real-time.
- **Step 6:**
  - *In BookMyShow mode:* Homepage CTA opens the BMS URL in a new tab; `/book-tickets` shows a BMS redirect page.
  - *In Own Website mode:* Homepage CTA goes to `/book-tickets`; `/book-tickets` shows the Razorpay checkout form.

### FLOW 4 — PERFORMER APPLICATION
- **Step 1:** User visits `/perform-with-us`.
- **Step 2:** User fills out the form: `Name`, `City`, `Art Form`, `Instagram/YouTube link`, `Bio`.
- **Step 3:** User clicks **"Send Application →"**.
- **Step 4:** Data is saved to the database.
- **Step 5:** Admin sees the application in the Comedian Apps section of the admin panel.
- **Step 6:** Admin clicks Approve or Decline.
- **Step 7:** *(Future)* An automated notification is sent to the applicant.

### FLOW 5 — ADMIN GALLERY MANAGEMENT
- **Step 1:** Admin goes to the Gallery Manager (`/admin/gallery`).
- **Step 2:** Admin uploads photos (drag/drop or browse) to Cloudinary.
- **Step 3:** Admin sets a category for each photo: `On Stage`, `The Crowd`, or `After The Show`.
- **Step 4:** Admin optionally marks specific photos as **"Show on Homepage"**.
- **Step 5:** The public `/gallery` page fetches these photos from the DB and displays them.
- **Step 6:** Filter buttons on the gallery page dynamically filter photos by category.

### FLOW 6 — ADMIN SHOWS MANAGEMENT
- **Step 1:** Admin goes to the Shows Manager (`/admin/shows`).
- **Step 2:** Admin clicks **"+ Add New Show"**.
- **Step 3:** Admin fills out the form: `Title`, `Date`, `Time`, `Venue`, `Seats`, `Price`, `BMS URL` (optional), `Poster image`, and `Status` (Published/Draft).
- **Step 4:** Admin saves → The show appears on the public `/shows` page.
- **Step 5:** Admin can edit or delete shows.
- **Step 6:** Past shows automatically move to the "Past Shows" section based on the current date.

---

## ━━━ SECTION 4: DATABASE SCHEMA ━━━

All collections are modeled for MongoDB.

**`BOOKINGS` Collection**
- `id` (ObjectId)
- `customerName` (String)
- `customerPhone` (String)
- `customerEmail` (String, optional)
- `ticketCount` (Number, max 5)
- `totalAmount` (Number)
- `razorpayOrderId` (String)
- `razorpayPaymentId` (String)
- `status` (String: `pending` | `approved` | `declined`)
- `createdAt` (Date)
- `updatedAt` (Date)

**`SHOWS` Collection**
- `id` (ObjectId)
- `title` (String)
- `date` (Date)
- `time` (String)
- `venueName` (String)
- `venueAddress` (String)
- `totalSeats` (Number)
- `seatsRemaining` (Number)
- `pricePerTicket` (Number)
- `bookMyShowUrl` (String, optional)
- `posterUrl` (String)
- `status` (String: `published` | `draft`)
- `isPast` (Boolean)
- `createdAt` (Date)
- `updatedAt` (Date)

**`GALLERY` Collection**
- `id` (ObjectId)
- `imageUrl` (String)
- `category` (String: `on-stage` | `crowd` | `after-show`)
- `showName` (String, optional)
- `showDate` (Date, optional)
- `showOnHomepage` (Boolean)
- `uploadedAt` (Date)

**`PERFORMER_APPLICATIONS` Collection**
- `id` (ObjectId)
- `name` (String)
- `city` (String)
- `artForm` (String)
- `instagramUrl` (String, optional)
- `youtubeUrl` (String, optional)
- `bio` (String)
- `status` (String: `pending` | `approved` | `declined`)
- `appliedAt` (Date)
- `reviewedAt` (Date, optional)

**`SETTINGS` Collection (Single Document)**
- `id` (ObjectId)
- `bookingMode` (String: `bookmyshow` | `razorpay`)
- `bookMyShowUrl` (String)
- `updatedAt` (Date)

**`ADMIN_SESSION` Collection**
- `id` (ObjectId)
- `sessionToken` (String)
- `createdAt` (Date)
- `expiresAt` (Date)

---

## ━━━ SECTION 5: API ROUTES NEEDED ━━━

### PUBLIC ROUTES (No Auth)
- `GET  /api/shows` — Fetch published shows
- `GET  /api/gallery` — Fetch gallery images
- `GET  /api/settings/booking-mode` — Get current booking mode
- `POST /api/bookings` — Create new booking
- `POST /api/razorpay/create-order` — Init Razorpay payment
- `POST /api/razorpay/verify` — Verify payment signature
- `POST /api/perform` — Submit performer application

### ADMIN ROUTES (Password Protected)
- `POST /api/admin/login` — Verify password, return session token
- `POST /api/admin/logout` — Clear session
- `GET  /api/admin/bookings` — All bookings
- `PUT  /api/admin/bookings/:id` — Update booking status
- `GET  /api/admin/shows` — All shows
- `POST /api/admin/shows` — Create show
- `PUT  /api/admin/shows/:id` — Update show
- `DELETE /api/admin/shows/:id` — Delete show
- `GET  /api/admin/gallery` — All images
- `POST /api/admin/gallery` — Upload image
- `PUT  /api/admin/gallery/:id` — Update category
- `DELETE /api/admin/gallery/:id` — Delete image
- `GET  /api/admin/applications` — All applications
- `PUT  /api/admin/applications/:id` — Approve/decline application
- `GET  /api/admin/settings` — Get all settings
- `PUT  /api/admin/settings` — Update settings (booking mode toggle)
- `GET  /api/admin/payments` — All payments
- `GET  /api/admin/stats` — Dashboard stats

---

## ━━━ SECTION 6: PAGES & COMPONENTS ━━━

### Pages
- `/` **(homepage)**
  - *Needs:* Booking mode, next show details, performers list, homepage gallery photos
- `/shows`
  - *Needs:* All published shows (upcoming + past)
- `/gallery`
  - *Needs:* All gallery images with categories
- `/about`
  - *Needs:* Static content, no API needed
- `/perform-with-us`
  - *Needs:* POST to `/api/perform`
- `/book-tickets`
  - *Needs:* Booking mode setting, current show details for Razorpay
- `/admin`
  - *Needs:* All admin API routes
- `/admin/password`
  - *Needs:* Admin entry screen logic

---

## ━━━ SECTION 7: COMPONENTS TO BUILD ━━━

Reusable components needed:
- `Navbar` (with booking mode awareness)
- `Footer`
- `ShowCard` (upcoming)
- `PastShowCard`
- `GalleryGrid` (with filter)
- `PerformerCard`
- `BookingForm` (guest, Razorpay)
- `AdminSidebar`
- `AdminStatsRow`
- `AdminTable` (reusable)
- `BookingToggle`
- `ImageUploader`
- `StatusBadge`
- `ConfirmationModal`

---

## ━━━ SECTION 8: ENVIRONMENT VARIABLES ━━━

```env
MONGODB_URI
NEXTAUTH_SECRET
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
ADMIN_PASSWORD
NEXT_PUBLIC_RAZORPAY_KEY_ID
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
WHATSAPP_API_KEY
```

---

## ━━━ SECTION 9: KNOWN ISSUES TO FIX ━━━

1. **`book-tickets.tsx`:** Session gate blocks guests.
2. **`book-tickets.tsx`:** Comedian registration is inside the ticket page — this is wrong.
3. **`_app.tsx`:** Toast theme is "light" but needs to be "dark".
4. **`policies.tsx`:** Personal Gmail is exposed publicly.
5. **`policies.tsx`:** Says "Junagadh" not Ahmedabad.
6. **`policies.tsx`:** "Humors" missing the U.
7. **`index.tsx`:** Hardcoded expired event date.
8. **`index.tsx`:** `Math.random()` hydration bug.
9. **`index.tsx`:** Session-gated CTAs.
10. **`dashboard.tsx`:** Tied to auth being removed.
11. **`profile.tsx`:** Tied to auth being removed.
12. **Auth pages:** Mostly redundant now.
13. **`404.tsx`:** Purple theme, needs dark redesign.
14. **All old pages:** Purple theme needs replacement.

---

## ━━━ SECTION 10: IMPLEMENTATION ORDER ━━━

Recommended order for a developer:

**Phase 1 — Foundation:**
1. Update `tailwind.config` with new design tokens.
2. Update `globals.css` with dark base styles.
3. Rebuild `Navbar` component.
4. Rebuild `Footer` component.

**Phase 2 — Fix existing broken pages:**
5. Fix `book-tickets.tsx` (remove auth, add guest form).
6. Fix `_app.tsx` (dark toast).
7. Fix `policies.tsx` (content issues).
8. Rebuild `404.tsx` (dark design).
9. Remove/archive dashboard, profile, login, signup pages.

**Phase 3 — New pages:**
10. Build `/shows` page.
11. Build `/gallery` page.
12. `/about` and `/perform-with-us` are already done.

**Phase 4 — Admin panel:**
13. Build `/admin/password` screen.
14. Build admin layout with sidebar.
15. Build each admin view one by one.
16. Wire all admin API routes.

**Phase 5 — Dynamic data:**
17. Wire `/shows` to DB.
18. Wire `/gallery` to DB.
19. Wire booking toggle to DB.
20. Wire homepage to DB.

**Phase 6 — Payments:**
21. Fix Razorpay guest flow.
22. Test end-to-end.
