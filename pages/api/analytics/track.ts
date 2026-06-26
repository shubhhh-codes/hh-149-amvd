import type { NextApiRequest, NextApiResponse } from 'next';
import { sendTrackingNotification } from '../../../lib/discord';
import { UAParser } from 'ua-parser-js';

import { withErrorHandler } from '../../../lib/withErrorHandler';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { event, actionDetails, timeSpentOnPage, userDetails, timeline, sessionId, isLiveUpdate } = req.body;

    if (!event || !actionDetails) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'Unknown IP';
    const userAgentStr = req.headers['user-agent'] || '';
    
    // 1. Parse User Agent
    const parser = UAParser(userAgentStr);
    const browser = parser.browser;
    const os = parser.os;
    const device = parser.device;
    
    const deviceType = device.type === 'mobile' ? 'Mobile' : device.type === 'tablet' ? 'Tablet' : 'Desktop';
    const deviceStr = `${device.vendor || ''} ${device.model || ''}`.trim() || deviceType;
    const osStr = `${os.name || 'Unknown OS'} ${os.version || ''}`.trim();
    const browserStr = `${browser.name || 'Unknown Browser'} ${browser.version || ''}`.trim();

    // 2. Fetch Geo Location & ISP
    let location = 'Unknown Location';
    let isp = 'Unknown ISP';

    // Prioritize Vercel's built-in, highly accurate IP headers
    const vercelCity = req.headers['x-vercel-ip-city'] as string;
    const vercelCountry = req.headers['x-vercel-ip-country'] as string;
    const vercelRegion = req.headers['x-vercel-ip-country-region'] as string;

    if (vercelCity && vercelCountry) {
      location = `${decodeURIComponent(vercelCity)}, ${vercelRegion ? decodeURIComponent(vercelRegion) + ', ' : ''}${vercelCountry}`;
    } else {
      // Fallback for Local Dev or custom hosting
      const isLocal = ip === '::1' || ip === '127.0.0.1' || ip === 'Unknown IP';
      const apiUrl = isLocal ? 'http://ip-api.com/json/?fields=status,country,regionName,city,isp,org' : `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,org`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second timeout
        const geoRes = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        const geoData = await geoRes.json();
        
        if (geoData.status === 'success') {
          location = `${geoData.city}, ${geoData.regionName}, ${geoData.country}`;
          isp = geoData.org || geoData.isp || 'Unknown ISP';
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('[Track API] Failed to fetch GeoIP:', err);
        }
      }
    }

    // 3. Compile Visitor Data
    const visitorData = {
      ip,
      location,
      isp,
      device: deviceStr,
      os: osStr,
      browser: browserStr
    };

    // 4. Fire the slack notification in the background
    sendTrackingNotification({
      event,
      actionDetails,
      visitorData,
      timeSpentOnPage,
      userDetails,
      timeline,
      sessionId,
      isLiveUpdate
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Track API] Error tracking event:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default withErrorHandler(handler);
