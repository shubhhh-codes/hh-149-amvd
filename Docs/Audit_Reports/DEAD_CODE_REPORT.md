# Dead Code & Duplication Report

## 1. Unused Pages
After scanning the frontend routing and CTA buttons, no pages are completely orphaned. However, the following pages are marked as **Legacy / Potentially Unused** based on the project handoff documents indicating a move away from user authentication towards guest-only checkouts:
*   `pages/dashboard.tsx`
*   `pages/profile.tsx`

## 2. Unused APIs
The following API routes appear to be completely unused. A search across the repository for their endpoints (e.g., `/api/cms/*`) and `fetch` calls revealed zero consumers:
*   `pages/api/cms/404.ts`
*   `pages/api/cms/gallery.ts`
*   `pages/api/cms/perform.ts`
*   `pages/api/cms/policies.ts`
*   `pages/api/cms/profile.ts`
*   `pages/api/cms/shows.ts`

*Note: The frontend consumes data directly in `getServerSideProps` using MongoDB instead of these CMS APIs.*

## 3. Unused Components
The following React components are never imported or rendered anywhere in the application:
*   `components/Ticket3D.tsx`
*   `components/ParticleBackground.tsx`

## 4. Duplicate Utilities & Database Connectors
The repository contains duplicate logic for connecting to MongoDB. 

**Duplicate Files:**
*   `lib/mongodb.ts`
*   `utils/mongodb.ts`

**Usage Context:**
*   `lib/mongodb.ts` is the primary connector, exporting a cached `clientPromise` and used across the vast majority of API routes and `getServerSideProps` functions.
*   `utils/mongodb.ts` is a redundant connector exporting `connectToDatabase` and `disconnectFromDatabase` functions. It is only imported in two isolated places:
    *   `pages/api/users/change-password.ts`
    *   `pages/api/admin/reset-password.ts`

**Risk:** Maintaining two separate connection pools can lead to connection exhaustion, especially in serverless environments like Vercel. `utils/mongodb.ts` should be deprecated in favor of `lib/mongodb.ts`.
