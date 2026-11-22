import './globals.css';
import type { Metadata, Viewport } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'HELP U — Autonomous AI Job Application & Resume Agent',
  description: 'AI-driven career assistant that builds your ATS resume, discovers matching jobs, applies automatically via Playwright, and tracks progress.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4f46e5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased text-slate-900">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
