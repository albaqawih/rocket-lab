import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const school = searchParams.get('school') || '';
  const className = searchParams.get('class') || '';

  const leaderboardScope =
    process.env.LEADERBOARD_SCOPE === 'class'
      ? `${school}::${className}`
      : school;

  if (!leaderboardScope) {
    return NextResponse.json({ entries: [] });
  }

  const { data, error } = await supabaseBrowser
    .from('leaderboard')
    .select(
      'id, student_name, class_name, school, best_score, stability_score, experiment_count, challenge_attempts, badges, achieved_at'
    )
    .eq('school_scope', leaderboardScope)
    .order('best_score', { ascending: false })
    .order('stability_score', { ascending: false })
    .order('challenge_attempts', { ascending: true })
    .order('achieved_at', { ascending: true })
    .limit(50);

  if (error) {
    return NextResponse.json({ entries: [], error: error.message }, { status: 500 });
  }

  const entries = (data || []).map((row: {
    id: string;
    student_name: string;
    class_name: string;
    school: string;
    best_score: number;
    stability_score: number;
    experiment_count: number;
    challenge_attempts: number;
    badges: string[];
    achieved_at: string;
  }, i: number) => ({
    id: row.id,
    studentName: row.student_name,
    className: row.class_name,
    school: row.school,
    bestScore: row.best_score,
    stabilityScore: row.stability_score,
    experimentCount: row.experiment_count,
    challengeAttempts: row.challenge_attempts,
    badges: row.badges || [],
    achievedAt: row.achieved_at,
    rank: i + 1,
  }));

  return NextResponse.json({ entries });
}
