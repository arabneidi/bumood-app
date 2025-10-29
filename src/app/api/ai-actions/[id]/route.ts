export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT - Update AI suggestion action (mark as tried, rate helpfulness, add feedback)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { tried, helpful, feedback } = body;

    const updateData: any = {};
    
    if (tried !== undefined) {
      updateData.tried = tried;
      if (tried) {
        updateData.triedAt = new Date();
      }
    }
    
    if (helpful !== undefined) {
      updateData.helpful = helpful;
      updateData.ratedAt = new Date();
    }
    
    if (feedback !== undefined) {
      updateData.feedback = feedback;
    }

    const aiAction = await prisma.aISuggestionAction.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json(aiAction);
  } catch (error) {
    console.error('Error updating AI action:', error);
    return NextResponse.json({ error: 'Failed to update AI action' }, { status: 500 });
  }
}

// DELETE - Remove AI suggestion action
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.aISuggestionAction.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting AI action:', error);
    return NextResponse.json({ error: 'Failed to delete AI action' }, { status: 500 });
  }
}
