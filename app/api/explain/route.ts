import { NextRequest, NextResponse } from 'next/server';
import { AIInputContract } from '@/lib/engine/types';
import { buildFallbackExplanation } from '@/lib/ai/fallback';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `أنت المساعد التعليمي العربي "مهندس الفضاء الذكي".

لقد أنجزت التطبيق جميع الحسابات بالفعل.

لا تقم أبدًا بما يلي:
- إعادة حساب أي قيمة
- تعديل أي قيمة أو نتيجة
- اختراع قياسات جديدة
- التناقض مع محرك الحساب
- الادعاء بأن التصميم آمن للإطلاق الحقيقي

اشرح فقط البيانات المقدمة باللغة العربية الواضحة المناسبة لطالب في المرحلة المتوسطة.
شجّع التفكير العلمي بسؤال الطالب عن توقعه قبل تغيير متغير واحد في المحاكاة.
أقصى 150 كلمة عربية.
لا تستخدم جداول markdown.
لا تذكر أرقامًا جديدة غير موجودة في البيانات المقدمة.`;

export async function POST(req: NextRequest) {
  let data: AIInputContract;
  
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free';

  // If no API key configured, use fallback immediately
  if (!apiKey) {
    const fallback = buildFallbackExplanation(data);
    return NextResponse.json(fallback);
  }

  try {
    const userMessage = `
معلومات الطالب: ${data.student.name} — ${data.student.className} — ${data.student.school}

مقاييس المحاكاة:
- نسبة الطول إلى القطر (L/D): ${data.metrics.length_diameter_ratio}
- نسبة الزعانف: ${data.metrics.fin_ratio_percent.toFixed(1)}%
- مركز الكتلة (CG): ${data.metrics.cg_cm} سم من رأس الصاروخ
- مركز الضغط (CP): ${data.metrics.cp_cm} سم من رأس الصاروخ
- مؤشر الاستقرار: ${data.metrics.stability_indicator}

النتيجة الإجمالية: ${data.score.total}/100 (${data.score.classification})

نقاط القوة: ${data.strengths.join(' | ')}
نقاط الضعف: ${data.weaknesses.join(' | ')}

اشرح هذه النتائج للطالب واطرح سؤالًا واحدًا يشجعه على التجربة.
تذكر: هذه محاكاة تعليمية مبسطة فقط.
`.trim();

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'ثورة الصواريخ — مختبر الصاروخ الذكي',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const json = await response.json();
    const text = json?.choices?.[0]?.message?.content;

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      throw new Error('Invalid AI response');
    }

    return NextResponse.json({ text: text.trim(), isFallback: false });
  } catch (err) {
    console.error('[AI explain] Falling back to deterministic explanation:', err);
    const fallback = buildFallbackExplanation(data);
    return NextResponse.json(fallback);
  }
}
