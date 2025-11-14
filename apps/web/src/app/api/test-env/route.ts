export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check server-side env vars for each AI service
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const textcortexKey = process.env.TEXTCORTEX_API_KEY;
    
    return NextResponse.json({ 
      openai: {
        hasApiKey: !!openaiKey,
        apiKeyLength: openaiKey ? openaiKey.length : 0,
        apiKeyPrefix: openaiKey ? openaiKey.substring(0, 10) + '...' : 'Not found'
      },
      gemini: {
        hasApiKey: !!geminiKey,
        apiKeyLength: geminiKey ? geminiKey.length : 0,
        apiKeyPrefix: geminiKey ? geminiKey.substring(0, 10) + '...' : 'Not found'
      },
      textcortex: {
        hasApiKey: !!textcortexKey,
        apiKeyLength: textcortexKey ? textcortexKey.length : 0,
        apiKeyPrefix: textcortexKey ? textcortexKey.substring(0, 10) + '...' : 'Not found'
      }
    });
    
  } catch (error) {
    console.error('Error checking environment:', error);
    return NextResponse.json({ 
      error: 'Failed to check environment',
      openai: { hasApiKey: false },
      gemini: { hasApiKey: false },
      textcortex: { hasApiKey: false }
    });
  }
}
