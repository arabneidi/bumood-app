import { NextRequest, NextResponse } from 'next/server';
import { generateAISuggestions, UserMoodProfile } from '@/lib/aiService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile = body as UserMoodProfile;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured on server' }, { status: 500 });
    }

    const suggestions = await generateAISuggestions(profile);
    return NextResponse.json({ suggestions });
  } catch (err: any) {
    console.error('AI suggestions API error:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Failed to generate suggestions' }, { status: 500 });
  }
}


