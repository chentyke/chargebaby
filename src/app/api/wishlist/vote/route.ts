import { NextRequest, NextResponse } from 'next/server';
import { voteForWishlistProduct } from '@/lib/notion';
import { verifyTurnstileToken } from '@/lib/turnstile';

export async function POST(request: NextRequest) {
  try {
    const { productId, turnstileToken } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: '缺少产品ID' },
        { status: 400 }
      );
    }

    if (!turnstileToken) {
      return NextResponse.json(
        { error: '缺少验证令牌' },
        { status: 400 }
      );
    }

    // 验证 Turnstile token
    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      return NextResponse.json(
        { error: '验证失败，请重新验证' },
        { status: 403 }
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