# Repo Scan Report

## 1. Project Overview

**Project Purpose:** A comedy event booking platform for Humors Hub (humors-hub). It handles event browsing, performer applications, admin operations, and ticket bookings.
**Technology Stack:** Next.js (14.2.15), React (18.2.0), TypeScript, Tailwind CSS, MongoDB (Native Driver 7.3.0).
**Router Architecture:** Pages Router (`pages/` directory).
**Authentication Architecture:** NextAuth for session management, supplemented with Next.js Middleware (`middleware.ts`) for route protection based on role/email.
**Database Architecture:** MongoDB with Native Driver implementation (no Mongoose/ORM). Direct collection access (`lib/mongodb.ts` and `utils/mongodb.ts`).
**Payment Architecture:** Razorpay Integration for online ticket booking (Order creation, Checkout, Signature verification).
**Deployment Architecture:** Vercel (configured via `vercel.json` with BOM1 region and custom security headers).

---

## 2. Repository Structure

### High-Level Map
* `pages/` - Contains all frontend page components and API routes.
* `pages/api/` - Backend API endpoints.
* `components/` - Reusable React components (Navbar, Footer, Tickets, etc.).
* `lib/` & `utils/` - Shared backend logic, MongoDB connection pooling and helpers.
* `scripts/` - Contains `init-db.ts` for database index creation.
* `public/` - Static assets.
* `types/` - TypeScript type definitions.
* `next.config.js` / `vercel.json` - Deployment and application configuration.
* `middleware.ts` - Next.js edge middleware for route protection.
* `PROJECT_HANDOFF.md` - Important documentation mapping intended flows and design system rules.

### Observations
* **Dead Code/Duplicate Logic:** There are two separate files for MongoDB connections (`lib/mongodb.ts` and `utils/mongodb.ts`) that handle connection pooling slightly differently.
* **Legacy Code Paths:** The project handoff indicates NextAuth is meant to be phased out for users, but it is currently actively used (`[...nextauth].ts`).
* **Unused/Deprecating Folders:** The presence of `models` was missing despite mention in `PROJECT_HANDOFF.md` because the app uses the MongoDB Native Driver directly rather than Mongoose schemas.

---

## 3. Frontend → Backend Flow Analysis

### Homepage
* **Actions:** Displays next show details, performer lists, and gallery photos.
* **API Calls:** Fetches data directly in `getServerSideProps` via MongoDB queries to `users` and `homepage_content`.
* **Redirects:** CTA buttons point to `/book-tickets` or `/perform-with-us`.

### Booking Flow
* **Entry Point:** `/book-tickets`.
* **Validation/API Calls:** Checks `initializeRazorpay()`. Calls `/api/bookings/create` or `/api/payments/create-order` to initialize transaction.
* **Payment Flow:** Razorpay modal triggers. On success, returns payment ID and signature.
* **Success/Failure Flow:** Verification via `/api/payments/verify`. If signature matches, updates `bookings` and `payments` collections to approved status.

### Authentication Flow
* **Login/Logout:** Handled via NextAuth (`pages/auth/login`, `pages/auth/signup`).
* **Protected Routes:** `middleware.ts` guards `/dashboard`, `/profile`, `/admin`, and nested paths.

### Admin Flow
* **Authentication:** Hardcoded check in `middleware.ts` ensuring `session.email === 'admin@humorshub.com'`.
* **Admin Pages:** Served via `pages/admin/index.tsx`.
* **Admin APIs:** Hosted under `/api/admin/*` for managing bookings, CMS content, shows, and comedians.

---

## 4. Button & Redirect Audit

| Button | Location | Expected | Actual | Status |
| ------ | -------- | -------- | ------ | ------ |
| Book Tickets → | Homepage CTA | Route to `/book-tickets` | Routes to `/book-tickets` | Active |
| Pay & Book Tickets | `/book-tickets` | Open Razorpay Modal | Opens Razorpay Modal | Active |
| Admin Access | Various / Login | Route to `/admin` | Routes to `/admin` | Active |
| Perform With Us | Homepage/Nav | Route to `/perform-with-us` | Routes to `/perform-with-us` | Active |

**Note:** Legacy Auth pages (`/dashboard`, `/profile`) still exist and are protected by middleware, though handoff docs suggest they might be deprecated.

---

## 5. API Audit

| Endpoint | Method | Used By | Auth | Status |
| -------- | ------ | ------- | ---- | ------ |
| `/api/auth/[...nextauth]` | POST/GET | Login/Session | None | Active |
| `/api/payments/create-order` | POST | `/book-tickets` | Required | Active |
| `/api/payments/verify` | POST | Razorpay Callback | Required | Active |
| `/api/bookings/create` | POST | `/book-tickets` | Required | Active |
| `/api/admin/bookings` | GET | Admin Dashboard | Admin | Active |
| `/api/admin/users` | GET | Admin Dashboard | Admin | Active |
| `/api/admin/cms/content` | POST | Admin Gallery/Shows | Admin | Active |

**Detect Risks:** The admin endpoints require careful session checking. The hardcoded admin check in `middleware.ts` is robust for page routing but APIs need independent verification.

---

## 6. Frontend API Consumer Audit

| Component | API | Status | Notes |
| --------- | --- | ------ | ----- |
| `book-tickets.tsx` | `/api/payments/verify` | Active | Uses standard `fetch` with JSON payload |
| `book-tickets.tsx` | `/api/payments/create-order` | Active | Razorpay order initialization |
| `shows.tsx` | DB Direct | Active | Uses `getServerSideProps` direct DB access |

---

## 7. Authentication Audit

* **NextAuth Usage:** Fully implemented via `[...nextauth].ts` with Credentials/JWT.
* **Session Storage:** JWT based.
* **Middleware Protection:** `middleware.ts` effectively blocks `/dashboard`, `/profile`, and `/admin`.
* **Admin Routes:** Hardcoded strictly to `admin@humorshub.com`.
* **Detect:** Inconsistent auth architecture (Admin uses a hardcoded email while standard users use NextAuth, which is slated for removal based on handoff notes).

---

## 8. Database Audit

* **Driver:** MongoDB Native Driver (Mongoose is NOT used).
* **Connections:** Shared client connection caching implemented in both `lib/mongodb.ts` and `utils/mongodb.ts`.
* **Collections:**
  * `users`
  * `bookings`
  * `payments`
  * `homepage_content`
* **Detect:** Lack of strict schema enforcement at the application layer since Native Driver is used. Validation happens ad-hoc before `.insertOne()` or `.updateOne()`.

---

## 9. Payment System Audit

* **Integration:** Razorpay
* **Create Order:** Handled via `/api/payments/create-order`.
* **Verify Payment:** Handled via `/api/payments/verify` validating the HMAC SHA256 signature using `crypto.createHmac`.
* **Detect:** Security is well-implemented with HMAC signature verification. Environment variables (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) are correctly strictly checked before initialization.

---

## 10. Environment Variable Audit

| Variable | Used In | Required | Missing? |
| -------- | ------- | -------- | -------- |
| `MONGODB_URI` | `lib/mongodb.ts` | Yes | Validated in code |
| `NEXTAUTH_SECRET` | NextAuth config | Yes | Required by NextAuth |
| `RAZORPAY_KEY_ID` | `create-order.ts`, Checkout | Yes | Validated in code |
| `RAZORPAY_KEY_SECRET` | `verify.ts`, SDK Init | Yes | Validated in code |

---

## 11. Build & Deployment Audit

* **Vercel Config:** Secure headers (CSP, X-Frame-Options, XSS Protection) are tightly configured in `vercel.json` and `next.config.js`.
* **CSP Headers:** Specifically allow Razorpay domains, Google APIs, and Vercel domains.
* **TypeScript Issues:** Handled by `--noEmit` in build scripts. `tsconfig.json` runs in strict mode.

---

## 12. Security Audit

* **Critical:** Hardcoded admin email in `middleware.ts` (`admin@humorshub.com`) means if a user registers with this email via standard signup, they might gain admin access unless prevented at the DB/auth layer.
* **High:** Lack of ORM/schema validation (using raw MongoDB driver) increases the risk of bad data or NoSQL injection if inputs are not properly sanitized.
* **Medium:** Duplicate MongoDB connection files (`lib` vs `utils`) could lead to connection pooling exhaustion if both are used concurrently in different routes.
* **Low:** `pages/api/` endpoints need explicit verification to ensure they repeat the admin-check that `middleware.ts` performs.

---

## 13. Reproducible Issues

### Issue: Duplicate MongoDB Connectors
* **Location:** `lib/mongodb.ts` vs `utils/mongodb.ts`
* **Root Cause:** Refactoring or merging of different codebases.
* **Severity:** Medium
* **Suggested Fix:** Standardize on a single file (`lib/mongodb.ts`) for all database connections to ensure a single connection pool.

### Issue: Hardcoded Admin Authentication
* **Location:** `middleware.ts`
* **Root Cause:** Quick implementation of admin role.
* **Severity:** Critical
* **Suggested Fix:** Implement a database-backed `role` field on the user document (e.g., `role: 'ADMIN'`) instead of relying on a hardcoded email string.

---

## 14. Final Summary

### Critical Issues
* Admin authorization is solely dependent on a hardcoded email address in middleware.

### High Priority Issues
* Two different `mongodb.ts` files managing connection pooling.

### Medium Priority Issues
* Auth architecture drift (NextAuth exists alongside plans to move to guest-only bookings).

### Technical Debt Items
* Switch to a formal validation library (like Zod) since Mongoose schemas are not present to validate data before DB insertion.

### Production Readiness Score
* **Architecture:** 7/10
* **Security:** 6/10
* **Authentication:** 6/10
* **Database:** 7/10
* **API Layer:** 8/10
* **Frontend Integration:** 8/10
* **Deployment:** 9/10 (Excellent Vercel and CSP setup)
