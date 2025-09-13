import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '移动电源数据库 - ChargeBaby',
  description: '测试数据收集与量化评分的移动电源数据库',
  keywords: ['充电宝', '移动电源', '性能测试', '产品对比', '快充', '评分', '数据库'],
  authors: [{ name: 'ChargeBaby Team' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: '移动电源数据库 - ChargeBaby',
    description: '测试数据收集与量化评分的移动电源数据库',
    type: 'website',
    locale: 'zh_CN',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'ChargeBaby',
  },
  twitter: {
    card: 'summary_large_image',
    title: '移动电源数据库 - ChargeBaby',
    description: '测试数据收集与量化评分的移动电源数据库',
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



