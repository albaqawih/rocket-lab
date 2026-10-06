import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { runFullCalculation } from '@/lib/engine/calculator';
import { RocketInputs } from '@/lib/engine/types';

interface SubmitRequest {
  student?: {
    name: string;
    className: string;
    school: string;
  };
  studentName?: string;
  className?: string;
  school?: string;
  inputs: RocketInputs;
  badges?: string[];
  experimentCount?: number;
  challengeAttempts?: number;
}

function validateInputs(inputs: RocketInputs): string | null {
  if (!inputs) return 'مدخلات الصاروخ مفقودة';
  if (inputs.rocketLengthCm < 30 || inputs.rocketLengthCm > 100)
    return 'طول الصاروخ خارج النطاق المسموح (30–100 سم)';
  if (inputs.bodyDiameterCm < 3 || inputs.bodyDiameterCm > 10)
    return 'قطر الجسم خارج النطاق (3–10 سم)';
  if (!['conical', 'rounded', 'ogive'].includes(inputs.noseShape))
    return 'شكل المقدمة غير صالح';
  if (inputs.noseLengthCm < 5 || inputs.noseLengthCm > 25)
    return 'طول المقدمة خارج النطاق (5–25 سم)';
  if (![3, 4].includes(inputs.numberOfFins))
    return 'عدد الزعانف يجب أن يكون 3 أو 4';
  if (inputs.finHeightCm < 2 || inputs.finHeightCm > 10)
    return 'ارتفاع الزعنفة خارج النطاق (2–10 سم)';
  if (inputs.finBaseLengthCm < 3 || inputs.finBaseLengthCm > 15)
    return 'طول قاعدة الزعنفة خارج النطاق (3–15 سم)';
  if (!['low', 'medium', 'high'].includes(inputs.finPosition))
    return 'موضع الزعانف غير صالح';
  if (inputs.massG < 100 || inputs.massG > 1000)
    return 'الكتلة خارج النطاق (100–1000 غرام)';
  if (!['front', 'balanced', 'rear'].includes(inputs.massDistribution))
    return 'توزيع الكتلة غير صالح';
  return null;
}

export async function POST(req: NextRequest) {
  let body: SubmitRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON غير صالح' }, { status: 400 });
  }

  const name = body.student?.name || body.studentName || '';
  const className = body.student?.className || body.className || '';
  const school = body.student?.school || body.school || '';
  const inputs = body.inputs;
  const badges = body.badges || [];
  const experimentCount = body.experimentCount || 0;
  const challengeAttempts = body.challengeAttempts || 0;

  if (!name || !className || !school) {
    return NextResponse.json({ error: 'بيانات الطالب ناقصة' }, { status: 400 });
  }

  // Validate inputs server-side
  const validationError = validateInputs(inputs);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 422 });
  }

  // Recalculate score server-side — client cannot forge this
  const result = runFullCalculation(inputs);
  const serverScore = result.score.total;
  const stabilityScore = result.score.stabilityScore;

  const leaderboardScope =
    process.env.LEADERBOARD_SCOPE === 'class'
      ? `${school}::${className}`
      : school;

  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({
      success: true,
      serverScore,
      rank: 1,
      message: 'تم احتساب النتيجة بنجاح في الوضع التجريبي.',
    });
  }

  try {
    const { data, error } = await supabaseServer.rpc('upsert_leaderboard_score', {
      p_student_name: name,
      p_class_name: className,
      p_school: school,
      p_best_score: serverScore,
      p_stability_score: stabilityScore,
      p_challenge_attempts: challengeAttempts,
      p_experiment_count: experimentCount,
      p_badges: badges,
      p_school_scope: leaderboardScope,
    });

    if (error) throw error;

    // Get student's current rank
    const { data: rankData } = await supabaseServer
      .from('leaderboard')
      .select('id, student_name, best_score')
      .eq('school_scope', leaderboardScope)
      .order('best_score', { ascending: false })
      .order('stability_score', { ascending: false })
      .order('challenge_attempts', { ascending: true })
      .order('achieved_at', { ascending: true });

    let rank = 1;
    if (rankData) {
      const idx = rankData.findIndex(
        (r: { student_name: string }) => r.student_name === name
      );
      rank = idx !== -1 ? idx + 1 : rankData.length + 1;
    }

    return NextResponse.json({
      success: true,
      serverScore,
      rank,
      updated: Array.isArray(data) && data[0]?.updated,
      currentBestScore: Array.isArray(data) ? data[0]?.current_best_score : serverScore,
    });
  } catch (err) {
    console.error('[leaderboard/submit]', err);
    return NextResponse.json({
      success: false,
      serverScore,
      error: 'تعذّر تحديث اللوحة، لكن نتيجتك محسوبة بنجاح.',
    });
  }
}
