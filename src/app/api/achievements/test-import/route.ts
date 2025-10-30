export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const items = await request.json();
    if (!Array.isArray(items)) return NextResponse.json({ error: 'array required' }, { status: 400 });
    let count = 0;
    for (const a of items) {
      await db.achievement.create({
        data: {
          id: a.id || undefined,
          userId: a.userId || 'dummy-user',
          type: a.type || '',
          title: a.title || '',
          description: a.description || '',
          icon: a.icon || '',
          stars: a.stars ?? 1,
          unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : null
        }
      });
      count++;
    }
    return NextResponse.json({ success: true, count });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const achievements = await request.json();
    
    const imported = [];
    const errors = [];
    
    for (let i = 0; i < achievements.length; i++) {
      try {
        const achievement = achievements[i];
        const created = await db.achievement.create({
          data: {
            id: achievement.id, // Use ID from CSV
            userId: achievement.userId || 'dummy-user',
            type: achievement.type,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            stars: achievement.stars,
            unlockedAt: achievement.unlockedAt ? new Date(achievement.unlockedAt) : new Date(),
            createdAt: achievement.createdAt ? new Date(achievement.createdAt) : new Date()
          }
        });
        imported.push(created);
      } catch (error: any) {
        errors.push({ index: i, error: error.message });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Imported ${imported.length} achievements to TEST database`,
      count: imported.length,
      errors
    });
  } catch (error: any) {
    console.error('Test achievements import error:', error);
    return NextResponse.json(
      { error: 'Failed to import achievements', details: error?.message },
      { status: 500 }
    );
  }
}
