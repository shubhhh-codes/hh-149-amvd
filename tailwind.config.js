/**
 * @copyright (c) 2024 - Present
 * @author github.com/kunalg932
 * @license MIT
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "tertiary-fixed-dim": "#8dcdff",
        "on-primary-container": "#591e00",
        "surface-container-low": "#1c1b1b",
        "on-primary-fixed-variant": "#7d2d00",
        "surface": "#131313",
        "tertiary-fixed": "#cae6ff",
        "on-tertiary-container": "#003550",
        "surface-container-high": "#2a2a2a",
        "primary-fixed": "#ffdbcd",
        "on-primary-fixed": "#360f00",
        "on-tertiary": "#00344f",
        "error": "#ffb4ab",
        "on-background": "#e5e2e1",
        "on-tertiary-fixed": "#001e30",
        "on-secondary-fixed-variant": "#474646",
        "on-error": "#690005",
        "on-secondary-container": "#bab8b7",
        "outline-variant": "#5a4137",
        "primary": "#ffb596",
        "error-container": "#93000a",
        "on-surface": "#e5e2e1",
        "inverse-on-surface": "#313030",
        "surface-variant": "#353534",
        "on-surface-variant": "#e2bfb2",
        "tertiary-container": "#00a2eb",
        "on-secondary-fixed": "#1c1b1b",
        "on-primary": "#581e00",
        "secondary-fixed": "#e5e2e1",
        "inverse-primary": "#a43e00",
        "primary-container": "#ff6b1a",
        "inverse-surface": "#e5e2e1",
        "surface-container": "#201f1f",
        "surface-dim": "#131313",
        "on-secondary": "#313030",
        "surface-container-lowest": "#0e0e0e",
        "outline": "#a98a7e",
        "on-tertiary-fixed-variant": "#004b70",
        "tertiary": "#8dcdff",
        "secondary-fixed-dim": "#c8c6c5",
        "surface-container-highest": "#353534",
        "on-error-container": "#ffdad6",
        "secondary-container": "#4a4949",
        "surface-bright": "#3a3939",
        "primary-fixed-dim": "#ffb596",
        "background": "#131313",
        "surface-tint": "#ffb596",
        "secondary": "#c8c6c5",
        "brand-black": "#0A0A0A",
        "brand-surface": "#141414",
        "brand-overlay": "#1F1F1F"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "9999px",
        "card": "8px"
      },
      spacing: {
        "unit": "8px",
        "container-max": "1120px",
        "margin-desktop": "48px",
        "gutter": "20px",
        "margin-mobile": "16px"
      },
      fontFamily: {
        "label-caps": ["Hind", "sans-serif"],
        "headline-sm": ["Hind", "sans-serif"],
        "body-lg": ["DM Sans", "sans-serif"],
        "display-lg-mobile": ["Hind", "sans-serif"],
        "body-md": ["DM Sans", "sans-serif"],
        "display-lg": ["Hind", "sans-serif"],
        "headline-md": ["Hind", "sans-serif"]
      },
      fontSize: {
        "label-caps": ["12px", { "lineHeight": "1", "letterSpacing": "0.1em", "fontWeight": "700" }],
        "headline-sm": ["20px", { "lineHeight": "1.2", "fontWeight": "600" }],
        "body-lg": ["15px", { "lineHeight": "1.6", "fontWeight": "400" }],
        "display-lg-mobile": ["32px", { "lineHeight": "1.1", "fontWeight": "700" }],
        "body-md": ["14px", { "lineHeight": "1.5", "fontWeight": "400" }],
        "display-lg": ["52px", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "headline-md": ["26px", { "lineHeight": "1.2", "fontWeight": "600" }]
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
} 