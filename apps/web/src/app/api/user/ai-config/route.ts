export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import OpenAI from 'openai';

// GET - Get user's AI configuration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'dummy-user';
    
    // For demo purposes, return default configuration
    // In production, you would fetch from database
    const aiConfig = {
      openai: { isConnected: false, lastUsed: null },
      gemini: { isConnected: false, lastUsed: null },
      textcortex: { isConnected: false, lastUsed: null }
    };
    
    return NextResponse.json(aiConfig);
  } catch (error) {
    console.error('Error fetching AI config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI configuration' },
      { status: 500 }
    );
  }
}

// POST - Connect an AI service
export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json();
    
    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Missing provider or API key' },
        { status: 400 }
      );
    }
    
    console.log(`Testing ${provider} connection...`);
    
    // Test the API key by making a real request
    if (provider === 'openai') {
      try {
        const openai = new OpenAI({
          apiKey: apiKey
        });
        
        // Test the connection with a simple request
        const testResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: 'Hello, this is a connection test. Please respond with "Connection successful".'
            }
          ],
          max_tokens: 10
        });
        
        if (testResponse.choices[0]?.message?.content) {
          console.log('✅ OpenAI connection test successful');
          
          // Store the API key (in production, encrypt it first)
          // For demo, we'll store it in localStorage on the client side
          return NextResponse.json({
            success: true,
            message: `OpenAI connected successfully! Test response: ${testResponse.choices[0].message.content}`,
            provider,
            isConnected: true,
            testResponse: testResponse.choices[0].message.content
          });
        } else {
          return NextResponse.json(
            { error: 'OpenAI connection test failed - no response received' },
            { status: 400 }
          );
        }
      } catch (openaiError: any) {
        console.error('OpenAI connection test failed:', openaiError);
        
        if (openaiError.status === 401) {
          return NextResponse.json(
            { error: 'Invalid OpenAI API key. Please check your key and try again.' },
            { status: 401 }
          );
        } else if (openaiError.status === 429) {
          return NextResponse.json(
            { error: 'OpenAI API rate limit exceeded. Please try again later.' },
            { status: 429 }
          );
        } else {
          return NextResponse.json(
            { error: `OpenAI connection failed: ${openaiError.message}` },
            { status: 400 }
          );
        }
      }
    } else if (provider === 'gemini') {
      // TODO: Implement Gemini connection test
      return NextResponse.json(
        { error: 'Gemini connection not implemented yet' },
        { status: 501 }
      );
    } else if (provider === 'textcortex') {
      try {
        // Test TextCortex API connection
        const testResponse = await fetch('https://api.textcortex.com/v1/texts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: 'Hello, this is a connection test.',
            mode: 'rewrite',
            max_tokens: 50
          })
        });
        
        if (testResponse.ok) {
          const data = await testResponse.json();
          console.log('✅ TextCortex connection test successful');
          
          return NextResponse.json({
            success: true,
            message: `TextCortex connected successfully! Test response received.`,
            provider,
            isConnected: true,
            testResponse: 'Connection test successful'
          });
        } else {
          const errorText = await testResponse.text();
          console.error('TextCortex connection test failed:', errorText);
          
          if (testResponse.status === 401) {
            return NextResponse.json(
              { error: 'Invalid TextCortex API key. Please check your key and try again.' },
              { status: 401 }
            );
          } else if (testResponse.status === 429) {
            return NextResponse.json(
              { error: 'TextCortex API rate limit exceeded. Please try again later.' },
              { status: 429 }
            );
          } else {
            return NextResponse.json(
              { error: `TextCortex connection failed: ${testResponse.status} - ${errorText}` },
              { status: 400 }
            );
          }
        }
      } catch (textcortexError: any) {
        console.error('TextCortex connection test failed:', textcortexError);
        return NextResponse.json(
          { error: `TextCortex connection failed: ${textcortexError.message}` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Unknown AI provider' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error connecting AI service:', error);
    return NextResponse.json(
      { error: 'Failed to connect AI service' },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect an AI service
export async function DELETE(request: NextRequest) {
  try {
    const { provider } = await request.json();
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Missing provider' },
        { status: 400 }
      );
    }
    
    // For demo purposes, just return success
    // In production, you would:
    // 1. Remove the encrypted key from database
    // 2. Update user's AI configuration
    
    console.log(`Disconnecting ${provider} service...`);
    
    return NextResponse.json({
      success: true,
      message: `${provider} service disconnected successfully`,
      provider,
      isConnected: false
    });
  } catch (error) {
    console.error('Error disconnecting AI service:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect AI service' },
      { status: 500 }
    );
  }
}
