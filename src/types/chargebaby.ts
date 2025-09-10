// 详细技术数据类型定义
export interface DetailData {
  // 物理尺寸
  length: number; // 长度（cm）
  width: number; // 宽度（cm）
  thickness: number; // 厚度（cm）
  volume: number; // 体积（cm³）
  weight: number; // 重量（g）
  
  // 容量相关
  capacityLevel: number; // 容量级别（mAh）
  maxDischargeCapacity: number; // 最大放电容量（Wh）
  selfChargingEnergy: number; // 自充能量（Wh）
  capacityWeightRatio: number; // 容量重量比（Wh/g）
  capacityVolumeRatio: number; // 容量体积比（Wh/cm³）
  energyWeightRatio: number; // 能量重量比
  energyVolumeRatio: number; // 能量体积比
  energyAchievementRate: number; // 能量达成率
  dischargeCapacityAchievementRate: number; // 放电容量达成率
  
  // 充电性能
  selfChargingTime: number; // 自充时间（min）
  avgSelfChargingPower: number; // 平均自充功率（W）
  energy20min: number; // 20分钟充入能量（Wh）
  
  // 输出性能
  maxContinuousOutputPower: number; // 最大持续输出平均功率（W）
  maxDischargeCapability: number; // 最大放电能力
  maxEnergyConversionRate: number; // 最大能量转换率
  conversionRate: number; // 转换率
  
  // 充电协议支持
  pdSupport: number; // PD协议支持
  qcSupport: number; // QC协议支持
  ppsSupport: number; // PPS协议支持
  ufcsSupport: number; // UFCS协议支持
  privateProtocol: number; // 私有协议支持
  protocolCompatibility: number; // 协议相互兼容性
  
  // 多接口功能
  dualPortOutput: number; // 双接口同时输出
  hotSwap: number; // 多口插拔不断联
  passThrough: number; // 边冲边放
  customDirection: number; // 输入输出方向自定义
  
  // 温度控制
  temperature: number; // 温度表现
  maxTemperature: number; // 最高温度
  temperatureUniformity: number; // 温度均匀度
  temperatureControlStrategy: number; // 温控策略
  
  // 显示功能
  display: number; // 显示功能
  displayContent: number; // 显示内容
  displayCarrier: number; // 显示载体
  displayAdjustment: number; // 显示调节
  brightness: number; // 亮度
  
  // 线缆相关
  cableLength: number; // 线缆长度
  cableSoftness: number; // 线缆柔软度
  
  // 电源质量
  ripple: number; // 纹波
  
  // 特殊功能
  iotCapability: number; // IoT能力
  customizationCapability: number; // 自定义能力
  acInputCapability: number; // AC输入能力
  
  // 数据来源
  dataSource: string; // 数据来源
}

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
  detailData?: DetailData; // 详细技术数据
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
