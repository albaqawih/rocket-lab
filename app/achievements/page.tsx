'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/ui/Navigation';
import { getSession, checkAndAwardBadges } from '@/lib/storage/localStorage';
import { BadgeId } from '@/lib/engine/types';

interface BadgeDefinition {
  id: BadgeId;
  title: string;
  description: string;
  icon: string;
  category: string;
}

const BADGES: BadgeDefinition[] = [
  {
    id: 'beginner-engineer',
    title: 'مهندس مبتدئ',
    description: 'قم بإكمال أول تصميم صاروخ بنجاح واحتساب مؤشراته العلمية',
    icon: '🚀',
    category: 'الأساسيات',
  },
  {
    id: 'stability-researcher',
    title: 'باحث الاستقرار',
    description: 'قم بمقارنة تصميمين مختلفين (A/B) وتحليل فرق الاستقرار بينهما',
    icon: '⚖️',
    category: 'المقارنة والتفكير',
  },
  {
    id: 'fin-expert',
    title: 'خبير الزعانف',
    description: 'قم بتنفيذ تجربة علمية تركز على تعديل زوايا أو أبعاد الزعانف',
    icon: '🪶',
    category: 'التجريب',
  },
  {
    id: 'mass-engineer',
    title: 'مهندس الكتلة',
    description: 'قم باختبار تأثير توزيعين مختلفين للكتلة على مركز ثقل الصاروخ',
    icon: '🎯',
    category: 'التجريب',
  },
  {
    id: 'young-scientist',
    title: 'عالم صغير',
    description: 'أكمل دورة المنهج العلمي الكاملة (فرضية → تجربة → نتيجة → استنتاج)',
    icon: '🔬',
    category: 'البحث العلمي',
  },
  {
    id: 'space-engineer',
    title: 'مهندس فضاء',
    description: 'نجحت في اجتياز التحدي النهائي وتصميم صاروخ فضاء متوازن تماماً',
    icon: '🏆',
    category: 'الإنجاز الأكبر',
  },
];

export default function AchievementsPage() {
  const router = useRouter();
  const [unlockedBadges, setUnlockedBadges] = useState<BadgeId[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session?.student) {
      router.push('/register');
      return;
    }
    // Check and update any newly earned badges
    const updated = checkAndAwardBadges();
    const currentBadges = getSession()?.badges || [];
    setUnlockedBadges(currentBadges);
    setLoaded(true);
  }, [router]);

  if (!loaded) return null;

  const progressPercent = Math.round((unlockedBadges.length / BADGES.length) * 100);

  return (
    <div className="min-h-screen bg-space-950 text-white flex flex-col dir-rtl">
      <Navigation />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="glass-card p-6 md:p-8 relative overflow-hidden text-center sm:text-right">
          <div className="absolute -left-10 -bottom-10 text-9xl opacity-10 pointer-events-none">🎖️</div>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3">
            سجل الإنجازات
          </div>
          <h1 className="text-3xl font-black text-white mb-2">🏅 أوسمة مهندس الصواريخ</h1>
          <p className="text-white/70 max-w-2xl text-sm leading-relaxed">
            اكسب الأوسمة والشارات العلمية أثناء استكشافك لمبادئ ديناميكا الهواء واستقرار الصواريخ!
          </p>

          {/* Progress Bar */}
          <div className="mt-6 max-w-xl">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span>نسبة إكمال الأوسمة</span>
              <span className="text-amber-400 font-mono font-black">
                {unlockedBadges.length} من {BADGES.length} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-space-800 rounded-full h-3 overflow-hidden p-0.5 border border-white/10">
              <div
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BADGES.map((badge) => {
            const isUnlocked = unlockedBadges.includes(badge.id);

            return (
              <div
                key={badge.id}
                className={`glass-card p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                  isUnlocked
                    ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-transparent shadow-lg shadow-amber-500/5'
                    : 'opacity-60 border-white/10 grayscale-[50%]'
                }`}
              >
                {isUnlocked && (
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/20 blur-xl pointer-events-none" />
                )}

                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-space-900 border border-white/10 flex items-center justify-center text-3xl shadow-inner">
                      {badge.icon}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        isUnlocked
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-white/5 text-white/40 border-white/10'
                      }`}
                    >
                      {isUnlocked ? '✅ تم الفتح' : '🔒 مغلق'}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-amber-400/80 mb-1">{badge.category}</div>
                  <h3 className="text-lg font-black text-white mb-2">{badge.title}</h3>
                  <p className="text-xs text-white/70 leading-relaxed mb-4">{badge.description}</p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-white/40">شرط الحصول:</span>
                  <span className={`font-bold ${isUnlocked ? 'text-amber-300' : 'text-white/50'}`}>
                    {isUnlocked ? 'مكتمل' : 'معلّق'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action shortcut */}
        <div className="glass-card p-6 text-center space-y-3">
          <h3 className="text-lg font-bold">هل ترغب في فتح المزيد من الأوسمة؟</h3>
          <p className="text-xs text-white/60">جرب إجراء تجارب جديدة أو خوض التحدي النهائي الآن.</p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={() => router.push('/experiment')}
              className="gradient-btn px-6 py-2.5 rounded-xl font-bold text-space-950 text-sm"
            >
              🔬 إجراء تجربة علمية
            </button>
            <button
              onClick={() => router.push('/challenge')}
              className="glass-card border border-white/20 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-white/10"
            >
              🏆 التحدي النهائي
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
