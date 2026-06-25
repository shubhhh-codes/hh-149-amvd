# 🎟️ Ticket Tier System — Feature Design Document

**Project:** The Humours Hub  
**Feature:** Multi-Tier Ticket Booking  
**Status:** Draft for Discussion  
**Author:** For AI Agent Review

---

## 1. Problem Statement

Currently, the `/book-tickets` page only supports booking individual tickets with a simple `+/-` quantity counter. There is no concept of ticket "types" — e.g., a Couple package or a Group of 4 bundle.

The goal is to upgrade the booking experience so users can select a **ticket tier** (Single, Couple, Group of 4) and optionally choose how many **units** of that tier they want. Each tier has its own price, which is fully controllable from the Admin CMS.

---

## 2. Ticket Tiers — Core Concept

A **Ticket Tier** is a named bundle that admits a fixed number of people at a specific price.

| Tier Name     | Key       | People Admitted | Price (default) |
|---------------|-----------|-----------------|-----------------|
| Single        | `single`  | 1 person        | ₹149            |
| Couple        | `couple`  | 2 people        | ₹249            |
| Group of 4    | `group4`  | 4 people        | ₹499            |

- **Price per tier** is configurable from the Admin CMS (under the Next Show Card).
- **Seat count per tier** is also configurable (e.g., change "Group of 4" to "Group of 5").
- **New tiers can be added or removed** from the CMS without any code changes.

---

## 3. Booking Flow (User Journey)

```
/book-tickets
    │
    ├── Step 1: Choose Ticket Type
    │     Cards displayed for each tier (Single / Couple / Group of 4)
    │     User taps/clicks to select one
    │
    ├── Step 2: Choose Quantity (within selected type)
    │     +/- counter for number of units of the selected tier
    │     e.g. 2x Couple = 4 people = ₹498
    │     Live price summary updates in real-time
    │
    ├── Step 3: Enter Contact Details
    │     Name, Email, Phone (same as current — no per-attendee info needed)
    │
    └── Step 4: Pay via Razorpay
          Amount = tier.price × quantity
          On success → /booking-success?id=...
```

---

## 4. UI Design — Ticket Type Selector (Cards)

The selector should replace the current bare "Number of Tickets" counter. Design should be premium and tactile, matching the site's dark aesthetic.

### 4.1 Card Layout Concept

Each tier is a **selectable card**. Cards are displayed in a horizontal row (or stacked on mobile).

```
┌─────────────────────────────────────────────────────────────┐
│  SELECT YOUR TICKET TYPE                                    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  🎤 Single   │  │  💑 Couple   │  │  👥 Group of 4   │  │
│  │              │  │              │  │                  │  │
│  │  1 Person    │  │  2 People    │  │  4 People        │  │
│  │              │  │              │  │                  │  │
│  │   ₹149       │  │   ₹249       │  │    ₹499          │  │
│  │              │  │              │  │                  │  │
│  │  [SELECTED]  │  │              │  │  Best Value 🔥   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Card States

- **Default:** Dark card with subtle border `border-white/10`
- **Hovered:** Slight border glow `border-white/30`
- **Selected:** Highlighted border + background accent, e.g., `border-primary-container bg-primary-container/10` with a checkmark icon
- **Badge:** Optional "Best Value" badge on Group tier (configurable)

### 4.3 Quantity Selector (After Tier Selection)

Below the card grid, a compact `+/-` counter appears:

```
 ┌────────────────────────────────────────────────────────┐
 │  HOW MANY?                                             │
 │                                                        │
 │    [ − ]   2   [ + ]   Couple Tickets                  │
 │                                                        │
 │    4 people total                                      │
 └────────────────────────────────────────────────────────┘
```

### 4.4 Price Summary Block

At the bottom of the selector, a live summary updates as the user interacts:

```
 ┌────────────────────────────────────────────────────────┐
 │  ORDER SUMMARY                                         │
 │                                                        │
 │  2 × Couple Ticket           ₹498                      │
 │  ─────────────────────────────────                     │
 │  Total (4 people admitted)   ₹498                      │
 └────────────────────────────────────────────────────────┘
```

---

## 5. Data Model Changes

### 5.1 Booking Document (MongoDB)

New fields added to the `bookings` collection:

```json
{
  "bookingId": "HH-XXXX",
  "fullName": "...",
  "email": "...",
  "phone": "...",

  "ticketType": "couple",           // tier key (single | couple | group4)
  "ticketTypeLabel": "Couple",      // human-readable, stored for audit
  "bookingUnits": 2,                // how many tier units were booked
  "numberOfTickets": 4,             // total people admitted (seats × units)
  "ticketPricePerUnit": 249,        // price per unit at time of booking (snapshot)
  "totalAmount": 498,               // total charged in ₹

  "status": "pending",
  "bookingType": "paid",
  "createdAt": "..."
}
```

> **Note:** `ticketPricePerUnit` is snapshotted at the time of booking so historical records remain accurate even if the admin changes the price later.

### 5.2 Payment Document (MongoDB)

```json
{
  "bookingId": "HH-XXXX",
  "amount": 49800,              // in paise (₹498 × 100)
  "ticketType": "couple",      // NEW field
  "ticketTypeLabel": "Couple", // NEW field
  "bookingUnits": 2,           // NEW field
  ...
}
```

---

## 6. CMS — Ticket Tier Management

The current single `Ticket Price` input will be replaced by a **Ticket Tiers** section inside the **Next Show Card** editor.

### 6.1 CMS Tier Editor UI (Admin Portal)

```
 TICKET TIERS
 ─────────────────────────────────────────────────────────────
 │ LABEL         │ PRICE (₹)  │ SEATS  │ BADGE TEXT │ DELETE │
 ─────────────────────────────────────────────────────────────
 │ Single        │   149      │  1     │            │  [×]   │
 │ Couple        │   249      │  2     │            │  [×]   │
 │ Group of 4    │   499      │  4     │ Best Value  │  [×]   │
 ─────────────────────────────────────────────────────────────
 [ + Add Tier ]
```

- Admin can edit label, price, seat count, and optional badge text.
- Admin can delete a tier or add new ones.
- Tiers are saved in `metadata.ticketTiers[]` on the `next_show` document.

### 6.2 Data Structure in DB (`metadata.ticketTiers`)

```json
{
  "ticketTiers": [
    { "key": "single",  "label": "Single",      "price": 149, "seats": 1, "badge": "" },
    { "key": "couple",  "label": "Couple",      "price": 249, "seats": 2, "badge": "" },
    { "key": "group4",  "label": "Group of 4",  "price": 499, "seats": 4, "badge": "Best Value" }
  ]
}
```

---

## 7. Backend API Changes Summary

| API File | Change |
|---|---|
| `lib/getTicketTiers.ts` | **New file.** Replaces `getTicketPrice.ts`. Returns full `TicketTier[]` array from DB with fallbacks. |
| `pages/api/payments/create-order.ts` | Accept `ticketTypeKey` + `bookingUnits`. Look up tier price. Calculate `amount = tier.price × units × 100` |
| `pages/api/payments/verify.ts` | Accept `ticketTypeKey` + `bookingUnits`. Snapshot price in payment record. |
| `pages/api/bookings/create.ts` | Accept `ticketType`, `bookingUnits`. Calculate + store `numberOfTickets`, `totalAmount`, `ticketPricePerUnit`. |

---

## 8. Admin Dashboard Changes Summary

### Bookings Tab — Booking Card
- Add a `TICKET TYPE` field showing e.g. `COUPLE × 2 (4 people)`
- The `TICKETS` field already shows total people

### Payments Tab — Payment Card  
- Show `Couple × 2` beside the payment amount

---

## 9. Open Design Questions (For Discussion)

1. **UI Component Style:** Should the tier cards be vertical (stacked on mobile, side-by-side on desktop) or always horizontal scrollable? → *To be decided with Stitch.ai redesign*
2. **Max quantity per tier:** Should there be a max, e.g., max 5 Couple tickets per booking?
3. **Complimentary bookings:** Should the admin's complimentary booking creation also support ticket tiers, or stay as a simple count?
4. **Capacity counting:** Should each tier's `seats` count toward the same venue capacity pool, or should tiers be tracked separately? *(Currently: one shared pool)*
5. **Icon per tier:** Use emoji (🎤, 💑, 👥) or custom icons (Material Symbols)?

---

## 10. Files Changed (Full List)

```
lib/
  getTicketTiers.ts              [NEW — replaces getTicketPrice.ts]

pages/
  book-tickets.tsx               [MODIFY]
  index.tsx                      [MODIFY — display tier prices in hero/marquee]

pages/api/
  bookings/create.ts             [MODIFY]
  payments/create-order.ts       [MODIFY]
  payments/verify.ts             [MODIFY]

components/admin/
  SiteCMS.tsx                    [MODIFY — Ticket Tiers editor]

pages/admin/
  index.tsx                      [MODIFY — bookings + payments tab display]
```
