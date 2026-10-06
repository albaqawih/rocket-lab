'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/ui/Navigation';
import RocketSVG from '@/components/rocket/RocketSVG';
import { getSession } from '@/lib/storage/localStorage';
import { RocketDesign } from '@/lib/engine/types';

export default function ComparePage() {
  const router = useRouter();
  const [designA, setDesignA] = useState<RocketDesign | null>(null);
  const [designB, setDesignB] = useState<RocketDesign | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session?.student) { router.replace('/register'); return; }
    const a = session.designs.find(d => d.label === 'A') || null;
    const b = session.designs.find(d => d.label === 'B') || null;
    setDesignA(a);
    setDesignB(b);
  }, [router]);

  function betterDesign(keyA: number, keyB: number): 'A' | 'B' | 'equal' {
    if (keyA > keyB) return 'A';
    if (keyB > keyA) return 'B';
    return 'equal';
  }

  const rows = designA && designB ? [
    {
      label: 'النتيجة الإجمالية',
      a: `${designA.score.total}/100`,
      b: `${designB.score.total}/100`,
      winner: betterDesign(designA.score.total, designB.score.total),
      aRaw: designA.score.total,
      bRaw: designB.score.total,
    },
    {
      label: 'مؤشر الاستقرار',
      a: `${designA.metrics.stabilityIndicator}`,
      b: `${designB.metrics.stabilityIndicator}`,
      winner: betterDesign(designA.metrics.stabilityIndicator, designB.metrics.stabilityIndicator),
      aRaw: designA.metrics.stabilityIndicator,
      bRaw: designB.metrics.stabilityIndicator,
    },
    {
      label: 'L/D',
      a: `${designA.metrics.lengthDiameterRatio}`,
      b: `${designB.metrics.lengthDiameterRatio}`,
      winner: betterDesign(
        designA.score.proportionScore,
        designB.score.proportionScore
      ),
      aRaw: designA.score.proportionScore,
      bRaw: designB.score.proportionScore,
    },
    {
      label: 'نسبة الزعانف',
      a: `${designA.metrics.finRatioPercent.toFixed(1)}%`,
      b: `${designB.metrics.finRatioPercent.toFixed(1)}%`,
      winner: betterDesign(designA.score.finScore, designB.score.finScore),
      aRaw: designA.score.finScore,
      bRaw: designB.score.finScore,
    },
    {
      label: 'CG (سم)',
      a: `${designA.metrics.cgCm}`,
      b: `${designB.metrics.cgCm}`,
      winner: 'equal' as const,
      aRaw: 0,
      bRaw: 0,
    },
    {
      label: 'CP (سم)',
      a: `${designA.metrics.cpCm}`,
      b: `${designB.metrics.cpCm}`,
      winner: 'equal' as const,
      aRaw: 0,
      bRaw: 0,
    },
    {
      label: 'الكتلة الافتراضية',
      a: `${designA.inputs.massG} غرام`,
      b: `${designB.inputs.massG} غرام`,
      winner: 'equal' as const,
      aRaw: 0,
      bRaw: 0,
    },
  ] : [];

  return (
    <div className="min-h-screen">
      <div className="starfield" />
      <Navigation />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6 animate-fade-in-up">
          <h1 className="text-2xl md:text-3xl font-black gradient-text-orange">مقارنة التصميمين A/B</h1>
          <p className="text-white/50 text-sm mt-1">قارن تصميميك جنبًا إلى جنب</p>
        </div>

        {!designA || !designB ? (
          <div className="glass-card-bright p-8 text-center animate-fade-in-up">
            <div className="text-4xl mb-4">⚖️</div>
            <h2 className="text-xl font-bold mb-3">تحتاج إلى تصميمين للمقارنة</h2>
            <p className="text-white/55 text-sm mb-6">
              {!designA && 'لم تنشئ التصميم A بعد. '}
              {!designB && 'لم تنشئ التصميم B بعد. '}
              يرجى إنشاء كلا التصميمين في مختبر التصميم.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!designA && <button className="btn-primary" onClick={() => router.push('/lab?design=A')}>إنشاء التصميم A</button>}
              {!designB && <button className="btn-secondary" onClick={() => router.push('/lab?design=B')}>إنشاء التصميم B</button>}
            </div>
          </div>
        ) : (
          <>
            {/* Visual comparison */}
            <div className="grid grid-cols-2 gap-4 mb-6 animate-fade-in-up">
              {[
                { design: designA, label: 'A' },
                { design: designB, label: 'B' },
              ].map(({ design, label }) => (
                <div key={label} className="glass-card-bright p-5 flex flex-col items-center">
                  <div className="flex items-center justify-between w-full mb-3">
                    <span className="font-black text-2xl text-rocket-orange">التصميم {label}</span>
                    <span
                      className="font-black text-2xl"
                      style={{
                        color: design.score.total >= 75 ? '#22c55e' :
                          design.score.total >= 60 ? '#38bdf8' : '#f59e0b',
                      }}
                    >
                      {design.score.total}
                    </span>
                  </div>
                  <RocketSVG
                    inputs={design.inputs}
                    cgCm={design.metrics.cgCm}
                    cpCm={design.metrics.cpCm}
                    rocketLengthCm={design.inputs.rocketLengthCm}
                    className="scale-75 -my-6"
                  />
                  <div className="text-sm text-white/50 mt-2">{design.score.classification}</div>
                </div>
              ))}
            </div>

            {/* Comparison table */}
            <div className="glass-card-bright overflow-hidden animate-fade-in-up delay-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-right px-4 py-3 text-white/50 font-semibold">المقياس</th>
                    <th className="text-center px-4 py-3 text-rocket-orange font-bold">التصميم A</th>
                    <th className="text-center px-4 py-3 text-blue-400 font-bold">التصميم B</th>
                    <th className="text-center px-4 py-3 text-white/50 font-semibold">الأفضل</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-white/65">{row.label}</td>
                      <td className={`px-4 py-3 text-center font-bold ${row.winner === 'A' ? 'text-green-400' : 'text-white/70'}`}>
                        {row.a}
                        {row.winner === 'A' && ' ✓'}
                      </td>
                      <td className={`px-4 py-3 text-center font-bold ${row.winner === 'B' ? 'text-green-400' : 'text-white/70'}`}>
                        {row.b}
                        {row.winner === 'B' && ' ✓'}
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        {row.winner === 'A' && <span className="bg-rocket-orange/20 text-rocket-orange px-2 py-0.5 rounded-full">A</span>}
                        {row.winner === 'B' && <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">B</span>}
                        {row.winner === 'equal' && <span className="text-white/30">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Overall winner */}
            <div className="mt-4 glass-card p-4 text-center animate-fade-in-up delay-200">
              {designA.score.total > designB.score.total ? (
                <p className="font-bold text-rocket-orange">🏆 التصميم A أفضل في هذه المحاكاة</p>
              ) : designB.score.total > designA.score.total ? (
                <p className="font-bold text-blue-400">🏆 التصميم B أفضل في هذه المحاكاة</p>
              ) : (
                <p className="font-bold text-star-yellow">⚖️ التصميمان متساويان في النتيجة الإجمالية</p>
              )}
              <p className="text-xs text-white/40 mt-2">هذه نتائج محاكاة تعليمية مبسطة فقط</p>
            </div>

            {/* Hint */}
            <div className="disclaimer-box mt-4 animate-fade-in-up delay-300">
              جرّب تغيير متغير واحد فقط بين التصميمين وسجّل فرضيتك في وضع التجربة لتكتشف تأثيره.
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 animate-fade-in-up delay-400">
              <button className="btn-secondary flex-1" onClick={() => router.push('/experiment')}>
                🔬 إجراء تجربة
              </button>
              <button className="btn-secondary flex-1" onClick={() => router.push('/challenge')}>
                🏆 التحدي الأخير
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
