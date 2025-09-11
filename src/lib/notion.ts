import { ChargeBaby, NotionDatabase, NotionPage, DetailData } from '@/types/chargebaby';
import { serverCache, CACHE_KEYS } from './cache';

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
    next: { revalidate: 60 }, // 60秒缓存
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Notion API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

/**
 * 从 Notion API 获取数据（不使用缓存）
 */
async function fetchChargeBabiesFromNotion(): Promise<ChargeBaby[]> {
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
}

/**
 * 从 Notion 数据库获取所有充电宝数据（带缓存）
 */
export async function getChargeBabies(): Promise<ChargeBaby[]> {
  try {
    // 尝试从缓存获取
    const cached = serverCache.get<ChargeBaby[]>(CACHE_KEYS.CHARGE_BABIES);
    if (cached) {
      console.log('📦 Serving charge babies from cache');
      return cached;
    }

    console.log('🌐 Fetching charge babies from Notion API');
    const data = await fetchChargeBabiesFromNotion();
    
    // 设置缓存，60秒过期，自动刷新
    serverCache.setWithAutoRefresh(
      CACHE_KEYS.CHARGE_BABIES,
      data,
      60, // 60秒
      fetchChargeBabiesFromNotion
    );

    return data;
  } catch (error) {
    console.error('Error fetching charge babies from Notion:', error);
    
    // 如果API调用失败，尝试返回过期的缓存数据
    const staleCache = serverCache.get<ChargeBaby[]>(CACHE_KEYS.CHARGE_BABIES);
    if (staleCache) {
      console.log('⚠️  Serving stale cache due to API error');
      return staleCache;
    }
    
    return [];
  }
}

/**
 * 获取页面内容块（递归获取子块）
 */
export async function getPageBlocks(pageId: string): Promise<any[]> {
  try {
    const response = await notionFetch<any>(`/blocks/${pageId}/children`);
    const blocks = response.results || [];
    
    // 递归获取有子块的内容
    for (const block of blocks) {
      if (block.has_children) {
        block.children = await getPageBlocks(block.id);
      }
    }
    
    return blocks;
  } catch (error) {
    console.error('Error fetching page blocks:', error);
    return [];
  }
}

/**
 * 将页面内容块转换为Markdown
 */
function convertBlocksToMarkdown(blocks: any[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'paragraph':
        return convertRichTextToMarkdown(block.paragraph?.rich_text || []);
      
      case 'heading_1':
        return `# ${convertRichTextToMarkdown(block.heading_1?.rich_text || [])}`;
      
      case 'heading_2':
        return `## ${convertRichTextToMarkdown(block.heading_2?.rich_text || [])}`;
      
      case 'heading_3':
        return `### ${convertRichTextToMarkdown(block.heading_3?.rich_text || [])}`;
      
      case 'bulleted_list_item':
        const bulletText = convertRichTextToMarkdown(block.bulleted_list_item?.rich_text || []);
        const bulletChildren = block.children ? '\n' + convertBlocksToMarkdown(block.children).split('\n').map(line => '  ' + line).join('\n') : '';
        return `- ${bulletText}${bulletChildren}`;
      
      case 'numbered_list_item':
        const numberText = convertRichTextToMarkdown(block.numbered_list_item?.rich_text || []);
        const numberChildren = block.children ? '\n' + convertBlocksToMarkdown(block.children).split('\n').map(line => '  ' + line).join('\n') : '';
        return `1. ${numberText}${numberChildren}`;
      
      case 'to_do':
        const checked = block.to_do?.checked ? '[x]' : '[ ]';
        const todoText = convertRichTextToMarkdown(block.to_do?.rich_text || []);
        const todoChildren = block.children ? '\n' + convertBlocksToMarkdown(block.children).split('\n').map(line => '  ' + line).join('\n') : '';
        return `- ${checked} ${todoText}${todoChildren}`;
      
      case 'toggle':
        const toggleTitle = convertRichTextToMarkdown(block.toggle?.rich_text || []);
        const toggleContent = block.children ? convertBlocksToMarkdown(block.children) : '';
        return `<details>\n<summary>${toggleTitle}</summary>\n\n${toggleContent}\n</details>`;
      
      case 'quote':
        return `> ${convertRichTextToMarkdown(block.quote?.rich_text || [])}`;
      
      case 'callout':
        const emoji = block.callout?.icon?.emoji || '💡';
        const calloutText = convertRichTextToMarkdown(block.callout?.rich_text || []);
        const calloutChildren = block.children ? '\n\n' + convertBlocksToMarkdown(block.children) : '';
        return `> ${emoji} ${calloutText}${calloutChildren}`;
      
      case 'code':
        const codeText = convertRichTextToMarkdown(block.code?.rich_text || []);
        const language = block.code?.language || '';
        return `\`\`\`${language}\n${codeText}\n\`\`\``;
      
      case 'image':
        const imageUrl = block.image?.external?.url || block.image?.file?.url || '';
        const caption = convertRichTextToMarkdown(block.image?.caption || []);
        return `![${caption}](${imageUrl})`;
      
      case 'video':
        const videoUrl = block.video?.external?.url || block.video?.file?.url || '';
        const videoCaption = convertRichTextToMarkdown(block.video?.caption || []);
        return `[📹 ${videoCaption || '视频'}](${videoUrl})`;
      
      case 'file':
        const fileUrl = block.file?.external?.url || block.file?.file?.url || '';
        const fileName = block.file?.name || '文件';
        return `[📁 ${fileName}](${fileUrl})`;
      
      case 'pdf':
        const pdfUrl = block.pdf?.external?.url || block.pdf?.file?.url || '';
        const pdfCaption = convertRichTextToMarkdown(block.pdf?.caption || []);
        return `[📄 ${pdfCaption || 'PDF文件'}](${pdfUrl})`;
      
      case 'bookmark':
        const bookmarkUrl = block.bookmark?.url || '';
        const bookmarkCaption = convertRichTextToMarkdown(block.bookmark?.caption || []);
        return `[🔗 ${bookmarkCaption || bookmarkUrl}](${bookmarkUrl})`;
      
      case 'embed':
        const embedUrl = block.embed?.url || '';
        const embedCaption = convertRichTextToMarkdown(block.embed?.caption || []);
        return `[🔗 ${embedCaption || '嵌入内容'}](${embedUrl})`;
      
      case 'divider':
        return '---';
      
      case 'table':
        // 处理表格：获取所有行数据
        if (block.children && block.children.length > 0) {
          const rows = block.children.filter((child: any) => child.type === 'table_row');
          if (rows.length === 0) return '';
          
          // 处理表头（第一行）
          const headerRow = rows[0];
          const headerCells = headerRow.table_row?.cells || [];
          const headers = headerCells.map((cell: any[]) => convertRichTextToMarkdown(cell) || '   ').join(' | ');
          
          // 创建分隔行
          const separator = headerCells.map(() => '---').join(' | ');
          
          // 处理数据行
          const dataRows = rows.slice(1).map((row: any) => {
            const cells = row.table_row?.cells || [];
            return cells.map((cell: any[]) => convertRichTextToMarkdown(cell) || '   ').join(' | ');
          });
          
          // 组合表格
          return `| ${headers} |\n| ${separator} |\n${dataRows.map((row: string) => `| ${row} |`).join('\n')}`;
        }
        return '';
      
      case 'table_row':
        // 表格行在table中处理，这里直接跳过
        return '';
      
      case 'equation':
        const equation = block.equation?.expression || '';
        return `$$${equation}$$`;
      
      default:
        // 忽略不支持的块类型
        return '';
    }
  }).filter(content => content.trim() !== '').join('\n\n');
}

/**
 * 将富文本转换为Markdown（支持HTML）
 */
function convertRichTextToMarkdown(richText: any[]): string {
  if (!Array.isArray(richText) || richText.length === 0) {
    return '';
  }
  
  return richText.map(text => {
    let content = text.text?.content || '';
    
    // 如果是空内容，直接返回
    if (!content.trim()) {
      return content;
    }
    
    // 收集需要应用的样式
    const styles: string[] = [];
    const annotations = text.annotations || {};
    
    // 颜色处理
    if (annotations.color && annotations.color !== 'default') {
      const colorMap: Record<string, string> = {
        red: '#ef4444',
        orange: '#f97316', 
        yellow: '#eab308',
        green: '#22c55e',
        blue: '#3b82f6',
        purple: '#a855f7',
        pink: '#ec4899',
        gray: '#6b7280',
        brown: '#a3a3a3'
      };
      const color = colorMap[annotations.color] || annotations.color;
      styles.push(`color:${color}`);
    }
    
    // 背景颜色处理
    if (annotations.background_color && annotations.background_color !== 'default') {
      const bgColorMap: Record<string, string> = {
        red_background: '#fef2f2',
        orange_background: '#fff7ed',
        yellow_background: '#fefce8',
        green_background: '#f0fdf4',
        blue_background: '#eff6ff',
        purple_background: '#faf5ff',
        pink_background: '#fdf2f8',
        gray_background: '#f9fafb'
      };
      const bgColor = bgColorMap[annotations.background_color] || '#f9fafb';
      styles.push(`background-color:${bgColor}`);
    }
    
    // 应用HTML样式（如果有颜色或背景色）
    if (styles.length > 0) {
      content = `<span style="${styles.join(';')}">${content}</span>`;
    }
    
    // 应用文本样式（顺序很重要）
    if (annotations.strikethrough) {
      content = `~~${content}~~`;
    }
    if (annotations.underline) {
      content = `<u>${content}</u>`;
    }
    if (annotations.code) {
      content = `\`${content}\``;
    }
    if (annotations.bold) {
      content = `**${content}**`;
    }
    if (annotations.italic) {
      content = `*${content}*`;
    }
    
    // 链接处理（放在最后）
    if (text.text?.link?.url) {
      content = `[${content}](${text.text.link.url})`;
    }
    
    return content;
  }).join('');
}

/**
 * 根据 ID 获取单个充电宝数据
 */
/**
 * 从 Notion API 获取单个充电宝数据（不使用缓存）
 */
async function fetchChargeBabyByIdFromNotion(id: string): Promise<ChargeBaby | null> {
  const [pageResponse, blocks] = await Promise.all([
    notionFetch<NotionPage>(`/pages/${id}`),
    getPageBlocks(id)
  ]);

  const chargeBaby = parseNotionPageToChargeBaby(pageResponse);
  
  // 将页面内容转换为Markdown并添加到articleContent
  const articleContent = convertBlocksToMarkdown(blocks);
  
  return {
    ...chargeBaby,
    articleContent: articleContent || chargeBaby.articleContent
  };
}

export async function getChargeBabyById(id: string): Promise<ChargeBaby | null> {
  try {
    const cacheKey = CACHE_KEYS.CHARGE_BABY_BY_ID(id);
    
    // 尝试从缓存获取
    const cached = serverCache.get<ChargeBaby>(cacheKey);
    if (cached) {
      console.log(`📦 Serving charge baby ${id} from cache`);
      return cached;
    }

    console.log(`🌐 Fetching charge baby ${id} from Notion API`);
    const data = await fetchChargeBabyByIdFromNotion(id);
    
    if (data) {
      // 设置缓存，5分钟过期（单个页面变化频率较低）
      serverCache.set(cacheKey, data, 300);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching charge baby by ID:', error);
    
    // 如果API调用失败，尝试返回过期的缓存数据
    const cacheKey = CACHE_KEYS.CHARGE_BABY_BY_ID(id);
    const staleCache = serverCache.get<ChargeBaby>(cacheKey);
    if (staleCache) {
      console.log(`⚠️  Serving stale cache for charge baby ${id} due to API error`);
      return staleCache;
    }
    
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
    brand: getTextProperty(props.Brand) || getTextProperty(props.品牌) || '',
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
    // 图文内容将在 getChargeBabyById 中从页面内容获取
    articleContent: '',
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
    maxSelfChargingPower: getNumberProperty(props['最大自充电功率']) || getNumberProperty(props['最大自充电功率（W）']) || 0,
    energy20min: getNumberProperty(props['20分钟充入能量']) || getNumberProperty(props['20分钟充入能量（Wh）']) || 0,
    
    // 输出性能
    maxContinuousOutputPower: getNumberProperty(props['最大持续输出平均功率（W）']) || 0,
    maxOutputPower: getNumberProperty(props['最大输出功率']) || getNumberProperty(props['最大输出功率（W）']) || 0,
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
