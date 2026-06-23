/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  // IMPORTANT: preflight OFF so Tailwind's reset does not clobber the
  // existing plain-CSS design system in app/globals.css. Utilities still
  // work for the shadcn components under /components/ui.
  corePlugins: { preflight: false },
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Chalk & Cedar mapped to shadcn semantic color names (literal values,
      // namespaced away from the app's own --accent/--card/--muted CSS vars).
      colors: {
        border: '#e8ddd5',
        input: '#e8ddd5',
        ring: '#4a7a5a',
        background: '#fdfcfa',
        foreground: '#221b16',
        primary: { DEFAULT: '#4a7a5a', foreground: '#ffffff' },
        secondary: { DEFAULT: '#f3ece4', foreground: '#221b16' },
        destructive: { DEFAULT: '#b3402e', foreground: '#ffffff' },
        muted: { DEFAULT: '#f0e9e1', foreground: '#7c6f63' },
        accent: { DEFAULT: '#f0ebe4', foreground: '#221b16' },
        popover: { DEFAULT: '#ffffff', foreground: '#221b16' },
        card: { DEFAULT: '#ffffff', foreground: '#221b16' },
      },
      keyframes: {
        'slide-up-fade': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up-fade': 'slide-up-fade 0.4s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
