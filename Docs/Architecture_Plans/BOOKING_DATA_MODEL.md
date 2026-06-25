# BOOKING DATA MODEL

This document defines the final collections for the guest-booking architecture. All user account-related collections and dependencies have been removed.

## 1. Collection: `bookings`

### Fields
- `_id`: ObjectId
- `bookingId`: String (Unique, Format: `HH-YYYY-XXXXXX`)
- `fullName`: String
- `email`: String
- `phone`: String
- `numberOfTickets`: Number
- `bookingType`: String (Enum: `'paid'`, `'complimentary'`)
- `status`: String (Enum: `'pending'`, `'approved'`, `'cancelled'`)
- `paymentId`: String (Reference to `payments._id`, Optional for complimentary)
- `attended`: Boolean (Default: `false`)
- `attendedAt`: Date (Optional)
- `createdAt`: Date
- `updatedAt`: Date

### Obsolete Fields (To be removed)
- `userId` (Customers no longer have accounts)
- `isComedianBooking` (Should be handled via a separate comedian application system)
- `comedianId` (Obsolete for ticket bookings)

### Indexes
- `bookingId` (Unique)
- `{ email: 1, phone: 1 }` (Compound index for fast ticket retrieval)
- `status` (For admin filtering and capacity calculations)

---

## 2. Collection: `payments`

### Fields
- `_id`: ObjectId
- `bookingId`: String (Reference to `bookings.bookingId`)
- `orderId`: String (Razorpay Order ID)
- `razorpayPaymentId`: String (Razorpay Payment ID)
- `amount`: Number (In smallest currency unit, e.g., paise)
- `status`: String (Enum: `'pending'`, `'completed'`, `'failed'`)
- `createdAt`: Date
- `updatedAt`: Date

### Obsolete Fields (To be removed)
- `userId`
- `user.email` / `user.username` (Data should live on the `bookings` collection)

### Indexes
- `orderId` (Unique)
- `bookingId`

---

## 3. Collection: `shows` (or `events`)

*Note: Currently managed via `homepage_content` CMS, but a formal schema is recommended for capacity management.*

### Fields
- `_id`: ObjectId
- `title`: String
- `date`: Date
- `time`: String
- `location`: String
- `ticketPrice`: Number
- `capacity`: Number (Default: 150)
- `status`: String (Enum: `'upcoming'`, `'completed'`, `'cancelled'`)
- `createdAt`: Date
- `updatedAt`: Date

---

## Relationships

1. **`bookings` → `payments`**: 1-to-1 relationship. A booking relies on a successful payment (if `bookingType` is `'paid'`). The `bookings.paymentId` references the payment record.
2. **`bookings` → `shows`**: Many-to-1 relationship. Multiple bookings belong to a single show. (If multiple shows are implemented, `bookings` must add a `showId` field).
3. **Admin Actions**: Admin has full CRUD over `bookings`, specifically toggling the `status` to `'cancelled'` and `attended` to `true`.
