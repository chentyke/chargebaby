import { Charger, NotionDatabase, NotionPage, ChargerDetailData, SubProject } from '@/types/charger';
import { serverCache, CACHE_KEYS } from './cache';

const notionApiBase = 'https://api.notion.com/v1';
const notionVersion = process.env.NOTION_VERSION || '2022-06-28';
const notionApiKey = process.env.NOTION_API_KEY;
const chargerDatabaseId = process.env.NOTION_CHARGER_DB!;

async function notionFetch<T>(path: string, init?: RequestInit, retries = 3): Promise<T> {
  if (!notionApiKey) throw new Error('NOTION_API_KEY is not set');

  // 增加超时时间，改善连接稳定性
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

  try {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Notion API request attempt ${attempt}/${retries}: ${notionApiBase}${path}`);

        const res = await fetch(`${notionApiBase}${path}`, {
          ...init,
          headers: {
            'Authorization': `Bearer ${notionApiKey}`,
            'Notion-Version': notionVersion,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'User-Agent': 'NextJS-App/1.0',
            'Connection': 'keep-alive',
            ...(init?.headers || {}),
          },
          cache: 'no-store',
          signal: controller.signal,
          // 添加连接配置
          // @ts-ignore - Node.js specific options
          keepalive: true,
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

        // 检查是否是连接错误，增加更长的重试间隔
        const isConnectionError =
          error.code === 'ECONNRESET' ||
          error.code === 'ECONNREFUSED' ||
          error.code === 'ETIMEDOUT' ||
          error.message.includes('fetch failed') ||
          error.message.includes('network');

        // 增加重试延迟，特别是连接错误时
        const baseDelay = isConnectionError ? 3000 : 1000;
        const delay = baseDelay * Math.pow(2, attempt);

        console.log(`Waiting ${delay}ms before retry ${attempt + 1} (${isConnectionError ? 'connection error' : 'other error'})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('All retry attempts failed');
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 从 Notion API 获取充电头数据（不使用缓存）
 */
async function fetchChargersFromNotion(): Promise<Charger[]> {
  // 检查必要的环境变量
  if (!chargerDatabaseId) {
    console.warn('⚠️  NOTION_CHARGER_DB not configured, returning empty array');
    return [];
  }

  const response = await notionFetch<NotionDatabase>(`/databases/${chargerDatabaseId}/query`, {
    method: 'POST',
    body: JSON.stringify({
      filter: {
        property: 'Tags',
        multi_select: { is_not_empty: true },
      },
      sorts: [
        {
          property: 'UpdatedAt',
          direction: 'descending',
        },
      ],
    }),
  });

  return response.results.map(parseNotionPageToCharger);
}

/**
 * 从 Notion 数据库获取所有充电头数据（带缓存）
 */
export async function getChargers(): Promise<Charger[]> {
  try {
    // 尝试从缓存获取
    const cached = serverCache.get<Charger[]>(CACHE_KEYS.CHARGERS);
    if (cached) {
      console.log('📦 Serving chargers from cache');
      return cached;
    }

    console.log('🌐 Fetching chargers from Notion API');
    const data = await fetchChargersFromNotion();

    // 设置缓存，60秒过期，自动刷新
    serverCache.setWithAutoRefresh(
      CACHE_KEYS.CHARGERS,
      data,
      60, // 60秒
      fetchChargersFromNotion
    );

    return data;
  } catch (error: any) {
    console.error('Error fetching chargers from Notion:', error);

    // 检查是否是网络连接问题
    const isNetworkError =
      error.code === 'ECONNRESET' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.message.includes('fetch failed') ||
      error.message.includes('network');

    if (isNetworkError) {
      console.error('🔌 Network connectivity issue detected - this may be a temporary problem');
    }

    // 如果API调用失败，尝试返回过期的缓存数据
    const staleCache = serverCache.get<Charger[]>(CACHE_KEYS.CHARGERS);
    if (staleCache) {
      console.log('⚠️  Serving stale cache due to API error');
      return staleCache;
    }

    // 如果没有缓存，返回空数组并记录详细错误
    console.error('❌ No cache available and API failed - returning empty array');
    return [];
  }
}

/**
 * 通过型号获取充电头数据
 */
export async function getChargerByModel(model: string): Promise<Charger | null> {
  try {
    const cacheKey = `charger-model-${model}`;

    // 尝试从缓存获取
    const cached = serverCache.get<Charger>(cacheKey);
    if (cached) {
      console.log(`📦 Serving charger ${model} from cache`);
      return cached;
    }

    const allChargers = await getChargers();
    const found = allChargers.find(cb => cb.model === model);

    if (found) {
      // 获取完整数据（包含文章内容）
      console.log(`🌐 Fetching charger ${model} details from Notion API`);
      const fullData = await fetchChargerByIdFromNotion(found.id);

      if (fullData) {
        // 设置缓存，5分钟过期
        serverCache.set(cacheKey, fullData, 300);
        return fullData;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching charger by model:', error);
    return null;
  }
}

/**
 * 获取页面内容块（递归获取子块）
 */
export async function getChargerPageBlocks(pageId: string): Promise<any[]> {
  try {
    const response = await notionFetch<any>(`/blocks/${pageId}/children`);
    const blocks = response.results || [];

    // 递归获取有子块的内容
    for (const block of blocks) {
      if (block.has_children) {
        block.children = await getChargerPageBlocks(block.id);
      }
    }

    return blocks;
  } catch (error) {
    console.error('Error fetching charger page blocks:', error);
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

      case 'quote':
        return `> ${convertRichTextToMarkdown(block.quote?.rich_text || [])}`;

      case 'image':
        const imageUrl = block.image?.external?.url || block.image?.file?.url || '';
        const caption = convertRichTextToMarkdown(block.image?.caption || []);
        return `![${caption}](${imageUrl})`;

      case 'divider':
        return '---';

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

    // 应用文本样式
    if (text.annotations?.strikethrough) {
      content = `~~${content}~~`;
    }
    if (text.annotations?.underline) {
      content = `<u>${content}</u>`;
    }
    if (text.annotations?.code) {
      content = `\`${content}\``;
    }
    if (text.annotations?.bold) {
      content = `**${content}**`;
    }
    if (text.annotations?.italic) {
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
 * 根据 ID 获取单个充电头数据
 */
async function fetchChargerByIdFromNotion(id: string): Promise<Charger | null> {
  const [pageResponse, blocks] = await Promise.all([
    notionFetch<NotionPage>(`/pages/${id}`),
    getChargerPageBlocks(id)
  ]);

  const charger = parseNotionPageToCharger(pageResponse);

  // 将页面内容转换为Markdown并添加到articleContent
  const articleContent = convertBlocksToMarkdown(blocks);

  // 获取子项目数据
  const subProjects = await fetchChargerSubProjects(id);

  return {
    ...charger,
    articleContent: articleContent || charger.articleContent,
    subProjects
  };
}

export async function getChargerById(id: string): Promise<Charger | null> {
  try {
    const cacheKey = CACHE_KEYS.CHARGER_BY_ID(id);

    // 尝试从缓存获取
    const cached = serverCache.get<Charger>(cacheKey);
    if (cached) {
      console.log(`📦 Serving charger ${id} from cache`);
      return cached;
    }

    console.log(`🌐 Fetching charger ${id} from Notion API`);
    const data = await fetchChargerByIdFromNotion(id);

    if (data) {
      // 设置缓存，5分钟过期（单个页面变化频率较低）
      serverCache.set(cacheKey, data, 300);
    }

    return data;
  } catch (error) {
    console.error('Error fetching charger by ID:', error);

    // 如果API调用失败，尝试返回过期的缓存数据
    const cacheKey = CACHE_KEYS.CHARGER_BY_ID(id);
    const staleCache = serverCache.get<Charger>(cacheKey);
    if (staleCache) {
      console.log(`⚠️  Serving stale cache for charger ${id} due to API error`);
      return staleCache;
    }

    return null;
  }
}

/**
 * 将 Notion 页面数据解析为 Charger 对象
 */
function parseNotionPageToCharger(page: NotionPage): Charger {
  const props = page.properties;

  // 基于实际API响应结构获取数据
  const brand = getTextProperty(props.品牌) || '';
  const title = getTextProperty(props.Title) || 'Unknown';
  const subtitle = getTextProperty(props.Subtitle) || '';
  const displayName = getTextProperty(props.DisplayName) || '';

  // 使用标题作为model（对于详情页路由）
  const model = title;

  // 获取购买链接（如果有）
  const taobaoLink = getUrlProperty(props.TaobaoLink) || '';
  const jdLink = getUrlProperty(props.JDLink) || '';

  const price = getNumberProperty(props.Price);
  const overallRating = getNumberProperty(props.综合评分);
  const performanceRating = getNumberProperty(props.性能评分);
  const experienceRating = getNumberProperty(props.体验评分);

  return {
    id: page.id,
    brand,
    model,
    title,
    subtitle,
    displayName,
    type: ['充电器'],
    tags: getMultiSelectProperty(props.Tags) || [],
    protocols: getMultiSelectProperty(props.协议) || [],
    price,
    releaseDate: getDateProperty(props.ReleaseDate) || new Date().toISOString(),
    overallRating,
    performanceRating,
    experienceRating,
    advantages: parseListProperty(getRichTextProperty(props.Advantages) || ''),
    disadvantages: parseListProperty(getRichTextProperty(props.Disadvantages) || ''),
    imageUrl: getFileProperty(props.Image) || page.cover?.external?.url || page.cover?.file?.url || '',
    finalImageUrl: getFileProperty(props.Image) || '',
    productSource: getSelectProperty(props.ProductSource) || '',
    taobaoLink,
    jdLink,
    createdAt: getDateProperty(props.CreatedAt) || new Date().toISOString(),
    updatedAt: getDateProperty(props.UpdatedAt) || new Date().toISOString(),
    // 详细技术规格数据
    detailData: parseChargerDetailData(props),
    // 图文内容将在 getChargerById 中从页面内容获取
    articleContent: '',
  };
}

/**
 * 解析充电头详细技术数据
 */
function parseChargerDetailData(props: any): ChargerDetailData {
  return {
    // 物理尺寸
    length: formatNumber(getNumberProperty(props['长度（cm）'])),
    width: formatNumber(getNumberProperty(props['宽度（cm）'])),
    thickness: formatNumber(getNumberProperty(props['高度（cm）'])),
    volume: formatNumber(getNumberProperty(props['体积（cm3）'])),
    weight: formatNumber(getNumberProperty(props['重量（g）'])),

    // 输出性能
    singlePortPower: formatNumber(getNumberProperty(props['单口功率（W）'])),
    multiPortPower: formatNumber(getNumberProperty(props['多口功率（W）'])),
    naturalCoolingPower: formatNumber(getNumberProperty(props['自然散热持续功率（W）'])),
    assistedCoolingPower: formatNumber(getNumberProperty(props['辅助散热持续功率（W）'])),

    // 电流支持
    maxCurrent5V: formatNumber(getNumberProperty(props['最大电流（5V）'])),
    maxCurrent9V: formatNumber(getNumberProperty(props['最大电流（9V）'])),
    maxCurrent12V: formatNumber(getNumberProperty(props['最大电流（12V）'])),
    maxCurrent15V: formatNumber(getNumberProperty(props['最大电流（15V）'])),
    maxCurrent20V: formatNumber(getNumberProperty(props['最大电流（20V）'])),
    maxCurrent28V: formatNumber(getNumberProperty(props['最大电流（28V）'])),

    // 转换效率
    efficiency5V: formatNumber(getNumberProperty(props['转换效率（5V）'])),
    efficiency9V: formatNumber(getNumberProperty(props['转换效率（9V）'])),
    efficiency12V: formatNumber(getNumberProperty(props['转换效率（12V）'])),
    efficiency15V: formatNumber(getNumberProperty(props['转换效率（15V）'])),
    efficiency20V: formatNumber(getNumberProperty(props['转换效率（20V）'])),
    efficiency28V: formatNumber(getNumberProperty(props['转换效率（28V）'])),

    // 纹波测试
    ripple5V: formatNumber(getNumberProperty(props['纹波（5V）'])),
    ripple9V: formatNumber(getNumberProperty(props['纹波（9V）'])),
    ripple12V: formatNumber(getNumberProperty(props['纹波（12V）'])),
    ripple15V: formatNumber(getNumberProperty(props['纹波（15V）'])),
    ripple20V: formatNumber(getNumberProperty(props['纹波（20V）'])),
    ripple28V: formatNumber(getNumberProperty(props['纹波（28V）'])),

    // 发热量（计算值）
    heatGeneration5V: formatNumber(getFormulaNumberProperty(props['发热量（5V）'])),
    heatGeneration9V: formatNumber(getFormulaNumberProperty(props['发热量（9V）'])),
    heatGeneration12V: formatNumber(getFormulaNumberProperty(props['发热量（12V）'])),
    heatGeneration15V: formatNumber(getFormulaNumberProperty(props['发热量（15V）'])),
    heatGeneration20V: formatNumber(getFormulaNumberProperty(props['发热量（20V）'])),
    heatGeneration28V: formatNumber(getFormulaNumberProperty(props['发热量（28V）'])),

    // 温度控制
    maxSurfaceTemp: formatNumber(getNumberProperty(props['最大表面温度（℃）'])),
    thermalControl: getMultiSelectProperty(props['温控机制']) || [],
    powerAllocationGen: formatNumber(getNumberProperty(props['功率分配技术代际'])),

    // 接口配置
    ports: getMultiSelectProperty(props['接口数量']) || [],
    powerAllocationFeatures: getMultiSelectProperty(props['功率分配特性']) || [],

    // 协议支持（主要接口）
    pdSupportPrimary: getMultiSelectProperty(props['PD协议支持性（主要接口）']) || [],
    ppsSupportPrimary: getMultiSelectProperty(props['PPS支持性（主要接口）']) || [],
    ufcsSupportPrimary: getMultiSelectProperty(props['UFCS支持性（主要接口）']) || [],
    privateProtocolSupportPrimary: getMultiSelectProperty(props['私有协议支持性（主要接口）']) || [],

    // 协议支持（次要接口）
    pdSupportSecondary: getMultiSelectProperty(props['PD协议支持性（次要接口）']) || [],
    ppsSupportSecondary: getMultiSelectProperty(props['PPS支持性（次要接口）']) || [],
    ufcsSupportSecondary: getMultiSelectProperty(props['UFCS支持性（次要接口）']) || [],
    privateProtocolSupportSecondary: getMultiSelectProperty(props['私有协议支持性（次要接口）']) || [],

    // 线缆压降补偿
    cableDropCompensation: getMultiSelectProperty(props['线缆压降补偿（线补）']) || [],

    // 显示功能
    displayType: getMultiSelectProperty(props['显示']) || [],
    screenDisplayFunctions: getMultiSelectProperty(props['屏幕显示功能']) || [],

    // IoT功能
    iotFunctions: getMultiSelectProperty(props['IoT功能']) || [],

    // 其他特性
    otherTags: getMultiSelectProperty(props['其他标签']) || [],

    // 数据来源
    dataSource: getRichTextProperty(props['数据来源']) || null,
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

function getNumberProperty(property: any): number | null {
  // 处理普通数字字段
  if (property?.number !== null && property?.number !== undefined) {
    return property.number;
  }

  // 处理计算字段 (formula)
  if (property?.formula?.type === 'number' && property?.formula?.number !== null && property?.formula?.number !== undefined) {
    return property.formula.number;
  }

  return null;
}

function getFormulaNumberProperty(property: any): number | null {
  // 专门处理formula类型的数字字段
  if (property?.formula?.type === 'number' && property?.formula?.number !== null && property?.formula?.number !== undefined) {
    return property.formula.number;
  }

  return null;
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
function formatNumber(num?: number | null): number | null {
  if (num === null || num === undefined) {
    return null;
  }

  if (Number.isNaN(num)) {
    return null;
  }

  return Math.round(num * 100) / 100;
}

function getUrlProperty(property: any): string {
  if (!property) {
    return '';
  }

  if (typeof property.url === 'string' && property.url.trim()) {
    return property.url.trim();
  }

  if (Array.isArray(property.rich_text) && property.rich_text.length > 0) {
    const firstText = property.rich_text[0];
    const content = firstText?.text?.content?.trim();
    if (content && (content.startsWith('http://') || content.startsWith('https://'))) {
      return content;
    }
  }

  return '';
}

/**
 * 获取子项目数据
 */
async function fetchChargerSubProjects(parentId: string): Promise<SubProject[]> {
  try {
    // 充电器数据库暂不使用子项目功能，直接返回空数组
    // 如果将来需要子项目，可以根据实际数据库结构调整查询条件
    return [];
  } catch (error) {
    console.error('Error fetching charger sub projects:', error);
    return [];
  }
}

/**
 * 将 Notion 页面数据解析为 SubProject 对象
 */
function parseNotionPageToSubProject(page: NotionPage): SubProject {
  const props = page.properties;

  return {
    id: page.id,
    model: getTextProperty(props.Model) || '',
    title: getTextProperty(props.Title) || '',
    displayName: getTextProperty(props.DisplayName) || '',
    type: getMultiSelectProperty(props.Type) || [],
    tags: getMultiSelectProperty(props.Tags) || [],
    videoLink: props.VideoLink?.url || '',
    videoDate: getDateProperty(props.VideoDate) || '',
    videoAuthor: getTextProperty(props.VideoAuthor) || '',
    videoCover: getFileProperty(props.VideoCover) || '',
    overallRating: getNumberProperty(props.OverallRating) || undefined,
    performanceRating: getNumberProperty(props.PerformanceRating) || undefined,
    submissionStatus: getSelectProperty(props['投稿审核']) || '',
    createdAt: getDateProperty(props.CreatedAt) || new Date().toISOString(),
    updatedAt: getDateProperty(props.UpdatedAt) || new Date().toISOString(),
  };
}