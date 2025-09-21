/**
 * 搜索历史记录管理工具
 */

const SEARCH_HISTORY_KEY = 'chargebaby_search_history';
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

/**
 * 获取搜索历史记录
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored) as SearchHistoryItem[];
    // 按时间倒序排列
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('获取搜索历史失败:', error);
    return [];
  }
}

/**
 * 添加搜索记录
 */
export function addSearchHistory(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return;
  
  try {
    const history = getSearchHistory();
    const trimmedQuery = query.trim();
    
    // 检查是否已存在相同查询
    const existingIndex = history.findIndex(item => item.query.toLowerCase() === trimmedQuery.toLowerCase());
    
    if (existingIndex >= 0) {
      // 如果已存在，更新时间戳并移到最前面
      history[existingIndex].timestamp = Date.now();
    } else {
      // 如果不存在，添加新记录
      const newItem: SearchHistoryItem = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query: trimmedQuery,
        timestamp: Date.now()
      };
      history.unshift(newItem);
    }
    
    // 限制历史记录数量
    const limitedHistory = history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('保存搜索历史失败:', error);
  }
}

/**
 * 删除指定搜索记录
 */
export function removeSearchHistory(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getSearchHistory();
    const filteredHistory = history.filter(item => item.id !== id);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('删除搜索历史失败:', error);
  }
}

/**
 * 清空所有搜索历史
 */
export function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('清空搜索历史失败:', error);
  }
}