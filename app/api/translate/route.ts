import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Job description text is required' },
        { status: 400 }
      );
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!openRouterApiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured in environment variables' },
        { status: 500 }
      );
    }

    // Comprehensive HR Framework System Instructions
    const systemPrompt = `
You are an HR and talent acquisition specialist specializing in skills-based hiring.
Your task is to enhance a job advertisement by incorporating relevant soft skills requirements.

Instructions:
1. Preserve all existing job responsibilities, qualifications, requirements, and wording wherever possible.
2. Do not rewrite the entire job advertisement.
3. Do not add all soft skills.
4. Select only the top 3 most relevant soft skills based on the actual job duties and work environment from the Available Soft Skills Framework.
5. Add the selected soft skills naturally as additional requirements.
6. Keep the wording concise, practical, and suitable for recruitment advertisements.
7. Avoid generic corporate language or training terminology.
8. The soft skills should read like real hiring requirements rather than a separate competency framework.
9. Use Traditional Chinese (Hong Kong) for all generated content and explanations.
10. After revising the job advertisement, provide a brief explanation.

Available Soft Skills Framework:
- 成長心態 (Growth Mindset): 我可以學習和進步
- 堅持不懈 (Persistence): 我不會輕易放棄
- 個人責任 (Personal Responsibility): 我為自己的行為負責
- 未來導向 (Future Orientation): 我為未來訂立目標
- 應變能力 (Adaptability): 即使在忙碌且不斷變化的環境中，我也能根據每種情況調整我的行動
- 積極主動 (Proactiveness): 我主動承擔工作，預測情況並預先採取必要行動
- 團隊合作 (Teamwork): 我知道如何向同事尋求幫助，也願意提供協助，共同達成目標
- 同理心 (Empathy): 我會考慮別人的感受，並以同理心行事
- 溝通能力 (Communication): 我能有效了解他人需求並清晰表達資訊及解決方案

Role Priority Guidelines:
- For frontline service, healthcare, elderly care, hospitality, retail, customer service, and education: Prioritize 同理心, 個人責任, 團隊合作
- For administrative and project coordination: Prioritize 個人責任, 溝通能力, 積極主動
- For supervisor and managerial: Prioritize 溝通能力, 應變能力, 積極主動
- For sales and business development: Prioritize 溝通能力, 積極主動, 堅持不懈

Strict Output Format:
Revised Job Advertisement
[Provide the complete revised job advertisement with the additional soft skills requirements incorporated.]

Soft Skills Selected
- [Soft Skill 1]: [Why it is relevant]
- [Soft Skill 2]: [Why it is relevant]
- [Soft Skill 3]: [Why it is relevant]
`;

    // 1. Call OpenRouter API
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here is the job advertisement to analyze and enhance:\n\n${text}` },
        ],
        temperature: 0.3,
      }),
    });

    const aiData = await aiResponse.json();

    if (!aiResponse.ok) {
      console.error('OpenRouter Error details:', aiData);
      throw new Error(aiData.error?.message || 'Failed to analyze job description with AI');
    }

    const aiResultText = aiData.choices[0]?.message?.content || 'No response from AI.';

    // 2. Save full result to Supabase database
    // 2. Save full result to Supabase database
    let savedToDb = false;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase keys missing in environment variables. Database save skipped.');
    } else {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { data: dbData, error: dbError } = await supabase
          .from('items') // Your table name
          .insert([
            { 
              title: text.substring(0, 100),       // Stores the first 100 chars of the job ad
              translation: aiResultText            // Stores the complete AI response
            }
          ]);

        if (dbError) {
          console.error('Supabase DB Insert Error:', dbError);
        } else {
          savedToDb = true;
        }
      } catch (dbErr) {
        console.error('Supabase connection or execution error:', dbErr);
      }
    }

    return NextResponse.json({
      result: aiResultText,
      saved: savedToDb,
    });

  } catch (error: any) {
    console.error('API Route Catch Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}