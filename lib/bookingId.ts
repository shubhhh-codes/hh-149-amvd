/**
 * Generates a human-friendly, sequential booking ID.
 * Format: HH-YYYY-XXXXXX (e.g., HH-2026-000001)
 * Uses MongoDB atomic findOneAndUpdate to prevent race conditions.
 */
import clientPromise from './mongodb';

export async function generateBookingId(): Promise<string> {
  const client = await clientPromise;
  const db = client.db();
  const year = new Date().getFullYear();

  const result = await db.collection('counters').findOneAndUpdate(
    { _id: `bookingId_${year}` as any },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  const seq = result?.seq || 1;
  const paddedSeq = String(seq).padStart(6, '0');

  return `HH-${year}-${paddedSeq}`;
}
