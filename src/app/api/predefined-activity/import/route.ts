export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Row = {
  id?: string;
  name: string;
  dssComponent: string;
  category?: string | null;
  icon?: string | null;
  isActive?: boolean | number;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: Row[] = Array.isArray(body) ? body : body?.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ imported: 0 });
    }
    let imported = 0;
    for (const it of items) {
      if (!it?.name || !it?.dssComponent) continue;
      const existing = await db.predefinedActivity.findFirst({ where: { name: it.name } });
      if (existing) {
        await db.predefinedActivity.update({
          where: { id: existing.id },
          data: {
            dssComponent: it.dssComponent,
            category: it.category || 'General',
            icon: it.icon || '✨',
            isActive: it.isActive === 0 ? false : true
          }
        });
      } else {
        await db.predefinedActivity.create({
          data: {
            name: it.name,
            dssComponent: it.dssComponent,
            category: it.category || 'General',
            icon: it.icon || '✨',
            isActive: it.isActive === 0 ? false : true
          }
        });
      }
      imported++;
    }
    return NextResponse.json({ imported });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}


