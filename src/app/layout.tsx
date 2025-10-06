import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ConditionalFooter } from '@/components/conditional-footer';
import { ThemeGuard } from '@/components/theme-guard';
import { cn } from '@/lib/utils';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

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
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="scroll-smooth" suppressHydrationWarning>
      <body className={cn(inter.className, 'bg-background text-foreground transition-colors')}>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const storageKey='theme-preference';const saved=localStorage.getItem(storageKey);const pref=saved==='light'||saved==='dark'||saved==='system'?saved:'system';const media=window.matchMedia('(prefers-color-scheme: dark)');const resolvedPref=pref==='system'?(media.matches?'dark':'light'):pref;const normalize=(pathname)=>{const trimmed=pathname.replace(/\/+$/,'');return trimmed.length>0?trimmed:'/';};const pathname=normalize(window.location.pathname||'');const onDocs=pathname==='/docs'||pathname.startsWith('/docs/');const finalTheme=onDocs?resolvedPref:'light';document.documentElement.classList.toggle('dark',finalTheme==='dark');document.documentElement.dataset.theme=finalTheme;}catch(e){}})();`,
          }}
        />
        <ThemeGuard />
        <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors">
          {/* 主要内容区域 */}
          <main className="flex-1">
            {children}
          </main>
          <ConditionalFooter />
        </div>
      </body>
    </html>
  );
}

