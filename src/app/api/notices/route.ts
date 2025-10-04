import { NextResponse } from 'next/server';
import { getNotices } from '@/lib/notion';

export async function GET() {
  try {
    const notices = await getNotices();
    return NextResponse.json(notices);
  } catch (error) {
    console.error('Error fetching notices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notices' },
      { status: 500 }
    );
  }
}