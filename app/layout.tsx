import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  axes: ['SOFT', 'opsz'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://pawly.app'),
  title: {
    default: 'Pawly — Your AI dog care companion',
    template: '%s · Pawly',
  },
  description:
    "The calm, caring, breed-aware app that helps you raise a happier, healthier dog. Personalised feeding, walks, training and health reminders — built around your dog.",
  keywords: ['dog care', 'puppy app', 'dog health tracker', 'dog feeding calculator', 'dog training', 'AI dog assistant'],
  openGraph: {
    title: 'Pawly — Your AI dog care companion',
    description: 'Personalised, breed-aware dog care for the modern owner.',
    type: 'website',
    siteName: 'Pawly',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pawly — Your AI dog care companion',
    description: 'Personalised, breed-aware dog care for the modern owner.',
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#FAF6F0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-sans bg-cream text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
