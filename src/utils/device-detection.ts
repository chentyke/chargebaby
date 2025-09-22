/**
 * 设备检测工具
 * 用于识别访问设备类型，特别是安卓设备
 */

export interface DeviceInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  supportsBackdropFilter: boolean;
  supportsWillChange: boolean;
}

/**
 * 检测当前设备信息
 */
export function detectDevice(): DeviceInfo {
  // 服务端渲染时的默认值
  if (typeof window === 'undefined') {
    return {
      isAndroid: false,
      isIOS: false,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      userAgent: '',
      supportsBackdropFilter: false,
      supportsWillChange: false,
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  
  // 检测操作系统
  const isAndroid = /android/.test(userAgent);
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  
  // 检测设备类型
  const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/.test(userAgent);
  const isTablet = /ipad|android(?!.*mobile)|tablet/.test(userAgent);
  const isDesktop = !isMobile && !isTablet;

  // 检测浏览器特性支持
  const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(1px)') || 
                                  CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
  
  const supportsWillChange = CSS.supports('will-change', 'transform');

  return {
    isAndroid,
    isIOS,
    isMobile,
    isTablet,
    isDesktop,
    userAgent,
    supportsBackdropFilter,
    supportsWillChange,
  };
}

/**
 * 检测是否为低性能设备（主要针对安卓）
 */
export function isLowPerformanceDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const device = detectDevice();
  
  // 安卓设备被认为是低性能设备（相对于iOS和桌面端）
  if (device.isAndroid) return true;
  
  // 检测设备内存（如果支持）
  if ('deviceMemory' in navigator) {
    const memory = (navigator as any).deviceMemory;
    if (memory && memory < 4) return true; // 少于4GB内存
  }
  
  // 检测硬件并发数
  if ('hardwareConcurrency' in navigator) {
    const cores = navigator.hardwareConcurrency;
    if (cores && cores < 4) return true; // 少于4核
  }
  
  return false;
}

/**
 * 获取性能级别
 */
export function getPerformanceLevel(): 'low' | 'medium' | 'high' {
  if (typeof window === 'undefined') return 'high';
  
  const device = detectDevice();
  
  // 安卓设备默认为低性能
  if (device.isAndroid) return 'low';
  
  // 移动设备为中等性能
  if (device.isMobile || device.isTablet) return 'medium';
  
  // 桌面设备为高性能
  return 'high';
}

/**
 * 检测是否应该启用动画
 */
export function shouldEnableAnimations(): boolean {
  if (typeof window === 'undefined') return true;
  
  // 检测用户的动画偏好
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return false;
  
  // 低性能设备减少动画
  const performanceLevel = getPerformanceLevel();
  return performanceLevel !== 'low';
}

/**
 * 检测是否应该启用毛玻璃效果
 */
export function shouldEnableBackdropBlur(): boolean {
  if (typeof window === 'undefined') return false;
  
  const device = detectDevice();
  
  // 安卓设备禁用毛玻璃
  if (device.isAndroid) return false;
  
  // 检测浏览器支持
  if (!device.supportsBackdropFilter) return false;
  
  return true;
}