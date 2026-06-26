/**
 * @copyright (c) 2024 - Present
 * @author github.com/shubhhh-codes
 * @license MIT
 *
 * Admin-only endpoint for reading and updating ticket tier configuration.
 * Authentication is required for BOTH GET and POST — this data is internal
 * to the admin panel and must never be publicly readable or writable.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import clientPromise from '../../../../lib/mongodb';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TierInput {
  key: string;
  name: string;
  label: string;
  price: number;
  seats: number;
  badge: string | null;
  displayOrder: number;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

/**
 * Validates a single tier object.
 * Returns null on success, or an error message string on failure.
 */
function validateTier(tier: unknown, index: number): string | null {
  if (typeof tier !== 'object' || tier === null || Array.isArray(tier)) {
    return `Tier at index ${index} is not a valid object`;
  }

  const t = tier as Record<string, unknown>;

  if (typeof t.key !== 'string' || t.key.trim() === '' || t.key.length > 50) {
    return `Tier[${index}].key must be a non-empty string (max 50 chars)`;
  }
  if (typeof t.name !== 'string' || t.name.trim() === '' || t.name.length > 100) {
    return `Tier[${index}].name must be a non-empty string (max 100 chars)`;
  }
  if (typeof t.label !== 'string' || t.label.trim() === '' || t.label.length > 50) {
    return `Tier[${index}].label must be a non-empty string (max 50 chars)`;
  }

  const price = Number(t.price);
  if (!Number.isFinite(price) || price <= 0) {
    return `Tier[${index}].price must be a positive number (got: ${t.price})`;
  }

  const seats = Number(t.seats);
  if (!Number.isInteger(seats) || seats < 1) {
    return `Tier[${index}].seats must be a positive integer (got: ${t.seats})`;
  }

  const displayOrder = Number(t.displayOrder);
  if (!Number.isInteger(displayOrder) || displayOrder < 1) {
    return `Tier[${index}].displayOrder must be a positive integer (got: ${t.displayOrder})`;
  }

  // badge is allowed to be null or a non-empty string
  if (t.badge !== null && (typeof t.badge !== 'string' || t.badge.trim() === '' || t.badge.length > 100)) {
    return `Tier[${index}].badge must be null or a non-empty string (max 100 chars)`;
  }

  return null;
}

/**
 * Sanitizes a single tier by picking only known fields.
 * Prevents arbitrary object injection into MongoDB.
 */
function sanitizeTier(tier: Record<string, unknown>): TierInput {
  return {
    key:          String(tier.key).trim(),
    name:         String(tier.name).trim(),
    label:        String(tier.label).trim(),
    price:        Number(tier.price),
    seats:        Number(tier.seats),
    displayOrder: Number(tier.displayOrder),
    badge:        tier.badge === null ? null : String(tier.badge).trim(),
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

import { withErrorHandler } from '../../../../lib/withErrorHandler';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ── 1. Method guard ────────────────────────────────────────────────────────
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // ── 2. Authentication ──────────────────────────────────────────────────────
  // Identical pattern used by every other admin route in this repository.
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (session.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  // ── 3. Database ────────────────────────────────────────────────────────────
  try {
    const client = await clientPromise;
    const db = client.db();

    // ── GET ─────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const settings = await db.collection('settings').findOne({ type: 'ticket-tiers' });

      const tiers: TierInput[] = settings?.tiers ?? [
        { key: 'solo',  name: 'Solo Pass',  label: 'SOLO',  price: 499,  seats: 1, badge: null,           displayOrder: 1 },
        { key: 'duo',   name: 'Duo Pass',   label: 'DUO',   price: 899,  seats: 2, badge: 'MOST POPULAR', displayOrder: 2 },
        { key: 'squad', name: 'Squad Pass', label: 'SQUAD', price: 1599, seats: 4, badge: null,           displayOrder: 3 },
      ];

      return res.status(200).json({
        tiers,
        venue: settings?.venue || 'The Humours Hub, Ahmedabad',
        date:  settings?.date  || 'Saturday',
        time:  settings?.time  || '8:30 PM',
      });
    }

    // ── POST ────────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const { tiers, venue, date, time } = req.body;

      // ── Validate top-level fields ────────────────────────────────────────
      if (!Array.isArray(tiers) || tiers.length === 0 || tiers.length > 20) {
        return res.status(400).json({ message: 'tiers must be a non-empty array (max 20 items)' });
      }

      const keys = new Set();
      for (const t of tiers) {
        if (t && typeof t.key === 'string') {
          keys.add(t.key.trim());
        }
      }
      if (keys.size !== tiers.length) {
        return res.status(400).json({ message: 'Tier keys must be unique' });
      }

      if (typeof venue !== 'string' || venue.trim() === '' || venue.length > 200) {
        return res.status(400).json({ message: 'venue must be a non-empty string (max 200 chars)' });
      }

      if (typeof date !== 'string' || date.trim() === '' || date.length > 100) {
        return res.status(400).json({ message: 'date must be a non-empty string (max 100 chars)' });
      }

      if (typeof time !== 'string' || time.trim() === '' || time.length > 100) {
        return res.status(400).json({ message: 'time must be a non-empty string (max 100 chars)' });
      }

      // ── Validate each tier ───────────────────────────────────────────────
      for (let i = 0; i < tiers.length; i++) {
        const error = validateTier(tiers[i], i);
        if (error) {
          return res.status(400).json({ message: error });
        }
      }

      // ── Sanitize: pick only known fields to prevent object injection ─────
      const sanitizedTiers: TierInput[] = tiers.map((t: Record<string, unknown>) =>
        sanitizeTier(t)
      );

      await db.collection('settings').updateOne(
        { type: 'ticket-tiers' },
        {
          $set: {
            tiers:     sanitizedTiers,
            venue:     venue.trim(),
            date:      date.trim(),
            time:      time.trim(),
            updatedAt: new Date(),
            updatedBy: session.user?.email ?? 'unknown',
          },
        },
        { upsert: true }
      );

      return res.status(200).json({ message: 'Ticket tiers updated successfully' });
    }

  } catch (error) {
    // Log full details server-side only — never expose to client
    console.error('[ticket-tiers] Handler error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default withErrorHandler(handler);
