import { NextRequest } from 'next/server';

const notionApiKey = process.env.NOTION_API_KEY;
const feedbackDatabaseId = process.env.NOTION_FEEDBACK_DATABASE_ID;

export async function POST(request: NextRequest) {
  try {
    if (!notionApiKey || !feedbackDatabaseId) {
      return Response.json(
        { error: 'Notion配置缺失，请联系管理员' },
        { status: 500 }
      );
    }

    // 处理JSON数据 (包含已上传图片的URL)
    const body = await request.json();
    const title = body.title;
    const type = body.type;
    const description = body.description;
    const contact = body.contact || '';
    const imageUrls = body.imageUrls || [];

    // 验证必填字段
    if (!title || !type || !description) {
      return Response.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 图片URL已经通过imageUrls传入，无需再次上传

    // 类型映射
    const typeMapping: Record<string, string> = {
      'website_design': '网站设计',
      'data_error': '数据错误', 
      'feature_request': '功能请求',
      'other': '其他问题'
    };

    const notionType = typeMapping[type] || '其他问题';
    const now = new Date().toISOString();

    // 提交到Notion
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: feedbackDatabaseId },
        properties: {
          '反馈': {
            title: [{ text: { content: title } }]
          },
          '类型': {
            select: { name: notionType }
          },
          '描述': {
            rich_text: [
              { text: { content: description } },
              ...(imageUrls.length > 0 ? [
                { text: { content: '\n\n附件图片：\n' } },
                ...imageUrls.map((url, index) => ({
                  text: {
                    content: `图片${index + 1}: ${url}\n`,
                    link: null
                  }
                }))
              ] : [])
            ]
          },
          '联系方式': {
            rich_text: contact ? [{ text: { content: contact } }] : []
          },
          '图片': {
            files: imageUrls.map((url, index) => {
              // 检查是否是notion-file:// 格式（Notion API上传的文件）
              if (url.startsWith('notion-file://')) {
                const fileId = url.replace('notion-file://', '');
                return {
                  type: 'file_upload',
                  name: `反馈图片${index + 1}.png`,
                  file_upload: {
                    id: fileId
                  }
                };
              } else {
                // 外部URL
                return {
                  type: 'external',
                  name: `反馈图片${index + 1}.png`,
                  external: {
                    url: url
                  }
                };
              }
            })
          },
          '日期': {
            date: { start: now }
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notion API error:', response.status, errorText);
      return Response.json(
        { error: `提交失败: ${response.status} - ${errorText}` },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('Feedback submitted successfully:', result.id);

    return Response.json({ 
      success: true, 
      message: '反馈提交成功',
      id: result.id 
    });

  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return Response.json(
      { error: error.message || '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}