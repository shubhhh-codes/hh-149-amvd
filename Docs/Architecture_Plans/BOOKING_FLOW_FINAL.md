# FINAL BOOKING FLOW

This document maps the exact sequence of events for a guest completing a booking, ensuring a seamless experience without authentication.

## Step 1: User Initiation (Frontend)
1. User navigates to Homepage or `/shows`.
2. User clicks **"Book Tickets"**.
3. User is directed to `/book-tickets` and presented with a guest form.
4. User inputs: `FullName`, `Email`, `Phone`, `NumberOfTickets`.
5. User clicks **"Pay Now"**.

## Step 2: Create Pending Booking (API)
1. Frontend posts payload to `/api/bookings/create`.
2. Backend validates capacity limits (warning only, no hard block).
3. Backend generates a unique ID (e.g., `HH-2026-000001`).
4. **Database Write (`bookings`)**:
   - `bookingId: 'HH-2026-000001'`
   - `fullName`, `email`, `phone`, `numberOfTickets`
   - `bookingType: 'paid'`
   - `status: 'pending'`
   - `attended: false`
5. Backend returns `bookingId` to Frontend.

## Step 3: Payment Initialization (API)
1. Frontend calls `/api/payments/create-order` passing the total amount (derived from `numberOfTickets * 149`).
2. Backend initializes a Razorpay order.
3. Backend returns Razorpay `order_id` to Frontend.

## Step 4: Razorpay Execution (Frontend/Client)
1. Frontend mounts the Razorpay checkout script using `order_id`.
2. User enters payment details inside Razorpay modal.
3. Upon success, Razorpay yields `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.

## Step 5: Payment Verification (API)
1. Frontend posts Razorpay credentials + `bookingId` to `/api/payments/verify`.
2. Backend verifies cryptographic signature.
3. **Database Write (`payments`)**:
   - Inserts new payment document with `bookingId`, `orderId`, `amount`, `status: 'completed'`.
4. **Database Update (`bookings`)**:
   - Updates booking `HH-2026-000001` setting `status: 'approved'` and attaching the `paymentId`.
5. Backend returns success.

## Step 6: Success Page & PDF Generation (Frontend/API)
1. Frontend redirects user to `/booking-success?id=HH-2026-000001`.
2. Success page immediately fires a request to `/api/generate-ticket?id=HH-2026-000001`.
3. Backend generates a PDF. The PDF contains the `bookingId` and an informational QR Code.
4. The PDF automatically downloads on the user's device.
5. The UI prominently displays: *"Your Booking ID is HH-2026-000001. Please save this for your records."*

## Step 7: Ticket Retrieval (Future Interaction)
1. User forgets their PDF and navigates to `/retrieve-tickets`.
2. User enters `Email` and `Phone`.
3. Frontend calls `/api/bookings/retrieve`.
4. Backend finds all bookings matching the exact email/phone pair.
5. Frontend displays Active Bookings with a "Download" button.
6. Frontend displays Cancelled Bookings as read-only.

## Error States
* **Capacity Full**: Show visual warning before payment initiation. Let user proceed if they choose.
* **Payment Failure / Cancellation**: Booking remains in `pending` state indefinitely.
* **Network Drop on Success**: If Razorpay succeeds but verify fails, admin must reconcile manually, or user can retry verify if Razorpay webhook logic is implemented.
