import { NextResponse } from 'next/server';
import { fetchRandomDocument } from '@/lib/namuwiki';

export async function GET() {
  try {
    const result = await fetchRandomDocument();
    return NextResponse.json(result);
  } catch (error) {
    console.error('가챠 API 에러:', error);
    return NextResponse.json(
      { error: '문서를 가져오는 데 실패했습니다. 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}