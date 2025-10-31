import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Nick's Document System - AI Paraphrasing",
  description: 'Professional AI-powered document paraphrasing with 10+ advanced models. Process up to 700+ pages with Claude, GPT-4, DeepSeek, and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=chillax@600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
