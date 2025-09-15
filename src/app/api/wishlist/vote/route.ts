import { NextRequest, NextResponse } from 'next/server';
import { voteForWishlistProduct } from '@/lib/notion';

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: '缺少产品ID' },
        { status: 400 }
      );
    }

    const success = await voteForWishlistProduct(productId);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: '投票失败，请稍后重试' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Vote API error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}