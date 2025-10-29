export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get all period tracking entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    
    const periodEntries = await prisma.periodTracking.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' }
    });
    
    return NextResponse.json(periodEntries);
  } catch (error) {
    console.error('Error fetching period tracking:', error);
    return NextResponse.json({ error: 'Failed to fetch period tracking' }, { status: 500 });
  }
}

// POST - Create new period tracking entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'dummy-user', startDate, endDate, flowIntensity, symptoms, notes } = body;
    
    const periodEntry = await prisma.periodTracking.create({
      data: {
        userId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        flowIntensity,
        symptoms,
        notes
      }
    });
    
    return NextResponse.json(periodEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating period tracking:', error);
    return NextResponse.json({ error: 'Failed to create period tracking' }, { status: 500 });
  }
}

