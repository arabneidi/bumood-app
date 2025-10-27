import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const achievements = await request.json();
    
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const db = new PrismaClient({
      datasources: {
        db: {
          url: `file:${dbPath}`
        }
      }
    });
    
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
    
    await db.$disconnect();
    
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
