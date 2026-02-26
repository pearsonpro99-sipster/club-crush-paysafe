import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Club Crush',
  description: 'Sports fan match-3 game by Dizplai',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
