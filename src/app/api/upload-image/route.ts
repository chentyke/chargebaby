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

    // 验证 Turnstile token（本地开发环境跳过）
    const isLocalhost = process.env.NODE_ENV === 'development' || 
                       request.headers.get('host')?.includes('localhost') ||
                       request.headers.get('host')?.includes('127.0.0.1');

    if (!isLocalhost) {
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
    } else {
      console.log('🔧 Development mode: Skipping Turnstile verification');
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
        filename: file.name,
        content_type: file.type,
      }),
    });

    console.log(`📝 Notion file upload created: ${uploadData.id}`);

    // 2. 上传文件到 Notion 使用 send endpoint
    const fileBuffer = await file.arrayBuffer();
    
    // 创建 FormData 用于文件上传
    const uploadFormData = new FormData();
    uploadFormData.append('file', new Blob([fileBuffer], { type: file.type }), file.name);
    
    const uploadResponse = await fetch(`${notionApiBase}/file_uploads/${uploadData.id}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': notionVersion,
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => '');
      console.error(`❌ Failed to upload to Notion: ${uploadResponse.status} ${errorText}`);
      throw new Error(`文件上传失败: ${uploadResponse.status}`);
    }

    console.log(`✅ File uploaded successfully to Notion`);
    
    const uploadResult = await uploadResponse.json();
    console.log('Upload result:', uploadResult);

    // 3. 文件上传成功，直接使用文件ID构建URL
    const finalFileUrl = `https://prod-files-secure.s3.us-west-2.amazonaws.com/secure.notion-static.com/${uploadData.id}/${encodeURIComponent(file.name)}`;

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