import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化价格
 */
export function formatPrice(price?: number | null): string {
  if (price === null || price === undefined) {
    return '价格待定';
  }

  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(price);
}

/**
 * 格式化评分
 */
export function formatRating(rating: number): string {
  return `${rating.toFixed(1)}`;
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * 格式化发售时间为相对时间
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMonths = (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth();
  
  if (diffInMonths < 1) {
    return '本月发售';
  } else if (diffInMonths < 12) {
    return `${diffInMonths}个月前发售`;
  } else {
    const years = Math.floor(diffInMonths / 12);
    return `${years}年前发售`;
  }
}

/**
 * 获取性能评级颜色 (基于1-100评分)
 */
export function getPerformanceColor(rating: number): string {
  if (rating >= 85) return 'text-green-600';
  if (rating >= 70) return 'text-blue-600';
  if (rating >= 55) return 'text-yellow-600';
  if (rating >= 40) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * 获取性能评级文本 (基于1-100评分)
 */
export function getPerformanceText(rating: number): string {
  if (rating >= 85) return '优秀';
  if (rating >= 70) return '良好';
  if (rating >= 55) return '一般';
  if (rating >= 40) return '较差';
  return '差';
}

/**
 * 获取评分进度条宽度百分比
 */
export function getRatingProgress(rating: number, maxRating: number = 100): number {
  return Math.min(Math.max((rating / maxRating) * 100, 0), 100);
}

/**
 * 获取不同评分类型的满分
 */
export function getMaxRating(ratingType: string): number {
  const maxRatings: Record<string, number> = {
    selfCharging: 40,
    output: 35,
    energy: 20,
    portability: 40,
    chargingProtocols: 30,
    multiPort: 20,
    overall: 100,
    performance: 100,
    experience: 100
  };
  return maxRatings[ratingType] || 100;
}

/**
 * 获取评分等级
 */
export function getRatingGrade(rating: number): string {
  if (rating >= 90) return 'S';
  if (rating >= 80) return 'A';
  if (rating >= 70) return 'B';
  if (rating >= 60) return 'C';
  if (rating >= 50) return 'D';
  return 'F';
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generate a stable anchor slug for headings, keeping support for CJK characters.
 */
export function slugifyHeading(input: string): string {
  const text = input.trim();
  if (!text) {
    return '';
  }

  const normalized = text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\w\s\u3400-\u4dbf\u4e00-\u9fff-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (normalized) {
    return normalized;
  }

  return text.replace(/\s+/g, '-');
}
