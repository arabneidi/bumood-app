export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    console.log('🧪 Testing OpenAI connection...');
    console.log('🔑 API Key available:', !!apiKey);
    console.log('🔑 API Key length:', apiKey?.length || 0);
    console.log('🔑 API Key preview:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : 'NONE');
    
    if (!apiKey) {
      return NextResponse.json({ 
        success: false,
        error: 'No OpenAI API key found in environment variables',
        apiKeyAvailable: false
      }, { status: 500 });
    }

    // Simple test call to OpenAI
    console.log('📡 Making test API call to OpenAI...');
    const startTime = Date.now();
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, OpenAI connection works!" and nothing else.'
          }
        ],
        max_tokens: 50,
      })
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️ OpenAI response received in ${duration}ms`);
    console.log('📊 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      return NextResponse.json({ 
        success: false,
        error: `OpenAI API error: ${response.status} ${response.statusText}`,
        errorDetails: errorText,
        apiKeyAvailable: true,
        responseStatus: response.status
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ OpenAI response data:', JSON.stringify(data, null, 2));
    
    const message = data.choices?.[0]?.message?.content;
    
    return NextResponse.json({ 
      success: true,
      message: message || 'No message in response',
      fullResponse: data,
      duration: `${duration}ms`,
      apiKeyAvailable: true
    });
    
  } catch (error) {
    console.error('❌ Error testing OpenAI connection:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined
    }, { status: 500 });
  }
}

