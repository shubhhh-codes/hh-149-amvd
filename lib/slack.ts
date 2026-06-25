import clientPromise from './mongodb';

export interface SlackBookingData {
  bookingId: string;
  fullName: string;
  email: string;
  phone: string;
  numberOfTickets: number;
  amountPaid?: number;
  bookingType: 'paid' | 'complimentary';
  cart?: any[];
  timeToConvertSeconds?: number;
}

async function getBookingStats() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const bookings = await db.collection('bookings').find({
      createdAt: { $gte: todayStart }
    }).toArray();
    
    const confirmed = bookings.filter(b => b.status === 'approved');
    const pending = bookings.filter(b => b.status === 'pending');
    const cancelled = bookings.filter(b => b.status === 'cancelled');
    
    const confirmedRevenue = confirmed.reduce((sum, b) => {
      if (b.cart && b.cart.length > 0) {
        return sum + b.cart.reduce((s: number, item: any) => s + (item.price || 0), 0);
      }
      return sum;
    }, 0);
    
    const total = bookings.length;
    const conversionRate = total > 0 ? Math.round((confirmed.length / total) * 100) : 0;
    
    return {
      confirmed: confirmed.length,
      pending: pending.length,
      cancelled: cancelled.length,
      confirmedRevenue,
      conversionRate
    };
  } catch (err) {
    console.error('[Slack] Failed to fetch booking stats:', err);
    return null;
  }
}

export async function sendSlackNotification(data: SlackBookingData) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log('[Slack] SLACK_WEBHOOK_URL not configured. Skipping notification.');
    return;
  }

  const isPaid = data.bookingType === 'paid';
  const color = '#FF6B1A'; // Humours Hub Brand Orange
  const title = isPaid ? '🎉 New Online Booking!' : '🎫 New Complimentary Pass Issued';

  let cartDetails = '';
  if (data.cart && data.cart.length > 0) {
    cartDetails = data.cart.map(item => `${item.units}x ${item.tierKey.replace('-', ' ')}`).join(', ');
  } else {
    cartDetails = `${data.numberOfTickets}x Passes`;
  }

  const message = {
    attachments: [
      {
        color,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${title}*`
            }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Name:*\n${data.fullName}` },
              { type: 'mrkdwn', text: `*Amount Paid:*\n${isPaid && data.amountPaid ? `₹${data.amountPaid}` : 'FREE'}` },
              { type: 'mrkdwn', text: `*Tickets:*\n${cartDetails}` },
              ...(data.timeToConvertSeconds ? [{ type: 'mrkdwn', text: `*⏱️ Time to Convert:*\n${Math.floor(data.timeToConvertSeconds / 60)}m ${data.timeToConvertSeconds % 60}s` }] : [])
            ]
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `📧 ${data.email}   |   📞 ${data.phone}   |   🆔 \`${data.bookingId}\``
              }
            ]
          }
        ]
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (!res.ok) {
      console.error(`[Slack] Failed to send notification. HTTP ${res.status}`);
    } else {
      console.log(`[Slack] Notification sent for booking ${data.bookingId}`);
    }

    // Append live stats as a follow-up message
    const stats = await getBookingStats();
    if (stats) {
      const statsMessage = {
        attachments: [
          {
            color: '#2ECC71',
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*📊 Today's Conversion Stats*\n \n✅ Confirmed: *${stats.confirmed}*  (₹${stats.confirmedRevenue.toLocaleString()})\n⏳ Pending: *${stats.pending}*\n❌ Cancelled: *${stats.cancelled}*`
                }
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `📈 Conversion Rate: *${stats.conversionRate}%*   |   💰 Revenue: *₹${stats.confirmedRevenue.toLocaleString()}*`
                  }
                ]
              }
            ]
          }
        ]
      };
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statsMessage)
      });
    }
  } catch (err) {
    console.error('[Slack] Error sending notification:', err);
  }
}

export interface VisitorData {
  ip: string;
  location: string;
  isp: string;
  device: string;
  os: string;
  browser: string;
  source?: string;
}

export async function sendVisitorNotification(visitorData: VisitorData) {
  const webhookUrl = process.env.SLACK_TRAFFIC_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    return;
  }

  const message = {
    attachments: [
      {
        color: '#FF6B1A',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*👀 New Active Visitor!*\n \n• *Location:* ${visitorData.location}  \n• *Device:* ${visitorData.device}  \n• *Source:* ${visitorData.source || 'Direct'}`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `🖥️ ${visitorData.os} / ${visitorData.browser}   |   🕵️ \`${visitorData.ip}\`   |   📡 ${visitorData.isp}`
              }
            ]
          }
        ]
      }
    ]
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  } catch (err) {
    console.error('[Slack] Error sending visitor notification:', err);
  }
}

export interface TrackingData {
  event: 'abandonment' | 'click' | 'journey';
  actionDetails: string;
  visitorData: VisitorData;
  timeSpentOnPage?: number; // in seconds
  userDetails?: {
    name: string;
    email: string;
    phone: string;
  };
  timeline?: string[];
}

export async function sendTrackingNotification(data: TrackingData) {
  // Try to use specialized webhooks, fallback to general webhooks if not available
  const abandonmentWebhook = process.env.SLACK_ABANDONMENT_WEBHOOK_URL || process.env.SLACK_TRAFFIC_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  const journeyWebhook = process.env.SLACK_JOURNEY_WEBHOOK_URL || process.env.SLACK_TRAFFIC_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  
  const webhookUrl = data.event === 'abandonment' ? abandonmentWebhook : journeyWebhook;
  
  if (!webhookUrl) return;

  const isAbandonment = data.event === 'abandonment';
  const isJourney = data.event === 'journey';
  
  let color = '#00A2FF'; // Blue for clicks
  if (isAbandonment) color = '#FF0000'; // Red for abandonment
  if (isJourney) color = '#8E44AD'; // Purple for full journeys
  
  let title = '👆 User Action';
  if (isAbandonment) title = '⚠️ Cart Abandonment';
  if (isJourney) title = '🧭 Full Session Journey';
  
  const timeText = data.timeSpentOnPage ? `*Time on Page:*\n${Math.floor(data.timeSpentOnPage / 60)}m ${data.timeSpentOnPage % 60}s` : `*Time:*\nN/A`;

  const blocks: any[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${title}*\n${data.actionDetails}`
      }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Location:*\n${data.visitorData.location}` },
        { type: 'mrkdwn', text: `*Device:*\n${data.visitorData.device} (${data.visitorData.os})` },
        { type: 'mrkdwn', text: timeText }
      ]
    }
  ];

  if (data.timeline && data.timeline.length > 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '*Activity Log:*' }
    });
    
    // Chunk into groups of 4 to prevent 'Show more...' button in Slack
    for (let i = 0; i < data.timeline.length; i += 4) {
      const chunk = data.timeline.slice(i, i + 4).map(t => `• ${t}`);
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: chunk.join('\n')
        }
      });
    }
  }

  if (data.userDetails && (data.userDetails.name || data.userDetails.email || data.userDetails.phone)) {
    blocks.push({
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*👤 Name:*\n${data.userDetails.name || '-'}` },
        { type: 'mrkdwn', text: `*📧 Email:*\n${data.userDetails.email || '-'}` },
        { type: 'mrkdwn', text: `*📞 Phone:*\n${data.userDetails.phone || '-'}` }
      ]
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `🕵️ \`${data.visitorData.ip}\`   |   📡 ${data.visitorData.isp}`
      }
    ]
  });

  const message = { attachments: [{ color, blocks }] };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  } catch (err) {
    console.error('[Slack] Error sending tracking notification:', err);
  }
}

export interface ContactData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export async function sendContactNotification(data: ContactData) {
  const webhookUrl = process.env.SLACK_CONTACT_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const message = {
    attachments: [
      {
        color: '#F39C12', // Yellow/Orange
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*📬 New Contact Form Submission*\n \n• *Name:* ${data.name}  \n• *Subject:* ${data.subject}`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Message:*\n> ${data.message.replace(/\n/g, '\n> ')}`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `📞 ${data.phone}   |   📧 ${data.email}`
              }
            ]
          }
        ]
      }
    ]
  };

  try {
    await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
  } catch (err) {
    console.error('[Slack] Error sending contact notification:', err);
  }
}

export interface FeedbackData {
  fullName: string;
  email: string;
  category: string;
  vibe: string;
  comment: string;
}

export async function sendFeedbackNotification(data: FeedbackData) {
  const webhookUrl = process.env.SLACK_FEEDBACK_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const vibeWord = data.vibe.toLowerCase();
  let vibeScore = parseInt(data.vibe, 10);
  if (isNaN(vibeScore)) {
    if (['amazing', 'great', 'excellent', 'awesome'].includes(vibeWord)) vibeScore = 5;
    else if (['good', 'nice', 'cool'].includes(vibeWord)) vibeScore = 4;
    else if (['okay', 'average', 'fine', 'neutral'].includes(vibeWord)) vibeScore = 3;
    else if (['bad', 'poor'].includes(vibeWord)) vibeScore = 2;
    else if (['terrible', 'awful', 'worst'].includes(vibeWord)) vibeScore = 1;
  }

  const vibeStars = !isNaN(vibeScore) && vibeScore >= 1 && vibeScore <= 5 
    ? '⭐'.repeat(vibeScore) + '☆'.repeat(5 - vibeScore) + ` (${vibeScore}/5)` 
    : data.vibe;

  const message = {
    attachments: [
      {
        color: '#9B59B6', // Purple
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*💬 New User Feedback*\n \n• *Name:* ${data.fullName}  \n• *Category:* ${data.category}  \n• *Vibe:* ${vibeStars}`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Comment:*\n> ${data.comment.replace(/\n/g, '\n> ')}`
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `📧 ${data.email}`
              }
            ]
          }
        ]
      }
    ]
  };

  try {
    await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
  } catch (err) {
    console.error('[Slack] Error sending feedback notification:', err);
  }
}

export interface SlackPaymentCancelledData {
  bookingId: string;
  fullName: string;
  email: string;
  phone: string;
  numberOfTickets: number;
  cart?: any[];
  repeatAttempter: boolean;
  totalAttempts: number;
}

export async function sendPaymentCancelledNotification(data: SlackPaymentCancelledData) {
  const webhookUrl = process.env.SLACK_LOST_SALES_WEBHOOK_URL || process.env.SLACK_ABANDONMENT_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) return;

  const color = '#E74C3C'; // Red
  
  let cartDetails = '';
  if (data.cart && data.cart.length > 0) {
    cartDetails = data.cart.map(item => `${item.units}x ${item.tierKey.replace('-', ' ')} (₹${item.price})`).join(', ');
  } else {
    cartDetails = `${data.numberOfTickets}x Passes`;
  }
  
  const blocks: any[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🚫 Payment Cancelled*`
      }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Name:*\n${data.fullName}` },
        { type: 'mrkdwn', text: `*Tickets:*\n${cartDetails}` }
      ]
    }
  ];

  if (data.repeatAttempter) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🔥 HOT LEAD — REPEAT ATTEMPTER*\nThis person has tried to book *${data.totalAttempts} times* recently but keeps cancelling at the paywall!\n<https://wa.me/91${data.phone.replace(/[^0-9]/g, '')}|💬 Message on WhatsApp>`
      }
    });
  } else {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<https://wa.me/91${data.phone.replace(/[^0-9]/g, '')}|💬 Message on WhatsApp>`
      }
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `📧 ${data.email}   |   📞 ${data.phone}   |   🆔 \`${data.bookingId}\``
      }
    ]
  });

  const message = {
    attachments: [
      {
        color,
        blocks
      }
    ]
  };

  try {
    await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
  } catch (err) {
    console.error('[Slack] Error sending payment cancelled notification:', err);
  }
}

export async function sendCapacityAlert(percent: number, totalSeats: number, capacity: number) {
  const webhookUrl = process.env.SLACK_CAPACITY_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const message = {
    attachments: [
      {
        color: '#E67E22', // Warning Orange
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*🚨 ALMOST SOLD OUT!*`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `The venue is now at *${percent}% capacity*!\nTotal approved seats: *${totalSeats} / ${capacity}*\n \n💡 _Time to post an urgent Instagram Story!_`
            }
          }
        ]
      }
    ]
  };

  try {
    await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
  } catch (err) {
    console.error('[Slack] Error sending capacity alert:', err);
  }
}

