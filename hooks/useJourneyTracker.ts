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

  useEffect(() => {
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
          const name = clickable.getAttribute('name') || clickable.getAttribute('id') || clickable.getAttribute('placeholder') || tag;
          text = `Filled form field '${name}'`;
        } else if (tag === 'img') {
          const alt = clickable.getAttribute('alt');
          text = alt ? `Clicked image '${alt}'` : `Clicked on an image`;
        } else {
          // Extract text but strip common Material Symbols/Icons that pollute the log
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
        // Random click on a non-interactive element
        const tag = target.tagName.toLowerCase();
        if (tag !== 'html' && tag !== 'body' && tag !== 'main' && tag !== 'section') {
          let text = (target as HTMLElement).innerText?.trim();
          if (text) {
            text = text.replace(/\n/g, ' ').slice(0, 25);
            addJourneyEvent(`Read / Clicked text: "${text}..."`);
          }
          // If it's just an empty div, we silently ignore it to prevent log spam!
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

    const handleBeforeUnload = () => {
      if (!mountTime.current) return;
      const timeSpent = Math.floor((Date.now() - mountTime.current) / 1000);
      
      const timelineFormatted = sessionTimeline.map(t => {
        const seconds = Math.floor((t.time - mountTime.current!) / 1000);
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `\`${m}:${s.toString().padStart(2, '0')}\` - ${t.action}`;
      });

      const data = JSON.stringify({
        event: 'journey',
        actionDetails: 'User finished session and closed tab.',
        timeSpentOnPage: timeSpent,
        timeline: timelineFormatted
      });
      
      navigator.sendBeacon('/api/analytics/track', new Blob([data], { type: 'application/json' }));
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}
