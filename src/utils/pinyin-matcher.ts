/**
 * 拼音匹配工具
 */

// 常用中文字符到拼音的映射
const PINYIN_MAP: Record<string, string[]> = {
  // 品牌相关
  '小': ['xiao'],
  '米': ['mi'],
  '华': ['hua'],
  '为': ['wei'],
  '荣': ['rong'],
  '耀': ['yao'],
  '苹': ['ping'],
  '果': ['guo'],
  '三': ['san'],
  '星': ['xing'],
  '魅': ['mei'],
  '族': ['zu'],
  '一': ['yi'],
  '加': ['jia'],
  '联': ['lian'],
  '想': ['xiang'],
  '中': ['zhong'],
  '兴': ['xing'],
  '努': ['nu'],
  '比': ['bi'],
  '亚': ['ya'],
  'O': ['o'],
  'P': ['p'],
  'V': ['v'],
  'I': ['i'],
  // 协议相关
  '快': ['kuai'],
  '充': ['chong'],
  '超': ['chao'],
  '级': ['ji'],
  '闪': ['shan'],
  '协': ['xie'],
  '议': ['yi'],
  // 其他常用字
  '宝': ['bao'],
  '电': ['dian'],
  '源': ['yuan'],
  '移': ['yi'],
  '动': ['dong'],
  '器': ['qi'],
  '线': ['xian'],
  '伸': ['shen'],
  '缩': ['suo'],
  '带': ['dai'],
  '自': ['zi'],
};

/**
 * 检查输入的拼音是否匹配中文字符
 */
function matchesPinyin(chinese: string, pinyin: string): boolean {
  const lowerPinyin = pinyin.toLowerCase();
  
  // 检查每个中文字符
  for (const char of chinese) {
    const pinyinList = PINYIN_MAP[char];
    if (pinyinList) {
      // 检查是否有任何拼音匹配
      const hasMatch = pinyinList.some(py => {
        // 支持部分匹配（例如 "mi" 匹配 "mi"）
        return py.startsWith(lowerPinyin) || lowerPinyin.startsWith(py);
      });
      if (hasMatch) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 检查搜索词是否匹配目标文本（支持中文和拼音）
 */
export function isMatch(target: string, searchTerm: string): boolean {
  if (!target || !searchTerm) return false;
  
  const lowerTarget = target.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();
  
  // 1. 直接匹配（中文、英文、数字）
  if (lowerTarget.includes(lowerSearch)) {
    return true;
  }
  
  // 2. 拼音匹配
  if (/^[a-z]+$/i.test(searchTerm)) {
    // 搜索词是纯字母，尝试拼音匹配
    return matchesPinyin(target, lowerSearch);
  }
  
  return false;
}

/**
 * 增强的匹配函数，同时检查多个字段
 */
export function isAnyFieldMatch(fields: (string | undefined)[], searchTerm: string): boolean {
  return fields.some(field => field && isMatch(field, searchTerm));
}

/**
 * 获取匹配度分数（用于排序）
 */
export function getMatchScore(target: string, searchTerm: string): number {
  if (!target || !searchTerm) return 0;
  
  const lowerTarget = target.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();
  
  // 精确匹配最高分
  if (lowerTarget === lowerSearch) return 100;
  
  // 开头匹配
  if (lowerTarget.startsWith(lowerSearch)) return 90;
  
  // 包含匹配
  if (lowerTarget.includes(lowerSearch)) return 80;
  
  // 拼音匹配
  if (/^[a-z]+$/i.test(searchTerm) && matchesPinyin(target, lowerSearch)) {
    return 70;
  }
  
  return 0;
}