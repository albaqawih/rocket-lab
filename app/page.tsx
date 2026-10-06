'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/storage/localStorage';

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (session?.student && session.onboardingDone) {
      // Returning user — handled by redirect page, but let welcome show first
    }
  }, []);

  const session = typeof window !== 'undefined' ? getSession() : null;
  const studentName = session?.student?.name;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="starfield" />

      {/* Animated rocket background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
        <svg width="600" height="600" viewBox="0 0 600 600" className="animate-spin-slow">
          <circle cx="300" cy="300" r="280" fill="none" stroke="rgba(255,107,53,0.5)" strokeWidth="1" strokeDasharray="8 4" />
          <circle cx="300" cy="300" r="200" fill="none" stroke="rgba(255,165,0,0.4)" strokeWidth="1" strokeDasharray="4 8" />
        </svg>
      </div>

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto animate-fade-in-up">
        {/* Stars decoration */}
        <div className="flex justify-center gap-2 mb-6">
          {['✦', '✧', '✦', '✧', '✦'].map((s, i) => (
            <span key={i} className="text-star-yellow opacity-70 text-sm" style={{ animationDelay: `${i * 0.2}s` }}>
              {s}
            </span>
          ))}
        </div>

        {/* Logo / Emblem */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rocket-orange to-engine-glow flex items-center justify-center animate-pulse-glow">
              <span className="text-5xl">🚀</span>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-star-yellow rounded-full flex items-center justify-center text-xs font-bold text-black">
              🌟
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-black mb-3 gradient-text-orange leading-tight">
          ثورة الصواريخ
        </h1>

        <div className="text-xl md:text-2xl font-bold text-white/80 mb-8">
          مختبر الصاروخ الذكي
        </div>

        {/* Main card */}
        <div className="glass-card-bright p-8 mb-8">
          {studentName ? (
            // Returning user
            <>
              <h2 className="text-2xl font-bold mb-2">
                مرحبًا بعودتك يا {studentName.split(' ')[0]}! 👋
              </h2>
              <p className="text-white/60 mb-6">
                هل تريد متابعة مهمتك الفضائية أم بدء مهمة جديدة؟
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  className="btn-primary flex-1"
                  onClick={() => router.push('/lab')}
                >
                  🚀 متابعة المهمة
                </button>
                <button
                  className="btn-secondary flex-1"
                  onClick={() => {
                    if (confirm('هل تريد حذف جميع بياناتك وبدء مهمة جديدة؟')) {
                      localStorage.clear();
                      router.push('/register');
                    }
                  }}
                >
                  🔄 بدء مهمة جديدة
                </button>
              </div>
            </>
          ) : (
            // New user
            <>
              <p className="text-xl md:text-2xl font-semibold text-white/90 leading-relaxed mb-2">
                مرحبًا بك أيها المهندس!
              </p>
              <p className="text-lg text-white/65 leading-relaxed mb-6">
                قبل أن تبدأ مهمتك الفضائية، عرّفنا بنفسك.
              </p>
              <button
                className="btn-primary w-full sm:w-auto text-lg px-12 py-4"
                onClick={() => router.push('/register')}
              >
                ابدأ المهمة 🚀
              </button>
            </>
          )}
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '🛸', label: 'صمّم صاروخك' },
            { icon: '📊', label: 'حلّل النتائج' },
            { icon: '🤖', label: 'استعن بالذكاء الاصطناعي' },
          ].map((item, i) => (
            <div key={i} className="glass-card p-4">
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="text-xs text-white/60 font-medium">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Leaderboard link */}
        <button
          onClick={() => router.push('/leaderboard')}
          className="mt-6 text-star-yellow/70 hover:text-star-yellow text-sm underline underline-offset-4 transition-colors"
        >
          🏆 لوحة مهندسي الفضاء
        </button>
      </div>
    </div>
  );
}
