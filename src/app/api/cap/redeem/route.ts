import { NextRequest, NextResponse } from 'next/server';
import { redeemCapChallenge, cap } from '@/lib/cap';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body?.token;
    const solutions = body?.solutions;

    if (!token || !Array.isArray(solutions)) {
      return NextResponse.json(
        { success: false, error: '缺少挑战令牌或解答' },
        { status: 400 },
      );
    }

    const result = await redeemCapChallenge({ token, solutions });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    cap.cleanup().catch((error) => {
      console.error('Cap cleanup error (redeem):', error);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Cap redeem error:', error);
    return NextResponse.json(
      { success: false, error: '验证失败，请重试' },
      { status: 500 },
    );
  }
}
