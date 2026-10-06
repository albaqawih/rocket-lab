'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/ui/Navigation';
import { getSession } from '@/lib/storage/localStorage';
import { LeaderboardEntry } from '@/lib/engine/types';

export default function LeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'school' | 'all'>('school');
  const [studentSchool, setStudentSchool] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLeaderboard = useCallback(async (currentScope: string, schoolName?: string) => {
    setLoading(true);
    try {
      const url = `/api/leaderboard?scope=${currentScope}${
        currentScope === 'school' && schoolName ? `&school=${encodeURIComponent(schoolName)}` : ''
      }`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      } else {
        setEntries(getMockLeaderboard());
      }
    } catch {
      setEntries(getMockLeaderboard());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const session = getSession();
    if (!session?.student) {
      router.push('/register');
      return;
    }
    setStudentSchool(session.student.school);
    fetchLeaderboard(scope, session.student.school);
  }, [router, scope, fetchLeaderboard]);

  const handleScopeChange = (newScope: 'school' | 'all') => {
    setScope(newScope);
    fetchLeaderboard(newScope, studentSchool);
  };

  const handleSubmitScore = async () => {
    const session = getSession();
    if (!session?.student || session.designs.length === 0) {
      setSubmitMessage({ type: 'error', text: 'لا يوجد لديك تصاميم مسجلة لإرسالها. قم بتصميم صاروخ في المختبر أولاً.' });
      return;
    }

    const bestDesign = [...session.designs].sort((a, b) => b.score.total - a.score.total)[0];

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: session.student.name,
          className: session.student.className,
          school: session.student.school,
          inputs: bestDesign.inputs,
          challengeAttempts: session.challengeAttempts || 0,
          experimentCount: session.experiments?.length || 0,
          badges: session.badges || [],
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitMessage({
          type: 'success',
          text: `🎉 تم تحديث النتيجة بنجاح! ترتيبك الحالي هو المركز #${data.rank || 1}`,
        });
        fetchLeaderboard(scope, studentSchool);
      } else {
        setSubmitMessage({
          type: 'error',
          text: data.error || 'حدث خطأ أثناء الاتصال بلوحة المهندسين.',
        });
      }
    } catch {
      setSubmitMessage({
        type: 'error',
        text: 'تعذر الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const top1 = entries[0];
  const top2 = entries[1];
  const top3 = entries[2];

  return (
    <div className="min-h-screen bg-space-950 text-white flex flex-col dir-rtl">
      <Navigation />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="glass-card p-6 md:p-8 relative overflow-hidden text-center sm:text-right">
          <div className="absolute -left-10 -bottom-10 text-9xl opacity-10 pointer-events-none">🏆</div>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3">
            التنافس العلمي الشريف
          </div>
          <h1 className="text-3xl font-black text-white mb-2">🏆 لوحة مهندسي الفضاء</h1>
          <p className="text-white/70 max-w-2xl text-sm leading-relaxed">
            تنافس مع زملائك المهندسين على تحقيق أفضل استقرار وأعلى نتيجة في تصميم الصواريخ الفضائية!
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
            <div className="flex bg-space-900 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => handleScopeChange('school')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  scope === 'school' ? 'bg-amber-500 text-space-950 shadow' : 'text-white/70 hover:text-white'
                }`}
              >
                🏫 مدرستي ({studentSchool || 'المدرسة'})
              </button>
              <button
                onClick={() => handleScopeChange('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  scope === 'all' ? 'bg-amber-500 text-space-950 shadow' : 'text-white/70 hover:text-white'
                }`}
              >
                🌐 جميع المدارس
              </button>
            </div>

            <button
              onClick={handleSubmitScore}
              disabled={submitting}
              className="gradient-btn px-6 py-2.5 rounded-xl font-bold text-space-950 text-sm flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
            >
              <span>🚀</span>
              <span>{submitting ? 'جاري الإرسال...' : 'إرسال أعلى نتيجة لي للوحة'}</span>
            </button>
          </div>

          {submitMessage && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs font-bold ${
                submitMessage.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {submitMessage.text}
            </div>
          )}
        </div>

        {/* Podium Top 3 */}
        {entries.length >= 1 && (
          <div className="grid grid-cols-3 gap-3 md:gap-6 items-end pt-8 pb-4 max-w-3xl mx-auto">
            {/* Rank 2 - Silver */}
            <div className="flex flex-col items-center">
              {top2 ? (
                <div className="glass-card p-4 w-full text-center border-slate-300/40 bg-slate-500/10 space-y-2">
                  <div className="text-4xl">🥈</div>
                  <div className="font-bold text-xs sm:text-sm truncate">{top2.studentName}</div>
                  <div className="text-[10px] text-white/60 truncate">{top2.school}</div>
                  <div className="font-black font-mono text-cyan-300 text-lg sm:text-xl">{top2.bestScore}</div>
                </div>
              ) : (
                <div className="h-24 w-full bg-space-900/40 rounded-2xl border border-white/5" />
              )}
              <div className="w-full bg-slate-400/20 h-20 rounded-b-2xl border-t border-slate-400/40 flex items-center justify-center font-black text-slate-300">
                #2
              </div>
            </div>

            {/* Rank 1 - Gold */}
            <div className="flex flex-col items-center -mt-6">
              {top1 ? (
                <div className="glass-card p-5 w-full text-center border-amber-400/60 bg-amber-500/20 space-y-2 shadow-xl shadow-amber-500/10">
                  <div className="text-5xl animate-pulse">🥇</div>
                  <div className="font-black text-sm sm:text-base text-amber-300 truncate">{top1.studentName}</div>
                  <div className="text-xs text-amber-200/70 truncate">{top1.school}</div>
                  <div className="font-black font-mono text-amber-400 text-2xl sm:text-3xl">{top1.bestScore}</div>
                </div>
              ) : (
                <div className="h-32 w-full bg-space-900/40 rounded-2xl border border-white/5" />
              )}
              <div className="w-full bg-amber-500/30 h-28 rounded-b-2xl border-t border-amber-400/60 flex items-center justify-center font-black text-amber-300 text-xl">
                #1
              </div>
            </div>

            {/* Rank 3 - Bronze */}
            <div className="flex flex-col items-center">
              {top3 ? (
                <div className="glass-card p-4 w-full text-center border-amber-700/40 bg-amber-900/10 space-y-2">
                  <div className="text-4xl">🥉</div>
                  <div className="font-bold text-xs sm:text-sm truncate">{top3.studentName}</div>
                  <div className="text-[10px] text-white/60 truncate">{top3.school}</div>
                  <div className="font-black font-mono text-amber-500 text-lg sm:text-xl">{top3.bestScore}</div>
                </div>
              ) : (
                <div className="h-20 w-full bg-space-900/40 rounded-2xl border border-white/5" />
              )}
              <div className="w-full bg-amber-700/20 h-16 rounded-b-2xl border-t border-amber-700/40 flex items-center justify-center font-black text-amber-600">
                #3
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/10 font-bold text-sm flex items-center justify-between">
            <span>جدول الترتيب العام</span>
            <span className="text-xs text-white/50">{entries.length} مهندسين مصنفين</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-white/60 animate-pulse">جاري تحميل لوحة المهندسين...</div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-white/60">لا توجد نتائج مسجلة حتى الآن. كن أول من يرسل نتيجته!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-space-900/80 text-white/60 text-xs border-b border-white/10">
                  <tr>
                    <th className="p-3">الترتيب</th>
                    <th className="p-3">الاسم</th>
                    <th className="p-3">الصف</th>
                    <th className="p-3">المدرسة</th>
                    <th className="p-3 font-mono">النتيجة</th>
                    <th className="p-3 font-mono">الاستقرار</th>
                    <th className="p-3">الأوسمة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {entries.map((entry, idx) => (
                    <tr key={entry.id || idx} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-bold font-mono text-cyan-400">#{idx + 1}</td>
                      <td className="p-3 font-bold text-white">{entry.studentName}</td>
                      <td className="p-3 text-white/70">{entry.className}</td>
                      <td className="p-3 text-white/70">{entry.school}</td>
                      <td className="p-3 font-black font-mono text-amber-400 text-base">{entry.bestScore}</td>
                      <td className="p-3 font-mono text-emerald-300">{entry.stabilityScore} pts</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {entry.badges?.map((b, i) => (
                            <span key={i} className="text-xs" title={b}>
                              🏅
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function getMockLeaderboard(): LeaderboardEntry[] {
  return [
    {
      id: '1',
      studentName: 'أحمد الغامدي',
      className: 'الثاني متوسط (أ)',
      school: 'مدرسة المستقبل المتميزة',
      bestScore: 95,
      stabilityScore: 40,
      challengeAttempts: 1,
      experimentCount: 3,
      badges: ['beginner-engineer', 'space-engineer', 'young-scientist'],
      achievedAt: new Date().toISOString(),
      schoolScope: 'مدرسة المستقبل المتميزة',
    },
    {
      id: '2',
      studentName: 'سارة الشهري',
      className: 'الثاني متوسط (ب)',
      school: 'مدرسة المستقبل المتميزة',
      bestScore: 91,
      stabilityScore: 38,
      challengeAttempts: 2,
      experimentCount: 2,
      badges: ['beginner-engineer', 'stability-researcher'],
      achievedAt: new Date().toISOString(),
      schoolScope: 'مدرسة المستقبل المتميزة',
    },
    {
      id: '3',
      studentName: 'عمر القحطاني',
      className: 'الثالث متوسط (أ)',
      school: 'مدرسة الموهوبين العلمية',
      bestScore: 87,
      stabilityScore: 36,
      challengeAttempts: 3,
      experimentCount: 4,
      badges: ['beginner-engineer', 'fin-expert'],
      achievedAt: new Date().toISOString(),
      schoolScope: 'مدرسة الموهوبين العلمية',
    },
  ];
}
