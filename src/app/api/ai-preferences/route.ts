export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fallback preferences when AI is unavailable
function generateFallbackPreferences(activity: string, selectedGenres: string[], preferenceType: string) {
  const fallbackData = {
    reading: {
      genres: ['Fiction', 'Non-fiction', 'Poetry', 'Biography', 'Self-help'],
      specifics: {
        'Fiction': ['Mystery', 'Romance', 'Fantasy', 'Thriller', 'Literary Fiction'],
        'Non-fiction': ['Biography', 'History', 'Science', 'Self-help', 'Philosophy'],
        'Poetry': ['Classical', 'Modern', 'Haiku', 'Free Verse', 'Sonnet'],
        'Biography': ['Historical Figure', 'Celebrity', 'Scientist', 'Artist', 'Politician'],
        'Self-help': ['Productivity', 'Mindfulness', 'Relationships', 'Career', 'Health']
      }
    },
    watching: {
      genres: ['Drama', 'Comedy', 'Action', 'Documentary', 'Sci-fi'],
      specifics: {
        'Drama': ['Classic Drama', 'Modern Drama', 'Romantic Drama', 'Historical Drama', 'Psychological Drama'],
        'Comedy': ['Romantic Comedy', 'Dark Comedy', 'Satire', 'Slapstick', 'Stand-up'],
        'Action': ['Superhero', 'Martial Arts', 'War', 'Adventure', 'Crime'],
        'Documentary': ['Nature', 'History', 'Science', 'Social Issues', 'Biography'],
        'Sci-fi': ['Space Opera', 'Cyberpunk', 'Dystopian', 'Time Travel', 'Alien Contact']
      }
    },
    exercise: {
      genres: ['Cardio', 'Strength', 'Yoga', 'Swimming', 'Running'],
      specifics: {
        'Cardio': ['Running', 'Cycling', 'Swimming', 'Dancing', 'Aerobics'],
        'Strength': ['Weightlifting', 'Bodyweight', 'Resistance Bands', 'Kettlebell', 'CrossFit'],
        'Yoga': ['Hatha', 'Vinyasa', 'Ashtanga', 'Yin', 'Hot Yoga'],
        'Swimming': ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'Water Aerobics'],
        'Running': ['Jogging', 'Sprinting', 'Trail Running', 'Treadmill', 'Marathon Training']
      }
    }
  };

  const activityData = fallbackData[activity as keyof typeof fallbackData] || {
    genres: ['General', 'Creative', 'Relaxing', 'Active', 'Social'],
    specifics: {
      'General': ['Popular', 'Classic', 'Modern', 'Creative', 'Relaxing']
    }
  };

  if (preferenceType === 'genres') {
    return activityData.genres;
  } else if (preferenceType === 'specifics') {
    const result = [];
    for (const genre of selectedGenres) {
      const specifics = activityData.specifics as any;
      result.push(...(specifics[genre] || ['Popular', 'Classic', 'Modern']));
    }
    return result;
  }

  return activityData.genres;
}

function generateFallbackDSSAnalysis(activity: string) {
  const dssAnalysis = {
    reading: {
      learningMomentum: 0.7,
      recoveryIndex: 0.3,
      connectionScore: 0.2,
      reasoning: "Reading enhances learning momentum through knowledge acquisition and cognitive engagement."
    },
    watching: {
      learningMomentum: 0.4,
      recoveryIndex: 0.6,
      connectionScore: 0.3,
      reasoning: "Watching content provides relaxation and recovery while offering learning opportunities."
    },
    exercise: {
      learningMomentum: 0.2,
      recoveryIndex: 0.8,
      connectionScore: 0.4,
      reasoning: "Exercise primarily supports recovery and physical well-being, with some social connection aspects."
    }
  };

  return dssAnalysis[activity as keyof typeof dssAnalysis] || {
    learningMomentum: 0.5,
    recoveryIndex: 0.5,
    connectionScore: 0.3,
    reasoning: "This activity provides balanced benefits across learning, recovery, and connection."
  };
}

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

    // Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('📱 No OpenAI API key found - using fallback preferences');
      return NextResponse.json({
        suggestions: generateFallbackPreferences(activity, selectedGenres, preferenceType),
        dssAnalysis: generateFallbackDSSAnalysis(activity),
        fallback: true,
        message: 'AI service unavailable - using offline preferences'
      });
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

IMPORTANT PERSONALIZATION RULES:
1. If the activity is "studying" or "learning", feel free to use their field of study (${fieldOfStudy}) for relevance
2. For ALL OTHER activities (socializing, exercising, relaxing, etc.), treat them as a NORMAL PERSON with varied interests
3. Do NOT force tech/study themes into non-academic activities
4. Include mainstream, popular, diverse options that anyone might enjoy

TASK: Generate subcategories that are:
1. Directly related to the activity "${activity}"
2. Age-appropriate for a ${age}-year-old
3. Activity-appropriate: If studying → use field of study; If socializing/exercising → use general interests
4. DIVERSE and MIXED - NOT overly focused on one interest
5. Include BOTH professional AND personal interests (when relevant to the activity)
6. Balance tech/non-tech, work/leisure, indoor/outdoor activities

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

IMPORTANT PERSONALIZATION RULES:
1. If the activity is "studying" or "learning", feel free to use their field of study (${fieldOfStudy}) for relevance
2. For ALL OTHER activities (socializing, exercising, relaxing, etc.), treat them as a NORMAL PERSON with varied interests
3. Do NOT force tech/study themes into non-academic activities
4. Include mainstream, popular, diverse options that anyone might enjoy

TASK: Generate specific suggestions that are:
1. Directly related to the selected subcategories: ${selectedGenres.join(', ')}
2. Age-appropriate for a ${age}-year-old
3. Activity-appropriate: If studying → use field of study; If socializing/exercising → use general diverse interests
4. DIVERSE and MIXED - include both tech and non-tech, work and leisure
5. Include mainstream popular options that appeal to a NORMAL PERSON
6. Balance professional interests with personal hobbies and relaxation
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

