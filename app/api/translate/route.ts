import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { word } = await request.json()

    if (!word) {
      return NextResponse.json({ error: 'Word is required' }, { status: 400 })
    }

    // Call OpenRouter API using a reliable free model
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://stackblitz.com',
        'X-Title': 'FullStack 101 App',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-3b-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate the given English word or phrase into Traditional Chinese (Taiwan/Hong Kong standard). Return ONLY the translation, with no extra text, markdown formatting, or punctuation.'
          },
          {
            role: 'user',
            content: word
          }
        ],
      }),
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message || 'OpenRouter error')
    }

    const translation = data.choices?.[0]?.message?.content?.trim() || ''

    return NextResponse.json({ english: word, translation })
  } catch (error: any) {
    console.error('OpenRouter API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}