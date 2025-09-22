'use client';

import { useEffect, useState } from 'react';

interface ICPBeianProps {
  className?: string;
  variant?: 'detail-mobile' | 'detail-desktop' | 'footer';
}

export function ICPBeian({ className = '', variant = 'footer' }: ICPBeianProps) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    // 支持 chargedb.cn 和 localhost (用于调试)
    const showCondition = hostname === 'chargedb.cn' || hostname === 'localhost';
    setShouldShow(showCondition);
  }, []);

  if (!shouldShow) {
    return null;
  }

  // 根据变体设置不同的样式
  const getStyles = () => {
    switch (variant) {
      case 'detail-mobile':
        return {
          container: "text-center mt-4 pt-4 border-t border-gray-200",
          link: "text-[11px] text-gray-400 hover:text-gray-500 transition-colors"
        };
      case 'detail-desktop':
        return {
          container: "text-center pt-4 border-t border-gray-200",
          link: "text-[11px] text-gray-400 hover:text-gray-500 transition-colors"
        };
      case 'footer':
      default:
        return {
          container: "",
          link: "text-sm text-gray-500 hover:text-gray-600 transition-colors"
        };
    }
  };

  const styles = getStyles();

  // Footer变体时，只返回链接，容器由Footer组件处理
  if (variant === 'footer') {
    return (
      <a 
        href="http://beian.miit.gov.cn/" 
        target="_blank" 
        rel="noopener noreferrer"
        className={`${styles.link} ${className}`}
      >
        浙ICP备2025199560号-1
      </a>
    );
  }

  // 详情页变体时，返回完整的容器
  return (
    <div className={`${styles.container} ${className}`}>
      <a 
        href="http://beian.miit.gov.cn/" 
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.link}
      >
        浙ICP备2025199560号-1
      </a>
    </div>
  );
}