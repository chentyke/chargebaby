import { Suspense } from 'react';
import { getPageBlocks, getPageTitle } from '@/lib/notion';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { RetryButton } from '@/components/retry-button';
import { slugifyHeading } from '@/lib/utils';
import { Metadata } from 'next';
import './notion-styles.css';

const POWERBANK_DOC_ID = process.env.NOTION_POWERBANK_DOC_ID!;

export const metadata: Metadata = {
  title: '移动电源测试指南 | ChargeBaby',
  description: '移动电源测试指南',
};

async function PowerBankDocContent() {
  if (!POWERBANK_DOC_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚙️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">配置错误</h1>
          <p className="text-gray-600 mb-6">NOTION_POWERBANK_DOC_ID 未配置，无法加载文档内容</p>
          <p className="text-sm text-gray-500">请联系管理员检查环境配置</p>
        </div>
      </div>
    );
  }

  try {
    const [blocks, pageTitle] = await Promise.all([
      getPageBlocks(POWERBANK_DOC_ID),
      getPageTitle(POWERBANK_DOC_ID),
    ]);
    const headings = extractHeadings(blocks);
    const headingMap = new Map(headings.map(heading => [heading.blockId, heading]));
    const markdownContent = convertBlocksToMarkdown(blocks, { headings, headingMap });
    
    // 调试：输出前几个字符
    console.log('Markdown content preview:', markdownContent.substring(0, 200));
    console.log('Total blocks:', blocks.length);
    
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {pageTitle && (
            <header className="mb-8 pb-4 border-b border-gray-200">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {pageTitle}
              </h1>
            </header>
          )}
          <div className="prose prose-lg max-w-none">
            <MarkdownRenderer content={markdownContent} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading powerbank doc:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">加载失败</h1>
          <p className="text-gray-600 mb-6">
            无法加载移动电源测试指南内容。可能是网络连接问题或服务暂时不可用。
          </p>
          <RetryButton className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            重试
          </RetryButton>
        </div>
      </div>
    );
  }
}

interface HeadingInfo {
  blockId: string;
  title: string;
  slug: string;
  level: 1 | 2 | 3;
}

interface RenderOptions {
  headings: HeadingInfo[];
  headingMap: Map<string, HeadingInfo>;
}

const defaultRenderOptions: RenderOptions = {
  headings: [],
  headingMap: new Map(),
};

const headingClassMap: Record<HeadingInfo['level'], string> = {
  1: 'text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0 leading-tight border-b border-gray-200 pb-2',
  2: 'text-xl font-semibold text-gray-900 mb-3 mt-5 leading-tight border-b border-gray-100 pb-1',
  3: 'text-lg font-semibold text-gray-900 mb-2 mt-4 leading-tight',
};

function convertBlocksToMarkdown(blocks: any[], options: RenderOptions = defaultRenderOptions): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'paragraph':
        const paragraphText = convertRichTextToMarkdown(block.paragraph?.rich_text || []);
        const paragraphChildren = block.children ? '\n\n' + convertBlocksToMarkdown(block.children, options) : '';
        return `${paragraphText}${paragraphChildren}`;
      
      case 'heading_1':
        const h1Title = convertRichTextToMarkdown(block.heading_1?.rich_text || []);
        const h1Info = options.headingMap.get(block.id);
        const h1IdAttr = h1Info?.slug ? ` id="${h1Info.slug}"` : '';
        return `<h1${h1IdAttr} class="${headingClassMap[1]}">${h1Title}</h1>`;
      
      case 'heading_2':
        const h2Title = convertRichTextToMarkdown(block.heading_2?.rich_text || []);
        const h2Info = options.headingMap.get(block.id);
        const h2IdAttr = h2Info?.slug ? ` id="${h2Info.slug}"` : '';
        const isToggleable = block.heading_2?.is_toggleable;
        if (isToggleable && block.children) {
          const h2Content = convertBlocksToMarkdown(block.children, options);
          const h2Color = block.heading_2?.color !== 'default' ? ` style="color: ${getNotionColor(block.heading_2?.color)}"` : '';
          const summaryIdAttr = h2Info?.slug ? ` id="${h2Info.slug}"` : '';
          return `<details${h2Color} class="notion-toggle notion-heading-toggle">\n<summary${summaryIdAttr} class="text-xl font-semibold heading-2">${h2Title}</summary>\n<div class="notion-toggle-content">\n\n${h2Content}\n\n</div>\n</details>`;
        }
        return `<h2${h2IdAttr} class="${headingClassMap[2]}">${h2Title}</h2>`;
      
      case 'heading_3':
        const h3Title = convertRichTextToMarkdown(block.heading_3?.rich_text || []);
        const h3Info = options.headingMap.get(block.id);
        const h3IdAttr = h3Info?.slug ? ` id="${h3Info.slug}"` : '';
        const isH3Toggleable = block.heading_3?.is_toggleable;
        if (isH3Toggleable && block.children) {
          const h3Content = convertBlocksToMarkdown(block.children, options);
          const h3Color = block.heading_3?.color !== 'default' ? ` style="color: ${getNotionColor(block.heading_3?.color)}"` : '';
          const summaryIdAttr = h3Info?.slug ? ` id="${h3Info.slug}"` : '';
          return `<details${h3Color} class="notion-toggle notion-heading-toggle">\n<summary${summaryIdAttr} class="text-lg font-semibold heading-3">${h3Title}</summary>\n<div class="notion-toggle-content">\n\n${h3Content}\n\n</div>\n</details>`;
        }
        return `<h3${h3IdAttr} class="${headingClassMap[3]}">${h3Title}</h3>`;
      
      case 'bulleted_list_item':
        const bulletText = convertRichTextToMarkdown(block.bulleted_list_item?.rich_text || []);
        const bulletChildren = block.children ? '\n' + convertBlocksToMarkdown(block.children, options).split('\n').map(line => '  ' + line).join('\n') : '';
        return `- ${bulletText}${bulletChildren}`;
      
      case 'numbered_list_item':
        const numberText = convertRichTextToMarkdown(block.numbered_list_item?.rich_text || []);
        const numberChildren = block.children ? '\n' + convertBlocksToMarkdown(block.children, options).split('\n').map(line => '  ' + line).join('\n') : '';
        return `1. ${numberText}${numberChildren}`;
      
      case 'to_do':
        const checked = block.to_do?.checked ? '[x]' : '[ ]';
        const todoText = convertRichTextToMarkdown(block.to_do?.rich_text || []);
        const todoChildren = block.children ? '\n' + convertBlocksToMarkdown(block.children, options).split('\n').map(line => '  ' + line).join('\n') : '';
        return `- ${checked} ${todoText}${todoChildren}`;
      
      case 'toggle':
        const toggleTitle = convertRichTextToMarkdown(block.toggle?.rich_text || []);
        const toggleContent = block.children ? convertBlocksToMarkdown(block.children, options) : '';
        const toggleColor = block.toggle?.color !== 'default' ? ` style="color: ${getNotionColor(block.toggle?.color)}"` : '';
        return `<details${toggleColor} class="notion-toggle">\n<summary>${toggleTitle}</summary>\n<div class="notion-toggle-content">\n\n${toggleContent}\n\n</div>\n</details>`;
      
      case 'column_list':
        const columns = block.children ? block.children.filter((child: any) => child.type === 'column') : [];
        if (columns.length === 0) return '';
        
        const columnContent = columns.map((column: any, index: number) => {
          const columnBlocks = column.children || [];
          const content = convertBlocksToMarkdown(columnBlocks, options);
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
        const syncedContent = convertBlocksToMarkdown(syncedChildren, options);
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
        const quoteChildren = block.children ? '\n\n' + convertBlocksToMarkdown(block.children, options) : '';
        const quoteColor = block.quote?.color !== 'default' ? ` style="border-left-color: ${getNotionColor(block.quote?.color)}"` : '';
        return `<blockquote${quoteColor} class="notion-quote">${quoteText}${quoteChildren}</blockquote>`;
      
      case 'callout':
        const emoji = block.callout?.icon?.emoji || '💡';
        const calloutText = convertRichTextToMarkdown(block.callout?.rich_text || []);
        const calloutChildren = block.children ? '\n\n' + convertBlocksToMarkdown(block.children, options) : '';
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
        return renderTableOfContents(options.headings);
      
      case 'link_preview':
        const linkUrl = block.link_preview?.url || '';
        return `<div class="notion-link-preview"><a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkUrl}</a></div>`;
      
      case 'template':
        const templateTitle = convertRichTextToMarkdown(block.template?.rich_text || []);
        const templateChildren = block.children ? convertBlocksToMarkdown(block.children, options) : '';
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
          return convertBlocksToMarkdown(block.children, options);
        }
        return '';
    }
  }).filter(content => content.trim() !== '').join('\n\n');
}

function renderTableOfContents(headings: HeadingInfo[]): string {
  const validHeadings = headings.filter(heading => heading.slug && heading.title);

  if (validHeadings.length === 0) {
    return `<details class="notion-toc" id="table-of-contents" data-default-open="true">
  <summary class="notion-toc-summary">📋 <strong>目录</strong></summary>
  <div class="toc-list">暂无可用目录</div>
</details>`;
  }

  const links = validHeadings
    .map(heading => `<a class="toc-h${heading.level}" href="#${heading.slug}">${escapeHtml(heading.title)}</a>`)
    .join('\n');

  return `<details class="notion-toc" id="table-of-contents" data-default-open="true">\n  <summary class="notion-toc-summary">📋 <strong>目录</strong></summary>\n  <div class="toc-list">\n${links}\n  </div>\n</details>`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function extractHeadings(
  blocks: any[],
  slugCounts: Map<string, number> = new Map(),
  accumulator: HeadingInfo[] = []
): HeadingInfo[] {
  for (const block of blocks) {
    if (!block) {
      continue;
    }

    if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
      const richText = block[block.type]?.rich_text || [];
      const plainTitle = convertRichTextToPlainText(richText);
      const baseSlug = slugifyHeading(plainTitle) || 'section';
      const currentCount = slugCounts.get(baseSlug) || 0;
      const slug = currentCount > 0 ? `${baseSlug}-${currentCount + 1}` : baseSlug;
      slugCounts.set(baseSlug, currentCount + 1);

      const level: 1 | 2 | 3 = block.type === 'heading_1' ? 1 : block.type === 'heading_2' ? 2 : 3;

      accumulator.push({
        blockId: block.id,
        title: plainTitle,
        slug,
        level,
      });
    }

    if (Array.isArray(block.children) && block.children.length > 0) {
      extractHeadings(block.children, slugCounts, accumulator);
    }
  }

  return accumulator;
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


function convertRichTextToPlainText(richText: any[]): string {
  if (!Array.isArray(richText) || richText.length === 0) {
    return '';
  }

  return richText
    .map(text => {
      if (typeof text?.plain_text === 'string') {
        return text.plain_text;
      }
      return text?.text?.content || '';
    })
    .join('');
}

function convertRichTextToMarkdown(richText: any[]): string {
  if (!Array.isArray(richText) || richText.length === 0) {
    return '';
  }
  
  return richText.map(text => {
    const rawContent = text.text?.content || '';
    if (!rawContent) {
      return '';
    }

    let content = escapeHtml(rawContent);
    const styles: string[] = [];
    const annotations = text.annotations || {};
    
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

    if (styles.length > 0) {
      content = `<span style="${styles.join(';')}">${content}</span>`;
    }

    if (text.text?.link?.url) {
      const href = escapeHtml(text.text.link.url);
      content = `<a href="${href}" target="_blank" rel="noopener noreferrer">${content}</a>`;
    }

    return content;
  }).join('');
}

export default function PowerBankDocPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <PowerBankDocContent />
    </Suspense>
  );
}
