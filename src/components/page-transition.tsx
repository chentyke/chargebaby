'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
    
    // 预加载路由
    const prefetchTimer = setTimeout(() => {
      // 预加载常用路由
      router.prefetch('/');
    }, 100);

    return () => clearTimeout(prefetchTimer);
  }, [router]);

  return (
    <div className={`min-h-screen transition-all duration-500 ease-out ${
      isVisible 
        ? 'opacity-100 translate-y-0 scale-100' 
        : 'opacity-0 translate-y-4 scale-98'
    } ${className}`}>
      {children}
    </div>
  );
}

export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const startTransition = () => setIsTransitioning(true);
  const endTransition = () => setIsTransitioning(false);
  
  return { isTransitioning, startTransition, endTransition };
}