export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, type, context } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log('🤖 AI Service - Processing prompt:', {
      type: type || 'general',
      context: context || 'unknown',
      promptLength: prompt.length
    });

    // Check for OpenAI API key (from client request or server environment)
    // Server env var takes priority for global access
    const clientApiKey = body.apiKey;
    const apiKey = clientApiKey || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log('❌ OpenAI API key not found');
      return NextResponse.json({ 
        error: 'AI service unavailable - no API key configured',
        response: 'AI service is currently unavailable. Please check your configuration.'
      }, { status: 500 });
    }

    try {
      console.log('📤 Sending request to OpenAI API...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: "You are a clinical psychologist and behavioral analyst. Provide deep, analytical psychological insights based on behavioral data. Be profound, insightful, and clinically informed. Avoid generic advice and focus on underlying psychological mechanisms.\n\nCRITICAL FORMATTING RULES:\n- Return ONLY clean HTML code - NO markdown, NO code blocks, NO ```html\n- Start directly with <h3> or <p> tags\n- Use <h3> for main sections, <h4> for subsections, <p> for paragraphs, <ul> and <li> for lists, and <strong> for emphasis\n- Keep response under 500 words maximum\n- Focus on the most critical insights only\n- Be concise and impactful\n\nDO NOT use markdown syntax like ```html or ``` - return pure HTML only."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 600,
          temperature: 0.7,
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
      
      const aiResponse = data.choices?.[0]?.message?.content || 'No response generated';
      
      return NextResponse.json({
        success: true,
        response: aiResponse,
        type: type || 'general',
        context: context || 'unknown',
        timestamp: new Date().toISOString()
      });

    } catch (aiError) {
      console.error('❌ AI service error:', aiError);
      
      // Return fallback response
      const fallbackResponse = `**AI SERVICE UNAVAILABLE**

The AI analysis service is currently experiencing technical difficulties. 

**FALLBACK ANALYSIS:**
Based on the behavioral data provided, this appears to be a mixed behavioral profile requiring further analysis when the AI service is restored.

**RECOMMENDATION:** 
Please try again later or contact support if the issue persists.`;

      return NextResponse.json({
        success: true,
        response: fallbackResponse,
        isFallback: true,
        error: aiError instanceof Error ? aiError.message : 'Unknown AI service error',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Error in AI service:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      response: 'AI service encountered an error. Please try again.',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
