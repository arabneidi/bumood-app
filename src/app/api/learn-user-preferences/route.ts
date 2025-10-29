import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId, activities, subcategories, moodData } = await request.json();

    if (!userId || !activities) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, activities' },
        { status: 400 }
      );
    }

    console.log('🧠 Learning user preferences from activities:', activities);
    console.log('🧠 Subcategories:', subcategories);
    console.log('🧠 Mood data:', moodData);

    // Get current user data
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: any = {};

    // Parse current interests
    const currentInterests = user.interests ? JSON.parse(user.interests) : [];
    const newInterests = [...currentInterests];

    // Learn from activities
    for (const activity of activities) {
      const activityLower = activity.toLowerCase();
      
      // Map activities to interests
      if (activityLower.includes('dancing') || activityLower.includes('dance')) {
        if (!newInterests.includes('dance')) newInterests.push('dance');
      }
      if (activityLower.includes('gym') || activityLower.includes('workout') || activityLower.includes('exercise')) {
        if (!newInterests.includes('fitness')) newInterests.push('fitness');
      }
      if (activityLower.includes('reading') || activityLower.includes('book')) {
        if (!newInterests.includes('reading')) newInterests.push('reading');
      }
      if (activityLower.includes('music') || activityLower.includes('singing')) {
        if (!newInterests.includes('music')) newInterests.push('music');
      }
      if (activityLower.includes('art') || activityLower.includes('painting') || activityLower.includes('drawing')) {
        if (!newInterests.includes('art')) newInterests.push('art');
      }
      if (activityLower.includes('cooking') || activityLower.includes('baking')) {
        if (!newInterests.includes('cooking')) newInterests.push('cooking');
      }
      if (activityLower.includes('gaming') || activityLower.includes('video game')) {
        if (!newInterests.includes('gaming')) newInterests.push('gaming');
      }
      if (activityLower.includes('sports') || activityLower.includes('football') || activityLower.includes('basketball')) {
        if (!newInterests.includes('sports')) newInterests.push('sports');
      }
    }

    // Learn from subcategories with randomness and similar vibes
    if (subcategories && Array.isArray(subcategories)) {
      for (const subcategory of subcategories) {
        const subcategoryLower = subcategory.toLowerCase();
        
        // Dance subcategories with similar vibes
        if (subcategoryLower.includes('ballet')) {
          if (!newInterests.includes('ballet')) newInterests.push('ballet');
          // Add similar elegant dance styles
          const similarDances = ['contemporary dance', 'modern dance', 'lyrical dance'];
          const randomSimilar = similarDances[Math.floor(Math.random() * similarDances.length)];
          if (!newInterests.includes(randomSimilar)) newInterests.push(randomSimilar);
        }
        if (subcategoryLower.includes('hip hop') || subcategoryLower.includes('hip-hop')) {
          if (!newInterests.includes('hip-hop')) newInterests.push('hip-hop');
          // Add similar urban dance styles
          const similarDances = ['breakdancing', 'street dance', 'urban dance'];
          const randomSimilar = similarDances[Math.floor(Math.random() * similarDances.length)];
          if (!newInterests.includes(randomSimilar)) newInterests.push(randomSimilar);
        }
        if (subcategoryLower.includes('salsa')) {
          if (!newInterests.includes('salsa')) newInterests.push('salsa');
          // Add similar Latin dance styles
          const similarDances = ['bachata', 'merengue', 'cha-cha'];
          const randomSimilar = similarDances[Math.floor(Math.random() * similarDances.length)];
          if (!newInterests.includes(randomSimilar)) newInterests.push(randomSimilar);
        }
        if (subcategoryLower.includes('jazz')) {
          if (!newInterests.includes('jazz dance')) newInterests.push('jazz dance');
          // Add similar expressive dance styles
          const similarDances = ['broadway dance', 'musical theater', 'show dance'];
          const randomSimilar = similarDances[Math.floor(Math.random() * similarDances.length)];
          if (!newInterests.includes(randomSimilar)) newInterests.push(randomSimilar);
        }
        if (subcategoryLower.includes('contemporary')) {
          if (!newInterests.includes('contemporary dance')) newInterests.push('contemporary dance');
          // Add similar modern dance styles
          const similarDances = ['modern dance', 'interpretive dance', 'experimental dance'];
          const randomSimilar = similarDances[Math.floor(Math.random() * similarDances.length)];
          if (!newInterests.includes(randomSimilar)) newInterests.push(randomSimilar);
        }
        
        // Music subcategories with similar vibes
        if (subcategoryLower.includes('classical')) {
          if (!newInterests.includes('classical music')) newInterests.push('classical music');
          // Add similar sophisticated music styles
          const similarGenres = ['orchestral music', 'chamber music', 'opera'];
          const randomSimilar = similarGenres[Math.floor(Math.random() * similarGenres.length)];
          if (!newInterests.includes(randomSimilar)) newInterests.push(randomSimilar);
        }
        if (subcategoryLower.includes('rock')) {
          if (!newInterests.includes('rock music')) newInterests.push('rock music');
          // Add similar energetic music styles
          const similarGenres = ['alternative rock', 'indie rock', 'punk rock'];
          const randomSimilar = similarGenres[Math.floor(Math.random() * similarGenres.length)];
          if (!newInterests.includes(randomSimilar)) newInterests.push(randomSimilar);
        }
        if (subcategoryLower.includes('pop')) {
          if (!newInterests.includes('pop music')) newInterests.push('pop music');
          // Add similar mainstream music styles
          const similarGenres = ['indie pop', 'synthpop', 'electropop'];
          const randomSimilar = similarGenres[Math.floor(Math.random() * similarGenres.length)];
          if (!newInterests.includes(randomSimilar)) newInterests.push(randomSimilar);
        }
        if (subcategoryLower.includes('jazz')) {
          if (!newInterests.includes('jazz music')) newInterests.push('jazz music');
          // Add similar improvisational music styles
          const similarGenres = ['blues', 'soul', 'funk'];
          const randomSimilar = similarGenres[Math.floor(Math.random() * similarGenres.length)];
          if (!newInterests.includes(randomSimilar)) newInterests.push(randomSimilar);
        }
      }
    }

    // Update interests if there are new ones
    if (newInterests.length > currentInterests.length) {
      updates.interests = JSON.stringify(newInterests);
      console.log('📚 Updated interests:', newInterests);
    }

    // Learn favorite musicians from music activities with randomness and similar vibes
    if (activities.some((a: string) => a.toLowerCase().includes('music'))) {
      const currentMusicians = user.favoriteMusicians ? user.favoriteMusicians.split(',').map((m: string) => m.trim()).filter(Boolean) : [];
      const newMusicians = [...currentMusicians];
      
      if (subcategories) {
        for (const subcategory of subcategories) {
          const subcategoryLower = subcategory.toLowerCase();
          
          // Classical music - add 1-2 random classical musicians
          if (subcategoryLower.includes('classical')) {
            const classicalMusicians = [
              'Ludwig van Beethoven', 'Wolfgang Amadeus Mozart', 'Johann Sebastian Bach',
              'Frédéric Chopin', 'Pyotr Ilyich Tchaikovsky', 'Claude Debussy',
              'Antonio Vivaldi', 'Franz Schubert', 'Robert Schumann'
            ];
            // Add 1-2 random classical musicians
            const numToAdd = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < numToAdd; i++) {
              const randomMusician = classicalMusicians[Math.floor(Math.random() * classicalMusicians.length)];
              if (!newMusicians.includes(randomMusician)) newMusicians.push(randomMusician);
            }
          }
          
          // Jazz - add 1-2 random jazz musicians
          if (subcategoryLower.includes('jazz')) {
            const jazzMusicians = [
              'Miles Davis', 'John Coltrane', 'Ella Fitzgerald', 'Louis Armstrong',
              'Billie Holiday', 'Duke Ellington', 'Charlie Parker', 'Thelonious Monk',
              'Dizzy Gillespie', 'Sarah Vaughan'
            ];
            const numToAdd = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < numToAdd; i++) {
              const randomMusician = jazzMusicians[Math.floor(Math.random() * jazzMusicians.length)];
              if (!newMusicians.includes(randomMusician)) newMusicians.push(randomMusician);
            }
          }
          
          // Rock - add 1-2 random rock musicians
          if (subcategoryLower.includes('rock')) {
            const rockMusicians = [
              'Led Zeppelin', 'Pink Floyd', 'The Beatles', 'Queen', 'The Rolling Stones',
              'Nirvana', 'Radiohead', 'U2', 'AC/DC', 'Guns N\' Roses'
            ];
            const numToAdd = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < numToAdd; i++) {
              const randomMusician = rockMusicians[Math.floor(Math.random() * rockMusicians.length)];
              if (!newMusicians.includes(randomMusician)) newMusicians.push(randomMusician);
            }
          }
          
          // Pop - add 1-2 random pop musicians
          if (subcategoryLower.includes('pop')) {
            const popMusicians = [
              'Taylor Swift', 'Ariana Grande', 'Billie Eilish', 'Ed Sheeran',
              'Bruno Mars', 'Adele', 'Justin Bieber', 'Dua Lipa', 'The Weeknd',
              'Olivia Rodrigo', 'Harry Styles', 'Lorde'
            ];
            const numToAdd = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < numToAdd; i++) {
              const randomMusician = popMusicians[Math.floor(Math.random() * popMusicians.length)];
              if (!newMusicians.includes(randomMusician)) newMusicians.push(randomMusician);
            }
          }
        }
      }
      
      if (newMusicians.length > currentMusicians.length) {
        updates.favoriteMusicians = newMusicians.join(', ');
        console.log('🎵 Updated favorite musicians:', newMusicians);
      }
    }

    // Learn favorite artists from art activities with randomness
    if (activities.some((a: string) => a.toLowerCase().includes('art'))) {
      const currentArtists = user.favoriteArtists ? user.favoriteArtists.split(',').map((a: string) => a.trim()).filter(Boolean) : [];
      const newArtists = [...currentArtists];
      
      // Add 2-3 random art-related artists
      const artArtists = [
        'Vincent van Gogh', 'Pablo Picasso', 'Frida Kahlo', 'Leonardo da Vinci',
        'Claude Monet', 'Salvador Dalí', 'Georgia O\'Keeffe', 'Jackson Pollock',
        'Henri Matisse', 'Wassily Kandinsky', 'Andy Warhol', 'Gustav Klimt'
      ];
      const numToAdd = Math.floor(Math.random() * 2) + 2; // 2-3 artists
      for (let i = 0; i < numToAdd; i++) {
        const randomArtist = artArtists[Math.floor(Math.random() * artArtists.length)];
        if (!newArtists.includes(randomArtist)) newArtists.push(randomArtist);
      }
      
      if (newArtists.length > currentArtists.length) {
        updates.favoriteArtists = newArtists.join(', ');
        console.log('🎨 Updated favorite artists:', newArtists);
      }
    }

    // Learn favorite sports figures from sports activities with randomness
    if (activities.some((a: string) => a.toLowerCase().includes('sports') || a.toLowerCase().includes('gym'))) {
      const currentSportsFigures = user.favoriteSportsFigures ? user.favoriteSportsFigures.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      const newSportsFigures = [...currentSportsFigures];
      
      // Add 2-3 random sports figures from different sports
      const sportsFigures = [
        'Muhammad Ali', 'Serena Williams', 'Michael Jordan', 'Lionel Messi',
        'LeBron James', 'Tom Brady', 'Usain Bolt', 'Roger Federer',
        'Cristiano Ronaldo', 'Simone Biles', 'Tiger Woods', 'Kobe Bryant'
      ];
      const numToAdd = Math.floor(Math.random() * 2) + 2; // 2-3 figures
      for (let i = 0; i < numToAdd; i++) {
        const randomFigure = sportsFigures[Math.floor(Math.random() * sportsFigures.length)];
        if (!newSportsFigures.includes(randomFigure)) newSportsFigures.push(randomFigure);
      }
      
      if (newSportsFigures.length > currentSportsFigures.length) {
        updates.favoriteSportsFigures = newSportsFigures.join(', ');
        console.log('🏆 Updated favorite sports figures:', newSportsFigures);
      }
    }

    // Learn favorite writers from reading activities with randomness
    if (activities.some((a: string) => a.toLowerCase().includes('reading'))) {
      const currentWriters = user.favoriteWriters ? user.favoriteWriters.split(',').map((w: string) => w.trim()).filter(Boolean) : [];
      const newWriters = [...currentWriters];
      
      // Add 2-3 random writers from different genres
      const writers = [
        'Maya Angelou', 'Ernest Hemingway', 'Virginia Woolf', 'Rumi',
        'Toni Morrison', 'Gabriel García Márquez', 'Haruki Murakami', 'Chimamanda Ngozi Adichie',
        'J.K. Rowling', 'George Orwell', 'Sylvia Plath', 'James Baldwin'
      ];
      const numToAdd = Math.floor(Math.random() * 2) + 2; // 2-3 writers
      for (let i = 0; i < numToAdd; i++) {
        const randomWriter = writers[Math.floor(Math.random() * writers.length)];
        if (!newWriters.includes(randomWriter)) newWriters.push(randomWriter);
      }
      
      if (newWriters.length > currentWriters.length) {
        updates.favoriteWriters = newWriters.join(', ');
        console.log('📖 Updated favorite writers:', newWriters);
      }
    }

    // Update user profile if there are changes
    if (Object.keys(updates).length > 0) {
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: updates
      });
      
      console.log('✅ User preferences updated successfully');
      
      return NextResponse.json({
        success: true,
        message: 'User preferences learned and updated',
        updates: updates,
        user: updatedUser
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'No new preferences to learn',
        updates: {}
      });
    }

  } catch (error) {
    console.error('Error learning user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to learn user preferences' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        interests: true,
        favoriteWriters: true,
        favoriteMusicians: true,
        favoriteSportsFigures: true,
        favoriteArtists: true,
        favoriteMovies: true,
        favoritePhilosophers: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      interests: user.interests ? JSON.parse(user.interests) : [],
      favoriteWriters: user.favoriteWriters ? user.favoriteWriters.split(',').map((w: string) => w.trim()).filter(Boolean) : [],
      favoriteMusicians: user.favoriteMusicians ? user.favoriteMusicians.split(',').map((m: string) => m.trim()).filter(Boolean) : [],
      favoriteSportsFigures: user.favoriteSportsFigures ? user.favoriteSportsFigures.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      favoriteArtists: user.favoriteArtists ? user.favoriteArtists.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
      favoriteMovies: user.favoriteMovies ? user.favoriteMovies.split(',').map((m: string) => m.trim()).filter(Boolean) : [],
      favoritePhilosophers: user.favoritePhilosophers ? user.favoritePhilosophers.split(',').map((p: string) => p.trim()).filter(Boolean) : []
    });

  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 }
    );
  }
}
