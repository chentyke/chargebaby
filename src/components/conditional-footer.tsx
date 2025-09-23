'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Footer } from './footer';

export function ConditionalFooter() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  
  // 确保组件在客户端挂载后才进行路径判断
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // 在服务端渲染期间，不渲染Footer以避免hydration不匹配
  if (!isMounted) {
    return null;
  }
  
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