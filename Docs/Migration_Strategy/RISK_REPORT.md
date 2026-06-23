# RISK REPORT

This document identifies potential risks associated with transitioning to the guest-booking architecture and provides mitigation strategies.

## 1. Security Risks
**Risk:** The `/api/bookings/retrieve` endpoint relies solely on Email and Phone Number. Anyone who knows a customer's email and phone could theoretically look up their booking history.
**Mitigation:** The retrieval endpoint should only return non-sensitive data (e.g., Event Name, Status, Number of Tickets). It should NOT expose the full unmasked credit card details or home addresses (which aren't collected anyway). The PDF generation endpoint must require the exact `bookingId`.

## 2. Data Loss Risks
**Risk:** The current `users` collection contains Comedian applications embedded within the user documents. Deleting customer accounts could inadvertently delete pending or approved comedian profiles.
**Mitigation:** Mandatory extraction of comedian profiles into a dedicated `comedians` collection *before* pruning the `users` collection. A strict backup must be verified before executing `$unset` or `drop` commands.

## 3. Migration Risks
**Risk:** Generating sequential `bookingId`s (HH-2026-000001) is susceptible to race conditions if multiple people book at the exact same millisecond.
**Mitigation:** Use MongoDB's atomic `findOneAndUpdate` on a dedicated `counters` collection to guarantee unique, sequential increments safely.

## 4. Production Deployment Risks
**Risk:** Deploying these sweeping changes all at once will break the current live booking flow if the database migration isn't perfectly synchronized with the Vercel deployment.
**Mitigation:** Enable maintenance mode on the site. Deploy the new code, run the database migration script, verify the new flow on staging, and then lift maintenance mode.

## 5. Vercel / Serverless Risks
**Risk:** Generating PDFs natively on the backend via serverless functions can sometimes exceed Vercel's execution time limits or memory limits, causing the auto-download feature to fail on the Success Page.
**Mitigation:** Keep PDF generation offloaded to the client-side (`html2canvas` / `jsPDF`) if possible, or ensure the serverless function is heavily optimized. If the PDF fails, ensure the user still visibly sees their `bookingId` on the screen so they aren't left empty-handed.

## 6. Razorpay Risks
**Risk:** If a user closes the window after paying on Razorpay but *before* `/api/payments/verify` is called, their booking will remain `pending` forever, though their card was charged.
**Mitigation:** Admin must have visibility into `pending` bookings and cross-reference them with the Razorpay dashboard. Ideally, a Razorpay Webhook should be implemented to catch these edge cases and auto-verify them asynchronously.
