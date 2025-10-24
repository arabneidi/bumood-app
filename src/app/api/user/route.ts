import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/user - Fetching user profile');
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    console.log('User ID:', userId);
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        age: true,
        height: true,
        weight: true,
        timezone: true,
        personality: true,
        universityLevel: true,
        fieldOfStudy: true,
        interests: true,
        quoteStyle: true,
        favoriteAuthors: true,
        favoriteWriters: true,
        favoriteSportsFigures: true,
        favoriteMusicians: true,
        favoriteArtists: true,
        favoriteMovies: true,
        favoritePhilosophers: true,
        customFavorites: true
      }
    });
    
    console.log('User found:', user);
    
    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('✅ Returning user:', user);
    return NextResponse.json(user);
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    console.log('📤 PUT /api/user - Updating user profile');
    const body = await request.json();
    console.log('Request body:', body);
    
    const { 
      userId = 'dummy-user', gender, name, age, height, weight, timezone, 
      personality, universityLevel, fieldOfStudy,
      interests, quoteStyle, favoriteAuthors,
      favoriteWriters, favoriteSportsFigures, favoriteMusicians, favoriteArtists, favoriteMovies, favoritePhilosophers, customFavorites
    } = body;
    
    console.log('Updating user:', userId);
    
    const updateData = {
      ...(gender !== undefined && { gender }),
      ...(name !== undefined && { name }),
      ...(age !== undefined && { age }),
      ...(height !== undefined && { height }),
      ...(weight !== undefined && { weight }),
      ...(timezone !== undefined && { timezone }),
      ...(personality !== undefined && { personality }),
      ...(universityLevel !== undefined && { universityLevel }),
      ...(fieldOfStudy !== undefined && { fieldOfStudy }),
      ...(interests !== undefined && { interests }),
      ...(quoteStyle !== undefined && { quoteStyle }),
      ...(favoriteAuthors !== undefined && { favoriteAuthors }),
      ...(favoriteWriters !== undefined && { favoriteWriters }),
      ...(favoriteSportsFigures !== undefined && { favoriteSportsFigures }),
      ...(favoriteMusicians !== undefined && { favoriteMusicians }),
      ...(favoriteArtists !== undefined && { favoriteArtists }),
      ...(favoriteMovies !== undefined && { favoriteMovies }),
      ...(favoritePhilosophers !== undefined && { favoritePhilosophers }),
      ...(customFavorites !== undefined && { customFavorites })
    };
    
    console.log('📝 Database update data:', updateData);
    
    const user = await db.user.upsert({
      where: { id: userId },
      update: updateData,
      create: {
        id: userId,
        ...updateData
      }
    });
    
    console.log('✅ User updated:', user);
    return NextResponse.json(user);
  } catch (error) {
    console.error('❌ Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

