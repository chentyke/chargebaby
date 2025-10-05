import { ChargeBaby, NotionDatabase, NotionPage, DetailData, WishlistProduct, SubProject, Notice } from '@/types/chargebaby';
import { serverCache, CACHE_KEYS } from './cache';

const notionApiBase = 'https://api.notion.com/v1';
const notionVersion = process.env.NOTION_VERSION || '2022-06-28';
const notionApiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_DATABASE_ID!;
const wishlistDatabaseId = process.env.NOTION_WISHLIST_DATABASE_ID!;
const noticeDatabaseId = process.env.NOTION_NOTICE_DB!;
const docDatabaseId = process.env.NOTION_DOC_ID!;

async function notionFetch<T>(path: string, init?: RequestInit, retries = 3): Promise<T> {
  if (!notionApiKey) throw new Error('NOTION_API_KEY is not set');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
  
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
            ...(init?.headers || {}),
          },
          cache: 'no-store',
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
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${delay}ms before retry ${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, delay));
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
      // 过滤掉WeChat产品
      return filterOutWeChat(cached);
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

    // 过滤掉WeChat产品
    return filterOutWeChat(data);
  } catch (error) {
    console.error('Error fetching charge babies from Notion:', error);
    
    // 如果API调用失败，尝试返回过期的缓存数据
    const staleCache = serverCache.get<ChargeBaby[]>(CACHE_KEYS.CHARGE_BABIES);
    if (staleCache) {
      console.log('⚠️  Serving stale cache due to API error');
      return filterOutWeChat(staleCache);
    }
    
    return [];
  }
}

/**
 * 过滤掉WeChat产品
 */
function filterOutWeChat(chargeBabies: ChargeBaby[]): ChargeBaby[] {
  return chargeBabies.filter(item => item.model !== 'WeChat');
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

    // 对于WeChat特殊处理，直接从原始数据获取（不使用过滤后的数据）
    let allChargeBabies: ChargeBaby[];
    if (model === 'WeChat') {
      // 直接获取原始数据，不经过过滤
      const cached = serverCache.get<ChargeBaby[]>(CACHE_KEYS.CHARGE_BABIES);
      if (cached) {
        allChargeBabies = cached;
      } else {
        allChargeBabies = await fetchChargeBabiesFromNotion();
      }
    } else {
      // 其他产品使用过滤后的数据
      allChargeBabies = await getChargeBabies();
    }
    
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

export async function getPageTitle(pageId: string): Promise<string | null> {
  try {
    const page = await notionFetch<any>(`/pages/${pageId}`);
    const titleFragments: any[] = page?.properties?.title?.title || [];
    const title = titleFragments
      .map(fragment => fragment?.plain_text || fragment?.text?.content || '')
      .join('')
      .trim();
    return title || null;
  } catch (error) {
    console.error('Error fetching page title:', error);
    return null;
  }
}

/**
 * 将页面内容块转换为Markdown
 */
function convertBlocksToMarkdown(blocks: any[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'paragraph':
        const paragraphText = convertRichTextToMarkdown(block.paragraph?.rich_text || []);
        const paragraphChildren = block.children ? '\n\n' + convertBlocksToMarkdown(block.children) : '';
        return `${paragraphText}${paragraphChildren}`;

      case 'heading_1':
        const h1Title = convertRichTextToMarkdown(block.heading_1?.rich_text || []);
        return `<h1 class="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0 leading-tight border-b border-gray-200 pb-2">${h1Title}</h1>`;

      case 'heading_2':
        const h2Title = convertRichTextToMarkdown(block.heading_2?.rich_text || []);
        const isToggleable = block.heading_2?.is_toggleable;
        if (isToggleable && block.children) {
          const h2Content = convertBlocksToMarkdown(block.children);
          const h2Color = block.heading_2?.color !== 'default' ? ` style="color: ${getNotionColor(block.heading_2?.color)}"` : '';
          return `<details${h2Color} class="notion-toggle notion-heading-toggle">\n<summary class="text-xl font-semibold heading-2">${h2Title}</summary>\n<div class="notion-toggle-content">\n\n${h2Content}\n\n</div>\n</details>`;
        }
        return `<h2 class="text-xl font-semibold text-gray-900 mb-3 mt-5 leading-tight border-b border-gray-100 pb-1">${h2Title}</h2>`;

      case 'heading_3':
        const h3Title = convertRichTextToMarkdown(block.heading_3?.rich_text || []);
        const isH3Toggleable = block.heading_3?.is_toggleable;
        if (isH3Toggleable && block.children) {
          const h3Content = convertBlocksToMarkdown(block.children);
          const h3Color = block.heading_3?.color !== 'default' ? ` style="color: ${getNotionColor(block.heading_3?.color)}"` : '';
          return `<details${h3Color} class="notion-toggle notion-heading-toggle">\n<summary class="text-lg font-semibold heading-3">${h3Title}</summary>\n<div class="notion-toggle-content">\n\n${h3Content}\n\n</div>\n</details>`;
        }
        return `<h3 class="text-lg font-semibold text-gray-900 mb-2 mt-4 leading-tight">${h3Title}</h3>`;

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
        const toggleColor = block.toggle?.color !== 'default' ? ` style="color: ${getNotionColor(block.toggle?.color)}"` : '';
        return `<details${toggleColor} class="notion-toggle">\n<summary>${toggleTitle}</summary>\n<div class="notion-toggle-content">\n\n${toggleContent}\n\n</div>\n</details>`;

      case 'column_list':
        const columns = block.children ? block.children.filter((child: any) => child.type === 'column') : [];
        if (columns.length === 0) return '';

        const columnContent = columns.map((column: any, index: number) => {
          const columnBlocks = column.children || [];
          const content = convertBlocksToMarkdown(columnBlocks);
          const widthRatio = column.column?.width_ratio || 1;
          return `<div class="notion-column" style="flex: ${widthRatio}">\n\n${content}\n\n</div>`;
        }).join('\n');

        return `<div class="notion-column-list" style="display: flex; gap: 1rem;">\n${columnContent}\n</div>`;

      case 'column':
        // Handled within column_list
        return '';

      case 'synced_block':
        // Handle synced blocks - use children if original, or reference if duplicate
        const syncedChildren = block.children || [];
        const syncedContent = convertBlocksToMarkdown(syncedChildren);
        const syncedFrom = block.synced_block?.synced_from;

        if (syncedFrom) {
          // This is a duplicate - might want to add a reference note
          return `<div class="notion-synced-block duplicate">\n${syncedContent}\n</div>`;
        } else {
          // This is the original
          return `<div class="notion-synced-block original">\n${syncedContent}\n</div>`;
        }

      case 'quote':
        const quoteText = convertRichTextToMarkdown(block.quote?.rich_text || []);
        const quoteChildren = block.children ? '\n\n' + convertBlocksToMarkdown(block.children) : '';
        const quoteColor = block.quote?.color !== 'default' ? ` style="border-left-color: ${getNotionColor(block.quote?.color)}"` : '';
        return `<blockquote${quoteColor} class="notion-quote">${quoteText}${quoteChildren}</blockquote>`;

      case 'callout':
        const emoji = block.callout?.icon?.emoji || '💡';
        const calloutText = convertRichTextToMarkdown(block.callout?.rich_text || []);
        const calloutChildren = block.children ? '\n\n' + convertBlocksToMarkdown(block.children) : '';
        const calloutColor = block.callout?.color !== 'default' ? getNotionColor(block.callout?.color) : '#f8fafc';
        const borderColor = block.callout?.color !== 'default' ? getNotionBorderColor(block.callout?.color) : '#e2e8f0';
        return `<div class="notion-callout" style="background-color: ${calloutColor}; border-left: 4px solid ${borderColor}; border-radius: 8px; padding: 1rem 1.25rem; margin: 1.5rem 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"><div style="display: flex; align-items: flex-start; gap: 0.75rem;"><span style="font-size: 1.25rem; line-height: 1.5; flex-shrink: 0;">${emoji}</span><div style="flex: 1; line-height: 1.6;">${calloutText}${calloutChildren}</div></div></div>`;

      case 'code':
        const codeText = convertRichTextToMarkdown(block.code?.rich_text || []);
        const language = block.code?.language || '';
        const codeCaption = block.code?.caption ? convertRichTextToMarkdown(block.code.caption) : '';
        return `\`\`\`${language}\n${codeText}\n\`\`\`` + (codeCaption ? `\n*${codeCaption}*` : '');

      case 'image':
        const imageUrl = block.image?.external?.url || block.image?.file?.url || '';
        const caption = convertRichTextToMarkdown(block.image?.caption || []);
        return `<img src="${imageUrl}" alt="${caption}" title="${caption}" class="notion-image" style="max-width: 100%; height: auto; border-radius: 4px;" />` + (caption ? `\n*${caption}*` : '');

      case 'video':
        const videoUrl = block.video?.external?.url || block.video?.file?.url || '';
        const videoCaption = convertRichTextToMarkdown(block.video?.caption || []);
        return `<div class="notion-video"><a href="${videoUrl}" target="_blank" rel="noopener noreferrer">📹 ${videoCaption || '视频'}</a></div>`;

      case 'file':
        const fileUrl = block.file?.external?.url || block.file?.file?.url || '';
        const fileName = block.file?.name || convertRichTextToMarkdown(block.file?.caption || []) || '文件';
        return `<div class="notion-file"><a href="${fileUrl}" target="_blank" rel="noopener noreferrer">📁 ${fileName}</a></div>`;

      case 'pdf':
        const pdfUrl = block.pdf?.external?.url || block.pdf?.file?.url || '';
        const pdfCaption = convertRichTextToMarkdown(block.pdf?.caption || []);
        return `<div class="notion-pdf"><a href="${pdfUrl}" target="_blank" rel="noopener noreferrer">📄 ${pdfCaption || 'PDF文件'}</a></div>`;
  
      case 'bookmark':
        const bookmarkUrl = block.bookmark?.url || '';
        const bookmarkCaption = convertRichTextToMarkdown(block.bookmark?.caption || []);
        return `<div class="notion-bookmark"><a href="${bookmarkUrl}" target="_blank" rel="noopener noreferrer">🔗 ${bookmarkCaption || bookmarkUrl}</a></div>`;

      case 'embed':
        const embedUrl = block.embed?.url || '';
        const embedCaption = convertRichTextToMarkdown(block.embed?.caption || []);
        return `<div class="notion-embed"><a href="${embedUrl}" target="_blank" rel="noopener noreferrer">🔗 ${embedCaption || '嵌入内容'}</a></div>`;

      case 'divider':
        return '<hr class="notion-divider" style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;" />';

      case 'table':
        if (block.children && block.children.length > 0) {
          const rows = block.children.filter((child: any) => child.type === 'table_row');
          if (rows.length === 0) return '';

          const hasHeader = block.table?.has_column_header;
          const hasRowHeader = block.table?.has_row_header;

          let headerHtml = '';
          let bodyRows = rows;

          if (hasHeader && rows.length > 0) {
            const headerCells = rows[0].table_row?.cells || [];
            headerHtml = `<thead><tr>${headerCells.map((cell: any[], cellIndex: number) => {
              const content = convertRichTextToMarkdown(cell) || '&nbsp;';
              const isRowHeader = hasRowHeader && cellIndex === 0;
              const extraClass = isRowHeader ? ' class="notion-table-row-header"' : '';
              return `<th${extraClass}>${content}</th>`;
            }).join('')}</tr></thead>`;
            bodyRows = rows.slice(1);
          }

          const bodyHtml = `<tbody>${bodyRows.map((row: any) => {
            const cells = row.table_row?.cells || [];
            return `<tr>${cells.map((cell: any[], cellIndex: number) => {
              const content = convertRichTextToMarkdown(cell) || '&nbsp;';
              const isRowHeader = hasRowHeader && cellIndex === 0;
              const tag = isRowHeader ? 'th' : 'td';
              const extraClass = isRowHeader ? ' class="notion-table-row-header"' : '';
              return `<${tag}${extraClass}>${content}</${tag}>`;
            }).join('')}</tr>`;
          }).join('')}</tbody>`;

          return `<div class="notion-table-wrapper"><table class="notion-table">${headerHtml}${bodyHtml}</table></div>`;
        }
        return '';

      case 'table_row':
        // Handled within table
        return '';

      case 'equation':
        const equation = block.equation?.expression || '';
        return `<div class="notion-equation">$$${equation}$$</div>`;

      case 'breadcrumb':
        return '<nav class="notion-breadcrumb">🏠</nav>';

      case 'table_of_contents':
        return '';

      case 'link_preview':
        const linkUrl = block.link_preview?.url || '';
        return `<div class="notion-link-preview"><a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkUrl}</a></div>`;

      case 'template':
        const templateTitle = convertRichTextToMarkdown(block.template?.rich_text || []);
        const templateChildren = block.children ? convertBlocksToMarkdown(block.children) : '';
        return `<div class="notion-template"><strong>📋 ${templateTitle}</strong>\n${templateChildren}</div>`;

      case 'child_page':
        const pageTitle = block.child_page?.title || '';
        return `<div class="notion-child-page">📄 <strong>${pageTitle}</strong></div>`;

      case 'child_database':
        const dbTitle = block.child_database?.title || '';
        return `<div class="notion-child-database">🗃️ <strong>${dbTitle}</strong></div>`;

      case 'unsupported':
        return '<div class="notion-unsupported">⚠️ 不支持的块类型</div>';

      default:
        // Handle unknown block types gracefully
        if (block.children && block.children.length > 0) {
          return convertBlocksToMarkdown(block.children);
        }
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

  return richText.map(text => {
    const rawContent = typeof text?.text?.content === 'string' ? text.text.content : '';
    if (!rawContent) {
      return '';
    }

    const annotations = text.annotations || {};
    const styleSegments: string[] = [];

    if (annotations.color && annotations.color !== 'default') {
      styleSegments.push(`color:${colorMap[annotations.color] || annotations.color}`);
    }

    if (annotations.background_color && annotations.background_color !== 'default') {
      styleSegments.push(`background-color:${bgColorMap[annotations.background_color] || '#f9fafb'}`);
    }

    let content = escapeHtml(rawContent);

    if (annotations.code) {
      content = `<code>${content}</code>`;
    }
    if (annotations.bold) {
      content = `<strong>${content}</strong>`;
    }
    if (annotations.italic) {
      content = `<em>${content}</em>`;
    }
    if (annotations.strikethrough) {
      content = `<del>${content}</del>`;
    }
    if (annotations.underline) {
      content = `<u>${content}</u>`;
    }

    if (styleSegments.length > 0) {
      content = `<span style="${styleSegments.join(';')}">${content}</span>`;
    }

    const linkUrl = text.text?.link?.url;
    if (linkUrl) {
      const href = escapeHtml(linkUrl);
      content = `<a href="${href}" target="_blank" rel="noopener noreferrer">${content}</a>`;
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
  
  // 获取子项目数据
  const subProjects = await fetchSubProjects(id);
  
  return {
    ...chargeBaby,
    articleContent: articleContent || chargeBaby.articleContent,
    subProjects
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
    taobaoLink: getUrlProperty(props.TaobaoLink) || getUrlProperty(props['淘宝链接']) || undefined,
    jdLink: getUrlProperty(props.JDLink) || getUrlProperty(props['京东链接']) || undefined,
    productSource:
      getTextProperty(props.ProductSource) ||
      getSelectProperty(props.ProductSource) ||
      getTextProperty(props['样机提供方']) ||
      getSelectProperty(props['样机提供方']) ||
      undefined,
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
    energy20min: formatNumber(getNumberProperty(props['20分钟充入能量（Wh）'])),
    
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
    passThrough: formatNumber(getNumberProperty(props['边充边放'])),
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

function getUrlProperty(property: any): string {
  // 处理 URL 类型字段
  if (property?.url) {
    return property.url;
  }
  
  // 处理 Rich Text 类型字段（链接可能存储为富文本）
  if (property?.rich_text && Array.isArray(property.rich_text) && property.rich_text.length > 0) {
    const firstText = property.rich_text[0];
    if (firstText?.text?.content) {
      const content = firstText.text.content.trim();
      // 检查内容是否看起来像URL
      if (content.startsWith('http://') || content.startsWith('https://')) {
        return content;
      }
    }
  }
  
  return '';
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

/**
 * 获取子项目数据
 */
async function fetchSubProjects(parentId: string): Promise<SubProject[]> {
  try {
    // 查询所有子项目，只显示审核通过的
    const response = await notionFetch<NotionDatabase>(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({
        filter: {
          and: [
            {
              property: '上级 项目',
              relation: { contains: parentId }
            },
            {
              property: '投稿审核',
              select: { equals: '通过' }
            }
          ]
        },
        sorts: [
          {
            property: 'VideoDate',
            direction: 'descending'
          },
          {
            property: 'CreatedAt',
            direction: 'descending'
          }
        ]
      })
    });

    return response.results.map(parseNotionPageToSubProject);
  } catch (error) {
    console.error('Error fetching sub projects:', error);
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
    overallRating: getNumberProperty(props.OverallRating),
    performanceRating: getNumberProperty(props.PerformanceRating),
    submissionStatus: getSelectProperty(props['投稿审核']) || '',
    createdAt: getDateProperty(props.CreatedAt) || new Date().toISOString(),
    updatedAt: getDateProperty(props.UpdatedAt) || new Date().toISOString(),
  };
}

// ========== 公告相关函数 ==========

/**
 * 从 Notion API 获取公告数据（不使用缓存）
 */
async function fetchNoticesFromNotion(): Promise<Notice[]> {
  // 检查必要的环境变量
  if (!noticeDatabaseId) {
    console.warn('⚠️  NOTION_NOTICE_DB not configured, returning empty array');
    return [];
  }

  const response = await notionFetch<NotionDatabase>(`/databases/${noticeDatabaseId}/query`, {
    method: 'POST',
    body: JSON.stringify({
      sorts: [
        {
          property: '发布日期',
          direction: 'descending',
        },
      ],
    }),
  });

  // 获取所有公告的详细内容
  const noticesWithContent = await Promise.all(
    response.results.map(async (page) => {
      const notice = parseNotionPageToNotice(page);
      // 获取页面内容
      const blocks = await getPageBlocks(page.id);
      const content = convertBlocksToMarkdown(blocks);
      return {
        ...notice,
        content: content || notice.content
      };
    })
  );

  // 过滤掉隐藏的公告
  return noticesWithContent.filter(notice => !notice.hidden);
}

/**
 * 获取所有公告数据（带缓存）
 */
export async function getNotices(): Promise<Notice[]> {
  try {
    // 尝试从缓存获取
    const cached = serverCache.get<Notice[]>(CACHE_KEYS.NOTICES);
    if (cached) {
      console.log('📦 Serving notices from cache');
      return cached;
    }

    console.log('🌐 Fetching notices from Notion API');
    const data = await fetchNoticesFromNotion();

    // 设置缓存，180秒过期，自动刷新
    serverCache.setWithAutoRefresh(
      CACHE_KEYS.NOTICES,
      data,
      180, // 180秒
      fetchNoticesFromNotion
    );

    return data;
  } catch (error) {
    console.error('Error fetching notices:', error);

    // 如果API调用失败，尝试返回过期的缓存数据
    const staleCache = serverCache.get<Notice[]>(CACHE_KEYS.NOTICES, true);
    if (staleCache) {
      console.log('⚠️  Using stale notices data due to API error');
      return staleCache;
    }

    return [];
  }
}

/**
 * 根据 ID 获取特定公告
 */
export async function getNoticeById(id: string): Promise<Notice | null> {
  try {
    const notices = await getNotices();
    return notices.find(notice => notice.id === id) || null;
  } catch (error) {
    console.error('Error fetching notice by id:', error);
    return null;
  }
}

/**
 * 将 Notion 页面数据解析为 Notice 对象
 */
function parseNotionPageToNotice(page: NotionPage): Notice {
  const props = page.properties;

  return {
    id: page.id,
    title: getTextProperty(props.标题) || '',
    content: '', // 内容将在 getNotices 中从页面内容获取
    category: (getSelectProperty(props.类别) as Notice['category']) || '公告',
    publisher: getRichTextProperty(props.发布者) || '',
    publishDate: getDateProperty(props.发布日期) || new Date().toISOString(),
    path: getRichTextProperty(props.路径) || '',
    hidden: getSelectProperty(props.Hidden) === 'true',
    createdAt: page.created_time || new Date().toISOString(),
    updatedAt: page.last_edited_time || new Date().toISOString(),
  };
}

// ========== 文档中心相关函数 ==========

/**
 * 文档接口定义
 */
export interface DocPage {
  id: string;
  title: string;
  path: string;
  order: number;
  level: number;
  parentId: string | null;
  hidden: boolean;
  status: 'published' | 'draft';
  description: string;
  icon: string;
  author: string;
  tags: string[];
  content: string;
  children: DocPage[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 从 Notion API 获取所有文档数据
 */
async function fetchDocsFromNotion(): Promise<DocPage[]> {
  if (!docDatabaseId) {
    console.warn('⚠️  NOTION_DOC_ID not configured, returning empty array');
    return [];
  }

  const response = await notionFetch<NotionDatabase>(`/databases/${docDatabaseId}/query`, {
    method: 'POST',
    body: JSON.stringify({
      filter: {
        and: [
          {
            property: 'Hidden',
            checkbox: { equals: false }
          },
          {
            property: 'Status',
            select: { equals: 'Published' }
          }
        ]
      },
      sorts: [
        {
          property: 'Order',
          direction: 'ascending'
        }
      ]
    }),
  });

  // 解析所有文档
  const docs = response.results.map(parseNotionPageToDoc);

  // 获取每个文档的内容
  const docsWithContent = await Promise.all(
    docs.map(async (doc) => {
      const blocks = await getPageBlocks(doc.id);
      const content = convertBlocksToMarkdown(blocks);
      return {
        ...doc,
        content: content || doc.content
      };
    })
  );

  // 构建树形结构
  return buildDocTree(docsWithContent);
}

/**
 * 获取所有文档数据（带缓存）
 */
export async function getDocs(): Promise<DocPage[]> {
  try {
    const cacheKey = CACHE_KEYS.DOCS;

    // 尝试从缓存获取
    const cached = serverCache.get<DocPage[]>(cacheKey);
    if (cached) {
      console.log('📦 Serving docs from cache');
      return cached;
    }

    console.log('🌐 Fetching docs from Notion API');
    const data = await fetchDocsFromNotion();

    // 设置缓存，300秒过期，自动刷新
    serverCache.setWithAutoRefresh(
      cacheKey,
      data,
      300, // 5分钟
      fetchDocsFromNotion
    );

    return data;
  } catch (error) {
    console.error('Error fetching docs:', error);

    // 如果API调用失败，尝试返回过期的缓存数据
    const cacheKey = CACHE_KEYS.DOCS;
    const staleCache = serverCache.get<DocPage[]>(cacheKey, true);
    if (staleCache) {
      console.log('⚠️  Using stale docs data due to API error');
      return staleCache;
    }

    return [];
  }
}

/**
 * 根据路径获取特定文档
 */
export async function getDocByPath(path: string): Promise<DocPage | null> {
  try {
    const docs = await getDocs();
    return findDocByPath(docs, path) || null;
  } catch (error) {
    console.error('Error fetching doc by path:', error);
    return null;
  }
}

/**
 * 将 Notion 页面数据解析为 DocPage 对象
 */
function parseNotionPageToDoc(page: NotionPage): DocPage {
  const props = page.properties;

  // 获取父级文档ID
  const parentRelations = props.Parent?.relation || [];
  const parentId = parentRelations.length > 0 ? parentRelations[0].id : null;

  // 计算文档层级
  let level = 1;
  if (props.Level?.formula?.type === 'number') {
    level = props.Level.formula.number || 1;
  }

  // 获取标题字段，支持中英文字段名
  const title = getTextProperty(props.Title) || getTextProperty(props.名称) || '';

  // 获取路径，并确保以 / 开头
  let path = getRichTextProperty(props.Path) || '';
  if (path && !path.startsWith('/')) {
    path = '/' + path;
  }

  return {
    id: page.id,
    title,
    path,
    order: getNumberProperty(props.Order) || 0,
    level,
    parentId,
    hidden: getCheckboxProperty(props.Hidden) || false,
    status: (getSelectProperty(props.Status) as DocPage['status']) || 'draft',
    description: getRichTextProperty(props.Description) || '',
    icon: getFileProperty(props.Icon) || '📄',
    author: getRichTextProperty(props.Author) || getRichTextProperty(props.作者) || '',
    tags: getMultiSelectProperty(props.Tags) || [],
    content: '', // 内容将在 fetchDocsFromNotion 中获取
    children: [], // 将在 buildDocTree 中构建
    createdAt: page.created_time || new Date().toISOString(),
    updatedAt: page.last_edited_time || new Date().toISOString(),
  };
}

/**
 * 构建文档树形结构
 */
function buildDocTree(docs: DocPage[]): DocPage[] {
  const docMap = new Map<string, DocPage>();
  const rootDocs: DocPage[] = [];

  // 创建文档映射
  docs.forEach(doc => {
    docMap.set(doc.id, { ...doc, children: [] });
  });

  // 构建树形结构
  docs.forEach(doc => {
    const docWithChildren = docMap.get(doc.id)!;

    if (doc.parentId && docMap.has(doc.parentId)) {
      // 有父文档，添加到父文档的children中
      const parent = docMap.get(doc.parentId)!;
      parent.children.push(docWithChildren);
    } else {
      // 没有父文档，作为根文档
      rootDocs.push(docWithChildren);
    }
  });

  // 对每层的文档进行排序
  const sortDocs = (docs: DocPage[]) => {
    docs.sort((a, b) => a.order - b.order);
    docs.forEach(doc => sortDocs(doc.children));
  };

  sortDocs(rootDocs);

  return rootDocs;
}

/**
 * 在文档树中根据路径查找文档
 */
function findDocByPath(docs: DocPage[], path: string): DocPage | null {
  for (const doc of docs) {
    if (doc.path === path) {
      return doc;
    }

    // 在子文档中查找
    const found = findDocByPath(doc.children, path);
    if (found) {
      return found;
    }
  }

  return null;
}

/**
 * 获取文档的面包屑导航
 */
export async function getDocBreadcrumb(path: string): Promise<DocPage[]> {
  try {
    const docs = await getDocs();
    const breadcrumb: DocPage[] = [];

    const findBreadcrumb = (docs: DocPage[], targetPath: string, current: DocPage[] = []): boolean => {
      for (const doc of docs) {
        if (doc.path === targetPath) {
          breadcrumb.push(...current, doc);
          return true;
        }

        if (doc.children.length > 0) {
          if (findBreadcrumb(doc.children, targetPath, [...current, doc])) {
            return true;
          }
        }
      }
      return false;
    };

    findBreadcrumb(docs, path);
    return breadcrumb;
  } catch (error) {
    console.error('Error getting doc breadcrumb:', error);
    return [];
  }
}

/**
 * 获取相邻文档（上一篇/下一篇）
 */
export async function getAdjacentDocs(path: string): Promise<{ prev: DocPage | null, next: DocPage | null }> {
  try {
    const docs = await getDocs();
    const flatDocs: DocPage[] = [];

    // 将树形结构扁平化为数组
    const flattenDocs = (docs: DocPage[]) => {
      docs.forEach(doc => {
        flatDocs.push(doc);
        if (doc.children.length > 0) {
          flattenDocs(doc.children);
        }
      });
    };

    flattenDocs(docs);

    // 找到当前文档的索引
    const currentIndex = flatDocs.findIndex(doc => doc.path === path);
    if (currentIndex === -1) {
      return { prev: null, next: null };
    }

    return {
      prev: currentIndex > 0 ? flatDocs[currentIndex - 1] : null,
      next: currentIndex < flatDocs.length - 1 ? flatDocs[currentIndex + 1] : null
    };
  } catch (error) {
    console.error('Error getting adjacent docs:', error);
    return { prev: null, next: null };
  }
}

// 辅助函数：获取Checkbox属性
function getCheckboxProperty(property: any): boolean {
  return property?.checkbox || false;
}

// Helper function to get Notion colors
function getNotionColor(color: string): string {
  const colorMap: Record<string, string> = {
    red: '#fef2f2',
    orange: '#fff7ed',
    yellow: '#fefce8',
    green: '#f0fdf4',
    blue: '#eff6ff',
    purple: '#faf5ff',
    pink: '#fdf2f8',
    gray: '#f9fafb',
    brown: '#fef7f0'
  };
  return colorMap[color] || '#f9fafb';
}

// Helper function to get Notion border colors
function getNotionBorderColor(color: string): string {
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
  return colorMap[color] || '#e2e8f0';
}

// Helper function to escape HTML
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
