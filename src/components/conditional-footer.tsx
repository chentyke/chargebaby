'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // 检查是否为详情页面（格式：/产品型号 或 /产品型号/detail）
  const isDetailPage = pathname.match(/^\/[^\/]+(?:\/detail)?$/);
  
  // 如果是详情页面，不显示全局Footer
  if (isDetailPage) {
    return null;
  }
  
  return <Footer />;
}