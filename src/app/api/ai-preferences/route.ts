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

    console.log('🔍 FULL AI PROMPT BEING SENT:');
    console.log('=====================================');
    console.log(prompt);
    console.log('=====================================');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert personalization assistant. Generate ${preferenceType} based on user demographics, preferences, and activity context. Always return a JSON object with suggestions and DSS analysis.`
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
    console.log('🔍 FULL AI RESPONSE:');
    console.log('=====================================');
    console.log(content);
    console.log('=====================================');

    // Extract JSON from response (both objects {} and arrays [])
    const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    // Handle both old format (array) and new format (object with suggestions and dssAnalysis)
    let suggestions;
    let dssAnalysis = null;
    
    if (Array.isArray(parsedResponse)) {
      // Old format - just suggestions array
      suggestions = parsedResponse;
    } else if (parsedResponse.suggestions && parsedResponse.dssAnalysis) {
      // New format - object with suggestions and dssAnalysis
      suggestions = parsedResponse.suggestions;
      dssAnalysis = parsedResponse.dssAnalysis;
    } else {
      throw new Error('Invalid response format');
    }

    console.log('✅ Generated suggestions:', suggestions);
    console.log('✅ DSS Analysis:', dssAnalysis);
    
    return NextResponse.json({ 
      suggestions,
      dssAnalysis,
      debug: {
        prompt,
        aiResponse: content,
        activity,
        preferenceType,
        selectedGenres,
        userInfo
      }
    });

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

IMPORTANT: For the activity "${activity}", generate genres/styles that are directly related to ${activity} itself, NOT music genres for studying.

${activity === 'studying' ? 'CRITICAL: For "studying", generate STUDY METHODS/TECHNIQUES, NOT music genres. Examples: Pomodoro Technique, Active Recall, Spaced Repetition, Mind Mapping, Cornell Notes, Feynman Technique, etc.' : ''}

${getActivityGenreExamples(activity)}

Return a JSON object with two fields:
1. "suggestions": an array of genre names (strings)
2. "dssAnalysis": an object with DSS component analysis

The DSS analysis should classify which Daily Success Score component this activity primarily relates to:
- "LM" (Learning Momentum) - activities that build knowledge, skills, or cognitive abilities
- "RI" (Recovery Index) - activities that promote rest, relaxation, or physical recovery
- "CN" (Connection) - activities that involve social interaction, community, or relationships

Format:
{
  "suggestions": ["Genre 1", "Genre 2", "Genre 3", ...],
  "dssAnalysis": {
    "primaryComponent": "LM|RI|CN",
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation of why this activity relates to this DSS component",
    "secondaryComponents": ["LM|RI|CN" or null],
    "activityType": "learning|recovery|social|mixed"
  }
}

Make sure genres are:
1. Age-appropriate for ${age} years old
2. Directly relevant to ${activity} (NOT music for studying)
3. Diverse and varied
4. Modern and current (not outdated)
5. Appealing to ${gender} preferences

Return only the JSON object, no other text.`;
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

ALSO, analyze which DSS (Daily Success Score) component this activity primarily relates to:

DSS Components:
- LM (Learning Momentum): Activities that involve deep work, focused learning, skill building, and task completion
- RI (Recovery Index): Activities that promote rest, recovery, sleep, relaxation, and physical/mental restoration  
- CN (Connection): Activities that involve social interaction, communication, relationship building, and community engagement

Return a JSON object with:
{
  "suggestions": ["array of specific suggestions"],
  "dssAnalysis": {
    "primaryComponent": "LM" | "RI" | "CN",
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation of why this activity relates to the primary component",
    "secondaryComponents": ["LM" | "RI" | "CN" | null],
    "activityType": "deep_work" | "social" | "recovery" | "learning" | "physical" | "creative" | "other"
  }
}

Examples:
- "studying" → LM (Learning Momentum) - involves focused learning and skill building
- "sleeping" → RI (Recovery Index) - promotes rest and recovery
- "socializing" → CN (Connection) - involves social interaction and relationship building
- "exercise" → RI (Recovery Index) - promotes physical recovery and health
- "reading" → LM (Learning Momentum) - involves learning and knowledge acquisition
- "dancing" → CN (Connection) - often social and community-oriented

Return only the JSON object, no other text.`;
}

function getActivityGenreExamples(activity: string): string {
  const examples: { [key: string]: string } = {
    'music': 'Music genres: Pop, Hip-Hop, Electronic, Rock, R&B, Country, Jazz, Classical, Indie, Alternative, K-Pop, Latin, etc.',
    'reading': 'Reading genres: Fiction, Non-fiction, Fantasy, Sci-Fi, Romance, Mystery, Thriller, Biography, Self-help, Poetry, etc.',
    'watching movies': 'Movie genres: Action, Comedy, Drama, Horror, Sci-Fi, Romance, Thriller, Documentary, Animation, etc.',
    'watching shows': 'TV genres: Drama, Comedy, Reality, Documentary, Crime, Fantasy, Sci-Fi, Romance, etc.',
    'sports': 'Sports: Football, Basketball, Tennis, Swimming, Running, Cycling, Yoga, Boxing, etc.',
    'art': 'Art styles: Digital Art, Painting, Photography, Sculpture, Street Art, Abstract, Realism, etc.',
    'philosophy': 'Philosophy areas: Ethics, Logic, Metaphysics, Political Philosophy, Existentialism, etc.',
    'studying': 'Study methods: Pomodoro Technique, Active Recall, Spaced Repetition, Mind Mapping, Cornell Notes, Feynman Technique, etc.',
    'dancing': 'Dance styles: Contemporary, Hip Hop, Jazz, Ballet, Salsa, K-Pop, House, Latin, Ballroom, etc.',
    'cooking': 'Cuisine types: Italian, Mexican, Asian, Mediterranean, Indian, French, American, Thai, etc.',
    'gaming': 'Game genres: Action, RPG, Strategy, Puzzle, Simulation, Sports, Adventure, Racing, etc.',
    'writing': 'Writing styles: Creative Writing, Technical Writing, Poetry, Blogging, Journaling, Academic, etc.',
    'photography': 'Photography styles: Portrait, Landscape, Street, Macro, Documentary, Fashion, etc.',
    'traveling': 'Travel types: Adventure, Cultural, Relaxation, Business, Solo, Group, Budget, Luxury, etc.',
    'fitness': 'Exercise types: Cardio, Strength Training, HIIT, Pilates, CrossFit, Yoga, Running, etc.',
    'meditation': 'Meditation types: Mindfulness, Guided, Breathing, Body Scan, Walking, etc.',
    'yoga': 'Yoga styles: Hatha, Vinyasa, Ashtanga, Bikram, Yin, Restorative, etc.'
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
    'philosophy': 'philosophers',
    'studying': 'study methods/techniques',
    'dancing': 'dance styles',
    'cooking': 'cuisine types',
    'gaming': 'game genres',
    'writing': 'writing styles',
    'photography': 'photography styles',
    'traveling': 'travel destinations',
    'fitness': 'exercise types',
    'meditation': 'meditation techniques',
    'yoga': 'yoga styles',
    'painting': 'art styles',
    'drawing': 'drawing styles',
    'singing': 'music genres',
    'playing instruments': 'music genres',
    'gardening': 'plant types',
    'hiking': 'trail types',
    'swimming': 'swimming styles',
    'running': 'running types',
    'cycling': 'cycling types',
    'boxing': 'boxing styles',
    'martial arts': 'martial arts styles'
  };
  
  return types[activity.toLowerCase()] || 'specific types/styles';
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
    'philosophy': `Consider philosophers like Aristotle, Plato, Nietzsche, Kant, etc.`,
    'studying': `For age ${age}, consider effective study methods like Pomodoro Technique, Active Recall, Spaced Repetition, Mind Mapping, Cornell Note-taking, Feynman Technique, etc.`,
    'dancing': `For age ${age}, consider popular dance styles like Contemporary, Hip Hop, Jazz, Ballet, Salsa, K-Pop, House, etc.`,
    'cooking': `For age ${age}, consider popular cuisine types like Italian, Mexican, Asian, Mediterranean, Indian, French, etc.`,
    'gaming': `For age ${age}, consider popular game genres like Action, RPG, Strategy, Puzzle, Simulation, Sports, etc.`,
    'writing': `For age ${age}, consider writing styles like Creative Writing, Technical Writing, Poetry, Blogging, Journaling, etc.`,
    'photography': `For age ${age}, consider photography styles like Portrait, Landscape, Street, Macro, Documentary, etc.`,
    'traveling': `For age ${age}, consider popular destinations like Europe, Asia, National Parks, Cities, Beaches, Mountains, etc.`,
    'fitness': `For age ${age}, consider exercise types like Cardio, Strength Training, HIIT, Pilates, CrossFit, etc.`,
    'meditation': `For age ${age}, consider meditation techniques like Mindfulness, Guided Meditation, Breathing Exercises, Body Scan, etc.`,
    'yoga': `For age ${age}, consider yoga styles like Hatha, Vinyasa, Ashtanga, Bikram, Yin, etc.`
  };
  
  return examples[activity.toLowerCase()] || `Provide relevant ${getSpecificType(activity)} for age ${age}.`;
}
