import { NextRequest, NextResponse } from 'next/server';
import { validateCapToken } from '@/lib/cap';

const notionApiBase = 'https://api.notion.com/v1';
const notionVersion = process.env.NOTION_VERSION || '2022-06-28';
const notionApiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_DATABASE_ID; // 使用主数据库ID

interface ReviewSubmissionData {
  model: string;
  author: string;
  link: string;
  date: string;
  cover: string;
  coverType?: 'uploaded' | 'external'; // 新增：标记封面类型
  type: string;
  title: string;
  capToken?: string;
}

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
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Notion API ${res.status}: ${text}`);
  }
  
  return res.json() as Promise<T>;
}

async function findParentProduct(modelName: string): Promise<string | null> {
  try {
    // 查询主产品数据库，找到对应的产品
    const response = await notionFetch<any>(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({
        filter: {
          and: [
            {
              property: 'Model',
              title: { contains: modelName }
            },
            {
              property: 'Type',
              multi_select: { contains: '充电宝' }
            }
          ]
        },
        page_size: 1
      })
    });

    if (response.results && response.results.length > 0) {
      return response.results[0].id;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding parent product:', error);
    return null;
  }
}

function createReviewNotionProperties(data: ReviewSubmissionData, parentId: string | null) {
  const now = new Date().toISOString();
  
  // 生成评测标题
  const reviewTitle = `${data.type}评测-${data.title}`;
  
  const properties: any = {
    // 使用 Model 作为标题字段
    'Model': {
      title: [{ text: { content: reviewTitle } }]
    },
    
    // 评测类型
    'Type': {
      multi_select: [{ name: data.type }]
    },
    
    // 评测标题
    'Title': {
      rich_text: [{ text: { content: data.title } }]
    },
    
    // 视频作者
    'VideoAuthor': {
      rich_text: [{ text: { content: data.author } }]
    },
    
    // 视频链接
    'VideoLink': {
      url: data.link
    },
    
    // 视频日期
    'VideoDate': {
      date: { start: data.date }
    },
    
    // 投稿审核状态设为待审核
    '投稿审核': {
      select: { name: '待审核' }
    },
    
    // 创建和更新时间
    'CreatedAt': {
      date: { start: now }
    },
    
    'UpdatedAt': {
      date: { start: now }
    }
  };

  // 如果有封面图片，添加封面
  if (data.cover) {
    if (data.coverType === 'uploaded') {
      // 使用上传的文件ID
      properties['VideoCover'] = {
        files: [
          {
            type: "file_upload",
            file_upload: {
              id: data.cover
            },
            name: "cover.png" // 提供默认名称
          }
        ]
      };
    } else {
      // 使用外部URL
      properties['VideoCover'] = {
        files: [
          {
            type: "external",
            external: {
              url: data.cover
            }
          }
        ]
      };
    }
  }

  // 如果找到了父产品，建立关联
  if (parentId) {
    properties['上级 项目'] = {
      relation: [{ id: parentId }]
    };
  }

  return properties;
}

export async function POST(request: NextRequest) {
  try {
    if (!notionApiKey) {
      return NextResponse.json(
        { error: 'Notion API configuration missing' },
        { status: 500 }
      );
    }

    if (!databaseId) {
      return NextResponse.json(
        { 
          error: '投稿功能暂未开放，数据库配置错误。',
          code: 'DATABASE_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }

    const data: ReviewSubmissionData = await request.json();

    // Cap 验证（本地开发环境跳过）
    const isLocalhost = process.env.NODE_ENV === 'development' || 
                       request.headers.get('host')?.includes('localhost') ||
                       request.headers.get('host')?.includes('127.0.0.1');

    if (!isLocalhost) {
      if (!data.capToken) {
        return NextResponse.json(
          { error: '缺少人机验证，请刷新页面重试' },
          { status: 400 }
        );
      }

      const { success } = await validateCapToken(data.capToken);
      if (!success) {
        return NextResponse.json(
          { error: '人机验证失败，请重试' },
          { status: 400 }
        );
      }
    } else {
      console.log('🔧 Development mode: Skipping Cap verification for review submission');
    }

    // 基本验证
    if (!data.model || !data.title || !data.author || !data.link || !data.date || !data.type) {
      return NextResponse.json(
        { error: '必填字段不能为空：产品型号、标题、作者、链接、日期、类型' },
        { status: 400 }
      );
    }

    // URL 验证
    try {
      new URL(data.link);
    } catch {
      return NextResponse.json(
        { error: '评测链接格式不正确，请输入完整的URL' },
        { status: 400 }
      );
    }

    // 查找父产品
    const parentId = await findParentProduct(data.model);
    
    // 创建 Notion 页面属性
    const notionProperties = createReviewNotionProperties(data, parentId);
    
    // 创建评测页面
    const response = await notionFetch(`/pages`, {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: notionProperties,
      }),
    });

    console.log('Review submission created successfully:', {
      id: (response as any).id,
      model: data.model,
      author: data.author,
      parentId
    });

    return NextResponse.json(
      { 
        success: true, 
        message: '投稿成功！感谢您的投稿，我们会尽快审核后展示在评测列表中。',
        id: (response as any).id 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating review submission:', error);
    
    let errorMessage = '提交失败，请稍后重试';
    
    if (error instanceof Error) {
      if (error.message.includes('400')) {
        errorMessage = '请检查数据格式是否正确';
      } else if (error.message.includes('401')) {
        errorMessage = '认证失败，请联系管理员';
      } else if (error.message.includes('404')) {
        errorMessage = '数据库配置错误，请联系管理员';
      } else if (error.message.includes('validation')) {
        errorMessage = '数据验证失败，请检查所有字段是否填写正确';
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
