import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT - Update period tracking entry
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { endDate, flowIntensity, symptoms, notes } = body;
    
    const periodEntry = await prisma.periodTracking.update({
      where: { id },
      data: {
        ...(endDate && { endDate: new Date(endDate) }),
        ...(flowIntensity && { flowIntensity }),
        ...(symptoms && { symptoms }),
        ...(notes && { notes })
      }
    });
    
    return NextResponse.json(periodEntry);
  } catch (error) {
    console.error('Error updating period tracking:', error);
    return NextResponse.json({ error: 'Failed to update period tracking' }, { status: 500 });
  }
}

// DELETE - Delete period tracking entry
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    await prisma.periodTracking.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Period tracking deleted successfully' });
  } catch (error) {
    console.error('Error deleting period tracking:', error);
    return NextResponse.json({ error: 'Failed to delete period tracking' }, { status: 500 });
  }
}

