export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check server-side env var for global access
    const apiKey = process.env.OPENAI_API_KEY;
    
    return NextResponse.json({ 
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'Not found'
    });
    
  } catch (error) {
    console.error('Error checking environment:', error);
    return NextResponse.json({ 
      error: 'Failed to check environment',
      hasApiKey: false
    });
  }
}
