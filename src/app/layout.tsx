import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '充电宝性能展示 - ChargeBaby',
  description: '专业的充电宝性能测试和对比平台，帮您选择最适合的充电宝产品',
  keywords: ['充电宝', '移动电源', '性能测试', '产品对比', '快充'],
  authors: [{ name: 'ChargeBaby Team' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: '充电宝性能展示 - ChargeBaby',
    description: '专业的充电宝性能测试和对比平台',
    type: 'website',
    locale: 'zh_CN',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'ChargeBaby',
  },
  twitter: {
    card: 'summary_large_image',
    title: '充电宝性能展示 - ChargeBaby',
    description: '专业的充电宝性能测试和对比平台',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="scroll-smooth">
      <body className={inter.className}>
        <div className="min-h-screen bg-white">
          {/* 主要内容区域 */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}



