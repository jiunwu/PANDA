import { NextResponse } from 'next/server';
import { getTopics } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const topics = await getTopics();
  return NextResponse.json(topics);
}
