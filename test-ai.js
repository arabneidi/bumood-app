// Test script to verify GPT-4o-mini connection
import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config();

async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No OpenAI API key found');
    return;
  }

  console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');
  
  try {
    console.log('📤 Testing GPT-4o-mini connection...');
    
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
            content: "You are a test assistant. Respond with a simple JSON object containing a test message."
          },
          {
            role: "user",
            content: "Generate a simple wellness suggestion for someone who is 37 years old and likes pop music. Respond in JSON format with title, description, and action fields."
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Success! GPT-4o-mini response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Test age-appropriate music suggestion
    if (data.choices && data.choices[0]) {
      console.log('\n🎵 Generated suggestion:');
      console.log(data.choices[0].message.content);
    }
    
  } catch (error) {
    console.error('❌ Error testing OpenAI:', error.message);
  }
}

testOpenAI();
