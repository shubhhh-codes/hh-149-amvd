import { useEffect, useRef } from 'react';

export const sessionTimeline: { time: number, action: string }[] = [];

export function addJourneyEvent(action: string) {
  // Prevent spamming exact duplicate consecutive events
  const lastEvent = sessionTimeline[sessionTimeline.length - 1];
  if (lastEvent && lastEvent.action === action) {
    return;
  }

  sessionTimeline.push({ time: Date.now(), action });
  // Keep memory clean, only keep last 30 significant events
  if (sessionTimeline.length > 30) {
    sessionTimeline.shift();
  }
}

export function useJourneyTracker() {
  const mountTime = useRef<number | null>(null);
  const sessionId = useRef<string>('');
  const lastSentLength = useRef<number>(0);

  useEffect(() => {
    if (!sessionId.current) {
      sessionId.current = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }

    if (!mountTime.current) {
      mountTime.current = Date.now();
      addJourneyEvent(`Started session on ${window.location.pathname}`);
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickable = target.closest('button, a, input, select, textarea, [role="button"], img');
      if (clickable) {
        let text = '';
        const tag = clickable.tagName.toLowerCase();
        
        if (['input', 'select', 'textarea'].includes(tag)) {
          // We handle actual filling in the 'change' event now, but we can log focus
          const name = clickable.getAttribute('name') || clickable.getAttribute('placeholder') || clickable.getAttribute('id') || tag;
          text = `Focused on '${name}'`;
        } else if (tag === 'img') {
          const alt = clickable.getAttribute('alt');
          text = alt ? `Clicked image '${alt}'` : `Clicked on an image`;
        } else {
          let rawText = clickable.getAttribute('aria-label') || (clickable as HTMLElement).innerText || clickable.textContent || '';
          const iconWords = ['edit_note', 'sentiment_very_satisfied', 'arrow_forward', 'check_circle', 'phone', 'mail', 'menu', 'close'];
          iconWords.forEach(icon => { rawText = rawText.replace(new RegExp(icon, 'gi'), ''); });
          
          text = rawText.trim().replace(/\n/g, ' ').slice(0, 30);
          text = text ? `Clicked '${text}'` : `Clicked ${tag}`;
          
          if (tag === 'a') {
            const href = clickable.getAttribute('href');
            if (href && !href.startsWith('#')) text += ` (to ${href})`;
          }
        }
        addJourneyEvent(text);
      } else {
        const tag = target.tagName.toLowerCase();
        if (tag !== 'html' && tag !== 'body' && tag !== 'main' && tag !== 'section') {
          // Only log if it's a small, specific text element like p, span, h1-h6
          if (['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(tag) || (target.childNodes.length === 1 && target.firstChild?.nodeType === Node.TEXT_NODE)) {
            let text = (target as HTMLElement).innerText?.trim();
            if (text && text.length < 100) { // Ignore giant paragraphs
              text = text.replace(/\n/g, ' ').slice(0, 40);
              addJourneyEvent(`Read: "${text}..."`);
            }
          }
        }
      }
    };

    const handleChange = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (target) {
        const name = target.getAttribute('name') || target.getAttribute('placeholder') || target.getAttribute('id') || target.tagName.toLowerCase();
        const value = target.value;
        // Don't log passwords or empty values
        if (value && target.type !== 'password') {
          // Mask long numbers like credit cards just in case, but keep phone/names visible
          const displayValue = value.length > 20 ? value.substring(0, 4) + '...' : value;
          addJourneyEvent(`Typed '${displayValue}' in '${name}'`);
        }
      }
    };

    let scrollTimeout: any;
    let lastLoggedSection = '';
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Find what they are looking at in the center of the screen
        const centerElement = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        const section = centerElement?.closest('section, div[id], main') || centerElement?.parentElement;
        
        let sectionName = '';
        if (section) {
          const heading = section.querySelector('h1, h2, h3, h4');
          if (heading && heading.textContent) {
            sectionName = heading.textContent.trim().replace(/\n/g, ' ').slice(0, 40);
          } else {
            sectionName = section.getAttribute('id') || '';
          }
        }
        
        if (!sectionName) {
           if (window.scrollY < 100) sectionName = 'Top of page';
           else if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) sectionName = 'Footer';
           else sectionName = 'Middle of page';
        }
        
        // Capitalize id names like 'gallery' -> 'Gallery'
        if (sectionName === sectionName.toLowerCase() && sectionName.length > 0) {
            sectionName = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
        }

        if (sectionName && sectionName !== lastLoggedSection) {
          lastLoggedSection = sectionName;
          addJourneyEvent(`Scrolled to '${sectionName}'`);
        }
      }, 1500); // Wait 1.5s of no scrolling to assume they "stopped"
    };

    const sendJourney = (isFinal = false) => {
      if (!mountTime.current) return;
      
      // If it's a heartbeat and nothing changed, don't spam
      if (!isFinal && sessionTimeline.length === lastSentLength.current) return;
      lastSentLength.current = sessionTimeline.length;

      const timeSpent = Math.floor((Date.now() - mountTime.current) / 1000);
      
      const timelineFormatted = sessionTimeline.map(t => {
        const seconds = Math.floor((t.time - mountTime.current!) / 1000);
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `\`${m}:${s.toString().padStart(2, '0')}\` - ${t.action}`;
      });

      const data = JSON.stringify({
        event: 'journey',
        sessionId: sessionId.current,
        isLiveUpdate: !isFinal,
        actionDetails: isFinal ? 'User left the website or closed the app.' : 'Live session in progress...',
        timeSpentOnPage: timeSpent,
        timeline: timelineFormatted
      });
      
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data,
        keepalive: true
      }).catch(() => {
        if (isFinal) navigator.sendBeacon('/api/analytics/track', new Blob([data], { type: 'application/json' }));
      });
    };

    const heartbeat = setInterval(() => sendJourney(false), 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendJourney(true);
      } else if (document.visibilityState === 'visible') {
        addJourneyEvent(`Resumed session`);
        // Immediately trigger a heartbeat to turn the Discord message back to 'Live' status
        sendJourney(false);
      }
    };

    const handlePageHide = (event: PageTransitionEvent) => {
      sendJourney(true);
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('change', handleChange, true);
    window.addEventListener('scroll', handleScroll);
    // iOS and Android DO NOT fire beforeunload when closing an app. 
    // They only fire visibilitychange and pagehide.
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('change', handleChange, true);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);
}
