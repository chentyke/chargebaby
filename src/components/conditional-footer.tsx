'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // 定义已知的非详情页面路径
  const knownPages = ['/ranking', '/compare', '/submit', '/'];
  
  // 如果是已知页面，显示Footer
  if (knownPages.includes(pathname)) {
    return <Footer />;
  }
  
  // 检查是否为详情页面（格式：/产品型号 或 /产品型号/detail）
  // 详情页面不显示全局Footer，因为有内嵌的ICP备案
  const isDetailPage = pathname.match(/^\/[^\/]+(?:\/detail)?$/);
  
  if (isDetailPage) {
    return null;
  }
  
  // 其他未知页面也显示Footer
  return <Footer />;
}