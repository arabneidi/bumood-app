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

