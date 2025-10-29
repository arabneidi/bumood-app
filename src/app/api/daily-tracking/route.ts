export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get today's or specific date's tracking
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    const dateParam = searchParams.get('date');
    
    // Get today's date or specified date
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    // Set to start of day for comparison
    targetDate.setHours(0, 0, 0, 0);
    
    const tracking = await prisma.dailyTracking.findFirst({
      where: {
        userId,
        date: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) // Next day
        }
      }
    });
    
    return NextResponse.json(tracking || null);
  } catch (error) {
    console.error('Error fetching daily tracking:', error);
    return NextResponse.json({ error: 'Failed to fetch daily tracking' }, { status: 500 });
  }
}

// POST - Create or update today's tracking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'dummy-user', ...trackingData } = body;
    
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Try to find existing entry for today
    const existing = await prisma.dailyTracking.findFirst({
      where: {
        userId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });
    
    if (existing) {
      // Update existing entry
      const updated = await prisma.dailyTracking.update({
        where: { id: existing.id },
        data: trackingData
      });
      return NextResponse.json(updated);
    } else {
      // Create new entry
      const created = await prisma.dailyTracking.create({
        data: {
          userId,
          date: today,
          ...trackingData
        }
      });
      return NextResponse.json(created, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating/updating daily tracking:', error);
    return NextResponse.json({ error: 'Failed to save daily tracking' }, { status: 500 });
  }
}

