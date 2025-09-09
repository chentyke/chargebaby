// 充电宝基础类型定义
export interface ChargeBaby {
  id: string;
  model: string; // 型号
  title: string; // 标题
  subtitle: string; // 副标题
  displayName?: string; // 外部展示名称（列表/分享）
  tags: string[]; // 标签
  price: number; // 定价
  releaseDate: string; // 发售时间
  overallRating: number; // 综合评分 (1-100)
  performanceRating: number; // 性能评分 (1-100)
  selfChargingCapability: number; // 自充能力 (1-40)
  outputCapability: number; // 输出能力 (1-35)
  energy: number; // 能量 (1-20)
  experienceRating: number; // 体验评分 (1-100)
  portability: number; // 便携性 (1-40)
  chargingProtocols: number; // 充电协议 (1-30)
  multiPortUsage: number; // 多接口使用 (1-20)
  advantages: string[]; // 优势
  disadvantages: string[]; // 不足
  imageUrl: string; // 产品图片
  finalImageUrl?: string; // 成品图片（用于下载/分享）
  createdAt: string;
  updatedAt: string;
}

// 评分类型
export type RatingType = 
  | 'overall'
  | 'performance'
  | 'selfCharging'
  | 'output'
  | 'energy'
  | 'experience'
  | 'portability'
  | 'multiPort';

// 评分标签映射
export const RatingLabels: Record<RatingType, string> = {
  overall: '综合评分',
  performance: '性能评分',
  selfCharging: '自充能力',
  output: '输出能力',
  energy: '能量',
  experience: '体验评分',
  portability: '便携性',
  multiPort: '多接口使用'
};

// Notion API 响应类型
export interface NotionPage {
  id: string;
  properties: Record<string, any>;
  cover?: {
    external?: { url: string };
    file?: { url: string };
  };
}

export interface NotionDatabase {
  results: NotionPage[];
  next_cursor?: string;
  has_more: boolean;
}
