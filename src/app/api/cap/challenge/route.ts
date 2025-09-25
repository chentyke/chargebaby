import { NextResponse } from 'next/server';
import { createCapChallenge, cap } from '@/lib/cap';

export async function POST() {
  try {
    const challenge = await createCapChallenge();
    cap.cleanup().catch((error) => {
      console.error('Cap cleanup error (challenge):', error);
    });
    return NextResponse.json(challenge);
  } catch (error) {
    console.error('Cap challenge error:', error);
    return NextResponse.json(
      { success: false, error: '无法生成验证挑战' },
      { status: 500 },
    );
  }
}
