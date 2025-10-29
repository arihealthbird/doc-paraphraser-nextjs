import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Document Paraphraser',
  description: 'AI-powered document paraphrasing service for PDF, DOCX, and TXT files',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
