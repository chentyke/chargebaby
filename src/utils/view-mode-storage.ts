/**
 * 视图模式和滚动位置存储工具
 * 用于在 localStorage 中持久化用户的视图选择和滚动位置
 */

export type ViewMode = 'grid' | 'list';

const VIEW_MODE_STORAGE_KEY = 'chargebaby_view_mode';
const SCROLL_POSITION_STORAGE_KEY = 'chargebaby_scroll_position';

/**
 * 获取存储的视图模式
 */
export function getStoredViewMode(): ViewMode {
  if (typeof window === 'undefined') {
    return 'grid'; // SSR 默认值
  }
  
  try {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return (stored === 'grid' || stored === 'list') ? stored : 'grid';
  } catch (error) {
    console.warn('Failed to read view mode from localStorage:', error);
    return 'grid';
  }
}

/**
 * 保存视图模式到存储
 */
export function setStoredViewMode(mode: ViewMode): void {
  if (typeof window === 'undefined') {
    return; // SSR 环境下不操作
  }
  
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch (error) {
    console.warn('Failed to save view mode to localStorage:', error);
  }
}

/**
 * 清除存储的视图模式（用于调试或重置）
 */
export function clearStoredViewMode(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(VIEW_MODE_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear view mode from localStorage:', error);
  }
}

/**
 * 滚动位置管理
 */
interface ScrollPositionData {
  scrollY: number;
  timestamp: number;
  pathname: string;
  viewMode: ViewMode;
}

/**
 * 保存当前页面的滚动位置
 */
export function saveScrollPosition(pathname: string, viewMode: ViewMode): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const scrollData: ScrollPositionData = {
      scrollY: window.scrollY,
      timestamp: Date.now(),
      pathname,
      viewMode
    };
    localStorage.setItem(SCROLL_POSITION_STORAGE_KEY, JSON.stringify(scrollData));
  } catch (error) {
    console.warn('Failed to save scroll position:', error);
  }
}

/**
 * 获取存储的滚动位置
 */
export function getStoredScrollPosition(pathname: string, viewMode: ViewMode): number | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(SCROLL_POSITION_STORAGE_KEY);
    if (!stored) return null;

    const scrollData: ScrollPositionData = JSON.parse(stored);
    
    // 检查路径和视图模式是否匹配，以及数据是否过期（超过30分钟）
    const isExpired = Date.now() - scrollData.timestamp > 30 * 60 * 1000;
    const isMatchingPath = scrollData.pathname === pathname;
    const isMatchingViewMode = scrollData.viewMode === viewMode;
    
    if (!isExpired && isMatchingPath && isMatchingViewMode) {
      return scrollData.scrollY;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to read scroll position from localStorage:', error);
    return null;
  }
}

/**
 * 清除存储的滚动位置
 */
export function clearStoredScrollPosition(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(SCROLL_POSITION_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear scroll position from localStorage:', error);
  }
}