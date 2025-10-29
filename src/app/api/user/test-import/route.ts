import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(request: NextRequest) {
  try {
    const profileData = await request.json();

    const updatedUser = await db.user.upsert({
      where: { id: 'dummy-user' },
      update: profileData,
      create: { id: 'dummy-user', ...profileData }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Test profile import error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error?.message },
      { status: 500 }
    );
  }
}
