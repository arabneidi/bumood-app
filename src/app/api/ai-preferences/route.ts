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
  const { 
    age, 
    gender, 
    interests, 
    personality,
    universityLevel,
    fieldOfStudy,
    favoriteAuthors,
    favoriteMusicians,
    favoriteSportsFigures,
    favoriteArtists,
    favoriteMovies,
    favoritePhilosophers,
  } = userInfo;
  
  return `You are an expert personalization assistant. Generate 8-12 relevant subcategories/genres for the activity "${activity}" based on comprehensive user profile data.

ACTIVITY CATEGORY: ${activity}

COMPREHENSIVE USER PROFILE:
- Age: ${age}
- Gender: ${gender}
- Personality Type: ${personality || 'Not specified'}
- University Level: ${universityLevel || 'Not specified'}
- Field of Study: ${fieldOfStudy || 'Not specified'}
- Interests: ${interests ? JSON.parse(interests).join(', ') : 'Not specified'}
- Favorite Authors: ${favoriteAuthors || 'Not specified'}
- Favorite Musicians: ${favoriteMusicians || 'Not specified'}
- Favorite Sports Figures: ${favoriteSportsFigures || 'Not specified'}
- Favorite Artists: ${favoriteArtists || 'Not specified'}
- Favorite Movies: ${favoriteMovies || 'Not specified'}
- Favorite Philosophers: ${favoritePhilosophers || 'Not specified'}

TASK: Generate subcategories that are:
1. Directly related to the activity "${activity}"
2. Age-appropriate for a ${age}-year-old
3. Aligned with their personality type (${personality})
4. Relevant to their field of study (${fieldOfStudy})
5. Diverse and modern
6. Appealing to their preferences and interests

DAILY SUCCESS SCORE (DSS) ANALYSIS:
Analyze which DSS component this activity primarily relates to:
- "LM" (Learning Momentum): Activities involving deep work, focused learning, skill building, task completion
- "RI" (Recovery Index): Activities promoting rest, recovery, sleep, relaxation, physical/mental restoration
- "CN" (Connection): Activities involving social interaction, communication, relationship building, community

Return a JSON object with:
{
  "suggestions": ["Subcategory 1", "Subcategory 2", "Subcategory 3", ...],
  "dssAnalysis": {
    "primaryComponent": "LM|RI|CN",
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation of why this activity relates to this DSS component",
    "secondaryComponents": ["LM|RI|CN" or null],
    "activityType": "deep_work|social|recovery|learning|physical|creative|other"
  }
}

Return only the JSON object, no other text.`;
}

function createSpecificPrompt(activity: string, selectedGenres: string[], userInfo: any, existingFavorites: string[]): string {
  const { 
    age, 
    gender, 
    interests, 
    personality,
    universityLevel,
    fieldOfStudy,
    favoriteAuthors,
    favoriteMusicians,
    favoriteSportsFigures,
    favoriteArtists,
    favoriteMovies,
    favoritePhilosophers,
  } = userInfo;
  
  return `You are an expert personalization assistant. Generate 12-16 specific suggestions for the activity "${activity}" based on selected subcategories and comprehensive user profile data.

ACTIVITY CATEGORY: ${activity}
SELECTED SUBCATEGORIES: ${selectedGenres.join(', ')}

COMPREHENSIVE USER PROFILE:
- Age: ${age}
- Gender: ${gender}
- Personality Type: ${personality || 'Not specified'}
- University Level: ${universityLevel || 'Not specified'}
- Field of Study: ${fieldOfStudy || 'Not specified'}
- Interests: ${interests ? JSON.parse(interests).join(', ') : 'Not specified'}
- Favorite Authors: ${favoriteAuthors || 'Not specified'}
- Favorite Musicians: ${favoriteMusicians || 'Not specified'}
- Favorite Sports Figures: ${favoriteSportsFigures || 'Not specified'}
- Favorite Artists: ${favoriteArtists || 'Not specified'}
- Favorite Movies: ${favoriteMovies || 'Not specified'}
- Favorite Philosophers: ${favoritePhilosophers || 'Not specified'}

EXISTING FAVORITES TO AVOID: ${existingFavorites.length > 0 ? existingFavorites.join(', ') : 'None'}

TASK: Generate specific suggestions that are:
1. Directly related to the selected subcategories: ${selectedGenres.join(', ')}
2. Age-appropriate for a ${age}-year-old
3. Aligned with their personality type (${personality})
4. Relevant to their field of study (${fieldOfStudy})
5. Modern and current
6. Appealing to their preferences and interests
7. NOT already in their favorites: ${existingFavorites.join(', ')}

DAILY SUCCESS SCORE (DSS) ANALYSIS:
Analyze which DSS component this activity primarily relates to:
- "LM" (Learning Momentum): Activities involving deep work, focused learning, skill building, task completion
- "RI" (Recovery Index): Activities promoting rest, recovery, sleep, relaxation, physical/mental restoration
- "CN" (Connection): Activities involving social interaction, communication, relationship building, community

Return a JSON object with:
{
  "suggestions": ["Specific Suggestion 1", "Specific Suggestion 2", "Specific Suggestion 3", ...],
  "dssAnalysis": {
    "primaryComponent": "LM|RI|CN",
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation of why this activity relates to this DSS component",
    "secondaryComponents": ["LM|RI|CN" or null],
    "activityType": "deep_work|social|recovery|learning|physical|creative|other"
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

