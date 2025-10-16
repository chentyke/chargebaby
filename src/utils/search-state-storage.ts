/**
 * 搜索状态存储工具
 * 用于在 localStorage 中持久化用户的搜索和筛选状态
 */

import { ChargeBaby, SortOption } from '@/types/chargebaby';

const SEARCH_STATE_STORAGE_KEY = 'chargebaby_search_state';

export interface SearchState {
  searchQuery: string;
  timestamp: number;
  pathname: string;
  // 筛选状态可以扩展，现在先保存基本的搜索查询
}

/**
 * 保存当前搜索状态
 */
export function saveSearchState(searchQuery: string, pathname: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const searchState: SearchState = {
      searchQuery: searchQuery.trim(),
      timestamp: Date.now(),
      pathname
    };
    localStorage.setItem(SEARCH_STATE_STORAGE_KEY, JSON.stringify(searchState));
  } catch (error) {
    console.warn('Failed to save search state:', error);
  }
}

/**
 * 获取存储的搜索状态
 */
export function getStoredSearchState(pathname: string): SearchState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(SEARCH_STATE_STORAGE_KEY);
    if (!stored) return null;

    const searchState: SearchState = JSON.parse(stored);
    
    // 检查路径是否匹配，以及数据是否过期（超过30分钟）
    const isExpired = Date.now() - searchState.timestamp > 30 * 60 * 1000;
    const isMatchingPath = searchState.pathname === pathname;
    
    if (!isExpired && isMatchingPath) {
      return searchState;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to read search state from localStorage:', error);
    return null;
  }
}

/**
 * 清除存储的搜索状态
 */
export function clearSearchState(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(SEARCH_STATE_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear search state from localStorage:', error);
  }
}

