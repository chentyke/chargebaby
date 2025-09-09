import { ChargeBaby, NotionDatabase, NotionPage } from '@/types/chargebaby';

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
