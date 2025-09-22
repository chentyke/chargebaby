import { NextRequest, NextResponse } from 'next/server';
import { verifyTurnstileToken } from '@/lib/turnstile';

const notionApiBase = 'https://api.notion.com/v1';
const notionVersion = process.env.NOTION_VERSION || '2022-06-28';
const notionApiKey = process.env.NOTION_API_KEY;

interface NotionFileUploadResponse {
  id: string;
  object: string;
  created_time: string;
  last_edited_time: string;
  expiry_time: string;
  upload_url: string;
  archived: boolean;
  status: string;
  filename: string;
  content_type: string;
  content_length: number;
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

export async function POST(request: NextRequest) {
  try {
    if (!notionApiKey) {
      return NextResponse.json(
        { error: 'Notion API configuration missing' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const turnstileToken = formData.get('turnstileToken') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    // 验证 Turnstile token
    if (!turnstileToken) {
      return NextResponse.json(
        { error: '缺少人机验证，请先完成验证' },
        { status: 400 }
      );
    }

    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      return NextResponse.json(
        { error: '人机验证失败，请重新验证' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '只支持上传 JPG、PNG、WebP、GIF 格式的图片' },
        { status: 400 }
      );
    }

    // 验证文件大小 (最大 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '图片文件大小不能超过 20MB' },
        { status: 400 }
      );
    }

    console.log(`📤 Starting file upload: ${file.name} (${file.size} bytes, ${file.type})`);

    // 1. 创建 Notion 文件上传
    const uploadData = await notionFetch<NotionFileUploadResponse>('/file_uploads', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'single_part',
        filename: file.name,
        content_type: file.type,
      }),
    });

    console.log(`📝 Notion file upload created: ${uploadData.id}`);

    // 2. 上传文件到 Notion 的上传URL
    const fileBuffer = await file.arrayBuffer();
    
    const uploadResponse = await fetch(uploadData.upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: new Uint8Array(fileBuffer),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => '');
      console.error(`❌ Failed to upload to Notion: ${uploadResponse.status} ${errorText}`);
      throw new Error(`文件上传失败: ${uploadResponse.status}`);
    }

    console.log(`✅ File uploaded successfully to Notion`);

    // 3. 查询上传状态以获取最终的文件URL
    let finalFileUrl = '';
    try {
      // 等待一小段时间让Notion处理文件
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fileStatus = await notionFetch<NotionFileUploadResponse>(`/file_uploads/${uploadData.id}`);
      if (fileStatus.status === 'completed') {
        // 构造文件访问URL - 这是Notion内部文件的标准格式
        finalFileUrl = `https://prod-files-secure.s3.us-west-2.amazonaws.com/${uploadData.id}/${encodeURIComponent(file.name)}`;
      } else {
        // 如果状态检查失败，使用备用URL格式
        finalFileUrl = uploadData.upload_url.split('?')[0];
      }
    } catch (statusError) {
      console.warn('无法获取文件状态，使用备用URL:', statusError);
      // 备用URL格式
      finalFileUrl = uploadData.upload_url.split('?')[0];
    }

    return NextResponse.json({
      success: true,
      fileId: uploadData.id,
      filename: file.name,
      contentType: file.type,
      size: file.size,
      url: finalFileUrl,
      message: '图片上传成功'
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    
    let errorMessage = '图片上传失败，请稍后重试';
    
    if (error instanceof Error) {
      if (error.message.includes('400')) {
        errorMessage = '请检查图片格式和大小是否符合要求';
      } else if (error.message.includes('401')) {
        errorMessage = '认证失败，请联系管理员';
      } else if (error.message.includes('413')) {
        errorMessage = '图片文件过大，请选择小于 20MB 的图片';
      } else if (error.message.includes('timeout')) {
        errorMessage = '上传超时，请检查网络连接';
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// 获取文件上传状态
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');
  
  if (!fileId) {
    return NextResponse.json(
      { error: 'Missing fileId parameter' },
      { status: 400 }
    );
  }

  try {
    // 查询文件状态
    const fileStatus = await notionFetch<NotionFileUploadResponse>(`/file_uploads/${fileId}`);
    
    return NextResponse.json({
      id: fileStatus.id,
      status: fileStatus.status,
      filename: fileStatus.filename,
      contentType: fileStatus.content_type,
      size: fileStatus.content_length,
      createdAt: fileStatus.created_time,
      expiryTime: fileStatus.expiry_time,
    });
  } catch (error) {
    console.error('Error checking file status:', error);
    return NextResponse.json(
      { error: '查询文件状态失败' },
      { status: 500 }
    );
  }
}