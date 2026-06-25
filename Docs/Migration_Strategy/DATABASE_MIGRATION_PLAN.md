# DATABASE MIGRATION PLAN

This strategy outlines the step-by-step process required to migrate existing production data to the guest-booking architecture safely.

## 1. Pre-Migration Backups
* Take a snapshot of the entire MongoDB cluster.
* Specifically export the `users` collection to a `.json` archive. (CRITICAL: Comedian applications currently live inside the `users` collection. Do not drop `users` until comedian profiles have been safely extracted into a new `comedians` collection).

## 2. Migrating the `bookings` Collection
Currently, bookings rely on `userId` and lack a human-readable identifier.

**Fields to Add:**
* `bookingId`: String (e.g., `HH-2024-000001`)
* `bookingType`: String (`'paid'` or `'complimentary'`)
* `attended`: Boolean
* `attendedAt`: Date (Optional)

**Fields to Remove:**
* `userId`
* `isComedianBooking`
* `comedianId`

**Execution Steps (Script):**
1. Fetch all existing bookings.
2. Iterate through them, sequentially generating a `bookingId`.
3. Set `bookingType` to `'paid'` for all historical bookings.
4. Set `attended` to `false`.
5. Run an `$unset` command to remove `userId`, `isComedianBooking`, and `comedianId`.

## 3. Migrating the `payments` Collection
Currently, payments store the entire `user` object or `userId`.

**Fields to Add:**
* `bookingId`: String

**Fields to Remove:**
* `userId`
* `user` (nested object)

**Execution Steps (Script):**
1. Map payments to their respective bookings.
2. Update the payment document with the new `bookingId` string generated in step 2.
3. Run `$unset` to remove `userId` and `user`.

## 4. Addressing the `users` Collection
**Execution Steps:**
1. Isolate the `admin@humorshub.com` document. Ensure it is preserved.
2. Query all users where `isComedian: true`. Move these documents into a brand new `comedians` collection.
3. **DROP** or heavily prune the `users` collection, removing all standard customer accounts.

## 5. Rollback Plan
If migration fails mid-execution or bugs are discovered in production:
1. Restore the `users`, `bookings`, and `payments` collections from the pre-migration `.json` snapshot or cluster backup.
2. Revert the application deployment in Vercel to the previous commit prior to Phase 5 implementation.
