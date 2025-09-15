import { NextRequest, NextResponse } from 'next/server';
import { addWishlistProduct } from '@/lib/notion';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // 验证必填字段
    if (!data.name?.trim()) {
      return NextResponse.json(
        { error: '产品名称为必填项' },
        { status: 400 }
      );
    }

    const success = await addWishlistProduct(data.name.trim());

    if (success) {
      return NextResponse.json({ 
        success: true,
        message: '产品申请提交成功！'
      });
    } else {
      return NextResponse.json(
        { error: '提交失败，请稍后重试' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Add wishlist product API error:', error);
    
    // 检查是否是数据库未配置的错误
    if (error instanceof Error && error.message.includes('NOTION_WISHLIST_DATABASE_ID')) {
      return NextResponse.json(
        { 
          error: '待测产品功能尚未配置，请联系管理员',
          code: 'WISHLIST_DB_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}