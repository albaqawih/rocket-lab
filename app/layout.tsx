import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ثورة الصواريخ — مختبر الصاروخ الذكي',
  description: 'مختبر تعليمي تفاعلي لتصميم الصواريخ الافتراضية وفهم مفاهيم الاستقرار والأبعاد الهندسية',
  keywords: ['صاروخ', 'مختبر', 'تعليم', 'علوم', 'هندسة', 'محاكاة'],
  authors: [{ name: 'ثورة الصواريخ' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-cairo antialiased bg-space-dark text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
