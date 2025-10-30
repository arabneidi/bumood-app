export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    if (!name) {
      const all = await db.predefinedActivity.findMany({ orderBy: { name: 'asc' } });
      return NextResponse.json({ count: all.length, activities: all.map(a => ({ name: a.name, dssComponent: a.dssComponent })) });
    }
    const row = await db.predefinedActivity.findFirst({ where: { name } });
    if (!row) return NextResponse.json({ found: false });
    return NextResponse.json({ found: true, activity: row });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}


