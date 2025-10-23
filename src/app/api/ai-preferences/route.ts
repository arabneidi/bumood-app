import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { 
      activity, 
      selectedGenres, 
      userInfo, 
      existingFavorites,
      preferenceType 
    } = await req.json();

    if (!activity || !preferenceType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`🤖 Generating AI preferences for ${preferenceType} in ${activity}`);
    console.log('User info:', userInfo);
    console.log('Selected genres:', selectedGenres);
    console.log('Existing favorites:', existingFavorites);

    let prompt = '';
    
    if (preferenceType === 'genres') {
      prompt = createGenrePrompt(activity, userInfo);
    } else if (preferenceType === 'specifics') {
      prompt = createSpecificPrompt(activity, selectedGenres, userInfo, existingFavorites);
    } else {
      return NextResponse.json({ error: 'Invalid preference type' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert personalization assistant. Generate ${preferenceType} based on user demographics, preferences, and activity context. Always return a JSON array of strings.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || '';
    console.log('🤖 OpenAI response:', content);

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON array found in response');
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(suggestions)) {
      throw new Error('Response is not an array');
    }

    console.log('✅ Generated suggestions:', suggestions);
    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('❌ AI preferences error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate AI preferences',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function createGenrePrompt(activity: string, userInfo: any): string {
  const { age, gender, interests } = userInfo;
  
  return `Generate 8-12 relevant genres/styles for the activity "${activity}" that would be appropriate for a ${age}-year-old ${gender}.

User context:
- Age: ${age}
- Gender: ${gender}
- Interests: ${interests || 'Not specified'}

Activity: ${activity}

For each activity, provide diverse, age-appropriate genres:

${getActivityGenreExamples(activity)}

Return ONLY a JSON array of genre names (strings), like:
["Genre 1", "Genre 2", "Genre 3", ...]

Make sure genres are:
1. Age-appropriate for ${age} years old
2. Relevant to ${activity}
3. Diverse and varied
4. Modern and current (not outdated)
5. Appealing to ${gender} preferences

Return only the JSON array, no other text.`;
}

function createSpecificPrompt(activity: string, selectedGenres: string[], userInfo: any, existingFavorites: string[]): string {
  const { age, gender, interests } = userInfo;
  
  return `Generate 12-16 specific ${getSpecificType(activity)} names for the activity "${activity}" based on selected genres: ${selectedGenres.join(', ')}.

User context:
- Age: ${age}
- Gender: ${gender}
- Interests: ${interests || 'Not specified'}
- Activity: ${activity}
- Selected genres: ${selectedGenres.join(', ')}

${getExistingFavoritesText(existingFavorites)}

For each genre, provide 2-3 specific ${getSpecificType(activity)} that are:
1. Age-appropriate for ${age} years old
2. Popular and well-known
3. Relevant to the selected genres
4. NOT already in existing favorites: ${existingFavorites.join(', ')}
5. Current and modern (not outdated)
6. Appealing to ${gender} preferences

${getSpecificExamples(activity, age)}

Return ONLY a JSON array of ${getSpecificType(activity)} names (strings), like:
["Name 1", "Name 2", "Name 3", ...]

Make sure to:
- Include diverse options across all selected genres
- Prioritize current, popular choices
- Avoid duplicates with existing favorites
- Keep names concise and recognizable

Return only the JSON array, no other text.`;
}

function getActivityGenreExamples(activity: string): string {
  const examples: { [key: string]: string } = {
    'music': 'Music genres: Pop, Hip-Hop, Electronic, Rock, R&B, Country, Jazz, Classical, Indie, Alternative, K-Pop, Latin, etc.',
    'reading': 'Reading genres: Fiction, Non-fiction, Fantasy, Sci-Fi, Romance, Mystery, Thriller, Biography, Self-help, Poetry, etc.',
    'watching movies': 'Movie genres: Action, Comedy, Drama, Horror, Sci-Fi, Romance, Thriller, Documentary, Animation, etc.',
    'watching shows': 'TV genres: Drama, Comedy, Reality, Documentary, Crime, Fantasy, Sci-Fi, Romance, etc.',
    'sports': 'Sports: Football, Basketball, Tennis, Swimming, Running, Cycling, Yoga, Boxing, etc.',
    'art': 'Art styles: Digital Art, Painting, Photography, Sculpture, Street Art, Abstract, Realism, etc.',
    'philosophy': 'Philosophy areas: Ethics, Logic, Metaphysics, Political Philosophy, Existentialism, etc.'
  };
  
  return examples[activity.toLowerCase()] || `Genres relevant to ${activity}`;
}

function getSpecificType(activity: string): string {
  const types: { [key: string]: string } = {
    'music': 'musicians/artists',
    'reading': 'authors/writers',
    'watching movies': 'movies',
    'watching shows': 'TV shows',
    'watching': 'movies and TV shows',
    'movies': 'movies',
    'tv': 'TV shows',
    'sports': 'athletes',
    'art': 'artists',
    'philosophy': 'philosophers'
  };
  
  return types[activity.toLowerCase()] || 'figures';
}

function getExistingFavoritesText(existingFavorites: string[]): string {
  if (!existingFavorites || existingFavorites.length === 0) {
    return 'No existing favorites to avoid.';
  }
  return `IMPORTANT: Do NOT suggest any of these existing favorites: ${existingFavorites.join(', ')}`;
}

function getSpecificExamples(activity: string, age: number): string {
  const examples: { [key: string]: string } = {
    'music': `For age ${age}, consider current pop artists like Olivia Rodrigo, Billie Eilish, Dua Lipa, The Weeknd, Harry Styles, Taylor Swift, etc.`,
    'reading': `For age ${age}, consider popular authors like J.K. Rowling, John Green, Colleen Hoover, Stephen King, etc.`,
    'watching movies': `For age ${age}, consider popular movies like "Barbie", "Oppenheimer", "Spider-Man: Across the Spider-Verse", "Everything Everywhere All at Once", "Top Gun: Maverick", etc.`,
    'watching shows': `For age ${age}, consider popular TV shows like "Stranger Things", "Euphoria", "Wednesday", "The Last of Us", "Bridgerton", etc.`,
    'watching': `For age ${age}, consider popular movies and TV shows like "Stranger Things", "Euphoria", "Barbie", "Wednesday", "The Last of Us", etc.`,
    'movies': `For age ${age}, consider popular movies like "Barbie", "Oppenheimer", "Spider-Man: Across the Spider-Verse", "Everything Everywhere All at Once", "Top Gun: Maverick", etc.`,
    'tv': `For age ${age}, consider popular TV shows like "Stranger Things", "Euphoria", "Wednesday", "The Last of Us", "Bridgerton", etc.`,
    'sports': `For age ${age}, consider current athletes like LeBron James, Serena Williams, Lionel Messi, etc.`,
    'art': `For age ${age}, consider current artists like Banksy, Yayoi Kusama, etc.`,
    'philosophy': `Consider philosophers like Aristotle, Plato, Nietzsche, Kant, etc.`
  };
  
  return examples[activity.toLowerCase()] || `Provide relevant ${getSpecificType(activity)} for age ${age}.`;
}
