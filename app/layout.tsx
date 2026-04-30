import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jambo',
  description: 'Apprends le kirundi et le swahili',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Jambo',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#C2410C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-cream text-ink">{children}</body>
    </html>
  );
}
