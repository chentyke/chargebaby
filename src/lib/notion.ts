import { ChargeBaby, NotionDatabase, NotionPage, DetailData, WishlistProduct } from '@/types/chargebaby';
import { serverCache, CACHE_KEYS } from './cache';

const notionApiBase = 'https://api.notion.com/v1';
const notionVersion = process.env.NOTION_VERSION || '2022-06-28';
const notionApiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_DATABASE_ID!;
const wishlistDatabaseId = process.env.NOTION_WISHLIST_DATABASE_ID!;

async function notionFetch<T>(path: string, init?: RequestInit, retries = 3): Promise<T> {
  if (!notionApiKey) throw new Error('NOTION_API_KEY is not set');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
  
  try {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`${notionApiBase}${path}`, {
          ...init,
          headers: {
            'Authorization': `Bearer ${notionApiKey}`,
            'Notion-Version': notionVersion,
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
          },
          cache: 'no-store', // 禁用 Next.js fetch 缓存，完全依赖我们的应用缓存
          signal: controller.signal,
        });
        
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Notion API ${res.status}: ${text}`);
        }
        
        return res.json() as Promise<T>;
      } catch (error: any) {
        console.warn(`Notion API attempt ${attempt}/${retries} failed:`, error.message);
        
        // 如果是最后一次重试，抛出错误
        if (attempt === retries) {
          throw error;
        }
        
        // 等待后重试（指数退避）
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw new Error('All retry attempts failed');
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 从 Notion API 获取数据（不使用缓存）
 */
async function fetchChargeBabiesFromNotion(): Promise<ChargeBaby[]> {
  // 检查必要的环境变量
  if (!databaseId) {
    console.warn('⚠️  NOTION_DATABASE_ID not configured, returning empty array');
    return [];
  }

  const response = await notionFetch<NotionDatabase>(`/databases/${databaseId}/query`, {
    method: 'POST',
    body: JSON.stringify({
      filter: {
        property: 'Type',
        multi_select: { contains: '充电宝' },
      },
      sorts: [
        {
          property: 'UpdatedAt',
          direction: 'descending',
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
 * 通过型号获取充电宝数据
 */
export async function getChargeBabyByModel(model: string): Promise<ChargeBaby | null> {
  try {
    const cacheKey = `charge-baby-model-${model}`;
    
    // 尝试从缓存获取
    const cached = serverCache.get<ChargeBaby>(cacheKey);
    if (cached) {
      console.log(`📦 Serving charge baby ${model} from cache`);
      return cached;
    }

    // 先获取所有数据，然后查找匹配的型号
    const allChargeBabies = await getChargeBabies();
    const found = allChargeBabies.find(cb => cb.model === model);
    
    if (found) {
      // 获取完整数据（包含文章内容）
      console.log(`🌐 Fetching charge baby ${model} details from Notion API`);
      const fullData = await fetchChargeBabyByIdFromNotion(found.id);
      
      if (fullData) {
        // 设置缓存，5分钟过期
        serverCache.set(cacheKey, fullData, 300);
        return fullData;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching charge baby by model:', error);
    return null;
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
    // 检查必要的环境变量
    if (!databaseId) {
      console.warn('⚠️  NOTION_DATABASE_ID not configured, returning empty array');
      return [];
    }

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
    type: getMultiSelectProperty(props.Type) || ['充电宝'],
    tags: getMultiSelectProperty(props.Tags) || [],
    protocols: getMultiSelectProperty(props['协议']) || [],
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
    length: formatNumber(getNumberProperty(props['长度（cm）'])),
    width: formatNumber(getNumberProperty(props['宽度（cm）'])),
    thickness: formatNumber(getNumberProperty(props['厚度（cm）']) || getNumberProperty(props['厚度'])),
    volume: formatNumber(getNumberProperty(props['体积（cm3）'])),
    weight: formatNumber(getNumberProperty(props['重量（g）'])),
    
    // 容量相关
    capacityLevel: formatNumber(getNumberProperty(props['容量级别（mAh）'])),
    maxDischargeCapacity: formatNumber(getNumberProperty(props['最大放电能量（Wh）'])),
    selfChargingEnergy: formatNumber(getNumberProperty(props['自充能量（Wh）'])),
    capacityWeightRatio: formatNumber(getNumberProperty(props['能量重量比（Wh/g）'])),
    capacityVolumeRatio: formatNumber(getNumberProperty(props['能量体积比（Wh/cm3）'])),
    energyWeightRatio: formatNumber(getNumberProperty(props['能量重量比'])),
    energyVolumeRatio: formatNumber(getNumberProperty(props['能量体积比'])),
    energyAchievementRate: formatNumber(getNumberProperty(props['能量达成率'])),
    dischargeCapacityAchievementRate: formatNumber(getNumberProperty(props['放电能量达成率'])),
    
    // 充电性能
    selfChargingTime: formatNumber(getNumberProperty(props['自充时间（min）'])),
    avgSelfChargingPower: formatNumber(getNumberProperty(props['平均自充功率（W）']) || getNumberProperty(props['平均自充功率'])),
    maxSelfChargingPower: formatNumber(getNumberProperty(props['最大自充电功率']) || getNumberProperty(props['最大自充电功率（W）'])),
    energy20min: formatNumber(getNumberProperty(props['20分钟充入能量']) || getNumberProperty(props['20分钟充入能量（Wh）'])),
    
    // 输出性能
    maxContinuousOutputPower: formatNumber(getNumberProperty(props['最大持续输出平均功率（W）'])),
    maxOutputPower: formatNumber(getNumberProperty(props['最大输出功率']) || getNumberProperty(props['最大输出功率（W）'])),
    maxDischargeCapability: formatNumber(getNumberProperty(props['最大放电能力'])),
    maxEnergyConversionRate: formatNumber(getNumberProperty(props['最大能量转换率'])),
    conversionRate: formatNumber(getNumberProperty(props['转换率'])),
    
    // 充电协议支持
    pdSupport: formatNumber(getNumberProperty(props['PD'])),
    qcSupport: formatNumber(getNumberProperty(props['QC'])),
    ppsSupport: formatNumber(getNumberProperty(props['PPS'])),
    ufcsSupport: formatNumber(getNumberProperty(props['UFCS'])),
    privateProtocol: formatNumber(getNumberProperty(props['私有协议'])),
    protocolCompatibility: formatNumber(getNumberProperty(props['协议相互兼容'])),
    
    // 多接口功能
    dualPortOutput: formatNumber(getNumberProperty(props['双接口同时输出'])),
    hotSwap: formatNumber(getNumberProperty(props['多口插拔不断联'])),
    passThrough: formatNumber(getNumberProperty(props['边冲边放'])),
    customDirection: formatNumber(getNumberProperty(props['输入输出方向自定义'])),
    
    // 温度控制
    temperature: formatNumber(getNumberProperty(props['温度'])),
    maxTemperature: formatNumber(getNumberProperty(props['最高温度'])),
    temperatureUniformity: formatNumber(getNumberProperty(props['温度均匀度'])),
    temperatureControlStrategy: formatNumber(getNumberProperty(props['温控策略']) || getNumberProperty(props['温控策略 1'])),
    
    // 显示功能
    display: formatNumber(getNumberProperty(props['显示'])),
    displayContent: formatNumber(getNumberProperty(props['显示内容'])),
    displayCarrier: formatNumber(getNumberProperty(props['显示载体'])),
    displayAdjustment: formatNumber(getNumberProperty(props['显示调节'])),
    brightness: formatNumber(getNumberProperty(props['亮度'])),
    
    // 线缆相关
    cableLength: formatNumber(getNumberProperty(props['线缆长度'])),
    cableSoftness: formatNumber(getNumberProperty(props['线缆柔软度'])),
    
    // 电源质量
    ripple: formatNumber(getNumberProperty(props['纹波']) || getNumberProperty(props['纹波 1'])),
    
    // 特殊功能
    iotCapability: formatNumber(getNumberProperty(props['IoT能力'])),
    customizationCapability: formatNumber(getNumberProperty(props['自定义能力'])),
    acInputCapability: formatNumber(getNumberProperty(props['AC输入能力'])),
    
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
  // 处理普通数字字段
  if (property?.number !== null && property?.number !== undefined) {
    return property.number;
  }
  
  // 处理计算字段 (formula)
  if (property?.formula?.type === 'number' && property?.formula?.number !== null && property?.formula?.number !== undefined) {
    return property.formula.number;
  }
  
  return 0;
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

/**
 * 格式化数字，保留最多两位小数
 */
function formatNumber(num: number): number {
  if (num === 0 || !num) return 0;
  return Math.round(num * 100) / 100;
}

// ========== 待测产品相关函数 ==========

/**
 * 从 Notion API 获取待测产品数据（不使用缓存）
 */
async function fetchWishlistProductsFromNotion(): Promise<WishlistProduct[]> {
  // 检查必要的环境变量
  if (!wishlistDatabaseId) {
    console.warn('⚠️  NOTION_WISHLIST_DATABASE_ID not configured, returning empty array');
    return [];
  }

  const response = await notionFetch<NotionDatabase>(`/databases/${wishlistDatabaseId}/query`, {
    method: 'POST',
    body: JSON.stringify({
      sorts: [
        {
          property: 'VoteCount',
          direction: 'descending',
        },
        {
          property: 'UpdatedAt',
          direction: 'descending',
        },
      ],
    }),
  });

  return response.results.map(parseNotionPageToWishlistProduct);
}

/**
 * 获取所有待测产品数据（带缓存）
 */
export async function getWishlistProducts(): Promise<WishlistProduct[]> {
  try {
    // 尝试从缓存获取
    const cached = serverCache.get<WishlistProduct[]>(CACHE_KEYS.WISHLIST_PRODUCTS);
    if (cached) {
      console.log('📦 Serving wishlist products from cache');
      return cached;
    }

    console.log('🌐 Fetching wishlist products from Notion API');
    const data = await fetchWishlistProductsFromNotion();
    
    // 设置缓存，120秒过期，自动刷新
    serverCache.setWithAutoRefresh(
      CACHE_KEYS.WISHLIST_PRODUCTS,
      data,
      120, // 120秒
      fetchWishlistProductsFromNotion
    );
    
    return data;
  } catch (error) {
    console.error('Error fetching wishlist products:', error);
    
    // 如果发生错误，尝试返回缓存的数据（即使过期）
    const staleData = serverCache.get<WishlistProduct[]>(CACHE_KEYS.WISHLIST_PRODUCTS, true);
    if (staleData) {
      console.log('⚠️  Using stale wishlist products data due to error');
      return staleData;
    }
    
    return [];
  }
}

/**
 * 根据 ID 获取特定待测产品
 */
export async function getWishlistProductById(id: string): Promise<WishlistProduct | null> {
  try {
    const products = await getWishlistProducts();
    return products.find(product => product.id === id) || null;
  } catch (error) {
    console.error('Error fetching wishlist product by id:', error);
    return null;
  }
}

/**
 * 为待测产品投票
 */
export async function voteForWishlistProduct(productId: string): Promise<boolean> {
  try {
    if (!wishlistDatabaseId) {
      console.warn('⚠️  NOTION_WISHLIST_DATABASE_ID not configured');
      return false;
    }

    // 首先获取当前的投票数
    const response = await notionFetch<NotionPage>(`/pages/${productId}`);
    const currentVotes = getNumberProperty(response.properties.VoteCount) || 0;
    
    // 更新投票数
    await notionFetch(`/pages/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        properties: {
          VoteCount: {
            number: currentVotes + 1
          },
          UpdatedAt: {
            date: {
              start: new Date().toISOString()
            }
          }
        }
      }),
    });

    // 清除缓存以强制刷新
    serverCache.delete(CACHE_KEYS.WISHLIST_PRODUCTS);
    
    return true;
  } catch (error) {
    console.error('Error voting for wishlist product:', error);
    return false;
  }
}

/**
 * 添加新的待测产品请求（简化版）
 */
export async function addWishlistProduct(productName: string): Promise<boolean> {
  try {
    if (!wishlistDatabaseId) {
      console.warn('⚠️  NOTION_WISHLIST_DATABASE_ID not configured');
      return false;
    }

    const now = new Date().toISOString();
    
    await notionFetch(`/pages`, {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: wishlistDatabaseId },
        properties: {
          Name: {
            title: [{ text: { content: productName } }]
          },
          VoteCount: {
            number: 1 // 提交者默认投票
          },
          Status: {
            select: { name: 'requested' } // 默认状态为"等待测试"
          },
          SubmittedAt: {
            date: { start: now }
          },
          UpdatedAt: {
            date: { start: now }
          }
        }
      }),
    });

    // 清除缓存以强制刷新
    serverCache.delete(CACHE_KEYS.WISHLIST_PRODUCTS);
    
    return true;
  } catch (error) {
    console.error('Error adding wishlist product:', error);
    return false;
  }
}

/**
 * 将 Notion 页面数据解析为 WishlistProduct 对象（简化版）
 */
function parseNotionPageToWishlistProduct(page: NotionPage): WishlistProduct {
  const props = page.properties;

  return {
    id: page.id,
    name: getTextProperty(props.Name) || '',
    voteCount: getNumberProperty(props.VoteCount) || 0,
    status: (getSelectProperty(props.Status) as WishlistProduct['status']) || 'requested',
    submittedAt: getDateProperty(props.SubmittedAt) || new Date().toISOString(),
    updatedAt: getDateProperty(props.UpdatedAt) || new Date().toISOString(),
  };
}
