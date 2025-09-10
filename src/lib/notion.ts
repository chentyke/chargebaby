import { ChargeBaby, NotionDatabase, NotionPage, DetailData } from '@/types/chargebaby';

const notionApiBase = 'https://api.notion.com/v1';
const notionVersion = process.env.NOTION_VERSION || '2022-06-28';
const notionApiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_DATABASE_ID!;

async function notionFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!notionApiKey) throw new Error('NOTION_API_KEY is not set');
  const res = await fetch(`${notionApiBase}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${notionApiKey}`,
      'Notion-Version': notionVersion,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Notion API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

/**
 * 从 Notion 数据库获取所有充电宝数据
 */
export async function getChargeBabies(): Promise<ChargeBaby[]> {
  try {
    const response = await notionFetch<NotionDatabase>(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({
        sorts: [
          {
            property: 'Title',
            direction: 'ascending',
          },
        ],
      }),
    });

    return response.results.map(parseNotionPageToChargeBaby);
  } catch (error) {
    console.error('Error fetching charge babies from Notion:', error);
    return [];
  }
}

/**
 * 根据 ID 获取单个充电宝数据
 */
export async function getChargeBabyById(id: string): Promise<ChargeBaby | null> {
  try {
    const response = await notionFetch<NotionPage>(`/pages/${id}`);

    return parseNotionPageToChargeBaby(response);
  } catch (error) {
    console.error('Error fetching charge baby by ID:', error);
    return null;
  }
}

/**
 * 根据标签筛选充电宝
 */
export async function getChargeBabiesByTag(tag: string): Promise<ChargeBaby[]> {
  try {
    const response = await notionFetch<NotionDatabase>(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({
        filter: {
          property: 'Tags',
          multi_select: { contains: tag },
        },
      }),
    });

    return response.results.map(parseNotionPageToChargeBaby);
  } catch (error) {
    console.error('Error fetching charge babies by tag:', error);
    return [];
  }
}

/**
 * 将 Notion 页面数据解析为 ChargeBaby 对象
 */
function parseNotionPageToChargeBaby(page: NotionPage): ChargeBaby {
  const props = page.properties;

  return {
    id: page.id,
    model: getTextProperty(props.Model) || getTextProperty(props.Name) || 'Unknown',
    title: getTextProperty(props.Title) || getTextProperty(props.Name) || 'Unknown',
    displayName: getTextProperty(props.DisplayName) || getTextProperty(props.ExternalName) || '',
    subtitle: getTextProperty(props.Subtitle) || '',
    tags: getMultiSelectProperty(props.Tags) || [],
    price: getNumberProperty(props.Price) || 0,
    releaseDate: getDateProperty(props.ReleaseDate) || new Date().toISOString(),
    overallRating: getNumberProperty(props.OverallRating) || 0,
    performanceRating: getNumberProperty(props.PerformanceRating) || 0,
    selfChargingCapability: getNumberProperty(props.SelfChargingCapability) || 0,
    outputCapability: getNumberProperty(props.OutputCapability) || 0,
    energy: getNumberProperty(props.Energy) || 0,
    experienceRating: getNumberProperty(props.ExperienceRating) || 0,
    portability: getNumberProperty(props.Portability) || 0,
    chargingProtocols: getNumberProperty(props.ChargingProtocols) || 0,
    multiPortUsage: getNumberProperty(props.MultiPortUsage) || 0,
    advantages: parseListProperty(getRichTextProperty(props.Advantages) || ''),
    disadvantages: parseListProperty(getRichTextProperty(props.Disadvantages) || ''),
    imageUrl: getFileProperty(props.Image) || page.cover?.external?.url || page.cover?.file?.url || '',
    finalImageUrl:
      getFileProperty(props.FinalImage) ||
      getFileProperty(props.Poster) ||
      getFileProperty(props.ShareImage) ||
      '',
    createdAt: getDateProperty(props.CreatedAt) || new Date().toISOString(),
    updatedAt: getDateProperty(props.UpdatedAt) || new Date().toISOString(),
    // 详细技术规格数据
    detailData: parseDetailData(props),
  };
}

/**
 * 解析详细技术数据
 */
function parseDetailData(props: any): DetailData {
  return {
    // 物理尺寸
    length: getNumberProperty(props['长度（cm）']) || 0,
    width: getNumberProperty(props['宽度（cm）']) || 0,
    thickness: getNumberProperty(props['厚度（cm）']) || getNumberProperty(props['厚度']) || 0,
    volume: getNumberProperty(props['体积（cm3）']) || 0,
    weight: getNumberProperty(props['重量（g）']) || 0,
    
    // 容量相关
    capacityLevel: getNumberProperty(props['容量级别（mAh）']) || 0,
    maxDischargeCapacity: getNumberProperty(props['最大放电容量（Wh）']) || 0,
    selfChargingEnergy: getNumberProperty(props['自充能量（Wh）']) || 0,
    capacityWeightRatio: getNumberProperty(props['容量重量比（Wh/g）']) || 0,
    capacityVolumeRatio: getNumberProperty(props['容量体积比（Wh/cm3）']) || 0,
    energyWeightRatio: getNumberProperty(props['能量重量比']) || 0,
    energyVolumeRatio: getNumberProperty(props['能量体积比']) || 0,
    energyAchievementRate: getNumberProperty(props['能量达成率']) || 0,
    dischargeCapacityAchievementRate: getNumberProperty(props['放电容量达成率']) || 0,
    
    // 充电性能
    selfChargingTime: getNumberProperty(props['自充时间（min）']) || 0,
    avgSelfChargingPower: getNumberProperty(props['平均自充功率（W）']) || getNumberProperty(props['平均自充功率']) || 0,
    energy20min: getNumberProperty(props['20分钟充入能量']) || getNumberProperty(props['20分钟充入能量（Wh）']) || 0,
    
    // 输出性能
    maxContinuousOutputPower: getNumberProperty(props['最大持续输出平均功率（W）']) || 0,
    maxDischargeCapability: getNumberProperty(props['最大放电能力']) || 0,
    maxEnergyConversionRate: getNumberProperty(props['最大能量转换率']) || 0,
    conversionRate: getNumberProperty(props['转换率']) || 0,
    
    // 充电协议支持
    pdSupport: getNumberProperty(props['PD']) || 0,
    qcSupport: getNumberProperty(props['QC']) || 0,
    ppsSupport: getNumberProperty(props['PPS']) || 0,
    ufcsSupport: getNumberProperty(props['UFCS']) || 0,
    privateProtocol: getNumberProperty(props['私有协议']) || 0,
    protocolCompatibility: getNumberProperty(props['协议相互兼容']) || 0,
    
    // 多接口功能
    dualPortOutput: getNumberProperty(props['双接口同时输出']) || 0,
    hotSwap: getNumberProperty(props['多口插拔不断联']) || 0,
    passThrough: getNumberProperty(props['边冲边放']) || 0,
    customDirection: getNumberProperty(props['输入输出方向自定义']) || 0,
    
    // 温度控制
    temperature: getNumberProperty(props['温度']) || 0,
    maxTemperature: getNumberProperty(props['最高温度']) || 0,
    temperatureUniformity: getNumberProperty(props['温度均匀度']) || 0,
    temperatureControlStrategy: getNumberProperty(props['温控策略']) || getNumberProperty(props['温控策略 1']) || 0,
    
    // 显示功能
    display: getNumberProperty(props['显示']) || 0,
    displayContent: getNumberProperty(props['显示内容']) || 0,
    displayCarrier: getNumberProperty(props['显示载体']) || 0,
    displayAdjustment: getNumberProperty(props['显示调节']) || 0,
    brightness: getNumberProperty(props['亮度']) || 0,
    
    // 线缆相关
    cableLength: getNumberProperty(props['线缆长度']) || 0,
    cableSoftness: getNumberProperty(props['线缆柔软度']) || 0,
    
    // 电源质量
    ripple: getNumberProperty(props['纹波']) || getNumberProperty(props['纹波 1']) || 0,
    
    // 特殊功能
    iotCapability: getNumberProperty(props['IoT能力']) || 0,
    customizationCapability: getNumberProperty(props['自定义能力']) || 0,
    acInputCapability: getNumberProperty(props['AC输入能力']) || 0,
    
    // 数据来源
    dataSource: getRichTextProperty(props['数据来源']) || '',
  };
}

// 辅助函数：解析 Notion 属性
function getTextProperty(property: any): string {
  return property?.title?.[0]?.text?.content || property?.rich_text?.[0]?.text?.content || '';
}

function getSelectProperty(property: any): string {
  return property?.select?.name || '';
}

function getMultiSelectProperty(property: any): string[] {
  return property?.multi_select?.map((item: any) => item.name) || [];
}

function getNumberProperty(property: any): number {
  return property?.number || 0;
}

function getDateProperty(property: any): string {
  return property?.date?.start || '';
}

function getFileProperty(property: any): string {
  return property?.files?.[0]?.external?.url || property?.files?.[0]?.file?.url || '';
}

function getRichTextProperty(property: any): string {
  return property?.rich_text?.[0]?.text?.content || '';
}

function parseListProperty(text: string): string[] {
  // 解析文本为数组，支持换行、逗号分隔等
  if (!text) return [];
  
  // 先按换行分割，再按逗号分割，最后清理空白
  const items = text.split(/[\n,]/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
  
  return items;
}
