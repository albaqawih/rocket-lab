'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, completeOnboarding } from '@/lib/storage/localStorage';

const SLIDES = [
  {
    icon: '🎯',
    title: 'مهمتك',
    description:
      'صمّم صاروخًا افتراضيًا واكتشف كيف تؤثر أبعاده في استقراره.',
    color: 'from-rocket-orange/20 to-rocket-amber/10',
    accent: '#ff6b35',
  },
  {
    icon: '🔬',
    title: 'فكّر كمهندس',
    description:
      'غيّر المتغيرات، ضع فرضيتك، ثم اختبرها بالمحاكاة.',
    color: 'from-blue-500/20 to-indigo-500/10',
    accent: '#38bdf8',
  },
  {
    icon: '🤖',
    title: 'استعن بمهندس الفضاء الذكي',
    description:
      'سيشرح لك الذكاء الاصطناعي نتائج الحسابات، لكنه لن يغيّرها.',
    color: 'from-purple-500/20 to-pink-500/10',
    accent: '#c084fc',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    const session = getSession();
    if (!session?.student) {
      router.replace('/register');
      return;
    }
    setStudentName(session.student.name.split(' ')[0]);
  }, [router]);

  function handleNext() {
    if (current < SLIDES.length - 1) {
      setCurrent(current + 1);
    } else {
      finishOnboarding();
    }
  }

  function finishOnboarding() {
    completeOnboarding();
    router.push('/lab');
  }

  const slide = SLIDES[current];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="starfield" />

      <div className="relative z-10 w-full max-w-lg mx-auto">
        {/* Skip button */}
        <div className="flex justify-end mb-6">
          <button className="btn-ghost text-sm" onClick={finishOnboarding}>
            تخطي المقدمة ←
          </button>
        </div>

        {/* Slide card */}
        <div
          key={current}
          className={`glass-card-bright p-10 text-center animate-fade-in-up bg-gradient-to-br ${slide.color}`}
        >
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-8 opacity-100'
                    : 'w-2 opacity-30'
                }`}
                style={{ background: slide.accent }}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="text-7xl mb-6 animate-float">{slide.icon}</div>

          {/* Slide number */}
          <div
            className="text-xs font-semibold mb-3 opacity-60"
            style={{ color: slide.accent }}
          >
            الشاشة {current + 1} من {SLIDES.length}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-black mb-4" style={{ color: slide.accent }}>
            {slide.title}
          </h2>

          {/* Description */}
          <p className="text-lg text-white/75 leading-relaxed mb-8">
            {slide.description}
          </p>

          {/* Student name encouragement on last slide */}
          {current === SLIDES.length - 1 && studentName && (
            <div className="glass-card p-3 mb-6 text-sm text-white/70">
              جاهز يا {studentName} لتصميم صاروخك؟ 🚀
            </div>
          )}

          {/* Button */}
          <button
            className="btn-primary w-full text-lg py-4"
            onClick={handleNext}
            style={{
              background: current === SLIDES.length - 1
                ? 'linear-gradient(135deg, #ff6b35, #ff4500)'
                : `linear-gradient(135deg, ${slide.accent}cc, ${slide.accent}88)`,
            }}
          >
            {current < SLIDES.length - 1 ? 'التالي →' : 'ابدأ التصميم 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}
