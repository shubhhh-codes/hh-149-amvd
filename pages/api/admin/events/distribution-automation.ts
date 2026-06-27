import { Db } from 'mongodb';

export const DISTRIBUTION_CHANNELS = [
  { id: 'instagram', name: 'Instagram', tasks: ['Feed', 'Reel', 'Story', 'Highlight', 'Carousel', 'Collaborator', 'Location', 'Hashtags', 'CTA', 'Ticket Link'] },
  { id: 'whatsapp', name: 'WhatsApp', tasks: ['Poster', 'Story', 'Caption', 'QR', 'Ticket Link', 'Broadcast', 'Community Share'] },
  { id: 'bms', name: 'BookMyShow', tasks: ['Listing', 'Images', 'Description', 'Artists', 'Pricing', 'Venue', 'Publish'] },
  { id: 'google', name: 'Google', tasks: ['Business Profile', 'Event Schema', 'Maps Verification'] },
  { id: 'website', name: 'Website', tasks: ['Event Published', 'SEO', 'Sitemap', 'Metadata'] },
  { id: 'repeat', name: 'Repeat Promotion', tasks: ['30 Days Before', '21 Days Before', '14 Days Before', '7 Days Before', '3 Days Before', '1 Day Before', 'Event Day', 'Post Event'] }
];

export async function generateDistributionChecklist(db: Db, eventContext: any) {
  const checklist: any = {};
  
  DISTRIBUTION_CHANNELS.forEach(channel => {
    checklist[channel.id] = {};
    channel.tasks.forEach(task => {
      checklist[channel.id][task] = false;
    });
  });

  const distributionWorkspace = {
    eventId: eventContext.eventId,
    eventName: eventContext.eventName,
    showDate: eventContext.showDate,
    status: 'draft',
    checklist,
    assets: {
      posters: [],
      reels: [],
      stories: []
    },
    generatedCopy: {
      instagramFeed: `Exciting news! We are bringing ${eventContext.eventName} to ${eventContext.venueName} on ${new Date(eventContext.showDate).toLocaleDateString()}. Get your tickets now!`,
      whatsapp: `Hey everyone! Catch ${eventContext.eventName} live at ${eventContext.venueName}. Book your tickets today: [Link]`
    },
    links: {
      bookingUrl: '',
      shortUrl: '',
      utmInstagram: '',
      utmWhatsApp: ''
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.collection('distributions').insertOne(distributionWorkspace);
}
