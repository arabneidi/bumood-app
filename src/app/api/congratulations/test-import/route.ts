import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const congratulations = await request.json();
    
    const imported = [];
    const errors = [];
    
    for (let i = 0; i < congratulations.length; i++) {
      try {
        const congratulation = congratulations[i];
        const created = await db.congratulation.create({
          data: {
            id: congratulation.id, // Use ID from CSV
            userId: congratulation.userId || 'dummy-user',
            type: congratulation.type,
            title: congratulation.title,
            message: congratulation.message,
            actionMessage: congratulation.actionMessage,
            icon: congratulation.icon,
            stars: congratulation.stars,
            isRead: congratulation.isRead || false,
            createdAt: congratulation.createdAt ? new Date(parseInt(congratulation.createdAt) * 1000) : new Date()
          }
        });
        imported.push(created);
      } catch (error: any) {
        errors.push({ index: i, error: error.message });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Imported ${imported.length} congratulations to TEST database`,
      count: imported.length,
      errors
    });
  } catch (error: any) {
    console.error('Test congratulations import error:', error);
    return NextResponse.json(
      { error: 'Failed to import congratulations', details: error?.message },
      { status: 500 }
    );
  }
}
