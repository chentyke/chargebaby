// 充电头详细技术数据类型定义（基于实际数据库结构）
export interface ChargerDetailData {
  // 物理尺寸
  length?: number | null; // 长度（cm）
  width?: number | null; // 宽度（cm）
  thickness?: number | null; // 高度（cm）
  volume?: number | null; // 体积（cm³）
  weight?: number | null; // 重量（g）

  // 输出性能
  singlePortPower?: number | null; // 单口功率（W）
  multiPortPower?: number | null; // 多口功率（W）
  naturalCoolingPower?: number | null; // 自然散热持续功率（W）
  assistedCoolingPower?: number | null; // 辅助散热持续功率（W）

  // 电流支持（各电压档位）
  maxCurrent5V?: number | null; // 最大电流（5V）
  maxCurrent9V?: number | null; // 最大电流（9V）
  maxCurrent12V?: number | null; // 最大电流（12V）
  maxCurrent15V?: number | null; // 最大电流（15V）
  maxCurrent20V?: number | null; // 最大电流（20V）
  maxCurrent28V?: number | null; // 最大电流（28V）

  // 转换效率
  efficiency5V?: number | null; // 转换效率（5V）
  efficiency9V?: number | null; // 转换效率（9V）
  efficiency12V?: number | null; // 转换效率（12V）
  efficiency15V?: number | null; // 转换效率（15V）
  efficiency20V?: number | null; // 转换效率（20V）
  efficiency28V?: number | null; // 转换效率（28V）

  // 纹波测试
  ripple5V?: number | null; // 纹波（5V）
  ripple9V?: number | null; // 纹波（9V）
  ripple12V?: number | null; // 纹波（12V）
  ripple15V?: number | null; // 纹波（15V）
  ripple20V?: number | null; // 纹波（20V）
  ripple28V?: number | null; // 纹波（28V）

  // 发热量（计算值）
  heatGeneration5V?: number | null; // 发热量（5V）
  heatGeneration9V?: number | null; // 发热量（9V）
  heatGeneration12V?: number | null; // 发热量（12V）
  heatGeneration15V?: number | null; // 发热量（15V）
  heatGeneration20V?: number | null; // 发热量（20V）
  heatGeneration28V?: number | null; // 发热量（28V）

  // 温度控制
  maxSurfaceTemp?: number | null; // 最大表面温度（℃）
  thermalControl: string[]; // 温控机制
  powerAllocationGen?: number | null; // 功率分配技术代际

  // 接口配置
  ports: string[]; // 接口数量
  powerAllocationFeatures: string[]; // 功率分配特性

  // 协议支持（主要接口）
  pdSupportPrimary: string[]; // PD协议支持性（主要接口）
  ppsSupportPrimary: string[]; // PPS支持性（主要接口）
  ufcsSupportPrimary: string[]; // UFCS支持性（主要接口）
  privateProtocolSupportPrimary: string[]; // 私有协议支持性（主要接口）

  // 协议支持（次要接口）
  pdSupportSecondary: string[]; // PD协议支持性（次要接口）
  ppsSupportSecondary: string[]; // PPS支持性（次要接口）
  ufcsSupportSecondary: string[]; // UFCS支持性（次要接口）
  privateProtocolSupportSecondary: string[]; // 私有协议支持性（次要接口）

  // 线缆压降补偿
  cableDropCompensation: string[]; // 线缆压降补偿（线补）

  // 显示功能
  displayType: string[]; // 显示类型
  screenDisplayFunctions: string[]; // 屏幕显示功能

  // IoT功能
  iotFunctions: string[]; // IoT功能

  // 其他特性
  otherTags: string[]; // 其他标签

  // 数据来源
  dataSource?: string | null; // 数据来源
}

// 充电头基础类型定义
export interface Charger {
  id: string;
  brand: string; // 品牌
  model: string; // 型号
  title: string; // 标题
  subtitle: string; // 副标题
  displayName?: string; // 外部展示名称（列表/分享）
  type?: string[]; // 产品类型
  tags: string[]; // 标签
  protocols: string[]; // 协议
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
  detailData?: ChargerDetailData; // 详细技术数据
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
export type ChargerRatingType =
  | 'overall'
  | 'performance'
  | 'experience';

// 评分标签映射
export const ChargerRatingLabels: Record<ChargerRatingType, string> = {
  overall: '综合评分',
  performance: '性能评分',
  experience: '体验评分'
};

// 排序选项类型
export type ChargerSortOption = 'updatedAt' | 'power' | 'weight' | 'price' | 'alphabetical' | 'overallRating' | 'performanceRating' | 'experienceRating' | 'singlePortPower' | 'multiPortPower';

export const CHARGER_SORT_OPTIONS: { value: ChargerSortOption; label: string }[] = [
  { value: 'updatedAt', label: '更新时间' },
  { value: 'overallRating', label: '综合评分' },
  { value: 'performanceRating', label: '性能评分' },
  { value: 'experienceRating', label: '体验评分' },
  { value: 'singlePortPower', label: '单口功率' },
  { value: 'multiPortPower', label: '多口功率' },
  { value: 'power', label: '功率' },
  { value: 'weight', label: '重量' },
  { value: 'price', label: '价格' },
  { value: 'alphabetical', label: '首字母' }
];

// 筛选选项类型
export interface ChargerFilterOptions {
  powerRange: {
    min: number;
    max: number;
  };
  weightRange: {
    min: number;
    max: number;
  };
  priceRange: {
    min: number;
    max: number;
  };
  brands: string[];
  features: ChargerFeature[];
  protocols: string[];
  tags: string[];
  sortBy: ChargerSortOption;
  sortOrder: 'asc' | 'desc';
}

// 充电头特性类型（基于数据库实际选项）
export const CHARGER_FEATURES = [
  { value: '桌面充电器', label: '桌面充电器' },
  { value: '便携充电器', label: '便携充电器' },
  { value: '多接口充电器', label: '多接口充电器' },
  { value: '单接口充电器', label: '单接口充电器' },
  { value: '宽幅电压输入', label: '宽幅电压输入' },
  { value: '第3代功率分配', label: '第3代功率分配' },
  { value: 'TFT显示屏', label: 'TFT显示屏' },
  { value: 'Wi-Fi连接', label: 'Wi-Fi连接' },
  { value: '温度控制', label: '温度控制' },
  { value: '多接口插拔不断联', label: '多接口插拔不断联' },
  { value: '动态功率分配', label: '动态功率分配' },
  { value: '多功率表智能切换', label: '多功率表智能切换' },
  { value: '分配策略自定义', label: '分配策略自定义' }
] as const;

export type ChargerFeature = (typeof CHARGER_FEATURES)[number]['value'];

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

// 产品来源映射
export const PRODUCT_SOURCE_LABELS: Record<string, string> = {
  '京东': '京东',
  'ISDT艾斯特': 'ISDT艾斯特'
};