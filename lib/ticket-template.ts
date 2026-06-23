export interface TicketTemplateData {
  ticketNumber: string;
  fullName: string;
  eventName: string;
  eventDate: string; // e.g. "24 Nov, Sun"
  eventTime: string; // e.g. "8:00 PM"
  venueName: string; // e.g. "The Studio"
  venueLocation: string; // e.g. "SG Highway"
  seatType: string; // e.g. "General"
  bookingType: string; // e.g. "Standard"
  qrCodeDataUri: string;
}

export function generateTicketHtml(data: TicketTemplateData): string {
  return `<!DOCTYPE html>
<html class="dark" lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>The Humours Hub - Ticket</title>
<!-- Fonts & Icons -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Hind:wght@400;500;700&amp;family=Dm+Sans:wght@400;500;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "tertiary-fixed-dim": "#8dcdff", "on-primary-container": "#591e00", "surface-container-low": "#1c1b1b",
        "on-primary-fixed-variant": "#7d2d00", surface: "#131313", "tertiary-fixed": "#cae6ff",
        "on-tertiary-container": "#003550", "surface-container-high": "#2a2a2a", "primary-fixed": "#ffdbcd",
        "on-primary-fixed": "#360f00", "on-tertiary": "#00344f", error: "#ffb4ab", "on-background": "#e5e2e1",
        "on-tertiary-fixed": "#001e30", "on-secondary-fixed-variant": "#474646", "on-error": "#690005",
        "on-secondary-container": "#bab8b7", "outline-variant": "#5a4137", primary: "#ffb596",
        "error-container": "#93000a", "on-surface": "#e5e2e1", "inverse-on-surface": "#313030",
        "surface-variant": "#353534", "on-surface-variant": "#e2bfb2", "tertiary-container": "#00a2eb",
        "on-secondary-fixed": "#1c1b1b", "on-primary": "#581e00", "secondary-fixed": "#e5e2e1",
        "inverse-primary": "#a43e00", "primary-container": "#ff6b1a", "inverse-surface": "#e5e2e1",
        "surface-container": "#201f1f", "surface-dim": "#131313", "on-secondary": "#313030",
        "surface-container-lowest": "#0e0e0e", outline: "#a98a7e", "on-tertiary-fixed-variant": "#004b70",
        tertiary: "#8dcdff", "secondary-fixed-dim": "#c8c6c5", "surface-container-highest": "#353534",
        "on-error-container": "#ffdad6", "secondary-container": "#4a4949", "surface-bright": "#3a3939",
        "primary-fixed-dim": "#ffb596", background: "#131313", "surface-tint": "#ffb596", secondary: "#c8c6c5",
        "brand-black": "#0A0A0A", "brand-surface": "#141414", "brand-overlay": "#1F1F1F"
      },
      borderRadius: {DEFAULT: "0.125rem", lg: "0.25rem", xl: "0.5rem", full: "0.75rem"},
      fontFamily: {
        "label-caps": ["Hind"], "headline-sm": ["Hind"], "body-lg": ["DM Sans"],
        "display-lg-mobile": ["Hind"], "body-md": ["DM Sans"], "display-lg": ["Hind"],
        "headline-md": ["Hind"], headline: ["Hind"], display: ["Hind"], body: ["Dm Sans"], label: ["Hind"]
      }
    }
  }
};
</script>
<style>
  /* Custom Utilities */
  body { background-color: #0A0A0A; color: #e5e2e1; }
  .noise-bg {
    /* Removed feTurbulence SVG noise because it causes 50MB PDF bloat in Chromium print engine */
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none;
    opacity: 0.02;
    background-color: #1a1a1a;
  }
</style>
</head>
<body class="font-body-md antialiased overflow-x-hidden min-h-screen flex flex-col">
<div class="noise-bg z-[-1]"></div>
<main class="flex-grow flex items-center justify-center p-4 sm:p-8">
<div class="max-w-md w-full mx-auto relative z-10">
<!-- Ticket Container -->
<div class="bg-brand-surface rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
<!-- Top Tear-away Stub (Inverted) -->
<div class="p-6 border-b-2 border-dashed border-white/20 bg-[#1A1A1A] text-center relative">
<!-- Left Notch -->
<div class="absolute -bottom-4 -left-4 w-8 h-8 rounded-full bg-[#0A0A0A] transform rotate-45"></div>
<!-- Right Notch -->
<div class="absolute -bottom-4 -right-4 w-8 h-8 rounded-full bg-[#0A0A0A] transform -rotate-45"></div>
<p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase mb-2">Digital Ticket</p>
<h1 class="font-headline-md text-3xl font-bold text-primary-container tracking-wide">${data.ticketNumber}</h1>
</div>
<!-- Main Body -->
<div class="p-8 sm:p-10 flex flex-col items-center text-center">
<!-- Typography: Extreme contrast -->
<h2 class="font-headline-md text-[32px] leading-tight font-bold text-on-surface mb-2">${data.eventName}</h2>
<p class="font-body-lg text-lg text-on-surface-variant font-light mb-10">Admitting <span class="font-bold text-on-surface">${data.fullName}</span></p>
<div class="w-full grid grid-cols-2 gap-x-4 mb-12 text-left">
<div class="flex flex-col gap-1">
<p class="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Date</p>
<p class="font-headline-sm text-xl font-bold text-on-surface leading-none">${data.eventDate}</p>
<p class="font-body-md text-sm text-on-surface-variant font-light">${data.eventTime}</p>
</div>
<div class="flex flex-col gap-1">
<p class="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Venue</p>
<p class="font-headline-sm text-xl font-bold text-on-surface leading-none">${data.venueName}</p>
<p class="font-body-md text-sm text-on-surface-variant font-light">${data.venueLocation}</p>
</div>
</div>
<!-- QR Code with Minimalist Spotlight Halo -->
<div class="relative flex justify-center items-center w-full pt-4 pb-2">
<!-- Glowing Halo -->
<div class="absolute inset-0 bg-primary-container opacity-30 blur-[60px] rounded-full w-48 h-48 mx-auto pointer-events-none"></div>
<div class="relative z-10 bg-white p-3 rounded-2xl shadow-[0_0_40px_rgba(255,107,26,0.15)]">
<img alt="QR Code" class="w-[140px] h-[140px]" src="${data.qrCodeDataUri}"/>
</div>
</div>
<p class="font-body-md text-sm text-on-surface-variant mt-6 font-light">Scan at the entrance</p>
</div>
</div>
</div>
</main>
</body>
</html>`;
}
