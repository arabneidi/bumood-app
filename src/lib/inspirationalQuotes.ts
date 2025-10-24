export const inspirationalQuotes = [
  "Every small step forward is progress worth celebrating.",
  "Your mental health journey is unique and valuable.",
  "Growth happens one day at a time, one choice at a time.",
  "You have the power to transform your thoughts and your life.",
  "Self-care isn't selfish—it's essential for your wellbeing.",
  "Your feelings are valid and deserve to be acknowledged.",
  "Progress, not perfection, is the goal.",
  "You are stronger than you know and more capable than you believe.",
  "Every challenge is an opportunity for growth and learning.",
  "Your mental health matters and you matter.",
  "Small consistent actions lead to big transformations.",
  "You deserve compassion, especially from yourself.",
  "Healing is not linear, and that's perfectly okay.",
  "Your journey of self-discovery is beautiful and ongoing.",
  "Every moment of mindfulness is a gift to yourself.",
  "You have the courage to face whatever comes your way.",
  "Self-awareness is the first step toward positive change.",
  "Your mental wellness is a priority, not a luxury.",
  "Every day is a fresh start and a new opportunity.",
  "You are worthy of love, happiness, and inner peace.",
  "Growth requires patience, and you're doing great.",
  "Your emotional intelligence is a superpower.",
  "Taking care of your mind is taking care of your future.",
  "You have the strength to overcome any obstacle.",
  "Self-reflection leads to self-improvement and wisdom.",
  "Your mental health journey is a testament to your resilience.",
  "Every positive thought is a step toward a brighter future.",
  "You are the author of your own story of growth.",
  "Mindfulness is the key to living in the present moment.",
  "Your wellbeing is worth every effort you put into it.",
  "Healing begins with self-acceptance and self-love.",
  "You have the power to choose your perspective.",
  "Every challenge you face makes you more resilient.",
  "Your mental health is just as important as your physical health.",
  "Small acts of self-care create big waves of wellbeing.",
  "You are capable of amazing things when you believe in yourself.",
  "Your emotional growth is a beautiful journey of discovery.",
  "Every step forward, no matter how small, is progress.",
  "You deserve to feel good about yourself and your life.",
  "Self-compassion is the foundation of all healing.",
  "Your mental wellness journey is uniquely yours and valuable.",
  "Every moment of peace you create is a victory.",
  "You have the inner strength to handle whatever comes your way.",
  "Growth happens when you step outside your comfort zone.",
  "Your mental health is an investment in your future happiness.",
  "You are worthy of all the good things life has to offer.",
  "Every positive change starts with a single decision.",
  "Your emotional wellbeing is a priority that deserves attention.",
  "You have the wisdom to make choices that serve your highest good.",
  "Self-care is not selfish—it's necessary for your survival.",
  "Your mental health journey is a story of courage and strength.",
  "Every day you choose to grow is a day you choose to thrive.",
  "You are enough, just as you are, right now.",
  "Your feelings are messengers trying to guide you toward healing.",
  "Self-awareness is the first step toward lasting change.",
  "You have the power to create the life you want to live.",
  "Every moment of self-reflection is a moment of growth.",
  "Your mental wellness is a gift you give to yourself and others.",
  "You are stronger than your struggles and wiser than your fears.",
  "Healing is a process, and you're exactly where you need to be.",
  "Your emotional intelligence is a skill that grows with practice.",
  "Every positive thought you think is a seed of happiness.",
  "You have the courage to be vulnerable and the strength to heal.",
  "Self-love is not selfish—it's the foundation of all love.",
  "Your mental health journey is a testament to your courage.",
  "Every challenge you overcome makes you more resilient.",
  "You deserve to feel peaceful, happy, and fulfilled.",
  "Your growth mindset is your greatest asset.",
  "Every act of self-care is an act of self-love.",
  "You have the power to transform your life one thought at a time.",
  "Your mental wellness is worth every moment you invest in it.",
  "You are capable of creating the life you dream of.",
  "Every positive change starts with believing you deserve it.",
  "Your emotional wellbeing is a priority that matters.",
  "You have the strength to face your fears and grow from them.",
  "Self-compassion is the key to lasting happiness and peace.",
  "Your mental health journey is a beautiful story of resilience.",
  "Every day you choose to grow is a day you choose to live fully.",
  "You are worthy of all the love, joy, and peace you seek.",
  "Your feelings are valid and your experiences matter.",
  "Self-awareness is the foundation of all personal growth.",
  "You have the power to choose how you respond to life's challenges.",
  "Every moment of mindfulness is a gift to your future self.",
  "Your mental wellness is an investment that pays dividends.",
  "You are enough, and you are becoming even more.",
  "Your emotional growth is a journey worth taking.",
  "Every positive choice you make is a step toward your best life.",
  "You have the wisdom to know what you need and the courage to ask for it.",
  "Self-care is not a luxury—it's a necessity for your wellbeing.",
  "Your mental health journey is a story of hope and healing.",
  "Every day you choose to grow is a day you choose to thrive.",
  "You are stronger than you know and more resilient than you believe.",
  "Your mental wellness is a priority that deserves your attention.",
  "You have the power to create positive change in your life.",
  "Every act of self-love is an investment in your happiness.",
  "You are worthy of all the good things you desire.",
  "Your emotional intelligence is a gift that keeps on giving.",
  "Every challenge you face is an opportunity to grow stronger.",
  "You have the courage to be authentic and the strength to heal.",
  "Self-reflection is the path to self-improvement and wisdom.",
  "Your mental health journey is a beautiful story of transformation.",
  "Every positive thought you think creates a ripple of good in the world.",
  "You are capable of amazing things when you believe in your potential.",
  "Your mental wellness is a treasure that grows more valuable with time.",
  "You have the power to choose peace over chaos in your mind.",
  "Every moment of self-care is a moment of self-respect.",
  "You are enough, and you are becoming even more than enough.",
  "Your emotional wellbeing is a priority that deserves your commitment.",
  "You have the strength to overcome any obstacle and the wisdom to learn from it.",
  "Self-compassion is the foundation of all healing and growth.",
  "Your mental health journey is a testament to your courage and resilience.",
  "Every day you choose to grow is a day you choose to live your best life.",
  "You are worthy of all the love, happiness, and peace you seek.",
  "Your feelings are valid, your experiences matter, and your growth is beautiful.",
  "Self-awareness is the first step toward creating the life you want.",
  "You have the power to transform your thoughts and change your life.",
  "Every positive change starts with believing you deserve happiness.",
  "Your mental wellness is an investment in your future self.",
  "You are enough, you are worthy, and you are becoming even more amazing."
];

export function getRandomQuote(): string {
  const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
  return inspirationalQuotes[randomIndex];
}

// Generate AI-powered motivational quote based on user's mood and data
export async function generateAIMotivationalQuote(userProfile: {
  currentMood?: {
    valence: number;
    energy: number;
    focus: number;
    stress: number;
    sleep?: number;
  };
  onPeriod?: boolean;
  waterIntake?: number;
  timeOfDay?: string;
  gender?: string;
  age?: number;
  interests?: string[];
  quoteStyle?: string;
  favoriteAuthors?: string[];
  favoriteWriters?: string[];
  favoriteSportsFigures?: string[];
  favoriteMusicians?: string[];
  favoriteArtists?: string[];
  favoriteMovies?: string[];
  favoritePhilosophers?: string[];
  recentActivities?: string[];  // To detect what user has been doing
}): Promise<string> {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log('⚠️ OpenAI API key not found, using random quote');
      return getRandomQuote();
    }

    const { 
      currentMood, onPeriod, waterIntake, timeOfDay, gender, age, interests, quoteStyle, favoriteAuthors,
      favoriteWriters, favoriteSportsFigures, favoriteMusicians, favoriteArtists, favoriteMovies, favoritePhilosophers,
      recentActivities
    } = userProfile;
    
    // Create personalized prompt
    let prompt = `Generate ONE short, powerful motivational quote for someone with this profile:

`;

    // User demographics and preferences
    if (age) {
      prompt += `Age: ${age} years old (ADJUST QUOTE FOR THIS AGE GROUP!)\n`;
    }
    
    if (gender) {
      prompt += `Gender: ${gender} (CONSIDER GENDER-SPECIFIC MOTIVATION!)\n`;
    }

    if (interests && interests.length > 0) {
      prompt += `Interests: ${interests.join(', ')}\n`;
    }

    if (quoteStyle) {
      prompt += `Preferred quote style: ${quoteStyle}\n`;
    }

    if (favoriteAuthors && favoriteAuthors.length > 0) {
      prompt += `General favorite quote sources: ${favoriteAuthors.join(', ')}\n`;
    }
    
    // Activity-specific favorites
    if (favoriteWriters && favoriteWriters.length > 0) {
      prompt += `Favorite writers/authors: ${favoriteWriters.join(', ')} (use when user does reading)\n`;
    }
    
    if (favoriteSportsFigures && favoriteSportsFigures.length > 0) {
      prompt += `Favorite athletes: ${favoriteSportsFigures.join(', ')} (use when user does sports/gym)\n`;
    }
    
    if (favoriteMusicians && favoriteMusicians.length > 0) {
      prompt += `Favorite musicians: ${favoriteMusicians.join(', ')} (use when user does music)\n`;
    }
    
    if (favoriteArtists && favoriteArtists.length > 0) {
      prompt += `Favorite artists: ${favoriteArtists.join(', ')} (use when user does art)\n`;
    }
    
    if (favoriteMovies && favoriteMovies.length > 0) {
      prompt += `Favorite movies/TV shows: ${favoriteMovies.join(', ')} (use for entertainment/inspiration)\n`;
    }
    
    if (favoritePhilosophers && favoritePhilosophers.length > 0) {
      prompt += `Favorite philosophers: ${favoritePhilosophers.join(', ')} (use for deep thoughts)\n`;
    }
    
    // Recent activities
    if (recentActivities && recentActivities.length > 0) {
      prompt += `Recent activities: ${recentActivities.join(', ')}\n`;
      prompt += `IMPORTANT: Match activities to quote sources:
      - If user did "reading" → use quotes from their favorite writers
      - If user did "gym/football/running" → use quotes from their favorite athletes
      - If user did "music" → use quotes from their favorite musicians
      - If user did "art" → use quotes from their favorite artists
      - If user did "watching movies/TV" → use quotes from their favorite movies/shows\n`;
    }

    // Current mood and state
    if (currentMood) {
      prompt += `\nCurrent Mood: Happiness ${currentMood.valence}/10, Energy ${currentMood.energy}/10, Stress ${currentMood.stress}/10\n`;
      
      // Add context based on mood
      if (currentMood.stress > 7) {
        prompt += `Feeling quite stressed. `;
      }
      if (currentMood.energy < 4) {
        prompt += `Low energy. `;
      }
      if (currentMood.valence > 7) {
        prompt += `Feeling happy. `;
      }
    }

    if (onPeriod) {
      prompt += `Currently menstruating. `;
    }

    if (waterIntake !== undefined && waterIntake < 4) {
      prompt += `Dehydrated. `;
    }

    if (timeOfDay) {
      prompt += `Time: ${timeOfDay}. `;
    }

    prompt += `\n\nGenerate ONE motivational quote that:
- Matches their interests and preferences
- Is relevant to their current mood/situation
- Is short and powerful (max 20 words)
- Includes attribution if from a famous person
- Varies the source and style each time (avoid repetition!)

CRITICAL PERSONALIZATION RULES:
1. **Match Activity to Source:**
   - If recent activity = "reading" → Use quotes from their favoriteWriters
   - If recent activity = "gym/football/running" → Use quotes from their favoriteSportsFigures
   - If recent activity = "music" → Use quotes from their favoriteMusicians
   - If recent activity = "art" → Use quotes from their favoriteArtists
   - If recent activity = "watching movies/TV" → Use quotes from their favoriteMovies

2. **Use Their Specific Favorites:**
   - If they listed "Messi, Ronaldo" as athletes → MUST use quotes from Messi or Ronaldo
   - If they listed "Maya Angelou, Rumi" as writers → MUST use quotes from Maya Angelou or Rumi
   - If they listed "Bob Dylan" as musician → MUST use Bob Dylan quotes/lyrics
   - If they listed "Inception, Breaking Bad" as movies → MUST use quotes from those shows/movies
   - If they listed "Van Gogh, Frida Kahlo" as artists → MUST use quotes from those artists

3. **Interest-Based Matching:**
   - gym/sports interests → Athletic/competitive quotes
   - poetry/literature interests → Beautiful/poetic quotes
   - science interests → Logical/curiosity quotes
   - spirituality interests → Calm/mindful quotes
   - art interests → Creative/inspirational quotes
   - music interests → Rhythmic/emotional quotes

4. **Age and Gender Considerations:**
   - For younger users (teens/20s) → More energetic, future-focused quotes
   - For older users (40s+) → More wisdom-based, reflective quotes
   - Consider gender-specific motivation when appropriate

5. **ALWAYS prefer their specific favorites over generic famous people!**

6. **VARIETY AND RANDOMNESS RULES:**
   - NEVER repeat the same person/source in consecutive requests
   - If user has multiple favorites in a category, rotate between them randomly
   - Mix between different categories (writers, athletes, philosophers, etc.)
   - Sometimes create original quotes inspired by their favorites
   - Vary the quote style (short vs. longer, direct vs. metaphorical)
   - Consider different time periods (modern vs. historical figures)
   - **GENRE-BASED EXPANSION**: When user likes specific artists/writers, suggest similar ones in the same genre/vibe

7. **ANTI-REPETITION STRATEGY:**
   - If last quote was from Messi → next time use a different athlete or switch to writers/philosophers
   - Rotate through all their favorite categories over multiple requests
   - Mix real quotes with original inspirational content
   - Vary the emotional tone (motivational, reflective, energetic, calm)

8. **GENRE-BASED SUGGESTIONS:**
   - If user likes "Taylor Swift" → suggest similar pop artists (Ariana Grande, Olivia Rodrigo, Billie Eilish)
   - If user likes "Maya Angelou" → suggest similar poets (Langston Hughes, Rumi, Pablo Neruda)
   - If user likes "Messi" → suggest similar footballers (Neymar, Mbappé, Ronaldo) or other sports legends
   - If user likes "Frida Kahlo" → suggest similar artists (Georgia O'Keeffe, Diego Rivera, Vincent van Gogh)
   - If user likes "Marcus Aurelius" → suggest similar philosophers (Seneca, Epictetus, Stoic thinkers)
   - **EXPAND BEYOND THEIR EXACT FAVORITES** - suggest artists/writers in the same style, era, or genre

FORMAT:
If using a real quote: "Quote text" — Author Name
If creating original: Just the quote (no attribution)

Respond with ONLY the quote and attribution, nothing else.`;

    console.log('🎯 Generating AI motivational quote...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a motivational wellness coach. Generate short, powerful, uplifting quotes. CRITICAL: Always vary your sources and avoid repetition. Mix between different people, create original content, and rotate through all available categories."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 50,
        temperature: 1.2,
        seed: Math.floor(Math.random() * 1000000)
      })
    });

    if (!response.ok) {
      console.log('⚠️ OpenAI API failed, using random quote');
      return getRandomQuote();
    }

    const data = await response.json();
    const quote = data.choices?.[0]?.message?.content?.trim() || getRandomQuote();
    
    console.log('✅ AI generated quote:', quote);
    return quote;
    
  } catch (error) {
    console.error('Error generating AI quote:', error);
    return getRandomQuote();
  }
}
