'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/ui/Navigation';
import RocketSVG from '@/components/rocket/RocketSVG';
import { getSession } from '@/lib/storage/localStorage';
import { AIInputContract, RocketDesign } from '@/lib/engine/types';

function AnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const designLabel = searchParams.get('design') as 'A' | 'B' | 'challenge' || 'A';

  const [design, setDesign] = useState<RocketDesign | null>(null);
  const [aiText, setAiText] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiIsFallback, setAiIsFallback] = useState(false);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    const session = getSession();
    if (!session?.student) { router.replace('/register'); return; }
    setStudentName(session.student.name.split(' ')[0]);

    const found = session.designs.find(d => d.label === designLabel) ||
      session.designs[session.designs.length - 1];

    if (!found) { router.replace('/lab'); return; }
    setDesign(found);

    // Fetch AI explanation
    const aiPayload: AIInputContract = {
      student: {
        name: session.student.name,
        className: session.student.className,
        school: session.student.school,
      },
      inputs: {
        rocket_length_cm: found.inputs.rocketLengthCm,
        body_diameter_cm: found.inputs.bodyDiameterCm,
        nose_shape: found.inputs.noseShape,
        nose_length_cm: found.inputs.noseLengthCm,
        number_of_fins: found.inputs.numberOfFins,
        fin_height_cm: found.inputs.finHeightCm,
        fin_base_length_cm: found.inputs.finBaseLengthCm,
        fin_position: found.inputs.finPosition,
        mass_g: found.inputs.massG,
        mass_distribution: found.inputs.massDistribution,
      },
      metrics: {
        length_diameter_ratio: found.metrics.lengthDiameterRatio,
        fin_ratio_percent: found.metrics.finRatioPercent,
        cg_cm: found.metrics.cgCm,
        cp_cm: found.metrics.cpCm,
        stability_indicator: found.metrics.stabilityIndicator,
      },
      score: {
        total: found.score.total,
        stability: found.score.stabilityScore,
        fins: found.score.finScore,
        proportions: found.score.proportionScore,
        mass_distribution: found.score.massScore,
        design_consistency: found.score.consistencyScore,
        classification: found.score.classification,
      },
      strengths: found.strengths,
      weaknesses: found.weaknesses,
    };

    setAiLoading(true);
    fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aiPayload),
    })
      .then(r => r.json())
      .then(data => {
        setAiText(data.text || '');
        setAiIsFallback(data.isFallback);
      })
      .catch(() => {
        setAiText('تعذّر تشغيل مهندس الفضاء الذكي حاليًا، لكن نتائج المحاكاة والحسابات ما زالت متاحة.');
        setAiIsFallback(true);
      })
      .finally(() => setAiLoading(false));
  }, [router, designLabel]);

  if (!design) return <div className="min-h-screen flex items-center justify-center text-white/50"><div className="starfield" />جارٍ التحميل...</div>;

  const { metrics, score, strengths, weaknesses } = design;

  function scoreColor(s: number) {
    if (s >= 90) return '#ffd700';
    if (s >= 75) return '#22c55e';
    if (s >= 60) return '#38bdf8';
    if (s >= 40) return '#f59e0b';
    return '#fb923c';
  }

  const scoreComponents = [
    { label: 'الاستقرار', score: score.stabilityScore, max: 40, icon: '🎯' },
    { label: 'الزعانف', score: score.finScore, max: 20, icon: '🪶' },
    { label: 'أبعاد الجسم', score: score.proportionScore, max: 15, icon: '📏' },
    { label: 'توزيع الكتلة', score: score.massScore, max: 15, icon: '⚖️' },
    { label: 'تناسق التصميم', score: score.consistencyScore, max: 10, icon: '✅' },
  ];

  return (
    <div className="min-h-screen">
      <div className="starfield" />
      <Navigation />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div>
            <h1 className="text-2xl md:text-3xl font-black gradient-text-orange">التحليل العلمي</h1>
            <p className="text-white/50 text-sm">التصميم {designLabel}</p>
          </div>
          <button className="btn-secondary text-sm" onClick={() => router.push(`/lab?design=${designLabel}`)}>
            ← تعديل التصميم
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rocket */}
          <div className="glass-card-bright p-6 flex flex-col items-center animate-fade-in-up">
            <h3 className="text-sm font-semibold text-white/60 mb-4">الصاروخ الافتراضي</h3>
            <RocketSVG
              inputs={design.inputs}
              cgCm={metrics.cgCm}
              cpCm={metrics.cpCm}
              rocketLengthCm={design.inputs.rocketLengthCm}
            />
          </div>

          {/* Metrics & Score */}
          <div className="space-y-4 animate-fade-in-up delay-100">
            {/* Metrics */}
            <div className="glass-card-bright p-5">
              <h3 className="font-bold mb-4">المقاييس التعليمية</h3>
              <div className="space-y-3">
                {[
                  { label: 'نسبة الطول إلى القطر (L/D)', value: `${metrics.lengthDiameterRatio}`, sub: metrics.ldClassification, color: '#38bdf8' },
                  { label: 'نسبة مساحة الزعانف', value: `${metrics.finRatioPercent.toFixed(1)}%`, color: '#c084fc' },
                  { label: 'مركز الكتلة (CG)', value: `${metrics.cgCm} سم`, color: '#ffd700', note: 'مركز كتلة تقديري للمحاكاة التعليمية' },
                  { label: 'مركز الضغط (CP)', value: `${metrics.cpCm} سم`, color: '#38bdf8', note: 'مركز ضغط تقديري للمحاكاة التعليمية' },
                  { label: 'مؤشر الاستقرار', value: metrics.stabilityIndicator.toFixed(2), sub: metrics.stabilityClassification, color: metrics.stabilityIndicator >= 1 ? '#22c55e' : '#f59e0b' },
                ].map((m, i) => (
                  <div key={i} className="border-b border-white/5 pb-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-white/50">{m.label}</span>
                      <span className="font-bold text-sm" style={{ color: m.color }}>{m.value}</span>
                    </div>
                    {m.sub && <div className="text-xs mt-0.5" style={{ color: m.color }}>{m.sub}</div>}
                    {m.note && <div className="text-xs text-info/50 mt-0.5">{m.note}</div>}
                  </div>
                ))}
              </div>
              <div className="disclaimer-box mt-3">
                هذا المؤشر خاص بالمحاكاة التعليمية ولا يعني أن صاروخًا حقيقيًا آمن أو مناسب للإطلاق.
              </div>
            </div>

            {/* Score breakdown */}
            <div className="glass-card-bright p-5">
              <h3 className="font-bold mb-3">تفاصيل التقييم</h3>
              <div className="space-y-2">
                {scoreComponents.map((c, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{c.icon} {c.label}</span>
                      <span className="font-bold text-white">{c.score}/{c.max}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(c.score / c.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <div className="text-xs text-white/40">المجموع</div>
                <div className="text-5xl font-black mt-1" style={{ color: scoreColor(score.total) }}>
                  {score.total}
                  <span className="text-sm text-white/40 font-normal mr-1">/100</span>
                </div>
                <div className="text-lg font-bold mt-1" style={{ color: scoreColor(score.total) }}>
                  {score.classification}
                </div>
              </div>
            </div>
          </div>

          {/* Strengths, Weaknesses & AI */}
          <div className="space-y-4 animate-fade-in-up delay-200">
            {/* Strengths */}
            {strengths.length > 0 && (
              <div className="glass-card-bright p-5 border border-green-500/20">
                <h3 className="font-bold mb-3 text-green-400 flex items-center gap-2">
                  <span>✅</span> نقاط القوة
                </h3>
                <ul className="space-y-2">
                  {strengths.map((s, i) => (
                    <li key={i} className="text-sm text-white/75 flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {weaknesses.length > 0 && (
              <div className="glass-card-bright p-5 border border-amber-500/20">
                <h3 className="font-bold mb-3 text-amber-400 flex items-center gap-2">
                  <span>🔧</span> نقاط تحتاج إلى تطوير
                </h3>
                <ul className="space-y-2">
                  {weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-white/75 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI explanation */}
            <div className="glass-card-bright p-5 border border-purple-500/20">
              <h3 className="font-bold mb-3 text-purple-300 flex items-center gap-2">
                <span>🤖</span>
                {aiIsFallback ? 'التفسير العلمي' : 'مهندس الفضاء الذكي'}
              </h3>
              {aiLoading ? (
                <div className="flex items-center gap-3 text-white/50 text-sm">
                  <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                  يفكّر مهندس الفضاء...
                </div>
              ) : (
                <>
                  {aiIsFallback && (
                    <p className="text-xs text-amber-400/70 mb-3">
                      تعذّر تشغيل مهندس الفضاء الذكي حاليًا، لكن نتائج المحاكاة والحسابات ما زالت متاحة.
                    </p>
                  )}
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{aiText}</p>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button className="btn-primary py-3" onClick={() => router.push('/results?design=' + designLabel)}>
                عرض النتيجة الكاملة →
              </button>
              <button className="btn-secondary py-3" onClick={() => router.push('/experiment')}>
                🔬 وضع التجربة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="starfield" /><div className="text-white/50">جارٍ التحميل...</div></div>}>
      <AnalysisContent />
    </Suspense>
  );
}
