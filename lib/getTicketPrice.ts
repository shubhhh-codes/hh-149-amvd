import clientPromise from './mongodb';

/**
 * Fetches the dynamic ticket price from the CMS (homepage_content -> next_show).
 * Parses the string (e.g. "₹149") into a number (149).
 * Returns a fallback of 149 if not found or invalid.
 */
export async function getTicketPrice(): Promise<number> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const nextShowDoc = await db.collection('homepage_content').findOne({
      type: 'next_show',
      isVisible: true,
      isDeleted: { $ne: true },
    });

    if (nextShowDoc && nextShowDoc.metadata && nextShowDoc.metadata.ticketPrice) {
      const priceString = String(nextShowDoc.metadata.ticketPrice);
      const parsedPrice = parseInt(priceString.replace(/\D/g, ''), 10);
      if (!isNaN(parsedPrice) && parsedPrice > 0) {
        return parsedPrice;
      }
    }
  } catch (error) {
    console.error('Error fetching ticket price:', error);
  }

  // Fallback default
  return 149;
}
