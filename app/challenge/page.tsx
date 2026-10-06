'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/ui/Navigation';
import RocketSVG from '@/components/rocket/RocketSVG';
import {
  getSession,
  saveDesign,
  incrementChallengeAttempts,
  completeChallengeFlag,
  checkAndAwardBadges,
} from '@/lib/storage/localStorage';
import { RocketInputs, FullCalculationResult, NoseShape, MassDistribution, FinPosition, RocketDesign } from '@/lib/engine/types';
import { runFullCalculation } from '@/lib/engine/calculator';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_INPUTS: RocketInputs = {
  rocketLengthCm: 50,
  bodyDiameterCm: 5,
  noseLengthCm: 10,
  noseShape: 'ogive',
  finHeightCm: 4,
  finBaseLengthCm: 6,
  numberOfFins: 3,
  finPosition: 'low',
  massG: 200,
  massDistribution: 'balanced',
};

export default function ChallengePage() {
  const router = useRouter();
  const [inputs, setInputs] = useState<RocketInputs>(DEFAULT_INPUTS);
  const [calc, setCalc] = useState<FullCalculationResult>(() => runFullCalculation(DEFAULT_INPUTS));
  const [attemptsUsed, setAttemptsUsed] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [studentId, setStudentId] = useState<string>('');

  useEffect(() => {
    const session = getSession();
    if (!session?.student) {
      router.push('/register');
      return;
    }
    setStudentId(session.student.id);
    setAttemptsUsed(session.challengeAttempts || 0);
    setCompleted(session.challengeCompleted || false);
  }, [router]);

  useEffect(() => {
    setCalc(runFullCalculation(inputs));
  }, [inputs]);

  const updateInput = <K extends keyof RocketInputs>(key: K, value: RocketInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const isIdealStability = calc.metrics.stabilityClassification === 'استقرار مثالي';
  const isHighScore = calc.score.total >= 85;
  const isFinValid = calc.metrics.finRatioPercent >= 2 && calc.metrics.finRatioPercent <= 8;

  const handleSubmitAttempt = () => {
    if (attemptsUsed >= 5 && !completed) {
      setShowFailureModal(true);
      return;
    }

    const newAttempts = incrementChallengeAttempts();
    setAttemptsUsed(newAttempts);

    // Save design
    const design: RocketDesign = {
      id: uuidv4(),
      studentId,
      label: 'challenge',
      inputs,
      metrics: calc.metrics,
      score: calc.score,
      strengths: calc.strengths,
      weaknesses: calc.weaknesses,
      createdAt: new Date().toISOString(),
    };
    saveDesign(design);

    if (isIdealStability && isHighScore) {
      completeChallengeFlag();
      checkAndAwardBadges();
      setCompleted(true);
      setShowCelebration(true);
      setStatusMessage({
        type: 'success',
        text: '🎉 مبروك! حققت جميع شروط التحدي النهائي بنجاح!',
      });
    } else {
      checkAndAwardBadges();
      if (newAttempts >= 5) {
        setShowFailureModal(true);
      } else {
        setStatusMessage({
          type: 'error',
          text: `المحاولة رقم ${newAttempts} لم تحقق الشروط الكاملة. لديك ${5 - newAttempts} محاولات متبقية.`,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-space-950 text-white flex flex-col dir-rtl">
      <Navigation />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="glass-card p-6 md:p-8 relative overflow-hidden text-center sm:text-right">
          <div className="absolute -left-10 -bottom-10 text-9xl opacity-10 pointer-events-none">🎯</div>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3">
            المهمة الحاسمة
          </div>
          <h1 className="text-3xl font-black text-white mb-2">🏆 التحدي النهائي: مهندس الصواريخ المحترف</h1>
          <p className="text-white/70 max-w-2xl text-sm leading-relaxed">
            صمّم صاروخًا متكاملاً يحقق <span className="text-amber-400 font-bold">درجة 85 فأكثر</span> مع{' '}
            <span className="text-cyan-400 font-bold">استقرار مثالي</span>. لديك 5 محاولات فقط لإثبات مهاراتك!
          </p>

          {/* Attempt counter badge */}
          <div className="mt-4 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
            <div className="glass-card px-4 py-2 text-sm font-bold flex items-center gap-2">
              <span>🎯 المحاولات:</span>
              <span className={`text-lg font-black ${attemptsUsed >= 5 ? 'text-red-400' : 'text-cyan-400'}`}>
                {attemptsUsed} / 5
              </span>
            </div>
            {completed && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                <span>✅ تم إكمال التحدي بنجاح!</span>
              </div>
            )}
          </div>
        </div>

        {/* Goals Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`glass-card p-4 flex items-center gap-3 border transition-all ${isHighScore ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10'}`}>
            <span className="text-2xl">{isHighScore ? '✅' : '⏳'}</span>
            <div>
              <div className="text-xs text-white/60">الهدف الأول</div>
              <div className="font-bold text-sm">النتيجة الإجمالية ≥ 85</div>
              <div className="text-xs font-mono font-bold mt-1 text-amber-300">الدرجة الحالية: {calc.score.total}</div>
            </div>
          </div>

          <div className={`glass-card p-4 flex items-center gap-3 border transition-all ${isIdealStability ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10'}`}>
            <span className="text-2xl">{isIdealStability ? '✅' : '⏳'}</span>
            <div>
              <div className="text-xs text-white/60">الهدف الثاني</div>
              <div className="font-bold text-sm">تصنيف استقرار مثالي (1 - 2 cal)</div>
              <div className="text-xs font-mono font-bold mt-1 text-cyan-300">
                {calc.metrics.stabilityIndicator.toFixed(2)} cal ({calc.metrics.stabilityClassification})
              </div>
            </div>
          </div>

          <div className={`glass-card p-4 flex items-center gap-3 border transition-all ${isFinValid ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10'}`}>
            <span className="text-2xl">{isFinValid ? '✅' : '⏳'}</span>
            <div>
              <div className="text-xs text-white/60">الهدف الثالث</div>
              <div className="font-bold text-sm">نسبة مساحة الزعانف متوازنة</div>
              <div className="text-xs font-mono font-bold mt-1 text-indigo-300">
                {calc.metrics.finRatioPercent.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Challenge Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls */}
          <div className="lg:col-span-7 glass-card p-6 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white border-b border-white/10 pb-3">
              <span>🔧</span> تعديل مواصفات الصاروخ
            </h2>

            {/* Sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-bold">
                  <span>طول الصاروخ (cm)</span>
                  <span className="text-cyan-400 font-mono">{inputs.rocketLengthCm} cm</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={100}
                  value={inputs.rocketLengthCm}
                  onChange={(e) => updateInput('rocketLengthCm', Number(e.target.value))}
                  className="w-full h-2 bg-space-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-bold">
                  <span>قطر الهيكل (cm)</span>
                  <span className="text-cyan-400 font-mono">{inputs.bodyDiameterCm} cm</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={10}
                  step={0.5}
                  value={inputs.bodyDiameterCm}
                  onChange={(e) => updateInput('bodyDiameterCm', Number(e.target.value))}
                  className="w-full h-2 bg-space-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-bold">
                  <span>ارتفاع الزعنفة (cm)</span>
                  <span className="text-cyan-400 font-mono">{inputs.finHeightCm} cm</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={inputs.finHeightCm}
                  onChange={(e) => updateInput('finHeightCm', Number(e.target.value))}
                  className="w-full h-2 bg-space-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-bold">
                  <span>طول قاعدة الزعنفة (cm)</span>
                  <span className="text-cyan-400 font-mono">{inputs.finBaseLengthCm} cm</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={15}
                  step={0.5}
                  value={inputs.finBaseLengthCm}
                  onChange={(e) => updateInput('finBaseLengthCm', Number(e.target.value))}
                  className="w-full h-2 bg-space-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold mb-1">عدد الزعانف</label>
                  <select
                    value={inputs.numberOfFins}
                    onChange={(e) => updateInput('numberOfFins', Number(e.target.value) as 3 | 4)}
                    className="w-full bg-space-900 border border-white/20 rounded-xl p-2.5 text-sm font-bold text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value={3}>3 زعانف</option>
                    <option value={4}>4 زعانف</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">شكل المقدمة</label>
                  <select
                    value={inputs.noseShape}
                    onChange={(e) => updateInput('noseShape', e.target.value as NoseShape)}
                    className="w-full bg-space-900 border border-white/20 rounded-xl p-2.5 text-sm font-bold text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="conical">مخروطي (Conical)</option>
                    <option value="ogive">انسيابي (Ogive)</option>
                    <option value="rounded">كروي/بيضاوي (Rounded)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">توزيع الكتلة</label>
                <select
                  value={inputs.massDistribution}
                  onChange={(e) => updateInput('massDistribution', e.target.value as MassDistribution)}
                  className="w-full bg-space-900 border border-white/20 rounded-xl p-2.5 text-sm font-bold text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="front">مركّز في المقدمة (Forward - مستحسن)</option>
                  <option value="balanced">متوازن (Balanced)</option>
                  <option value="rear">مركّز في الخلف (Rear)</option>
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              {statusMessage && (
                <div
                  className={`p-3 rounded-xl text-sm font-bold ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : statusMessage.type === 'error'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {statusMessage.text}
                </div>
              )}

              <button
                onClick={handleSubmitAttempt}
                disabled={attemptsUsed >= 5 && !completed}
                className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                  attemptsUsed >= 5 && !completed
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : 'gradient-btn text-space-950 hover:scale-[1.02]'
                }`}
              >
                <span>🚀</span>
                <span>إرسال وتجربة المحاولة ({attemptsUsed + 1}/5)</span>
              </button>
            </div>
          </div>

          {/* Rocket Visual & Stats */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card p-6 flex flex-col items-center">
              <h3 className="text-sm font-bold text-white/70 mb-4">معاينة الصاروخ المباشرة</h3>
              <RocketSVG
                inputs={inputs}
                cgCm={calc.metrics.cgCm}
                cpCm={calc.metrics.cpCm}
                rocketLengthCm={inputs.rocketLengthCm}
              />
            </div>

            <div className="glass-card p-6 space-y-3">
              <h3 className="text-sm font-bold text-white/70">المؤشرات الحالية</h3>
              <div className="flex justify-between items-center py-2 border-b border-white/10 text-sm">
                <span>النتيجة الإجمالية</span>
                <span className="font-mono font-black text-amber-400 text-lg">{calc.score.total} / 100</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10 text-sm">
                <span>مسافة الاستقرار (Calibers)</span>
                <span className="font-mono font-bold text-cyan-300">
                  {calc.metrics.stabilityIndicator.toFixed(2)} cal
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10 text-sm">
                <span>تصنيف الاستقرار</span>
                <span className="font-bold text-emerald-300">{calc.metrics.stabilityClassification}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm">
                <span>نسبة مساحة الزعانف</span>
                <span className="font-mono font-bold text-indigo-300">
                  {calc.metrics.finRatioPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-lg w-full p-8 text-center space-y-6 border-2 border-amber-500/50 animate-fade-in">
            <div className="text-7xl animate-bounce">🏆</div>
            <h2 className="text-3xl font-black text-amber-300">أبدعت أيها المهندس!</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              لقد نجحت في تصميم صاروخ متوازن بدرجة عالية تحقيقًا لجميع معايير الاستقرار والنسب الهندسية المثالية.
            </p>
            <div className="bg-amber-500/20 border border-amber-500/40 p-4 rounded-2xl">
              <div className="text-xs text-amber-200">وسام جديد تم فتحه</div>
              <div className="text-xl font-black text-amber-300 mt-1">🏅 وسام مهندس فضاء</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => router.push('/leaderboard')}
                className="flex-1 gradient-btn py-3 rounded-xl font-bold text-space-950"
              >
                🏆 لوحة المهندسين
              </button>
              <button
                onClick={() => router.push('/summary')}
                className="flex-1 glass-card border border-white/20 py-3 rounded-xl font-bold hover:bg-white/10"
              >
                📋 عرض ملخصي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Failure Modal */}
      {showFailureModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-lg w-full p-8 text-center space-y-6 border-2 border-red-500/50">
            <div className="text-6xl">⚠️</div>
            <h2 className="text-2xl font-black text-red-400">انتهت المحاولات الخمس</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              استهلكت المحاولات الـ 5 المتاحة دون الوصول للنتيجة المطلوبة. تذكر أن مركز الضغط (CP) يجب أن يكون خلف مركز الكتلة (CG) بمقدار 1 إلى 2 من قطر الصاروخ!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => router.push('/lab')}
                className="flex-1 gradient-btn py-3 rounded-xl font-bold text-space-950"
              >
                🔧 العودة للمختبر للتدرّب
              </button>
              <button
                onClick={() => setShowFailureModal(false)}
                className="flex-1 glass-card border border-white/20 py-3 rounded-xl font-bold hover:bg-white/10"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
