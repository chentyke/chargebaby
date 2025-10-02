// 充电线详细技术数据类型定义
export interface CableDetailData {
  // 基本物理规格
  length?: number | null; // 长度（m）
  weight?: number | null; // 重量（g）
  diameter?: number | null; // 线径（mm）
  diameter2?: number | null; // 线径2（mm）

  // 电气性能
  maxPower?: number | null; // 最大功率（W）
  maxVoltage?: number | null; // 最大电压（V）
  maxCurrent?: number | null; // 最大电流（A）
  resistance?: number | null; // 线阻（mΩ）
  maxTransferRate?: number | null; // 最大传输速率（Gbps）
  lineResistanceScore?: number | null; // 线阻评分

  // 材质和工艺
  connectorMaterial?: string | null; // 端子外壳材质
  cableProcess?: string | null; // 线缆工艺

  // 协议兼容性
  chargingProtocols: string[]; // 充电协议
  usbProtocolCompatibility: string[]; // USB协议兼容性
  thunderboltCompatibility: string[]; // 雷电协议兼容性

  // 特殊功能
  reDriverReTimer?: string | null; // ReDriver/ReTimer
  videoTransmissionCapability: string[]; // 视频传输能力

  // 数据来源
  dataSource?: string | null; // 数据来源
}

// 充电线基础类型定义
export interface Cable {
  id: string;
  brand: string; // 品牌
  model: string; // 型号
  title: string; // 标题
  subtitle: string; // 副标题
  displayName?: string; // 外部展示名称（列表/分享）
  type?: string[]; // 产品类型
  tags: string[]; // 标签
  price?: number | null; // 定价
  releaseDate?: string; // 发售时间
  overallRating?: number | null; // 综合评分 (1-100)
  performanceRating?: number | null; // 性能评分 (1-100)
  experienceRating?: number | null; // 体验评分 (1-100)
  advantages?: string[]; // 优势
  disadvantages?: string[]; // 不足
  imageUrl: string; // 产品图片
  finalImageUrl?: string; // 成品图片（用于下载/分享）
  taobaoLink?: string; // 淘宝购买链接
  jdLink?: string; // 京东购买链接
  productSource?: string; // 样机提供方
  createdAt: string;
  updatedAt: string;
  detailData?: CableDetailData; // 详细技术数据
  articleContent?: string; // 图文内容（Markdown格式）
  subProjects?: SubProject[]; // 子项目（评测内容）
}

// 子项目类型定义（复用充电宝的）
export interface SubProject {
  id: string;
  model: string; // 型号（如：视频评测-xxx）
  title?: string; // 标题
  displayName?: string; // 显示名称
  type: string[]; // 类型（视频、图文等）
  tags?: string[]; // 标签
  videoLink?: string; // 视频链接
  videoDate?: string; // 视频日期
  videoAuthor?: string; // 视频作者
  videoCover?: string; // 视频封面
  overallRating?: number; // 综合评分
  performanceRating?: number; // 性能评分
  submissionStatus?: string; // 投稿审核状态（通过、待审核、拒绝等）
  createdAt: string;
  updatedAt: string;
}

// 评分类型
export type CableRatingType =
  | 'overall'
  | 'performance'
  | 'experience'
  | 'durability'
  | 'compatibility'
  | 'portability';

// 评分标签映射
export const CableRatingLabels: Record<CableRatingType, string> = {
  overall: '综合评分',
  performance: '性能评分',
  experience: '体验评分',
  durability: '耐用性评分',
  compatibility: '兼容性评分',
  portability: '便携性评分'
};

// 排序选项类型
export type CableSortOption = 'updatedAt' | 'power' | 'length' | 'weight' | 'price' | 'alphabetical' | 'overallRating' | 'performanceRating' | 'experienceRating';

export const CABLE_SORT_OPTIONS: { value: CableSortOption; label: string }[] = [
  { value: 'updatedAt', label: '更新时间' },
  { value: 'overallRating', label: '综合评分' },
  { value: 'performanceRating', label: '性能评分' },
  { value: 'experienceRating', label: '体验评分' },
  { value: 'power', label: '功率' },
  { value: 'length', label: '长度' },
  { value: 'weight', label: '重量' },
  { value: 'price', label: '价格' },
  { value: 'alphabetical', label: '首字母' }
];

// 筛选选项类型
export interface CableFilterOptions {
  powerRange: {
    min: number;
    max: number;
  };
  lengthRange: {
    min: number;
    max: number;
  };
  priceRange: {
    min: number;
    max: number;
  };
  brands: string[];
  features: CableFeature[];
  protocols: string[];
  sortBy: CableSortOption;
  sortOrder: 'asc' | 'desc';
}

// 充电线特性类型
export const CABLE_FEATURES = [
  { value: '磁吸收纳', label: '磁吸收纳' },
  { value: '编织线', label: '编织线' },
  { value: '硅胶材质', label: '硅胶材质' },
  { value: '快充支持', label: '快充支持' },
  { value: '数据传输', label: '数据传输' },
  { value: '视频传输', label: '视频传输' },
  { value: '雷电协议', label: '雷电协议' },
  { value: 'USB4', label: 'USB4' }
] as const;

export type CableFeature = (typeof CABLE_FEATURES)[number]['value'];

// Notion API 响应类型（复用）
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

// 充电线工艺材质映射
export const CABLE_PROCESS_LABELS: Record<string, string> = {
  '硅胶': '硅胶线',
  '编织': '编织线',
  'PVC': 'PVC线',
  'TPE': 'TPE线'
};

// 充电线端子材质映射
export const CONNECTOR_MATERIAL_LABELS: Record<string, string> = {
  '塑料': '塑料',
  '金属': '金属',
  '合金': '合金'
};
