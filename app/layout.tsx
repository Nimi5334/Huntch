import type { Metadata } from 'next';
import { DM_Sans, Libre_Baskerville, Frank_Ruhl_Libre, Heebo, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// SPA prototype: pages are client components. We let Next statically
// prerender the route shells (default behaviour) so client-side navigation is
// served instantly from the prefetched route cache instead of round-tripping
// the server on every tab switch. (A previous `force-dynamic` here made every
// route server-rendered on demand, causing slow, inconsistent page loads.)

// ── Chalk & Cedar type system ──
// UI text: DM Sans (latin) + Heebo (hebrew). Headlines: Libre Baskerville (latin serif) + Frank Ruhl Libre (hebrew serif).
// Data / numbers: JetBrains Mono.
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
});

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-he',
  display: 'swap',
});

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-head',
  display: 'swap',
});

const frankRuhl = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['500', '700', '900'],
  variable: '--font-head-he',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Huntch',
  description: 'גיוס חכם לעסקי מזון ואירוח',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#fdfcfa',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${dmSans.variable} ${heebo.variable} ${libreBaskerville.variable} ${frankRuhl.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
