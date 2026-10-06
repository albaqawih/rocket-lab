'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/ui/Navigation';
import RocketSVG from '@/components/rocket/RocketSVG';
import { getSession } from '@/lib/storage/localStorage';
import { SessionData, RocketDesign } from '@/lib/engine/types';

export default function SummaryPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [bestDesign, setBestDesign] = useState<RocketDesign | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s?.student) {
      router.push('/register');
      return;
    }
    setSession(s);

    if (s.designs.length > 0) {
      const sorted = [...s.designs].sort((a, b) => b.score.total - a.score.total);
      setBestDesign(sorted[0]);
    }
  }, [router]);

  if (!session?.student) return null;

  const { student, bestScore, badges, experiments, challengeAttempts, challengeCompleted } = session;

  return (
    <div className="min-h-screen bg-space-950 text-white flex flex-col dir-rtl">
      <Navigation />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Profile Card Header */}
        <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 text-center md:text-right">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              بطاقة المهندس الرقمية
            </div>
            <h1 className="text-3xl font-black text-white">{student.name}</h1>
            <p className="text-sm text-white/70">
              الصف: <span className="text-cyan-300 font-bold">{student.className}</span> | المدرسة:{' '}
              <span className="text-cyan-300 font-bold">{student.school}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 justify-center">
            <div className="glass-card px-5 py-3 text-center border-amber-500/30 bg-amber-500/10">
              <div className="text-xs text-amber-200">أعلى نتيجة</div>
              <div className="text-3xl font-black text-amber-400 font-mono">{bestScore} / 100</div>
            </div>

            <div className="glass-card px-5 py-3 text-center border-indigo-500/30 bg-indigo-500/10">
              <div className="text-xs text-indigo-200">الأوسمة المكتسبة</div>
              <div className="text-3xl font-black text-indigo-300 font-mono">{badges.length} / 6</div>
            </div>

            <div className="glass-card px-5 py-3 text-center border-cyan-500/30 bg-cyan-500/10">
              <div className="text-xs text-cyan-200">التجارب المنجزة</div>
              <div className="text-3xl font-black text-cyan-300 font-mono">{experiments.length}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons Header */}
        <div className="flex flex-wrap gap-4 justify-between items-center bg-space-900/60 p-4 rounded-2xl border border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📋</span> ملخص رحلتك التعليمية
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/report')}
              className="gradient-btn px-5 py-2.5 rounded-xl font-bold text-space-950 text-sm flex items-center gap-2"
            >
              <span>📄</span>
              <span>عرض وتقويم تقرير المعلم</span>
            </button>
            <button
              onClick={() => router.push('/leaderboard')}
              className="glass-card border border-white/20 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-white/10"
            >
              🏆 لوحة المهندسين
            </button>
          </div>
        </div>

        {/* Best Design Showcase */}
        {bestDesign ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center glass-card p-6">
            <div className="lg:col-span-5 flex flex-col items-center">
              <span className="text-xs font-bold text-amber-400 mb-2">أفضل صاروخ مصمم</span>
              <RocketSVG
                inputs={bestDesign.inputs}
                cgCm={bestDesign.metrics.cgCm}
                cpCm={bestDesign.metrics.cpCm}
                rocketLengthCm={bestDesign.inputs.rocketLengthCm}
              />
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-xl font-bold">مواصفات الصاروخ الأفضل</h3>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full font-black text-sm">
                  النتيجة: {bestDesign.score.total} / 100
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-space-900/80 p-3 rounded-xl border border-white/10">
                  <div className="text-white/60">طول الصاروخ</div>
                  <div className="font-bold text-sm text-cyan-300 mt-1">{bestDesign.inputs.rocketLengthCm} cm</div>
                </div>
                <div className="bg-space-900/80 p-3 rounded-xl border border-white/10">
                  <div className="text-white/60">قطر الهيكل</div>
                  <div className="font-bold text-sm text-cyan-300 mt-1">{bestDesign.inputs.bodyDiameterCm} cm</div>
                </div>
                <div className="bg-space-900/80 p-3 rounded-xl border border-white/10">
                  <div className="text-white/60">نسبة L/D</div>
                  <div className="font-bold text-sm text-cyan-300 mt-1">
                    {bestDesign.metrics.lengthDiameterRatio.toFixed(1)} ({bestDesign.metrics.ldClassification})
                  </div>
                </div>
                <div className="bg-space-900/80 p-3 rounded-xl border border-white/10">
                  <div className="text-white/60">مؤشر الاستقرار</div>
                  <div className="font-bold text-sm text-emerald-300 mt-1">
                    {bestDesign.metrics.stabilityIndicator.toFixed(2)} cal
                  </div>
                </div>
                <div className="bg-space-900/80 p-3 rounded-xl border border-white/10">
                  <div className="text-white/60">نسبة مساحة الزعانف</div>
                  <div className="font-bold text-sm text-indigo-300 mt-1">
                    {bestDesign.metrics.finRatioPercent.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-space-900/80 p-3 rounded-xl border border-white/10">
                  <div className="text-white/60">شكل المقدمة</div>
                  <div className="font-bold text-sm text-cyan-300 mt-1">{bestDesign.inputs.noseShape}</div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-emerald-400">نقاط القوة في هذا التصميم:</h4>
                <ul className="text-xs text-white/80 space-y-1 list-disc list-inside">
                  {bestDesign.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-8 text-center space-y-4">
            <div className="text-5xl">🚀</div>
            <h3 className="text-lg font-bold">لم تقم بتصميم أي صاروخ بعد</h3>
            <p className="text-xs text-white/60">توجه إلى مختبر التصميم لبدء أول مهمة فضائية لك!</p>
            <button
              onClick={() => router.push('/lab')}
              className="gradient-btn px-6 py-2.5 rounded-xl font-bold text-space-950 text-sm inline-block"
            >
              🔧 الذهاب لمختبر التصميم
            </button>
          </div>
        )}

        {/* Challenge & Experiment Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span>🎯</span> حالة التحدي النهائي
            </h3>
            <div className="flex items-center justify-between p-4 bg-space-900 rounded-2xl border border-white/10">
              <div>
                <div className="text-xs text-white/60">عدد المحاولات المستهلكة</div>
                <div className="text-2xl font-black text-cyan-400 font-mono mt-1">{challengeAttempts} / 5</div>
              </div>
              <div>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    challengeCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {challengeCompleted ? '✅ مكتمل بنجاح' : '⏳ قيد المحاولة'}
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push('/challenge')}
              className="w-full glass-card border border-white/20 py-2.5 rounded-xl font-bold text-xs hover:bg-white/10"
            >
              خوض التحدي النهائي الان
            </button>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span>🔬</span> سجل التجارب العلمية
            </h3>
            {experiments.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                {experiments.map((e, idx) => (
                  <div key={e.id} className="bg-space-900/80 p-3 rounded-xl border border-white/10 text-xs">
                    <div className="font-bold text-cyan-300 mb-1">
                      تجربة #{idx + 1}: المتغيّر ({e.changedVariable})
                    </div>
                    <div className="text-white/70 truncate">{e.observation || 'لم تسجل ملاحظات'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-white/50 text-center py-4">لم تجر أي تجربة علمية بعد.</div>
            )}
            <button
              onClick={() => router.push('/experiment')}
              className="w-full glass-card border border-white/20 py-2.5 rounded-xl font-bold text-xs hover:bg-white/10"
            >
              إجراء تجربة جديدة
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
