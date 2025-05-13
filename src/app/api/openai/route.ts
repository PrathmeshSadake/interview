import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request. Messages array is required.' },
        { status: 400 }
      );
    }

    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4', // Use GPT-4 for better interview questions
        messages,
        max_tokens: 100, // Reduced from 300 to encourage shorter responses
        temperature: 0.6, // Slightly lower for more consistent, focused responses
        presence_penalty: 0.1, // Slight penalty to discourage repetition
        frequency_penalty: 0.2 // Discourage repeating the same words/phrases
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: `OpenAI API error: ${errorData.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ response: data });
    
  } catch (error) {
    console.error('Error processing OpenAI request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 