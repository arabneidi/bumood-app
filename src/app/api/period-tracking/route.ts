export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    const items = await db.periodTracking.findMany({ where: { userId }, orderBy: { startDate: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const items = await request.json();
    const arr = Array.isArray(items) ? items : [items];
    let count = 0;
    for (const p of arr) {
      await db.periodTracking.create({
        data: {
          userId: p.userId || 'dummy-user',
          startDate: p.startDate ? new Date(p.startDate) : new Date(),
          endDate: p.endDate ? new Date(p.endDate) : null,
          flowIntensity: p.flowIntensity || null,
          symptoms: p.symptoms || null,
          notes: p.notes || null
        }
      });
      count++;
    }
    return NextResponse.json({ success: true, count });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}

// deduplicated legacy handlers removed; using shared db client above

