import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Intervia — AI-Powered Interview Video Room',
  description: 'Conduct minimal, fast video interviews with real-time transcription and instant AI candidate evaluation.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${jakarta.variable} bg-[#090a0f] text-gray-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200`}>
        {children}
      </body>
    </html>
  );
}
