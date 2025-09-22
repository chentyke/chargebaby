import { useState, useEffect, useMemo } from 'react';
import { 
  detectDevice, 
  isLowPerformanceDevice, 
  getPerformanceLevel, 
  shouldEnableAnimations, 
  shouldEnableBackdropBlur,
  type DeviceInfo 
} from '@/utils/device-detection';

export interface PerformanceConfig {
  // 动画相关
  enableAnimations: boolean;
  enableHoverEffects: boolean;
  enableTransitions: boolean;
  animationDuration: number;
  
  // 视觉效果
  enableBackdropBlur: boolean;
  enableShadows: boolean;
  enableGradients: boolean;
  
  // 渲染优化
  enableWillChange: boolean;
  enableTransform3d: boolean;
  
  // 性能级别
  performanceLevel: 'low' | 'medium' | 'high';
  
  // 设备信息
  device: DeviceInfo;
}

/**
 * 性能优化Hook
 * 根据设备类型自动调整性能配置
 */
export function usePerformanceOptimization(): PerformanceConfig {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const config = useMemo((): PerformanceConfig => {
    // 服务端渲染时使用默认配置
    if (!isMounted) {
      return {
        enableAnimations: true,
        enableHoverEffects: true,
        enableTransitions: true,
        animationDuration: 200,
        enableBackdropBlur: true,
        enableShadows: true,
        enableGradients: true,
        enableWillChange: true,
        enableTransform3d: true,
        performanceLevel: 'high' as const,
        device: {
          isAndroid: false,
          isIOS: false,
          isMobile: false,
          isTablet: false,
          isDesktop: true,
          userAgent: '',
          supportsBackdropFilter: true,
          supportsWillChange: true,
        },
      };
    }

    // 客户端渲染时使用实际设备检测
    const device = detectDevice();
    const performanceLevel = getPerformanceLevel();
    const isLowPerf = isLowPerformanceDevice();
    const enableAnimations = shouldEnableAnimations();
    const enableBackdropBlur = shouldEnableBackdropBlur();

    // 基础配置
    let baseConfig: PerformanceConfig = {
      enableAnimations: true,
      enableHoverEffects: true,
      enableTransitions: true,
      animationDuration: 200,
      enableBackdropBlur: true,
      enableShadows: true,
      enableGradients: true,
      enableWillChange: true,
      enableTransform3d: true,
      performanceLevel,
      device,
    };

    // 根据性能级别调整配置
    switch (performanceLevel) {
      case 'low':
        // 低性能设备（主要是安卓）- 激进优化
        return {
          ...baseConfig,
          enableAnimations: enableAnimations && false, // 禁用复杂动画
          enableHoverEffects: false, // 禁用hover效果
          enableTransitions: false, // 禁用过渡效果
          animationDuration: 100, // 缩短动画时间
          enableBackdropBlur: false, // 禁用毛玻璃
          enableShadows: false, // 禁用阴影
          enableGradients: false, // 禁用渐变
          enableWillChange: device.supportsWillChange,
          enableTransform3d: false,
        };
        
      case 'medium':
        // 中等性能设备（iOS移动设备）- 适度优化
        return {
          ...baseConfig,
          enableAnimations: enableAnimations,
          enableHoverEffects: false, // 移动设备不需要hover
          enableTransitions: true,
          animationDuration: 150,
          enableBackdropBlur: enableBackdropBlur,
          enableShadows: true,
          enableGradients: true,
          enableWillChange: device.supportsWillChange,
          enableTransform3d: true,
        };
        
      case 'high':
      default:
        // 高性能设备（桌面）- 完整体验
        return {
          ...baseConfig,
          enableAnimations: enableAnimations,
          enableHoverEffects: true,
          enableTransitions: true,
          animationDuration: 200,
          enableBackdropBlur: enableBackdropBlur,
          enableShadows: true,
          enableGradients: true,
          enableWillChange: device.supportsWillChange,
          enableTransform3d: true,
        };
    }
  }, [isMounted]);

  return config;
}

/**
 * 获取优化后的CSS类名
 */
export function useOptimizedClassName(baseClassName: string, config: PerformanceConfig): string {
  return useMemo(() => {
    let className = baseClassName;
    
    // 根据配置移除或替换类名
    if (!config.enableBackdropBlur) {
      className = className
        .replace(/backdrop-blur-\w+/g, '') // 移除毛玻璃
        .replace(/backdrop-blur/g, '');
    }
    
    if (!config.enableShadows) {
      className = className
        .replace(/shadow-\w+/g, '') // 移除阴影
        .replace(/drop-shadow-\w+/g, '');
    }
    
    if (!config.enableTransitions) {
      className = className
        .replace(/transition-\w+/g, '') // 移除过渡
        .replace(/duration-\w+/g, '')
        .replace(/ease-\w+/g, '');
    }
    
    if (!config.enableHoverEffects) {
      className = className
        .replace(/hover:[\w-:]+/g, '') // 移除hover效果
        .replace(/hover-hover:[\w-:]+/g, '');
    }
    
    // 清理多余空格
    return className.replace(/\s+/g, ' ').trim();
  }, [baseClassName, config]);
}

/**
 * 获取优化后的内联样式
 */
export function useOptimizedStyle(baseStyle: React.CSSProperties, config: PerformanceConfig): React.CSSProperties {
  return useMemo(() => {
    const style = { ...baseStyle };
    
    if (!config.enableBackdropBlur) {
      delete style.backdropFilter;
      delete style.WebkitBackdropFilter;
    }
    
    if (!config.enableTransitions) {
      delete style.transition;
      delete style.transitionProperty;
      delete style.transitionDuration;
      delete style.transitionTimingFunction;
    }
    
    if (config.enableWillChange && config.enableAnimations) {
      style.willChange = 'transform';
    }
    
    return style;
  }, [baseStyle, config]);
}