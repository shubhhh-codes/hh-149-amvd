import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { id, eventContext } = req.body;
    if (!id || !eventContext) return res.status(400).json({ error: 'Missing parameters' });

    const client = await clientPromise;
    const db = client.db('humourshub');

    // Simulate AI generation with robust dynamic templates
    const dateStr = new Date(eventContext.showDate).toLocaleDateString();
    
    const instaTemplates = [
      `🔥 BIG NEWS! 🔥\n\n${eventContext.eventName} is coming to ${eventContext.venueName} on ${dateStr}!\n\nThis is going to be an unforgettable night of laughter. Grab your squad and secure your tickets before they sell out! 🎟️👇\n\nLink in bio! #HumoursHub #StandupComedy`,
      `Stop scrolling! 🛑 Laughter is incoming!\n\nJoin us at ${eventContext.venueName} for ${eventContext.eventName} this ${dateStr}.\n\nYou do NOT want to miss this lineup. Early bird tickets are live right now. Tag who you are bringing! 🤣🎉\n\n[Link in Bio]`,
      `Ready for the best night of the month? 🎤✨\n\n${eventContext.eventName} is going down at ${eventContext.venueName} on ${dateStr}. Tickets are flying fast, so hit the link in our bio to grab yours today!`
    ];

    const whatsappTemplates = [
      `🚨 *NEW SHOW ALERT* 🚨\n\nHey everyone! We just announced *${eventContext.eventName}* at ${eventContext.venueName}!\n\n📅 Date: ${dateStr}\n🎫 Book here: [Your Link Here]\n\nReply to this message if you want a special group discount code!`,
      `Just dropped! 🎤 *${eventContext.eventName}*\n\nCatch us live at ${eventContext.venueName} on ${dateStr}. Gather the group chat and book your seats before it's full!\n\n🎟️ Tickets: [Your Link Here]`,
      `Need plans for ${dateStr}? We got you! 😂\n\n*${eventContext.eventName}* is happening at ${eventContext.venueName}.\n\nSecure your tickets right now: [Your Link Here]`
    ];

    // Pick random variations
    const generatedCopy = {
      instagramFeed: instaTemplates[Math.floor(Math.random() * instaTemplates.length)],
      whatsapp: whatsappTemplates[Math.floor(Math.random() * whatsappTemplates.length)]
    };

    await db.collection('distributions').updateOne(
      { _id: new ObjectId(id) },
      { $set: { generatedCopy } }
    );

    res.status(200).json({ success: true, generatedCopy });
  } catch (err: any) {
    console.error('Generate Error:', err);
    res.status(500).json({ error: 'Failed to generate copy' });
  }
}
