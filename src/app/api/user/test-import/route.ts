import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import path from 'path';

export async function PUT(request: NextRequest) {
  try {
    const profileData = await request.json();
    
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const db = new PrismaClient({
      datasources: {
        db: {
          url: `file:${dbPath}`
        }
      }
    });
    
    const updatedUser = await db.user.update({
      where: { id: 'dummy-user' },
      data: profileData
    });
    
    await db.$disconnect();
    
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Test profile import error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error?.message },
      { status: 500 }
    );
  }
}
