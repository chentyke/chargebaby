'use client';

import { useEffect, useState } from 'react';
import { detectDevice, isLowPerformanceDevice, getPerformanceLevel } from '@/utils/device-detection';
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
    const userAgent = navigator.userAgent.toLowerCase();
    
    // 检测是否为低性能设备（所有Chrome浏览器 + 所有安卓设备）
    const isLowPerf = isLowPerformanceDevice();
    const isChrome = /chrome/.test(userAgent) && !/edge|edg/.test(userAgent);
    
    // 为低性能设备添加优化类
    if (isLowPerf) {
      setOptimizationClass('android-optimized');
      
      // 添加具体的设备类型标识
      if (device.isAndroid) {
        document.body.classList.add('android-device');
        if (isChrome) {
          document.body.classList.add('chrome-android');
        }
      } else if (isChrome) {
        // Chrome浏览器在非安卓设备上（Mac、iOS、Windows等）
        document.body.classList.add('chrome-browser');
        if (device.isIOS) {
          document.body.classList.add('chrome-ios');
        } else if (device.isDesktop) {
          document.body.classList.add('chrome-desktop');
        }
      } else {
        document.body.classList.add('low-performance-device');
      }
    } else if (device.isIOS) {
      document.body.classList.add('ios-device');
    } else if (device.isDesktop) {
      document.body.classList.add('desktop-device');
    }

    // 添加性能级别类
    const performanceLevel = getPerformanceLevel();
    document.body.classList.add(`performance-${performanceLevel}`);

    // 清理函数
    return () => {
      document.body.classList.remove(
        'android-device', 'ios-device', 'desktop-device', 
        'chrome-android', 'chrome-browser', 'chrome-ios', 'chrome-desktop',
        'low-performance-device',
        'performance-low', 'performance-medium', 'performance-high'
      );
    };
  }, []);

  // 在客户端挂载前使用默认类名
  return (
    <div className={cn(isMounted ? optimizationClass : '', className)}>
      {children}
    </div>
  );
}