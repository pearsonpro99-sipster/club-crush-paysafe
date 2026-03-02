import type { Metadata } from 'next';
import './globals.css';
import ServiceWorkerInit from '@/app/components/ServiceWorkerInit';

export const metadata: Metadata = {
  title: 'Dizplai Fan Games',
  description: 'Sports fan games — Club Crush, Flappy Bird & more. Earn points, climb the leaderboard, win prizes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Fan Games" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
        <ServiceWorkerInit />
        {children}
      </body>
    </html>
  );
}
