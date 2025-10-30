export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Update the demo user profile with provided fields (upsert)
export async function PUT(request: NextRequest) {
  try {
    const profileData = await request.json();
    const userId = 'dummy-user';

    const updatedUser = await db.user.upsert({
      where: { id: userId },
      create: { id: userId, name: 'Demo User', email: 'demo@example.com', ...profileData },
      update: { ...profileData }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Test profile import error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile', details: error?.message },
      { status: 500 }
    );
  }
}
