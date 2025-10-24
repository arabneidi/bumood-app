// AI Service for mood analysis and suggestions
// Using Hugging Face Inference API (free tier)

export interface UserMoodProfile {
  currentMood: {
    valence: number;
    energy: number;
    focus: number;
    stress: number;
    sleep?: number;
  };
  recentEntries: any[];
  moodHistory: {
    avgValence: number;
    valenceTrend: number;
    stressPattern: number;
    energyPattern: number;
    sleepPattern: number;
  };
  successfulSolutions: string[];
  commonActivities: string[];
  timeOfDay: string;
  userFeedback?: {
    helpfulSuggestions: string[];  // Suggestions user found helpful
    unhelpfulSuggestions: string[]; // Suggestions user didn't like
    preferredCategories: string[];  // Categories user prefers
    avoidCategories: string[];      // Categories to avoid
  };
  userInfo?: {
    gender?: string;  // male, female, non-binary, prefer-not-to-say
    age?: number;
    personality?: string;  // introvert, extrovert, ambivert, etc.
    universityLevel?: string;  // undergraduate, graduate, phd, etc.
    fieldOfStudy?: string;  // computer science, psychology, medicine, etc.
    onPeriod?: boolean;  // Is currently on their period
    periodDay?: number;  // Which day of period (1-7)
    periodCycleLength?: number;  // Average cycle length (e.g., 28, 30 days)
    periodSymptoms?: string[];  // Current symptoms (cramps, mood swings, etc.)
  };
  userPreferences?: {
    interests?: string[];  // gym, sports, poetry, literature, etc.
    quoteStyle?: string;
    favoriteWriters?: string[];  // For book suggestions
    favoriteSportsFigures?: string[];  // For sports/workout suggestions
    favoriteMusicians?: string[];  // For music suggestions
    favoriteArtists?: string[];  // For art suggestions
    favoriteMovies?: string[];  // For movie/TV suggestions
    favoritePhilosophers?: string[];  // For philosophical content
  };
  activeGoals?: {
    id: string;
    title: string;
    description?: string;
    category: string;
    subcategory?: string;
    targetValue: number;
    currentValue: number;
    progressPercentage: number;
    difficulty: string;
    streak: number;
    completed: boolean;
  }[];
  dailyTracking?: {
    // Water & Nutrition
    waterIntake?: number;  // glasses of water
    mealsEaten?: number;  // number of meals
    mealQuality?: string;  // poor, fair, good, excellent
    caffeine?: number;  // caffeinated drinks
    alcohol?: number;  // alcoholic drinks
    
    // Physical Activity
    exercise?: boolean;
    exerciseType?: string;  // cardio, strength, yoga, etc.
    exerciseDuration?: number;  // minutes
    steps?: number;  // daily steps
    
    // Social & Mental
    socialInteraction?: boolean;
    screenTime?: number;  // hours
    outdoorTime?: number;  // minutes
    
    // Self-Care
    meditation?: boolean;
    meditationDuration?: number;
    journaling?: boolean;
    readingTime?: number;
    
    // Health
    medicationTaken?: boolean;
    supplements?: string[];
    symptoms?: string[];
  };
  // Reflection from the latest entry (typed or voice)
  reflection?: string;
}

export interface AISuggestion {
  type: 'activity' | 'tip' | 'reminder' | 'challenge' | 'encouragement';
  title: string;
  description: string;
  action?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  icon: string;
  reasoning: string;
  suggestionId?: string; // Unique identifier for tracking
}

// Free AI API endpoints - Multiple providers for better reliability
const AI_ENDPOINTS = {
  // OpenAI API (free tier) - Most reliable for real AI
  OPENAI: 'https://api.openai.com/v1/chat/completions',
  // Google Gemini API (free tier) - Most reliable
  GEMINI: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  // TextCortex API (free $5 credit)
  TEXTCORTEX: 'https://api.textcortex.com/v1/texts',
  // DeepAI Text Generator (free tier)
  DEEPAI: 'https://api.deepai.org/api/text-generator',
  // Hugging Face (backup) - Try a different model
  HUGGINGFACE: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
  // Local fallback
  FALLBACK: 'local'
};

// 🎯 AI MODE SELECTION - OpenAI with smart fallback
const AI_MODE: 'OPENAI_ONLY' | 'GEMINI_ONLY' | 'TEXTCORTEX_ONLY' | 'DEEPAI_ONLY' | 'LOCAL_ONLY' | 'HUGGINGFACE_ONLY' | 'HUGGINGFACE_WITH_FALLBACK' | 'OPENAI_WITH_FALLBACK' = 'OPENAI_ONLY';

// Generate AI suggestions using free APIs
export async function generateAISuggestions(profile: UserMoodProfile): Promise<AISuggestion[]> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🤖 AI MODE: ${AI_MODE}`);
  console.log(`${'='.repeat(60)}\n`);

  if (AI_MODE === 'OPENAI_ONLY') {
    console.log('🤖 Using OPENAI API for REAL AI');
    try {
      const suggestions = await generateWithOpenAI(profile);
      console.log('✅ OpenAI API SUCCESS!');
      return suggestions;
    } catch (error) {
      console.error('❌ OpenAI API FAILED:', error.message);
      throw error;
    }
  }

  if (AI_MODE === 'GEMINI_ONLY') {
    console.log('🔮 Using GOOGLE GEMINI API');
    try {
      const suggestions = await generateWithGemini(profile);
      console.log('✅ Gemini API SUCCESS!');
      return suggestions;
    } catch (error) {
      console.error('❌ Gemini API FAILED:', error.message);
      console.log('🔄 Falling back to local AI...');
      return generateLocalSuggestionsWithLearning(profile);
    }
  }

  if (AI_MODE === 'TEXTCORTEX_ONLY') {
    console.log('📝 Using TEXTCORTEX API');
    try {
      const suggestions = await generateWithTextCortex(profile);
      console.log('✅ TextCortex API SUCCESS!');
      return suggestions;
    } catch (error) {
      console.error('❌ TextCortex API FAILED:', error.message);
      console.log('🔄 Falling back to local AI...');
      return generateLocalSuggestionsWithLearning(profile);
    }
  }

  if (AI_MODE === 'DEEPAI_ONLY') {
    console.log('🤖 Using DEEPAI API');
    try {
      const suggestions = await generateWithDeepAI(profile);
      console.log('✅ DeepAI API SUCCESS!');
      return suggestions;
    } catch (error) {
      console.error('❌ DeepAI API FAILED:', error.message);
      console.log('🔄 Falling back to local AI...');
      return generateLocalSuggestionsWithLearning(profile);
    }
  }

  if (AI_MODE === 'LOCAL_ONLY') {
    console.log('🧠 Using LOCAL AI ONLY');
    return generateLocalSuggestionsWithLearning(profile);
  }

  if (AI_MODE === 'HUGGINGFACE_ONLY') {
    console.log('🤗 Using HUGGING FACE ONLY');
    try {
    const suggestions = await generateWithHuggingFace(profile);
      console.log('✅ Hugging Face API SUCCESS!');
      return suggestions;
    } catch (error) {
      console.error('❌ Hugging Face API FAILED:', error.message);
      console.log('🔄 Falling back to local AI...');
      return generateLocalSuggestionsWithLearning(profile);
    }
  }

  // Disabled: OPENAI_WITH_FALLBACK mode
  // Disabled: HUGGINGFACE_WITH_FALLBACK mode

  // Default: enforce explicit mode
  throw new Error('AI_MODE misconfigured');
}

// Generate suggestions using OpenAI API (REAL AI!)
async function generateWithOpenAI(profile: UserMoodProfile): Promise<AISuggestion[]> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ OpenAI API key not found');
    throw new Error('OpenAI API key not configured');
  }
  
  try {
    const prompt = createOpenAIPrompt(profile);
    console.log('📤 Sending request to OpenAI API...');
    
    const response = await fetch(AI_ENDPOINTS.OPENAI, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a wellness AI assistant. Generate personalized mood improvement suggestions based on user data. Always respond with valid JSON format. CRITICAL: Always vary your suggestions and avoid repetition. Mix between different activities, artists, songs, and approaches each time."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 1.2,
        seed: Math.floor(Math.random() * 1000000)
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', errorText);
      throw new Error(`OpenAI API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Got response from OpenAI:', data);
    
    return parseOpenAIResponse(data, profile);
  } catch (error) {
    console.error('❌ OpenAI API error:', error);
    throw error;
  }
}

// Generate suggestions using Google Gemini API
async function generateWithGemini(profile: UserMoodProfile): Promise<AISuggestion[]> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ Gemini API key not found');
    throw new Error('Gemini API key not configured');
  }
  
  try {
    const prompt = createGeminiPrompt(profile);
    console.log('📤 Sending request to Gemini API...');
    
    const response = await fetch(`${AI_ENDPOINTS.GEMINI}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', errorText);
      throw new Error(`Gemini API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Got response from Gemini:', data);
    
    return parseGeminiResponse(data, profile);
  } catch (error) {
    console.error('❌ Gemini API error:', error);
    throw error;
  }
}

// Generate suggestions using TextCortex API
async function generateWithTextCortex(profile: UserMoodProfile): Promise<AISuggestion[]> {
  const apiKey = process.env.TEXTCORTEX_API_KEY || process.env.NEXT_PUBLIC_TEXTCORTEX_API_KEY;
  
  if (!apiKey) {
    console.log('❌ TextCortex API key not found');
    throw new Error('TextCortex API key not configured');
  }
  
  try {
    const prompt = createTextCortexPrompt(profile);
    console.log('📤 Sending request to TextCortex API...');
    
    const response = await fetch(AI_ENDPOINTS.TEXTCORTEX, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "chat-sophos-1",
        max_tokens: 500,
        temperature: 0.9,
        text: prompt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ TextCortex API error:', errorText);
      throw new Error(`TextCortex API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Got response from TextCortex:', data);
    
    return parseTextCortexResponse(data, profile);
  } catch (error) {
    console.error('❌ TextCortex API error:', error);
    throw error;
  }
}

// Generate suggestions using DeepAI API
async function generateWithDeepAI(profile: UserMoodProfile): Promise<AISuggestion[]> {
  const apiKey = process.env.DEEPAI_API_KEY || process.env.NEXT_PUBLIC_DEEPAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ DeepAI API key not found');
    throw new Error('DeepAI API key not configured');
  }
  
  try {
    const prompt = createDeepAIPrompt(profile);
    console.log('📤 Sending request to DeepAI API...');
    
    const response = await fetch(AI_ENDPOINTS.DEEPAI, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey.replace('api:', ''), // Remove 'api:' prefix
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: prompt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DeepAI API error:', errorText);
      throw new Error(`DeepAI API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Got response from DeepAI:', data);
    
    return parseDeepAIResponse(data, profile);
  } catch (error) {
    console.error('❌ DeepAI API error:', error);
    throw error;
  }
}

// Generate suggestions using Hugging Face API
async function generateWithHuggingFace(profile: UserMoodProfile): Promise<AISuggestion[]> {
  const token = process.env.HUGGINGFACE_API_TOKEN || process.env.NEXT_PUBLIC_HUGGINGFACE_API_TOKEN;
  
  if (!token || token === 'hf_your_token_here') {
    console.log('✅ Hugging Face token configured! Token:', token?.substring(0, 10) + '...');
  }
  
  if (!token) {
    console.log('❌ Hugging Face token not found, using local AI');
    throw new Error('Token not configured');
  }
  
  try {
    const prompt = createSimplePrompt(profile);
    console.log('📤 Sending request to Hugging Face API...');
    console.log('🔑 Using token:', token.substring(0, 10) + '...');
    
    const response = await fetch(AI_ENDPOINTS.HUGGINGFACE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.9,
          do_sample: true,
          top_p: 0.95,
          repetition_penalty: 1.2,
          return_full_text: false
        },
        options: {
          wait_for_model: true,
          use_cache: false
        }
      })
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API error:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Got response from Hugging Face:', data);
    
    // Generate diverse suggestions using HF response as inspiration
    return generateDiverseSuggestionsWithAI(data, profile);
  } catch (error) {
    console.error('❌ Hugging Face API error:', error);
    throw error;
  }
}

// Create a simple prompt for GPT-2
function createSimplePrompt(profile: UserMoodProfile): string {
  const { currentMood, timeOfDay } = profile;
  
  return `You are feeling ${currentMood.valence}/10 happy, ${currentMood.energy}/10 energetic, with ${currentMood.stress}/10 stress in the ${timeOfDay}. Here are 3 wellness suggestions: 1.`;
}

// Generate diverse suggestions using AI response
function generateDiverseSuggestionsWithAI(aiResponse: any, profile: UserMoodProfile): AISuggestion[] {
  console.log('🎨 Generating diverse suggestions with AI inspiration...');
  
  // Extract text from AI response
  const aiText = aiResponse[0]?.generated_text || aiResponse.text || '';
  console.log('💭 AI said:', aiText);
  
  // Generate randomized suggestions based on mood
  return generateRandomizedSuggestions(profile, aiText);
}

// Generate truly random suggestions each time
function generateRandomizedSuggestions(profile: UserMoodProfile, aiInspo: string = ''): AISuggestion[] {
  const { currentMood, moodHistory, timeOfDay } = profile;
  const randomSeed = Math.random();
  
  // Huge pool of diverse suggestions
  const allSuggestions: AISuggestion[] = [
    // Energy boosters
    {
      type: 'activity',
      title: '10-Minute Dance Party',
      description: 'Put on your favorite upbeat song and dance like nobody\'s watching!',
      action: 'Dance to 3 energizing songs',
      priority: currentMood.energy < 5 ? 'high' : 'medium',
      category: 'energy',
      icon: '💃',
      reasoning: `${aiInspo ? 'AI-inspired: ' + aiInspo.substring(0, 50) + '...' : 'Dancing releases endorphins and boosts energy naturally.'}`
    },
    {
      type: 'activity',
      title: 'Pop Music Energy Boost',
      description: 'Listen to current pop hits to get your energy flowing!',
      action: 'Listen to "Levitating" by Dua Lipa and dance',
      priority: currentMood.energy < 5 ? 'high' : 'medium',
      category: 'energy',
      icon: '🎵',
      reasoning: 'Upbeat pop music naturally increases energy and mood.'
    },
    {
      type: 'activity',
      title: 'Classic Rock Motivation',
      description: 'Turn up some classic rock for instant motivation and energy!',
      action: 'Listen to "Don\'t Stop Believin\'" by Journey',
      priority: currentMood.energy < 5 ? 'high' : 'medium',
      category: 'energy',
      icon: '🎸',
      reasoning: 'Classic rock has timeless energy-boosting power.'
    },
    {
      type: 'activity',
      title: 'Power Walk in Nature',
      description: 'A brisk 15-minute walk outside can completely shift your energy.',
      action: 'Go for a 15-minute outdoor walk',
      priority: currentMood.valence < 6 ? 'high' : 'medium',
      category: 'energy',
      icon: '🚶',
      reasoning: 'Combining movement with nature exposure amplifies mood benefits.'
    },
    {
      type: 'tip',
      title: 'Cold Shower Challenge',
      description: 'End your shower with 30 seconds of cold water for instant alertness.',
      action: 'Try a cold shower',
      priority: 'medium',
      category: 'energy',
      icon: '🚿',
      reasoning: 'Cold exposure triggers adrenaline and sharpens focus.'
    },
    
    // Stress reducers
    {
      type: 'activity',
      title: 'Box Breathing',
      description: 'Breathe in for 4, hold for 4, out for 4, hold for 4. Repeat 5 times.',
      action: 'Practice box breathing for 5 minutes',
      priority: currentMood.stress > 6 ? 'high' : 'low',
      category: 'stress',
      icon: '🫁',
      reasoning: 'Box breathing activates the parasympathetic nervous system.'
    },
    {
      type: 'activity',
      title: 'Progressive Muscle Relaxation',
      description: 'Tense and release each muscle group from toes to head.',
      action: 'Do 10-minute muscle relaxation',
      priority: currentMood.stress > 7 ? 'high' : 'medium',
      category: 'stress',
      icon: '💆',
      reasoning: 'Physical relaxation directly reduces mental stress.'
    },
    {
      type: 'tip',
      title: 'Write It Out',
      description: 'Brain dump everything bothering you onto paper. Don\'t filter.',
      action: 'Free-write for 10 minutes',
      priority: currentMood.stress > 5 ? 'high' : 'low',
      category: 'stress',
      icon: '📝',
      reasoning: 'Expressive writing reduces rumination and stress.'
    },
    
    // Mood boosters
    {
      type: 'challenge',
      title: 'Random Acts of Kindness',
      description: 'Do something nice for someone. It boosts YOUR mood too!',
      action: 'Perform 1 act of kindness',
      priority: currentMood.valence < 7 ? 'high' : 'medium',
      category: 'mood',
      icon: '❤️',
      reasoning: 'Helping others activates reward centers in your brain.'
    },
    {
      type: 'activity',
      title: 'Gratitude Power-up',
      description: 'List 5 things you\'re grateful for right now. Be specific!',
      action: 'Write 5 specific gratitudes',
      priority: currentMood.valence < 6 ? 'high' : 'medium',
      category: 'mood',
      icon: '🙏',
      reasoning: 'Gratitude rewires your brain toward positivity.'
    },
    {
      type: 'encouragement',
      title: 'Call a Friend',
      description: 'Social connection is one of the strongest mood boosters.',
      action: 'Call or text someone you care about',
      priority: currentMood.valence < 5 ? 'high' : 'medium',
      category: 'mood',
      icon: '📞',
      reasoning: 'Human connection releases oxytocin, the bonding hormone.'
    },
    
    // Focus enhancers
    {
      type: 'tip',
      title: 'Pomodoro Power',
      description: 'Work for 25 minutes, then take a 5-minute break. Repeat.',
      action: 'Try one Pomodoro session',
      priority: currentMood.focus < 6 ? 'high' : 'low',
      category: 'focus',
      icon: '🍅',
      reasoning: 'Time-boxing increases focus and prevents burnout.'
    },
    {
      type: 'activity',
      title: 'Brain Food Snack',
      description: 'Eat something with protein and healthy fats for mental clarity.',
      action: 'Have nuts, avocado, or eggs',
      priority: currentMood.focus < 5 ? 'high' : 'medium',
      category: 'focus',
      icon: '🥑',
      reasoning: 'Stable blood sugar improves concentration.'
    },
    
    // Creative activities
    {
      type: 'activity',
      title: 'Doodle Therapy',
      description: 'Spend 10 minutes drawing or doodling. No skills needed!',
      action: 'Doodle or color for 10 minutes',
      priority: 'medium',
      category: 'creativity',
      icon: '🎨',
      reasoning: 'Creative expression reduces stress and boosts mood.'
    },
    {
      type: 'challenge',
      title: 'Age-Appropriate Music Mood Shift',
      description: 'Create a playlist with songs from your generation that take you from your current mood to your target mood.',
      action: 'Make a mood-shifting playlist with songs from your era',
      priority: 'medium',
      category: 'creativity',
      icon: '🎵',
      reasoning: 'Music from your generation has stronger emotional resonance and mood-shifting power.'
    },
    
    // Sleep & rest
    {
      type: 'reminder',
      title: 'Power Nap',
      description: 'A 20-minute nap can recharge your entire afternoon.',
      action: 'Take a 20-minute nap',
      priority: currentMood.energy < 4 ? 'high' : 'low',
      category: 'sleep',
      icon: '😴',
      reasoning: 'Short naps improve alertness without grogginess.'
    },
    {
      type: 'tip',
      title: 'Evening Wind-Down Ritual',
      description: 'Create a calming pre-bed routine: dim lights, no screens, gentle activity.',
      action: 'Start wind-down routine 1 hour before bed',
      priority: timeOfDay === 'evening' ? 'high' : 'low',
      category: 'sleep',
      icon: '🌙',
      reasoning: 'Consistent wind-down improves sleep quality.'
    },
    
    // Mindfulness
    {
      type: 'activity',
      title: '5-Senses Grounding',
      description: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.',
      action: 'Do 5-senses exercise',
      priority: currentMood.stress > 6 ? 'high' : 'medium',
      category: 'mindfulness',
      icon: '🧘',
      reasoning: 'Grounding brings you into the present moment.'
    },
    {
      type: 'tip',
      title: 'Body Scan Meditation',
      description: 'Lie down and mentally scan your body from head to toe.',
      action: 'Do 10-minute body scan',
      priority: currentMood.stress > 5 ? 'high' : 'low',
      category: 'mindfulness',
      icon: '🔍',
      reasoning: 'Body awareness reduces stress and improves mood.'
    },
    
    // Social & connection
    {
      type: 'encouragement',
      title: 'Send Appreciation',
      description: 'Text someone and tell them why you appreciate them.',
      action: 'Send 1 appreciation message',
      priority: 'medium',
      category: 'social',
      icon: '💌',
      reasoning: 'Expressing gratitude strengthens relationships and boosts mood.'
    },
    {
      type: 'activity',
      title: 'Join a Group Activity',
      description: 'Being around others (even without talking) can lift your mood.',
      action: 'Go to a coffee shop or gym',
      priority: currentMood.valence < 5 ? 'high' : 'low',
      category: 'social',
      icon: '👥',
      reasoning: 'Social presence activates mirror neurons and positive feelings.'
    },
    
    // Fun & joy
    {
      type: 'challenge',
      title: 'Laugh Break',
      description: 'Watch funny videos or call someone who makes you laugh.',
      action: 'Spend 10 minutes laughing',
      priority: currentMood.valence < 6 ? 'high' : 'medium',
      category: 'joy',
      icon: '😂',
      reasoning: 'Laughter releases endorphins and reduces stress hormones.'
    },
    {
      type: 'activity',
      title: 'Try Something New',
      description: 'Do one small thing you\'ve never done before today.',
      action: 'Try a new food, route, or activity',
      priority: 'medium',
      category: 'joy',
      icon: '✨',
      reasoning: 'Novelty stimulates dopamine and breaks routine patterns.'
    }
  ];
  
  // Shuffle and select 5-6 random suggestions
  const shuffled = allSuggestions
    .map(suggestion => ({
      ...suggestion,
      suggestionId: `hf_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      randomScore: Math.random()
    }))
    .sort((a, b) => {
      // Prioritize high-priority suggestions but still randomize
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return a.randomScore - b.randomScore;
    })
    .slice(0, 5 + Math.floor(randomSeed * 2)); // 5-6 suggestions
  
  console.log(`🎲 Generated ${shuffled.length} randomized suggestions`);
  return shuffled;
}


// Generate local suggestions with learning from feedback - NOW WITH RANDOMIZATION!
async function generateLocalSuggestionsWithLearning(profile: UserMoodProfile): Promise<AISuggestion[]> {
  console.log('🎲 Generating NEW random suggestions...');
  
  // Just use the randomized suggestions - they're way better!
  return generateRandomizedSuggestions(profile);
}

// Adapt suggestions based on user feedback
function adaptSuggestionsBasedOnFeedback(
  suggestions: AISuggestion[], 
  helpful: any[], 
  unhelpful: any[]
): AISuggestion[] {
  // If user has feedback, adapt suggestions
  if (helpful.length > 0 || unhelpful.length > 0) {
    console.log('🎯 Adapting suggestions based on your feedback...');
    
    // Boost priority of similar helpful suggestions
    suggestions.forEach(suggestion => {
      const similarHelpful = helpful.find(h => 
        h.category === suggestion.category || 
        h.type === suggestion.type ||
        h.priority === suggestion.priority
      );
      
      if (similarHelpful) {
        suggestion.priority = 'high';
        suggestion.reasoning += ` (Adapted based on your positive feedback!)`;
      }
    });
    
    // Lower priority of similar unhelpful suggestions
    suggestions.forEach(suggestion => {
      const similarUnhelpful = unhelpful.find(u => 
        u.category === suggestion.category && 
        u.type === suggestion.type
      );
      
      if (similarUnhelpful) {
        suggestion.priority = 'low';
        suggestion.reasoning += ` (Reduced priority based on your feedback)`;
      }
    });
  }
  
  return suggestions;
}

// Local AI suggestions (fallback)
function generateLocalSuggestions(profile: UserMoodProfile): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const { currentMood, moodHistory, successfulSolutions, commonActivities, timeOfDay } = profile;

  // Valence-based suggestions with advanced analysis
  if (currentMood.valence <= 3) {
    suggestions.push({
      type: 'activity',
      title: 'Emergency Mood Boost',
      description: 'Your valence is critically low. Let\'s get you feeling better with immediate, proven techniques.',
      action: 'Try the 5-4-3-2-1 grounding technique',
      priority: 'high',
      category: 'mood',
      icon: '🚨',
      reasoning: `Based on your valence score of ${currentMood.valence}/10, you need immediate intervention.`
    });

    if (successfulSolutions.length > 0) {
      suggestions.push({
        type: 'tip',
        title: 'Use Your Success Formula',
        description: `You\'ve found success with: ${successfulSolutions[0]}. Try this proven method again.`,
        action: `Practice ${successfulSolutions[0]}`,
        priority: 'high',
        category: 'mood',
        icon: '✅',
        reasoning: 'Leveraging your personal success patterns for immediate relief.'
      });
    }
  } else if (currentMood.valence >= 8) {
    suggestions.push({
      type: 'encouragement',
      title: 'Momentum Builder',
      description: 'Excellent valence! Channel this positive energy into something meaningful or help others.',
      action: 'Share your positivity or start a creative project',
      priority: 'medium',
      category: 'mood',
      icon: '🌟',
      reasoning: 'High valence states are perfect for building positive momentum and helping others.'
    });
  }

  // Energy-valence mismatch analysis
  if (currentMood.energy > 6 && currentMood.valence < 5) {
    suggestions.push({
      type: 'challenge',
      title: 'Energy-to-Valence Transfer',
      description: 'You have high energy but low valence. Use your physical energy to boost your emotional state.',
      action: 'Do 10 minutes of vigorous exercise or dancing',
      priority: 'high',
      category: 'mood',
      icon: '⚡',
      reasoning: 'Physical activity can convert high energy into improved valence through endorphin release.'
    });
  }

  // Stress management with pattern analysis
  if (currentMood.stress >= 7) {
    suggestions.push({
      type: 'activity',
      title: 'Stress Relief Protocol',
      description: 'High stress detected. Use evidence-based techniques to calm your nervous system.',
      action: 'Practice 4-7-8 breathing for 5 minutes',
      priority: 'high',
      category: 'stress',
      icon: '🧘',
      reasoning: `Your stress level of ${currentMood.stress}/10 requires immediate attention.`
    });

    if (moodHistory.stressPattern > 6) {
      suggestions.push({
        type: 'tip',
        title: 'Chronic Stress Alert',
        description: 'You\'ve been consistently stressed. Consider addressing root causes and building stress resilience.',
        action: 'Identify and address stress triggers',
        priority: 'high',
        category: 'stress',
        icon: '⚠️',
        reasoning: 'Pattern analysis shows chronic stress requiring systematic intervention.'
      });
    }
  }

  // Sleep optimization
  if (currentMood.sleep && currentMood.sleep < 6) {
    suggestions.push({
      type: 'reminder',
      title: 'Sleep Debt Recovery',
      description: 'Insufficient sleep is affecting your mood and energy. Prioritize rest tonight.',
      action: 'Set bedtime 1 hour earlier tonight',
      priority: 'high',
      category: 'sleep',
      icon: '😴',
      reasoning: `Only ${currentMood.sleep} hours of sleep is insufficient for optimal mood regulation.`
    });
  }

  // Time-based suggestions
  if (timeOfDay === 'morning' && currentMood.valence < 6) {
    suggestions.push({
      type: 'tip',
      title: 'Morning Valence Setter',
      description: 'Start your day with intention. A positive morning routine can influence your entire day.',
      action: 'Do 5 minutes of gratitude journaling',
      priority: 'medium',
      category: 'routine',
      icon: '🌅',
      reasoning: 'Morning valence sets the tone for the entire day.'
    });
  } else if (timeOfDay === 'evening' && currentMood.stress > 6) {
    suggestions.push({
      type: 'activity',
      title: 'Evening Wind-down',
      description: 'High stress in the evening. Create a calming bedtime routine to improve sleep and tomorrow\'s valence.',
      action: 'Take a warm bath or do gentle stretching',
      priority: 'medium',
      category: 'routine',
      icon: '🌙',
      reasoning: 'Evening stress can disrupt sleep and affect next day\'s valence.'
    });
  }

  // Pattern-based insights
  if (moodHistory.valenceTrend < -1) {
    suggestions.push({
      type: 'tip',
      title: 'Valence Decline Pattern',
      description: 'Your valence has been declining recently. Let\'s reverse this trend with positive interventions.',
      action: 'Increase social connections or outdoor time',
      priority: 'high',
      category: 'mood',
      icon: '📉',
      reasoning: 'Declining valence trend requires proactive intervention to prevent further deterioration.'
    });
  }

  // Activity-based suggestions
  if (commonActivities.length > 0) {
    const topActivity = commonActivities[0];
    suggestions.push({
      type: 'tip',
      title: 'Leverage Your Strengths',
      description: `You frequently engage in ${topActivity}. Use this strength to boost your mood today.`,
      action: `Plan a ${topActivity} session`,
      priority: 'low',
      category: 'activity',
      icon: '💪',
      reasoning: 'Building on established positive activities increases success probability.'
    });
  }

  // Wellness optimization
  const overallScore = (currentMood.valence + currentMood.energy + (10 - currentMood.stress) + currentMood.focus) / 4;
  if (overallScore < 5) {
    suggestions.push({
      type: 'challenge',
      title: 'Wellness Reset Challenge',
      description: 'Your overall wellness needs attention. Commit to 3 small positive actions today.',
      action: 'Choose 3 wellness activities from your successful solutions',
      priority: 'high',
      category: 'wellness',
      icon: '🔄',
      reasoning: `Overall wellness score of ${overallScore.toFixed(1)}/10 indicates need for comprehensive intervention.`
    });
  }

  // Add unique IDs and return suggestions sorted by priority
  return suggestions
    .map((suggestion, index) => ({
      ...suggestion,
      suggestionId: `suggestion_${Date.now()}_${index}`
    }))
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 6);
}

// Analyze user mood patterns
export function analyzeMoodPatterns(entries: any[]): UserMoodProfile['moodHistory'] {
  if (entries.length === 0) {
    return {
      avgValence: 5,
      valenceTrend: 0,
      stressPattern: 5,
      energyPattern: 5,
      sleepPattern: 8
    };
  }

  const recent = entries.slice(0, 7);
  const previous = entries.slice(7, 14);

  const avgValence = recent.reduce((sum, entry) => sum + entry.valence, 0) / recent.length;
  const previousAvgValence = previous.length > 0 ? 
    previous.reduce((sum, entry) => sum + entry.valence, 0) / previous.length : avgValence;
  
  const valenceTrend = avgValence - previousAvgValence;
  const stressPattern = recent.reduce((sum, entry) => sum + entry.stress, 0) / recent.length;
  const energyPattern = recent.reduce((sum, entry) => sum + entry.energy, 0) / recent.length;
  const sleepPattern = recent.reduce((sum, entry) => sum + (entry.sleep || 8), 0) / recent.length;

  return {
    avgValence,
    valenceTrend,
    stressPattern,
    energyPattern,
    sleepPattern
  };
}

// Extract successful solutions from user history
export function extractSuccessfulSolutions(entries: any[]): string[] {
  const solutions: string[] = [];
  
  entries.forEach(entry => {
    if (entry.notes) {
      // Look for positive outcomes in notes
      const positiveKeywords = ['better', 'improved', 'helped', 'worked', 'success', 'good', 'great'];
      if (positiveKeywords.some(keyword => entry.notes.toLowerCase().includes(keyword))) {
        // Extract activity or solution mentioned
        const activities = entry.activities || [];
        solutions.push(...activities);
      }
    }
  });

  // Count frequency and return most successful
  const solutionCounts = solutions.reduce((acc, solution) => {
    acc[solution] = (acc[solution] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(solutionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([solution]) => solution);
}

// Create prompts for different AI services
function createOpenAIPrompt(profile: UserMoodProfile): string {
  const { currentMood, timeOfDay, userFeedback, userInfo, userPreferences, activeGoals } = profile;
  
  let prompt = `Generate 5 personalized wellness suggestions for someone with this mood profile:

Current Mood:
- Happiness: ${currentMood.valence}/10
- Energy: ${currentMood.energy}/10  
- Focus: ${currentMood.focus}/10
- Stress: ${currentMood.stress}/10
- Sleep: ${currentMood.sleep || 8}/10
- Time of Day: ${timeOfDay}
`;

  // Add user preferences FIRST (critical for personalization)
  if (userPreferences) {
    prompt += `\nUser Preferences & Favorites (USE THESE FOR SPECIFIC SUGGESTIONS):\n`;
    
    if (userPreferences.interests && userPreferences.interests.length > 0) {
      prompt += `- Interests: ${userPreferences.interests.join(', ')}\n`;
    }
    
    if (userPreferences.favoriteWriters && userPreferences.favoriteWriters.length > 0) {
      prompt += `- Favorite Writers: ${userPreferences.favoriteWriters.join(', ')} (USE FOR BOOK SUGGESTIONS!)\n`;
    }
    
    if (userPreferences.favoriteSportsFigures && userPreferences.favoriteSportsFigures.length > 0) {
      prompt += `- Favorite Athletes: ${userPreferences.favoriteSportsFigures.join(', ')} (USE FOR WORKOUT SUGGESTIONS!)\n`;
    }
    
    if (userPreferences.favoriteMusicians && userPreferences.favoriteMusicians.length > 0) {
      prompt += `- Favorite Musicians: ${userPreferences.favoriteMusicians.join(', ')} (USE FOR MUSIC SUGGESTIONS!)\n`;
    }
    
    if (userPreferences.favoriteArtists && userPreferences.favoriteArtists.length > 0) {
      prompt += `- Favorite Artists: ${userPreferences.favoriteArtists.join(', ')} (USE FOR ART SUGGESTIONS!)\n`;
    }
    if (userPreferences.favoriteMovies && userPreferences.favoriteMovies.length > 0) {
      prompt += `- Favorite Movies/TV: ${userPreferences.favoriteMovies.join(', ')} (USE FOR WATCHING SUGGESTIONS!)\n`;
    }
    
    if (userPreferences.favoritePhilosophers && userPreferences.favoritePhilosophers.length > 0) {
      prompt += `- Favorite Philosophers: ${userPreferences.favoritePhilosophers.join(', ')}\n`;
    }
  }

  // Add active goals for goal-oriented suggestions
  if (activeGoals && activeGoals.length > 0) {
    prompt += `\nActive Goals (CRITICAL - Use these to provide goal-oriented suggestions and motivation):\n`;
    
    activeGoals.forEach(goal => {
      const progressText = goal.completed ? 'COMPLETED!' : `${goal.progressPercentage}% complete (${goal.currentValue}/${goal.targetValue})`;
      const streakText = goal.streak > 0 ? ` (${goal.streak} day streak)` : '';
      prompt += `- "${goal.title}" (${goal.category}${goal.subcategory ? ` - ${goal.subcategory}` : ''}) - ${progressText}${streakText}\n`;
      
      if (goal.description) {
        prompt += `  Description: ${goal.description}\n`;
      }
    });
    
    prompt += `\nGOAL-ORIENTED SUGGESTIONS RULES:\n`;
    prompt += `- For goals with low progress (<30%), provide motivational suggestions to get started\n`;
    prompt += `- For goals with medium progress (30-70%), provide suggestions to maintain momentum\n`;
    prompt += `- For goals with high progress (>70%), provide suggestions to push to completion\n`;
    prompt += `- For completed goals, provide celebration and next-level suggestions\n`;
    prompt += `- For health goals (quitting smoking, fitness), provide specific health-focused suggestions\n`;
    prompt += `- For learning goals (reading books, courses), provide educational suggestions\n`;
    prompt += `- For habit goals (gym attendance, meditation), provide habit-building suggestions\n`;
    prompt += `- Always mention the specific goal by name when relevant\n`;
  }

  // Add user info (age, gender, and period data) for more personalized suggestions
  if (userInfo) {
    prompt += `\nUser Demographics (CRITICAL for age-appropriate and gender-specific suggestions):\n`;
    
    if (userInfo.age) {
      prompt += `- Age: ${userInfo.age} years old (ADJUST ALL SUGGESTIONS FOR THIS AGE GROUP!)\n`;
    }
    
    if (userInfo.gender) {
      prompt += `- Gender: ${userInfo.gender} (CONSIDER GENDER-SPECIFIC WELLNESS NEEDS!)\n`;
    }
    
    if (userInfo.personality) {
      prompt += `- Personality: ${userInfo.personality} (CRITICAL for suggestion type!)\n`;
      console.log(`🎭 Personality detected: ${userInfo.personality}`);
    }
    
    if (userInfo.universityLevel) {
      prompt += `- University Level: ${userInfo.universityLevel} (ADJUST SUGGESTIONS FOR ACADEMIC LEVEL!)\n`;
    }
    
    if (userInfo.fieldOfStudy) {
      prompt += `- Field of Study: ${userInfo.fieldOfStudy} (PROVIDE FIELD-SPECIFIC SUGGESTIONS!)\n`;
    }
    
    if (userInfo.height && userInfo.weight) {
      prompt += `- Physical stats: ${userInfo.height}cm, ${userInfo.weight}kg (for fitness suggestions)\n`;
    }
    
    if (userInfo.onPeriod) {
      prompt += `- Currently menstruating: YES (Day ${userInfo.periodDay} of period)\n`;
      prompt += `- Average cycle length: ${userInfo.periodCycleLength} days\n`;
      
      if (userInfo.periodSymptoms && userInfo.periodSymptoms.length > 0) {
        prompt += `- Current period symptoms: ${userInfo.periodSymptoms.join(', ')}\n`;
      }
      
      prompt += `- IMPORTANT: Provide suggestions that are appropriate for someone currently on their period (e.g., gentle activities, pain relief, mood support, avoid intense exercise)\n`;
    } else if (userInfo.gender === 'female' && userInfo.periodCycleLength) {
      prompt += `- Not currently on period (average cycle: ${userInfo.periodCycleLength} days)\n`;
    }
  }

  // Add daily tracking data (water, meals, exercise, etc.)
  if (profile.dailyTracking) {
    const dt = profile.dailyTracking;
    prompt += `\nToday's Activities & Habits (CRITICAL - Use this to provide relevant suggestions):\n`;
    
    // Water & Nutrition
    if (dt.waterIntake !== undefined) {
      const waterStatus = dt.waterIntake < 4 ? 'dehydrated (LOW)' : dt.waterIntake >= 8 ? 'well hydrated' : 'moderate hydration';
      prompt += `- Water intake: ${dt.waterIntake} glasses (${waterStatus})\n`;
    }
    
    if (dt.mealsEaten !== undefined) {
      prompt += `- Meals eaten today: ${dt.mealsEaten}\n`;
    }
    
    if (dt.mealQuality) {
      prompt += `- Meal quality: ${dt.mealQuality}\n`;
    }
    
    if (dt.caffeine !== undefined) {
      const caffeineNote = dt.caffeine > 3 ? ' (HIGH - may affect mood/sleep)' : '';
      prompt += `- Caffeine: ${dt.caffeine} drinks${caffeineNote}\n`;
    }
    
    if (dt.alcohol !== undefined) {
      const alcoholNote = dt.alcohol > 2 ? ' (HIGH - may affect mood)' : '';
      prompt += `- Alcohol: ${dt.alcohol} drinks${alcoholNote}\n`;
    }
    
    // Physical Activity
    if (dt.exercise) {
      prompt += `- Exercise today: YES (${dt.exerciseType || 'general'}, ${dt.exerciseDuration || 0} minutes)\n`;
    } else {
      prompt += `- Exercise today: NO (suggest gentle movement)\n`;
    }
    
    if (dt.steps !== undefined) {
      const stepsNote = dt.steps < 5000 ? ' (LOW - suggest more movement)' : dt.steps >= 10000 ? ' (EXCELLENT)' : '';
      prompt += `- Steps: ${dt.steps}${stepsNote}\n`;
    }
    
    // Social & Mental
    if (dt.socialInteraction !== undefined) {
      prompt += `- Social interaction: ${dt.socialInteraction ? 'YES' : 'NO (suggest social activities)'}\n`;
    }
    
    if (dt.screenTime !== undefined) {
      const screenNote = dt.screenTime > 6 ? ' (HIGH - suggest screen break)' : '';
      prompt += `- Screen time: ${dt.screenTime} hours${screenNote}\n`;
    }
    
    if (dt.outdoorTime !== undefined) {
      const outdoorNote = dt.outdoorTime < 30 ? ' (LOW - suggest outdoor activity)' : '';
      prompt += `- Outdoor time: ${dt.outdoorTime} minutes${outdoorNote}\n`;
    }
    
    // Self-Care
    if (dt.meditation) {
      prompt += `- Meditation: YES (${dt.meditationDuration || 0} minutes)\n`;
    }
    
    if (dt.journaling) {
      prompt += `- Journaling: YES\n`;
    }
    
    if (dt.readingTime !== undefined) {
      prompt += `- Reading: ${dt.readingTime} minutes\n`;
    }
    
    // Health
    if (dt.medicationTaken) {
      prompt += `- Medication: Taken\n`;
    }
    
    if (dt.supplements && dt.supplements.length > 0) {
      prompt += `- Supplements: ${dt.supplements.join(', ')}\n`;
    }
    
    if (dt.symptoms && dt.symptoms.length > 0) {
      prompt += `- Physical symptoms: ${dt.symptoms.join(', ')} (address these in suggestions)\n`;
    }
    
    prompt += `- IMPORTANT: Consider what they've eaten, drunk, and done today when making suggestions. If they haven't drunk enough water, suggest hydration. If they haven't exercised, suggest gentle movement. If they've had too much caffeine/alcohol or screen time, address that.\n`;
  }

  // Add reflection text to personalize tone and content
  if (profile.reflection && profile.reflection.trim().length > 0) {
    prompt += `\nUser's Reflection (IMPORTANT context from the latest entry):\n"${profile.reflection.trim().slice(0, 600)}"\n`;
  }

  // Add user feedback to personalize suggestions
  if (userFeedback) {
    prompt += `\nUser Preferences (IMPORTANT - Use this to personalize suggestions):\n`;
    
    if (userFeedback.helpfulSuggestions.length > 0) {
      prompt += `- Suggestions they LOVED (suggest similar): ${userFeedback.helpfulSuggestions.join(', ')}\n`;
    }
    
    if (userFeedback.unhelpfulSuggestions.length > 0) {
      prompt += `- Suggestions they DIDN'T like (avoid these): ${userFeedback.unhelpfulSuggestions.join(', ')}\n`;
    }
    
    if (userFeedback.preferredCategories.length > 0) {
      prompt += `- Preferred categories (focus on these): ${userFeedback.preferredCategories.join(', ')}\n`;
    }
    
    if (userFeedback.avoidCategories.length > 0) {
      prompt += `- Categories to avoid: ${userFeedback.avoidCategories.join(', ')}\n`;
    }
  }

  prompt += `

CRITICAL INSTRUCTION - BE ULTRA-SPECIFIC IN YOUR SUGGESTIONS:

PERSONALITY-BASED SUGGESTIONS (CRITICAL):
- **INTJ (The Architect)**: Suggest strategic planning, independent projects, deep thinking activities, solo research, analytical tasks
- **INTP (The Thinker)**: Suggest intellectual challenges, problem-solving, theoretical discussions, solo learning, analytical projects
- **ENTJ (The Commander)**: Suggest leadership activities, group projects, strategic planning, team building, competitive activities
- **ENTP (The Debater)**: Suggest brainstorming sessions, group discussions, creative challenges, social debates, innovative projects
- **INFJ (The Advocate)**: Suggest meaningful causes, helping others, quiet reflection, creative writing, spiritual activities
- **INFP (The Mediator)**: Suggest creative expression, personal projects, quiet activities, artistic pursuits, individual reflection
- **ENFJ (The Protagonist)**: Suggest mentoring others, group activities, social causes, leadership roles, community involvement
- **ENFP (The Campaigner)**: Suggest social activities, creative projects, group adventures, networking, inspiring others
- **ISTJ (The Logistician)**: Suggest structured activities, detailed planning, routine tasks, organized projects, methodical approaches
- **ISFJ (The Protector)**: Suggest helping others, caring activities, structured routines, service projects, nurturing tasks

STUDENT-SPECIFIC SUGGESTIONS (CRITICAL):
- **UNDERGRADUATE**: Focus on study groups, campus activities, dorm life, freshman stress, social integration
- **GRADUATE**: Focus on research stress, thesis work, academic pressure, professional development, networking
- **PHD**: Focus on dissertation stress, academic isolation, research burnout, career planning, mentorship
- **COMPUTER SCIENCE**: Suggest coding breaks, tech meetups, hackathons, programming projects, tech communities
- **PSYCHOLOGY**: Suggest mindfulness practices, therapy resources, mental health awareness, counseling services
- **MEDICINE**: Suggest stress management for medical students, study techniques, clinical rotation support
- **ENGINEERING**: Suggest problem-solving activities, technical projects, engineering communities, innovation challenges
- **BUSINESS**: Suggest networking events, case studies, leadership development, entrepreneurship activities
- **ARTS/HUMANITIES**: Suggest creative projects, cultural events, writing workshops, artistic communities
- **STUDENT + HIGH STRESS**: Suggest study breaks, campus counseling, peer support groups, academic resources
- **STUDENT + LOW ENERGY**: Suggest study snacks, power naps, study groups, academic motivation techniques

PERSONALITY + STUDENT COMBINATIONS (CRITICAL):
- **INTJ + COMPUTER SCIENCE**: Suggest system architecture projects, solo coding challenges, technical research, independent study
- **INTP + COMPUTER SCIENCE**: Suggest algorithm challenges, theoretical computer science, solo programming projects, technical discussions
- **ENTJ + COMPUTER SCIENCE**: Suggest leading tech teams, organizing hackathons, tech leadership roles, competitive programming
- **ENTP + COMPUTER SCIENCE**: Suggest tech meetups, brainstorming sessions, innovative projects, group coding challenges
- **INFJ + PSYCHOLOGY**: Suggest individual therapy work, personal reflection, helping others with mental health, quiet study
- **INFP + PSYCHOLOGY**: Suggest creative therapy approaches, personal journaling, artistic expression, individual research
- **ENFJ + PSYCHOLOGY**: Suggest group therapy sessions, mentoring peers, mental health advocacy, community workshops
- **ENFP + PSYCHOLOGY**: Suggest psychology study groups, mental health awareness events, peer support groups, social activities
- **ISTJ + ANY FIELD**: Suggest structured study plans, organized schedules, methodical approaches, routine-based activities
- **ISFJ + ANY FIELD**: Suggest helping classmates, study groups, service projects, caring for others, structured support

1. **If suggesting music/dance:**
   - DO NOT say "listen to music" or "dance"
   - If they have favorite musicians: "Listen to [SPECIFIC SONG] by [FAVORITE MUSICIAN]"
   - **GENRE EXPANSION**: If they like Taylor Swift → suggest similar pop artists (Ariana Grande, Olivia Rodrigo, Billie Eilish)
   - **GENRE EXPANSION**: If they like Pink Floyd → suggest similar rock/prog artists (Led Zeppelin, Queen, Radiohead)
   - **GENRE EXPANSION**: If they like classical → suggest similar composers (Mozart, Beethoven, Chopin)
   - If NO favorite musicians saved: Use age-appropriate suggestions:
     * Age 18-25: "Listen to 'Levitating' by Dua Lipa" or "Dance to 'Good 4 U' by Olivia Rodrigo"
     * Age 26-35: "Listen to 'Blinding Lights' by The Weeknd" or "Dance to 'Watermelon Sugar' by Harry Styles"
     * Age 36-45: "Listen to 'Shake It Off' by Taylor Swift" or "Dance to 'Uptown Funk' by Bruno Mars"
     * Age 46+: "Listen to 'Don't Stop Believin'' by Journey" or "Dance to 'Sweet Caroline' by Neil Diamond"
   - ALWAYS include specific song titles and artists!

2. **If suggesting reading:**
   - DO NOT say "read a book"
   - DO say "Read [SPECIFIC BOOK TITLE] by [FAVORITE WRITER]"
   - **GENRE EXPANSION**: If they like Maya Angelou → suggest similar poets (Langston Hughes, Rumi, Pablo Neruda)
   - **GENRE EXPANSION**: If they like Ernest Hemingway → suggest similar writers (F. Scott Fitzgerald, John Steinbeck, Jack London)
   - **GENRE EXPANSION**: If they like Carl Sagan → suggest similar science writers (Neil deGrasse Tyson, Stephen Hawking, Richard Feynman)
   - Example: "Read 'Pride and Prejudice' by Jane Austen" or "Read Rumi's 'The Guest House' poem"
   - Use their favorite writers list AND similar authors in the same genre!

3. **If suggesting exercise/sports:**
   - DO NOT say "work out" or "exercise"
   - DO say "Try [SPECIFIC WORKOUT] inspired by [FAVORITE ATHLETE]"
   - **GENRE EXPANSION**: If they like Messi → suggest similar footballers (Neymar, Mbappé, Ronaldo) or other sports legends
   - **GENRE EXPANSION**: If they like Serena Williams → suggest similar tennis players (Venus Williams, Roger Federer, Rafael Nadal)
   - **GENRE EXPANSION**: If they like Michael Jordan → suggest similar basketball players (LeBron James, Kobe Bryant, Magic Johnson)
   - Example: "Do Ronaldo's 30-min HIIT routine" or "Try Serena Williams' warmup stretches"
   - Use their favorite athletes list AND similar athletes in the same sport!

4. **If suggesting movies/shows:**
   - DO NOT say "watch a movie"
   - DO say "Watch [SPECIFIC MOVIE/SHOW]"
   - Example: "Watch 'The Pursuit of Happyness'" or "Watch a TED Talk by Brené Brown"

5. **If suggesting meditation/mindfulness:**
   - DO NOT say "meditate"
   - DO say "Try [SPECIFIC TECHNIQUE] meditation"
   - Example: "Try Thich Nhat Hanh's walking meditation" or "Practice 4-7-8 breathing technique"

6. **If suggesting art/creativity:**
   - DO NOT say "do art"
   - DO say "Try [SPECIFIC ART ACTIVITY] inspired by [FAVORITE ARTIST]"
   - **GENRE EXPANSION**: If they like Frida Kahlo → suggest similar artists (Georgia O'Keeffe, Diego Rivera, Vincent van Gogh)
   - **GENRE EXPANSION**: If they like Leonardo da Vinci → suggest similar Renaissance artists (Michelangelo, Raphael, Botticelli)
   - **GENRE EXPANSION**: If they like Van Gogh → suggest similar impressionist artists (Monet, Renoir, Degas)
   - Example: "Draw self-portraits inspired by Frida Kahlo" or "Try Van Gogh's color techniques"

RESPONSE FORMAT:
[
  {
    "type": "activity" | "tip" | "reminder" | "challenge" | "encouragement",
    "title": "Specific Title with Names",
    "description": "Detailed step-by-step what to do, including SPECIFIC names, titles, techniques",
    "action": "ULTRA-SPECIFIC action (include song/book/movie/workout name!)",
    "priority": "high" | "medium" | "low",
    "category": "energy" | "stress" | "mood" | "wellness" | "activity",
    "icon": "relevant emoji",
    "reasoning": "Why this SPECIFIC suggestion (reference their favorites and current mood)"
  }
]

EXAMPLES OF GOOD SUGGESTIONS:
✅ "Listen to 'Respect' by Nina Simone for energy boost"
✅ "Read Chapter 1 of 'Pride and Prejudice' by Jane Austen"
✅ "Try Ronaldo's 10-minute leg workout from his Instagram"
✅ "Watch 'The Alchemist' audiobook by Paulo Coelho"
✅ "Practice Rumi-inspired gratitude meditation"

EXAMPLES OF BAD (TOO GENERIC) SUGGESTIONS:
❌ "Listen to music"
❌ "Read a book"
❌ "Do some exercise"
❌ "Watch something uplifting"
❌ "Try meditation"

${userInfo?.onPeriod ? '\nCRITICAL: This person is currently menstruating - be sensitive and provide appropriate suggestions!' : ''}
${userFeedback ? '\nIMPORTANT: Personalize based on their preferences above!' : ''}

BE ULTRA-SPECIFIC! Include actual song titles, book titles, specific exercises, etc.`;
  
  return prompt;
}

function createGeminiPrompt(profile: UserMoodProfile): string {
  const { currentMood, timeOfDay } = profile;
  
  return `You are a wellness AI assistant. Generate 5 personalized mood improvement suggestions based on this user profile:

Current Mood:
- Happiness: ${currentMood.valence}/10
- Energy: ${currentMood.energy}/10  
- Focus: ${currentMood.focus}/10
- Stress: ${currentMood.stress}/10
- Sleep: ${currentMood.sleep || 8}/10
- Time of Day: ${timeOfDay}

Please provide 5 specific, actionable suggestions in this exact JSON format:
[
  {
    "type": "activity|tip|challenge|encouragement",
    "title": "Short descriptive title",
    "description": "Detailed explanation of what to do",
    "action": "Specific action to take",
    "priority": "high|medium|low",
    "category": "energy|stress|mood|wellness|activity",
    "icon": "relevant emoji",
    "reasoning": "Why this suggestion is good for their current state"
  }
]

Focus on suggestions that directly address their current mood levels and time of day.`;
}

function createTextCortexPrompt(profile: UserMoodProfile): string {
  const { currentMood, timeOfDay } = profile;
  
  return `Generate 5 personalized wellness suggestions for someone with:
- Happiness: ${currentMood.valence}/10
- Energy: ${currentMood.energy}/10
- Stress: ${currentMood.stress}/10
- Time: ${timeOfDay}

Provide specific, actionable suggestions that address their current mood state.`;
}

function createDeepAIPrompt(profile: UserMoodProfile): string {
  const { currentMood, timeOfDay } = profile;
  
  return `Create 5 wellness suggestions for mood improvement. User feels:
- ${currentMood.valence}/10 happy
- ${currentMood.energy}/10 energetic  
- ${currentMood.stress}/10 stressed
- Time: ${timeOfDay}

Give practical, specific actions they can take right now.`;
}

// Parse responses from different AI services
function parseOpenAIResponse(data: any, profile: UserMoodProfile): AISuggestion[] {
  try {
    const text = data.choices?.[0]?.message?.content || '';
    console.log('🔍 OpenAI response text:', text);
    
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      return suggestions.map((s: any, index: number) => ({
        ...s,
        suggestionId: `openai_${Date.now()}_${index}`,
        type: s.type || 'tip',
        priority: s.priority || 'medium',
        category: s.category || 'wellness',
        icon: s.icon || '🤖'
      }));
    }
    
    // Fallback: generate suggestions from text
    return generateSuggestionsFromText(text, profile, 'openai');
  } catch (error) {
    console.error('❌ Error parsing OpenAI response:', error);
    throw error;
  }
}

function parseGeminiResponse(data: any, profile: UserMoodProfile): AISuggestion[] {
  try {
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('🔍 Gemini response text:', text);
    
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      return suggestions.map((s: any, index: number) => ({
        ...s,
        suggestionId: `gemini_${Date.now()}_${index}`,
        type: s.type || 'tip',
        priority: s.priority || 'medium',
        category: s.category || 'wellness',
        icon: s.icon || '💡'
      }));
    }
    
    // Fallback: generate suggestions from text
    return generateSuggestionsFromText(text, profile, 'gemini');
  } catch (error) {
    console.error('❌ Error parsing Gemini response:', error);
    throw error;
  }
}

function parseTextCortexResponse(data: any, profile: UserMoodProfile): AISuggestion[] {
  try {
    const text = data.data?.output || data.output || '';
    console.log('🔍 TextCortex response text:', text);
    return generateSuggestionsFromText(text, profile, 'textcortex');
  } catch (error) {
    console.error('❌ Error parsing TextCortex response:', error);
    throw error;
  }
}

function parseDeepAIResponse(data: any, profile: UserMoodProfile): AISuggestion[] {
  try {
    const text = data.output || '';
    console.log('🔍 DeepAI response text:', text);
    return generateSuggestionsFromText(text, profile, 'deepai');
  } catch (error) {
    console.error('❌ Error parsing DeepAI response:', error);
    throw error;
  }
}

// Generate suggestions from AI text response
function generateSuggestionsFromText(text: string, profile: UserMoodProfile, source: string): AISuggestion[] {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const suggestions: AISuggestion[] = [];
  
  lines.forEach((line, index) => {
    if (line.trim().length > 10) { // Only use substantial lines
      suggestions.push({
        type: 'tip',
        title: `AI Suggestion ${index + 1}`,
        description: line.trim(),
        action: line.trim(),
        priority: 'medium',
        category: 'wellness',
        icon: '🤖',
        reasoning: `Generated by ${source} AI based on your current mood`,
        suggestionId: `${source}_${Date.now()}_${index}`
      });
    }
  });
  
  // Return up to 5 suggestions
  return suggestions.slice(0, 5);
}
