/**
 * 搜索筛选标签工具
 */

import { ChargeBaby } from '@/types/chargebaby';
import { isMatch, getMatchScore } from './pinyin-matcher';

export interface SearchTag {
  id: string;
  label: string;
  value: string;
  type: 'brand' | 'protocol' | 'feature';
  count?: number; // 匹配的产品数量
  matchScore?: number; // 匹配度分数
}

// 协议关键词常量
const PROTOCOL_KEYWORDS = [
  'PD', 'QC', 'PPS', 'UFCS', 
  '小米协议', 'OPPO协议', '华为协议', 'VIVO协议',
  '快充', '超级快充', '闪充'
];

/**
 * 从充电宝数据中提取品牌标签
 */
export function extractBrandTags(chargeBabies: ChargeBaby[]): SearchTag[] {
  const brandCounts = new Map<string, number>();
  
  chargeBabies.forEach(item => {
    if (item.brand) {
      brandCounts.set(item.brand, (brandCounts.get(item.brand) || 0) + 1);
    }
  });
  
  return Array.from(brandCounts.entries())
    .sort((a, b) => b[1] - a[1]) // 按产品数量排序
    .map(([brand, count]) => ({
      id: `brand_${brand}`,
      label: brand,
      value: brand,
      type: 'brand' as const,
      count
    }));
}

/**
 * 从充电宝数据中提取充电协议标签
 */
export function extractProtocolTags(chargeBabies: ChargeBaby[]): SearchTag[] {
  const protocolCounts = new Map<string, number>();
  
  chargeBabies.forEach(item => {
    const processedProtocols = new Set<string>();
    
    // 首先检查protocols字段
    if (Array.isArray(item.protocols) && item.protocols.length > 0) {
      item.protocols.forEach(protocol => {
        if (protocol && protocol.trim()) {
          const trimmedProtocol = protocol.trim();
          protocolCounts.set(trimmedProtocol, (protocolCounts.get(trimmedProtocol) || 0) + 1);
          processedProtocols.add(trimmedProtocol);
        }
      });
    }
    
    // 从tags中提取协议信息，但避免重复计算已经在protocols中的协议
    if (Array.isArray(item.tags)) {
      item.tags.forEach(tag => {
        if (tag) {
          PROTOCOL_KEYWORDS.forEach(keyword => {
            if (tag.includes(keyword) && !processedProtocols.has(keyword)) {
              protocolCounts.set(keyword, (protocolCounts.get(keyword) || 0) + 1);
              processedProtocols.add(keyword);
            }
          });
        }
      });
    }
  });
  
  
  return Array.from(protocolCounts.entries())
    .sort((a, b) => b[1] - a[1]) // 按产品数量排序
    .map(([protocol, count]) => ({
      id: `protocol_${protocol}`,
      label: protocol,
      value: protocol,
      type: 'protocol' as const,
      count
    }));
}

/**
 * 从充电宝数据中提取产品特性标签
 */
export function extractFeatureTags(chargeBabies: ChargeBaby[]): SearchTag[] {
  const featureCounts = new Map<string, number>();
  
  chargeBabies.forEach(item => {
    if (Array.isArray(item.tags)) {
      item.tags.forEach(tag => {
        if (tag) {
          // 检查是否是协议类型的标签，如果是则跳过
          const isProtocolTag = PROTOCOL_KEYWORDS.some(keyword => tag.includes(keyword));
          if (!isProtocolTag) {
            featureCounts.set(tag, (featureCounts.get(tag) || 0) + 1);
          }
        }
      });
    }
  });
  
  return Array.from(featureCounts.entries())
    .sort((a, b) => b[1] - a[1]) // 按产品数量排序
    .map(([feature, count]) => ({
      id: `feature_${feature}`,
      label: feature,
      value: feature,
      type: 'feature' as const,
      count
    }));
}

/**
 * 根据搜索查询生成智能标签建议
 */
export function generateSearchTags(query: string, chargeBabies: ChargeBaby[]): SearchTag[] {
  if (!query.trim() || query.trim().length < 1) return [];
  
  const searchTerm = query.toLowerCase().trim();
  const suggestions: SearchTag[] = [];
  
  // 获取所有标签
  const brandTags = extractBrandTags(chargeBabies);
  const protocolTags = extractProtocolTags(chargeBabies);
  const featureTags = extractFeatureTags(chargeBabies);
  
  
  // 匹配品牌（支持拼音）
  brandTags.forEach(tag => {
    if (isMatch(tag.label, searchTerm)) {
      suggestions.push({
        ...tag,
        matchScore: getMatchScore(tag.label, searchTerm)
      });
    }
  });
  
  // 匹配充电协议（支持拼音）
  protocolTags.forEach(tag => {
    if (isMatch(tag.label, searchTerm)) {
      suggestions.push({
        ...tag,
        matchScore: getMatchScore(tag.label, searchTerm)
      });
    }
  });
  
  // 匹配产品特性（支持拼音）
  featureTags.forEach(tag => {
    if (isMatch(tag.label, searchTerm)) {
      suggestions.push({
        ...tag,
        matchScore: getMatchScore(tag.label, searchTerm)
      });
    }
  });
  
  // 去重并排序（按类型优先级：品牌 > 协议 > 特性，然后按匹配度）
  const uniqueSuggestions = suggestions.filter((tag, index, arr) => 
    arr.findIndex(t => t.id === tag.id) === index
  );
  
  return uniqueSuggestions
    .sort((a, b) => {
      // 类型优先级
      const typeOrder = { brand: 0, protocol: 1, feature: 2 };
      const typeDiff = typeOrder[a.type] - typeOrder[b.type];
      if (typeDiff !== 0) return typeDiff;
      
      // 匹配度分数优先
      const aScore = a.matchScore || 0;
      const bScore = b.matchScore || 0;
      if (aScore !== bScore) return bScore - aScore;
      
      // 产品数量优先
      return (b.count || 0) - (a.count || 0);
    })
    .slice(0, 5); // 限制显示数量
}

/**
 * 应用标签筛选
 */
export function applyTagFilter(chargeBabies: ChargeBaby[], selectedTag: SearchTag): ChargeBaby[] {
  switch (selectedTag.type) {
    case 'brand':
      return chargeBabies.filter(item => item.brand === selectedTag.value);
    
    case 'protocol':
      return chargeBabies.filter(item => {
        // 首先检查protocols字段
        if (Array.isArray(item.protocols) && item.protocols.includes(selectedTag.value)) {
          return true;
        }
        
        // 如果protocols字段没有匹配，检查tags字段
        if (Array.isArray(item.tags)) {
          return item.tags.some(tag => tag && tag.includes(selectedTag.value));
        }
        
        return false;
      });
    
    case 'feature':
      return chargeBabies.filter(item => 
        Array.isArray(item.tags) && item.tags.includes(selectedTag.value)
      );
    
    default:
      return chargeBabies;
  }
}

/**
 * 获取标签类型的显示名称
 */
export function getTagTypeLabel(type: SearchTag['type']): string {
  switch (type) {
    case 'brand':
      return '品牌';
    case 'protocol':
      return '充电协议';
    case 'feature':
      return '产品特性';
    default:
      return '标签';
  }
}