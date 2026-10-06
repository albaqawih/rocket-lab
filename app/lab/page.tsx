'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Navigation from '@/components/ui/Navigation';
import RocketSVG from '@/components/rocket/RocketSVG';
import { runFullCalculation } from '@/lib/engine/calculator';
import { getSession, saveDesign, checkAndAwardBadges } from '@/lib/storage/localStorage';
import { RocketInputs, NoseShape, FinPosition, MassDistribution, FullCalculationResult, RocketDesign } from '@/lib/engine/types';

const DEFAULT_INPUTS: RocketInputs = {
  rocketLengthCm: 60,
  bodyDiameterCm: 6,
  noseShape: 'conical',
  noseLengthCm: 12,
  numberOfFins: 3,
  finHeightCm: 5,
  finBaseLengthCm: 6,
  finPosition: 'low',
  massG: 350,
  massDistribution: 'balanced',
};

function LabContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const designLabel = (searchParams.get('design') as 'A' | 'B' | 'challenge') || 'A';

  const [inputs, setInputs] = useState<RocketInputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<FullCalculationResult | null>(null);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    const session = getSession();
    if (!session?.student) { router.replace('/register'); return; }
    if (!session.onboardingDone) { router.replace('/onboarding'); return; }
    setStudentName(session.student.name.split(' ')[0]);

    // Load existing design if available
    const existingDesign = session.designs.find(d => d.label === designLabel);
    if (existingDesign) {
      setInputs(existingDesign.inputs);
    }
  }, [router, designLabel]);

  // Live calculation on every input change
  const recalculate = useCallback((inp: RocketInputs) => {
    const res = runFullCalculation(inp);
    setResult(res);
  }, []);

  useEffect(() => {
    recalculate(inputs);
  }, [inputs, recalculate]);

  function updateInput<K extends keyof RocketInputs>(key: K, value: RocketInputs[K]) {
    setInputs(prev => ({ ...prev, [key]: value }));
  }

  function handleSaveAndAnalyze() {
    if (!result) return;
    const session = getSession();
    if (!session?.student) return;

    const design: RocketDesign = {
      id: uuidv4(),
      studentId: session.student.id,
      label: designLabel,
      inputs,
      metrics: result.metrics,
      score: result.score,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      createdAt: new Date().toISOString(),
    };

    saveDesign(design);
    checkAndAwardBadges();
    router.push(`/analysis?design=${designLabel}`);
  }

  const metrics = result?.metrics;

  function scoreColor(score: number) {
    if (score >= 90) return '#ffd700';
    if (score >= 75) return '#22c55e';
    if (score >= 60) return '#38bdf8';
    if (score >= 40) return '#f59e0b';
    return '#fb923c';
  }

  return (
    <div className="min-h-screen">
      <div className="starfield" />
      <Navigation />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in-up">
          <div>
            <h1 className="text-2xl md:text-3xl font-black gradient-text-orange">
              مختبر التصميم
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {studentName ? `جاهز يا ${studentName} لتصميم صاروخك؟` : 'صمّم صاروخك الافتراضي'}
              {' '}— التصميم{' '}
              <span className="text-rocket-orange font-bold">{designLabel}</span>
            </p>
          </div>
          {designLabel === 'A' && (
            <button
              className="btn-secondary text-sm"
              onClick={() => router.push('/lab?design=B')}
            >
              + إنشاء تصميم B
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Inputs */}
          <div className="lg:col-span-2 space-y-4 animate-slide-in">
            {/* Body dimensions */}
            <div className="glass-card-bright p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>🚀</span> أبعاد جسم الصاروخ
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <SliderInput
                  label="طول الصاروخ"
                  unit="سم"
                  value={inputs.rocketLengthCm}
                  min={30} max={100} step={1}
                  onChange={v => updateInput('rocketLengthCm', v)}
                />
                <SliderInput
                  label="قطر جسم الصاروخ"
                  unit="سم"
                  value={inputs.bodyDiameterCm}
                  min={3} max={10} step={0.5}
                  onChange={v => updateInput('bodyDiameterCm', v)}
                />
              </div>
            </div>

            {/* Nose */}
            <div className="glass-card-bright p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>🔺</span> المقدمة
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">شكل المقدمة</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'conical', label: 'مخروطي', icon: '▲' },
                      { value: 'rounded', label: 'دائري', icon: '⬤' },
                      { value: 'ogive', label: 'انسيابي', icon: '◗' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updateInput('noseShape', opt.value as NoseShape)}
                        className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                          inputs.noseShape === opt.value
                            ? 'border-rocket-orange bg-rocket-orange/20 text-rocket-orange'
                            : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                        }`}
                      >
                        <div className="text-lg mb-1">{opt.icon}</div>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <SliderInput
                    label="طول المقدمة"
                    unit="سم"
                    value={inputs.noseLengthCm}
                    min={5} max={25} step={1}
                    onChange={v => updateInput('noseLengthCm', v)}
                    note="عنصر بصري فقط — لا يؤثر في التقييم"
                  />
                </div>
              </div>
            </div>

            {/* Fins */}
            <div className="glass-card-bright p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>🪶</span> الزعانف
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">عدد الزعانف</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[3, 4].map(n => (
                      <button
                        key={n}
                        onClick={() => updateInput('numberOfFins', n as 3 | 4)}
                        className={`py-3 rounded-xl border font-bold text-lg transition-all ${
                          inputs.numberOfFins === n
                            ? 'border-rocket-orange bg-rocket-orange/20 text-rocket-orange'
                            : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <SliderInput
                  label="ارتفاع الزعنفة"
                  unit="سم"
                  value={inputs.finHeightCm}
                  min={2} max={10} step={0.5}
                  onChange={v => updateInput('finHeightCm', v)}
                />
                <SliderInput
                  label="طول قاعدة الزعنفة"
                  unit="سم"
                  value={inputs.finBaseLengthCm}
                  min={3} max={15} step={0.5}
                  onChange={v => updateInput('finBaseLengthCm', v)}
                />
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">موضع الزعانف</label>
                  <div className="flex flex-col gap-2">
                    {([
                      { value: 'low', label: 'منخفض' },
                      { value: 'medium', label: 'متوسط' },
                      { value: 'high', label: 'مرتفع' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updateInput('finPosition', opt.value as FinPosition)}
                        className={`py-2 px-4 rounded-lg border text-sm font-semibold transition-all text-right ${
                          inputs.finPosition === opt.value
                            ? 'border-rocket-orange bg-rocket-orange/20 text-rocket-orange'
                            : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mass */}
            <div className="glass-card-bright p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>⚖️</span> الكتلة
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <SliderInput
                  label="الكتلة الافتراضية الكلية"
                  unit="غرام"
                  value={inputs.massG}
                  min={100} max={1000} step={10}
                  onChange={v => updateInput('massG', v)}
                  note="للمقارنة بين التصاميم — لا يؤثر في التقييم"
                />
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">توزيع الكتلة</label>
                  <div className="flex flex-col gap-2">
                    {([
                      { value: 'front', label: 'أمامي' },
                      { value: 'balanced', label: 'متوازن' },
                      { value: 'rear', label: 'خلفي' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => updateInput('massDistribution', opt.value as MassDistribution)}
                        className={`py-2 px-4 rounded-lg border text-sm font-semibold transition-all text-right ${
                          inputs.massDistribution === opt.value
                            ? 'border-rocket-orange bg-rocket-orange/20 text-rocket-orange'
                            : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Rocket SVG + Live Metrics */}
          <div className="space-y-4">
            {/* Rocket visualization */}
            <div className="glass-card-bright p-6 flex flex-col items-center animate-fade-in-up delay-200">
              <h3 className="text-sm font-semibold text-white/60 mb-4">معاينة الصاروخ</h3>
              {metrics && (
                <RocketSVG
                  inputs={inputs}
                  cgCm={metrics.cgCm}
                  cpCm={metrics.cpCm}
                  rocketLengthCm={inputs.rocketLengthCm}
                />
              )}
            </div>

            {/* Live metrics */}
            {metrics && result && (
              <div className="glass-card-bright p-5 animate-fade-in-up delay-300">
                <h3 className="text-sm font-semibold text-white/60 mb-4">المقاييس الحية</h3>

                <div className="space-y-3">
                  <MetricRow
                    label="L/D"
                    value={metrics.lengthDiameterRatio.toFixed(2)}
                    sub={metrics.ldClassification}
                    color="#38bdf8"
                  />
                  <MetricRow
                    label="نسبة الزعانف"
                    value={`${metrics.finRatioPercent.toFixed(1)}%`}
                    color="#c084fc"
                  />
                  <MetricRow
                    label="CG (من رأس الصاروخ)"
                    value={`${metrics.cgCm} سم`}
                    color="#ffd700"
                    note="تقديري للمحاكاة التعليمية"
                  />
                  <MetricRow
                    label="CP (من رأس الصاروخ)"
                    value={`${metrics.cpCm} سم`}
                    color="#38bdf8"
                    note="تقديري للمحاكاة التعليمية"
                  />
                  <MetricRow
                    label="مؤشر الاستقرار"
                    value={metrics.stabilityIndicator.toFixed(2)}
                    sub={metrics.stabilityClassification}
                    color={metrics.stabilityIndicator >= 1 ? '#22c55e' : metrics.stabilityIndicator >= 0.5 ? '#f59e0b' : '#ef4444'}
                  />
                </div>

                {/* Stability disclaimer */}
                <div className="disclaimer-box mt-4">
                  هذا المؤشر خاص بالمحاكاة التعليمية ولا يعني أن صاروخًا حقيقيًا آمن أو مناسب للإطلاق.
                </div>

                {/* Live score preview */}
                <div className="mt-4 text-center">
                  <div className="text-xs text-white/40 mb-1">التقييم المتوقع</div>
                  <div
                    className="text-4xl font-black"
                    style={{ color: scoreColor(result.score.total) }}
                  >
                    {result.score.total}
                    <span className="text-sm text-white/40 font-normal mr-1">/100</span>
                  </div>
                  <div className="text-sm mt-1" style={{ color: scoreColor(result.score.total) }}>
                    {result.score.classification}
                  </div>
                </div>
              </div>
            )}

            {/* Save and analyze */}
            <button
              className="btn-primary w-full py-4 text-lg animate-fade-in-up delay-400"
              onClick={handleSaveAndAnalyze}
              disabled={!result}
            >
              حفظ وتحليل التصميم →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================
// Sub-components
// ==============================

function SliderInput({
  label, unit, value, min, max, step, onChange, note,
}: {
  label: string; unit: string; value: number;
  min: number; max: number; step: number;
  onChange: (v: number) => void; note?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-white/70">{label}</label>
        <span className="text-sm font-bold text-rocket-orange">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="slider-rtl"
      />
      <div className="flex justify-between text-xs text-white/30 mt-1">
        <span>{max} {unit}</span>
        <span>{min} {unit}</span>
      </div>
      {note && <p className="text-xs text-info/70 mt-1">{note}</p>}
    </div>
  );
}

function MetricRow({ label, value, sub, color, note }: {
  label: string; value: string; sub?: string; color: string; note?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-white/5">
      <div>
        <div className="text-xs text-white/50">{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color }}>{sub}</div>}
        {note && <div className="text-xs text-info/50 mt-0.5">{note}</div>}
      </div>
      <div className="font-bold text-sm whitespace-nowrap" style={{ color }}>{value}</div>
    </div>
  );
}

export default function LabPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="starfield" /><div className="text-white/50">جارٍ التحميل...</div></div>}>
      <LabContent />
    </Suspense>
  );
}
