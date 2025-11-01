export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function maskUrl(url?: string | null) {
  if (!url) return 'N/A';
  try {
    const u = new URL(url);
    const maskedAuth = u.username ? `${u.username}:***` : '';
    return `${u.protocol}//${maskedAuth}${maskedAuth ? '@' : ''}${u.host}${u.pathname}`;
  } catch {
    return 'Invalid DATABASE_URL format';
  }
}

export async function GET(_req: NextRequest) {
  try {
    const dbUrl = process.env.DATABASE_URL || null;
    const masked = maskUrl(dbUrl);
    let version: string | null = null;
    let currentDb: string | null = null;
    try {
      const rows: any[] = await db.$queryRawUnsafe('select current_database() as db, version() as v');
      if (rows && rows[0]) {
        currentDb = rows[0].db || null;
        version = rows[0].v || null;
      }
    } catch {}
    return NextResponse.json({
      provider: 'postgresql',
      databaseUrlMasked: masked,
      currentDatabase: currentDb,
      serverVersion: version,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}


