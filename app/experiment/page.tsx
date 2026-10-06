'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import Navigation from '@/components/ui/Navigation';
import { getSession, saveHypothesis, saveExperiment, checkAndAwardBadges } from '@/lib/storage/localStorage';
import { Hypothesis, Experiment, RocketDesign } from '@/lib/engine/types';

const VARIABLES = [
  { id: 'rocketLengthCm', label: 'طول الصاروخ' },
  { id: 'bodyDiameterCm', label: 'قطر الجسم' },
  { id: 'noseShape', label: 'شكل المقدمة' },
  { id: 'numberOfFins', label: 'عدد الزعانف' },
  { id: 'finHeightCm', label: 'ارتفاع الزعنفة' },
  { id: 'finBaseLengthCm', label: 'طول قاعدة الزعنفة' },
  { id: 'finPosition', label: 'موضع الزعانف' },
  { id: 'massDistribution', label: 'توزيع الكتلة' },
];

type Step = 'hypothesis' | 'experiment' | 'result' | 'conclusion';

export default function ExperimentPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('hypothesis');
  const [designA, setDesignA] = useState<RocketDesign | null>(null);
  const [designB, setDesignB] = useState<RocketDesign | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [studentName, setStudentName] = useState('');

  // Hypothesis form
  const [selectedVariable, setSelectedVariable] = useState('');
  const [prediction, setPrediction] = useState('');
  const [hypothesisId] = useState(uuidv4());
  const [experimentId] = useState(uuidv4());

  // Conclusion form
  const [observation, setObservation] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [hypothesisCorrect, setHypothesisCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session?.student) { router.replace('/register'); return; }
    setStudentName(session.student.name.split(' ')[0]);
    const a = session.designs.find(d => d.label === 'A') || null;
    const b = session.designs.find(d => d.label === 'B') || null;
    setDesignA(a);
    setDesignB(b);
    setExperiments(session.experiments);
  }, [router]);

  function handleSaveHypothesis() {
    if (!selectedVariable || !prediction.trim()) return;
    const session = getSession();
    if (!session?.student) return;

    const hyp: Hypothesis = {
      id: hypothesisId,
      studentId: session.student.id,
      experimentId,
      variable: selectedVariable,
      prediction: prediction.trim(),
      createdAt: new Date().toISOString(),
    };
    saveHypothesis(hyp);
    setStep('experiment');
  }

  function handleSaveConclusion() {
    if (!observation.trim() || !conclusion.trim() || hypothesisCorrect === null) return;
    const session = getSession();
    if (!session?.student || !designA || !designB) return;

    const exp: Experiment = {
      id: experimentId,
      studentId: session.student.id,
      designAId: designA.id,
      designBId: designB.id,
      changedVariable: selectedVariable,
      hypothesisId,
      observation: observation.trim(),
      conclusion: conclusion.trim(),
      hypothesisCorrect,
      createdAt: new Date().toISOString(),
    };
    saveExperiment(exp);
    checkAndAwardBadges();
    setStep('conclusion');
  }

  const hasDesigns = designA && designB;

  return (
    <div className="min-h-screen">
      <div className="starfield" />
      <Navigation />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6 animate-fade-in-up">
          <h1 className="text-2xl md:text-3xl font-black gradient-text-orange">وضع التجربة</h1>
          <p className="text-white/50 text-sm mt-1">فرضية → تجربة → نتيجة → استنتاج</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {(['hypothesis', 'experiment', 'result', 'conclusion'] as Step[]).map((s, i) => {
            const labels: Record<Step, string> = {
              hypothesis: 'الفرضية',
              experiment: 'التجربة',
              result: 'النتيجة',
              conclusion: 'الاستنتاج',
            };
            const done = ['hypothesis', 'experiment', 'result', 'conclusion'].indexOf(step) > i;
            const active = step === s;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  active ? 'bg-rocket-orange text-white' :
                  done ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  'bg-white/5 text-white/30'
                }`}>
                  <span>{done ? '✓' : i + 1}</span>
                  <span className="hidden sm:inline">{labels[s]}</span>
                </div>
                {i < 3 && <div className="w-4 h-0.5 bg-white/15 shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* No designs message */}
        {!hasDesigns && step === 'hypothesis' && (
          <div className="glass-card-bright p-8 text-center animate-fade-in-up">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-3">تحتاج إلى تصميمين للمقارنة</h2>
            <p className="text-white/60 mb-6 text-sm">
              أنشئ التصميم A والتصميم B في مختبر التصميم أولًا، ثم عُد لهنا لإجراء تجربتك.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button className="btn-primary" onClick={() => router.push('/lab?design=A')}>
                إنشاء التصميم A
              </button>
              <button className="btn-secondary" onClick={() => router.push('/lab?design=B')}>
                إنشاء التصميم B
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Hypothesis */}
        {step === 'hypothesis' && hasDesigns && (
          <div className="glass-card-bright p-7 animate-fade-in-up">
            <h2 className="text-xl font-bold mb-2 text-rocket-orange">🔭 ضع فرضيتك</h2>
            <p className="text-white/55 text-sm mb-6 leading-relaxed">
              قبل أن تقارن التصميمين، فكّر: ماذا تتوقع أن يحدث؟
            </p>

            {/* Variable selector */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-white/70 mb-2">
                ما المتغير الذي ستقارنه؟
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {VARIABLES.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariable(v.id)}
                    className={`p-2 rounded-lg border text-xs font-medium transition-all text-center ${
                      selectedVariable === v.id
                        ? 'border-rocket-orange bg-rocket-orange/20 text-rocket-orange'
                        : 'border-white/10 bg-white/5 text-white/55 hover:border-white/25'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prediction */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white/70 mb-2">
                ما توقعك لما سيتغير في نتيجة المحاكاة؟
              </label>
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="مثال: أتوقع أن زيادة ارتفاع الزعنفة ستزيد مؤشر الاستقرار..."
                value={prediction}
                onChange={e => setPrediction(e.target.value)}
                maxLength={500}
              />
            </div>

            <button
              className="btn-primary w-full"
              onClick={handleSaveHypothesis}
              disabled={!selectedVariable || !prediction.trim()}
            >
              حفظ الفرضية والانتقال للتجربة →
            </button>
          </div>
        )}

        {/* Step 2: Do the experiment */}
        {step === 'experiment' && (
          <div className="glass-card-bright p-7 animate-fade-in-up">
            <h2 className="text-xl font-bold mb-2 text-blue-400">🔬 أجرِ التجربة</h2>
            <p className="text-white/55 text-sm mb-6">
              فرضيتك: "<span className="text-white/80">{prediction}</span>"
            </p>

            <div className="glass-card p-4 mb-6">
              <p className="text-sm text-white/70 leading-relaxed">
                الآن قارن التصميم A والتصميم B في صفحة المقارنة.
                سجّل ما لاحظته، ثم ارجع هنا لكتابة استنتاجك.
              </p>
            </div>

            <div className="flex gap-3">
              <button className="btn-primary flex-1" onClick={() => router.push('/compare')}>
                عرض المقارنة A/B
              </button>
              <button className="btn-secondary" onClick={() => setStep('result')}>
                سجّلت ملاحظتي ←
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Record result */}
        {step === 'result' && (
          <div className="glass-card-bright p-7 animate-fade-in-up">
            <h2 className="text-xl font-bold mb-2 text-green-400">📊 سجّل نتيجتك</h2>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-white/70 mb-2">ما الذي لاحظته؟</label>
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="صف ما رأيته في نتائج المقارنة..."
                value={observation}
                onChange={e => setObservation(e.target.value)}
                maxLength={500}
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-white/70 mb-2">ما استنتاجك؟</label>
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="بناءً على ما لاحظته، ماذا تستنتج؟..."
                value={conclusion}
                onChange={e => setConclusion(e.target.value)}
                maxLength={500}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-white/70 mb-3">هل كانت فرضيتك صحيحة؟</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setHypothesisCorrect(true)}
                  className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                    hypothesisCorrect === true
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : 'border-white/10 text-white/50'
                  }`}
                >
                  ✓ نعم، كانت صحيحة
                </button>
                <button
                  onClick={() => setHypothesisCorrect(false)}
                  className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                    hypothesisCorrect === false
                      ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                      : 'border-white/10 text-white/50'
                  }`}
                >
                  ✗ لا، كانت خاطئة
                </button>
              </div>
            </div>

            <button
              className="btn-primary w-full"
              onClick={handleSaveConclusion}
              disabled={!observation.trim() || !conclusion.trim() || hypothesisCorrect === null}
            >
              حفظ الاستنتاج →
            </button>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'conclusion' && (
          <div className="glass-card-bright p-8 text-center animate-fade-in-up">
            <div className="text-5xl mb-4">🧪</div>
            <h2 className="text-2xl font-black text-green-400 mb-3">أحسنت، عالم صغير!</h2>
            <p className="text-white/65 mb-2">
              {hypothesisCorrect
                ? 'كانت فرضيتك صحيحة! هذا يعني أنك فكّرت كمهندس حقيقي.'
                : 'لم تكن فرضيتك كما توقعت — وهذا علم! المهندسون يتعلمون من النتائج غير المتوقعة.'}
            </p>
            <p className="text-white/45 text-sm mb-8">
              {studentName ? `يا ${studentName}، ` : ''}
              لقد أكملت دورة كاملة: فرضية → تجربة → نتيجة → استنتاج.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button className="btn-primary" onClick={() => { setStep('hypothesis'); setPrediction(''); setSelectedVariable(''); setObservation(''); setConclusion(''); setHypothesisCorrect(null); }}>
                + تجربة جديدة
              </button>
              <button className="btn-secondary" onClick={() => router.push('/achievements')}>
                🏅 إنجازاتي
              </button>
              <button className="btn-secondary" onClick={() => router.push('/challenge')}>
                🏆 التحدي الأخير
              </button>
            </div>
          </div>
        )}

        {/* Past experiments */}
        {experiments.length > 0 && step === 'hypothesis' && (
          <div className="mt-6 glass-card p-5 animate-fade-in-up delay-200">
            <h3 className="font-bold text-white/60 mb-3 text-sm">تجاربي السابقة ({experiments.length})</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {experiments.map((e, i) => {
                const varLabel = VARIABLES.find(v => v.id === e.changedVariable)?.label || e.changedVariable;
                return (
                  <div key={e.id} className="border-b border-white/5 pb-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">التجربة {i + 1} — {varLabel}</span>
                      <span className={e.hypothesisCorrect ? 'text-green-400' : 'text-amber-400'}>
                        {e.hypothesisCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="text-white/35 text-xs mt-1 truncate">{e.conclusion}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
