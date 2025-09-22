'use client';

import { useEffect, useState } from 'react';
import { detectDevice } from '@/utils/device-detection';
import { cn } from '@/lib/utils';

interface DeviceOptimizedContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 设备优化容器组件
 * 根据设备类型自动应用优化CSS类
 */
export function DeviceOptimizedContainer({ children, className }: DeviceOptimizedContainerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [optimizationClass, setOptimizationClass] = useState<string>('');

  useEffect(() => {
    setIsMounted(true);
    const device = detectDevice();
    
    // 为安卓设备添加优化类
    if (device.isAndroid) {
      setOptimizationClass('android-optimized');
      
      // 同时在document.body上添加类，方便全局样式应用
      document.body.classList.add('android-device');
    } else if (device.isIOS) {
      document.body.classList.add('ios-device');
    } else if (device.isDesktop) {
      document.body.classList.add('desktop-device');
    }

    // 添加性能级别类
    const performanceLevel = device.isAndroid ? 'low' : device.isMobile ? 'medium' : 'high';
    document.body.classList.add(`performance-${performanceLevel}`);

    // 清理函数
    return () => {
      document.body.classList.remove('android-device', 'ios-device', 'desktop-device');
      document.body.classList.remove('performance-low', 'performance-medium', 'performance-high');
    };
  }, []);

  // 在客户端挂载前使用默认类名
  return (
    <div className={cn(isMounted ? optimizationClass : '', className)}>
      {children}
    </div>
  );
}