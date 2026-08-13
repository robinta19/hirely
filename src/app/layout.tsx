import type { Metadata } from 'next';
import { Geist, Inter } from 'next/font/google';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Hirely — AI-Powered Video Interview & Candidate Assessment',
  description: 'Conduct fast, secure video interviews with real-time speech transcription and instant AI candidate evaluation.',
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
    <html lang="en" className={`dark ${geist.variable} ${inter.variable}`}>
      <body className="font-sans bg-[#050507] text-gray-100 antialiased selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
