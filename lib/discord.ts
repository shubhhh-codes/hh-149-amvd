import clientPromise from './mongodb';

export interface DiscordBookingData {
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
    console.error('[Discord] Failed to fetch booking stats:', err);
    return null;
  }
}

export async function sendDiscordNotification(data: DiscordBookingData) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const isPaid = data.bookingType === 'paid';
  const color = 16739098; // #FF6B1A
  const title = isPaid ? '🎉 New Online Booking!' : '🎫 New Complimentary Pass Issued';

  let cartDetails = '';
  if (data.cart && data.cart.length > 0) {
    cartDetails = data.cart.map(item => `${item.units}x ${item.tierKey.replace('-', ' ')}`).join(', ');
  } else {
    cartDetails = `${data.numberOfTickets}x Passes`;
  }

  const fields = [
    { name: '🎟️ Tickets', value: cartDetails, inline: true },
    { name: '💳 Amount Paid', value: isPaid && data.amountPaid ? `₹${data.amountPaid}` : 'FREE', inline: true },
    { name: '📞 Phone', value: data.phone, inline: true }
  ];

  if (data.timeToConvertSeconds) {
    fields.push({
      name: '⏱️ Time to Convert',
      value: `${Math.floor(data.timeToConvertSeconds / 60)}m ${data.timeToConvertSeconds % 60}s`,
      inline: true
    });
  }

  const payload = {
    embeds: [
      {
        author: { name: "Humours Hub Bookings", icon_url: "https://humourshub.in/favicon.ico" },
        title,
        color,
        description: `**${data.fullName}** just booked ${isPaid ? 'tickets' : 'complimentary passes'}.`,
        fields,
        footer: { text: `ID: ${data.bookingId} • ${data.email}` },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) console.error(`[Discord] Failed to send notification. HTTP ${res.status}`);

    const stats = await getBookingStats();
    if (stats) {
      const statsPayload = {
        embeds: [
          {
            author: { name: "Humours Hub Analytics", icon_url: "https://humourshub.in/favicon.ico" },
            title: "📊 Today's Conversion Stats",
            color: 3066993, // #2ECC71
            fields: [
              { name: '✅ Confirmed', value: `${stats.confirmed} (₹${stats.confirmedRevenue.toLocaleString()})`, inline: true },
              { name: '⏳ Pending', value: `${stats.pending}`, inline: true },
              { name: '❌ Cancelled', value: `${stats.cancelled}`, inline: true }
            ],
            footer: { text: `Conversion Rate: ${stats.conversionRate}%` },
            timestamp: new Date().toISOString()
          }
        ]
      };
      await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(statsPayload) });
    }
  } catch (err) {
    console.error('[Discord] Error sending notification:', err);
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
  const webhookUrl = process.env.DISCORD_TRAFFIC_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = {
    embeds: [{
      author: { name: "Humours Hub Traffic", icon_url: "https://humourshub.in/favicon.ico" },
      title: "🟢 Active Visitor on Site",
      color: 16739098, // #FF6B1A
      fields: [
        { name: '📍 Location', value: visitorData.location, inline: true },
        { name: '💻 Device', value: `${visitorData.device} (${visitorData.os})`, inline: true },
        { name: '🌐 Source', value: visitorData.source || 'Direct', inline: true }
      ],
      footer: { text: `IP: ${visitorData.ip} • ISP: ${visitorData.isp}` },
      timestamp: new Date().toISOString()
    }]
  };

  try {
    await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (err) {
    console.error('[Discord] Error sending visitor notification:', err);
  }
}

export interface TrackingData {
  event: 'abandonment' | 'click' | 'journey';
  actionDetails: string;
  visitorData: VisitorData;
  timeSpentOnPage?: number;
  userDetails?: { name: string; email: string; phone: string; };
  timeline?: string[];
}

export async function sendTrackingNotification(data: TrackingData) {
  const abandonmentWebhook = process.env.DISCORD_ABANDONMENT_WEBHOOK_URL || process.env.DISCORD_TRAFFIC_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  const journeyWebhook = process.env.DISCORD_JOURNEY_WEBHOOK_URL || process.env.DISCORD_TRAFFIC_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  const webhookUrl = data.event === 'abandonment' ? abandonmentWebhook : journeyWebhook;
  if (!webhookUrl) return;

  let color = 16739098; // Default Orange #FF6B1A
  let title = '📍 User Journey Event';
  if (data.event === 'abandonment') { color = 16711680; title = '🚨 Cart Abandonment'; }
  if (data.event === 'journey') { color = 9807270; title = '🏁 Session Completed'; }

  const timeText = data.timeSpentOnPage ? `${Math.floor(data.timeSpentOnPage / 60)}m ${data.timeSpentOnPage % 60}s` : `N/A`;

  const fields: any[] = [
    { name: '📍 Location', value: data.visitorData.location, inline: true },
    { name: '💻 Device', value: data.visitorData.device, inline: true },
    { name: '⏱️ Duration', value: timeText, inline: true }
  ];

  if (data.userDetails && (data.userDetails.name || data.userDetails.email || data.userDetails.phone)) {
    fields.push({
      name: '👤 User Identified',
      value: `\`${data.userDetails.name || 'N/A'}\` • \`${data.userDetails.email || 'N/A'}\` • \`${data.userDetails.phone || 'N/A'}\``,
      inline: false
    });
  }

  if (data.timeline && data.timeline.length > 0) {
    const log = data.timeline.map(t => `${t}`).join('\n');
    fields.push({
      name: '📝 Activity Log',
      value: `\`\`\`\n${log.slice(0, 1000)}\n\`\`\``,
      inline: false
    });
  }

  const payload = {
    embeds: [{
      author: { name: "Humours Hub Tracker", icon_url: "https://humourshub.in/favicon.ico" },
      title,
      description: `> ${data.actionDetails}`,
      color,
      fields,
      footer: { text: `IP: ${data.visitorData.ip} • ISP: ${data.visitorData.isp}` },
      timestamp: new Date().toISOString()
    }]
  };

  try {
    await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (err) {
    console.error('[Discord] Error sending tracking notification:', err);
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
  const webhookUrl = process.env.DISCORD_CONTACT_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = {
    embeds: [{
      author: { name: "Humours Hub Contact", icon_url: "https://humourshub.in/favicon.ico" },
      title: "📬 New Message Received",
      color: 15965202, // #F39C12
      description: `**Subject:** ${data.subject}\n\n**Message:**\n\`\`\`\n${data.message.slice(0, 2000)}\n\`\`\``,
      fields: [
        { name: '👤 From', value: data.name, inline: true },
        { name: '📞 Phone', value: data.phone, inline: true },
        { name: '📧 Email', value: data.email, inline: true }
      ],
      timestamp: new Date().toISOString()
    }]
  };

  try {
    await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (err) {
    console.error('[Discord] Error sending contact notification:', err);
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
  const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
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

  const payload = {
    embeds: [{
      author: { name: "Humours Hub Feedback", icon_url: "https://humourshub.in/favicon.ico" },
      title: "💬 New User Feedback",
      color: 10181046, // #9B59B6
      description: `> "${data.comment.replace(/\n/g, '\n> ')}"`,
      fields: [
        { name: '👤 From', value: data.fullName, inline: true },
        { name: '📂 Category', value: data.category, inline: true },
        { name: '✨ Vibe', value: vibeStars, inline: true }
      ],
      footer: { text: `${data.email}` },
      timestamp: new Date().toISOString()
    }]
  };

  try {
    await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (err) {
    console.error('[Discord] Error sending feedback notification:', err);
  }
}

export interface DiscordPaymentCancelledData {
  bookingId: string;
  fullName: string;
  email: string;
  phone: string;
  numberOfTickets: number;
  cart?: any[];
  repeatAttempter: boolean;
  totalAttempts: number;
}

export async function sendPaymentCancelledNotification(data: DiscordPaymentCancelledData) {
  const webhookUrl = process.env.DISCORD_LOST_SALES_WEBHOOK_URL || process.env.DISCORD_ABANDONMENT_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  let cartDetails = '';
  if (data.cart && data.cart.length > 0) {
    cartDetails = data.cart.map(item => `${item.units}x ${item.tierKey.replace('-', ' ')} (₹${item.price})`).join(', ');
  } else {
    cartDetails = `${data.numberOfTickets}x Passes`;
  }
  
  const fields = [
    { name: '👤 Name', value: data.fullName, inline: true },
    { name: '🎟️ Tickets', value: cartDetails, inline: true },
    { name: '📞 Action', value: `[💬 WhatsApp](https://wa.me/91${data.phone.replace(/[^0-9]/g, '')})`, inline: true }
  ];

  let description = '';
  if (data.repeatAttempter) {
    description = `**🔥 HOT LEAD — REPEAT ATTEMPTER**\nThis person has tried to book **${data.totalAttempts} times** recently but keeps cancelling at the paywall!`;
  }

  const payload = {
    embeds: [{
      author: { name: "Humours Hub Sales", icon_url: "https://humourshub.in/favicon.ico" },
      title: "🚨 Checkout Abandoned",
      color: 15158332, // #E74C3C
      description: description,
      fields,
      footer: { text: `ID: ${data.bookingId} • ${data.email}` },
      timestamp: new Date().toISOString()
    }]
  };

  try {
    await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (err) {
    console.error('[Discord] Error sending payment cancelled notification:', err);
  }
}

export async function sendCapacityAlert(percent: number, totalSeats: number, capacity: number) {
  const webhookUrl = process.env.DISCORD_CAPACITY_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = {
    embeds: [{
      author: { name: "Humours Hub Alerts", icon_url: "https://humourshub.in/favicon.ico" },
      title: "🔥 VENUE ALMOST SOLD OUT",
      color: 15105570, // #E67E22
      description: `The venue is now at **${percent}% capacity**!\n\n💡 *Action required: Time to post an urgent Instagram Story!*`,
      fields: [
        { name: '🎟️ Seats Approved', value: `${totalSeats} / ${capacity}`, inline: true },
        { name: '📈 Capacity', value: `${percent}%`, inline: true }
      ],
      timestamp: new Date().toISOString()
    }]
  };

  try {
    await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (err) {
    console.error('[Discord] Error sending capacity alert:', err);
  }
}

export interface SecurityData {
  event: 'failed_login';
  ip: string;
  emailTried: string;
  passwordTried?: string;
  location: string;
  isp: string;
  device: string;
  os: string;
  browser: string;
}

export async function sendSecurityNotification(data: SecurityData) {
  const webhookUrl = process.env.DISCORD_SECURITY_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = {
    embeds: [{
      author: { name: "Humours Hub Security", icon_url: "https://humourshub.in/favicon.ico" },
      title: "🚨 Failed Admin Login Attempt",
      color: 15158332, // Red
      description: `An unauthorized attempt was made to access the admin dashboard.`,
      fields: [
        { name: '📧 Email Tried', value: `\`${data.emailTried}\``, inline: true },
        { name: '🔑 Password Tried', value: `\`${data.passwordTried || '***'}\``, inline: true },
        { name: '💻 Device', value: `${data.device} (${data.os})`, inline: true },
        { name: '📍 Location', value: data.location, inline: true },
        { name: '🌐 ISP', value: data.isp, inline: true },
        { name: '📡 IP', value: `\`${data.ip}\``, inline: true }
      ],
      timestamp: new Date().toISOString()
    }]
  };

  try {
    await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (err) {
    console.error('[Discord] Error sending security notification:', err);
  }
}
