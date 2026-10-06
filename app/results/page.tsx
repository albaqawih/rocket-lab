'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/ui/Navigation';
import { getSession } from '@/lib/storage/localStorage';
import { RocketDesign } from '@/lib/engine/types';

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const designLabel = searchParams.get('design') || 'A';

  const [design, setDesign] = useState<RocketDesign | null>(null);
  const [studentName, setStudentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [submitMessage, setSubmitMessage] = useState('');
  const [newBadges, setNewBadges] = useState<string[]>([]);

  useEffect(() => {
    const session = getSession();
    if (!session?.student) { router.replace('/register'); return; }
    setStudentName(session.student.name.split(' ')[0]);

    const found = session.designs.find(d => d.label === designLabel) ||
      session.designs[session.designs.length - 1];
    if (!found) { router.replace('/lab'); return; }
    setDesign(found);

    // Check new badges
    const badgeNames: Record<string, string> = {
      'beginner-engineer': '🏅 مهندس مبتدئ',
      'stability-researcher': '🔬 باحث الاستقرار',
      'fin-expert': '🪶 خبير الزعانف',
      'mass-engineer': '⚖️ مهندس الكتلة',
      'young-scientist': '🧪 عالم صغير',
      'space-engineer': '🚀 مهندس فضاء',
    };

    // Show badges earned (simplified — show all earned badges)
    setNewBadges(session.badges.map(b => badgeNames[b] || b));

    // Auto-submit to leaderboard
    handleLeaderboardSubmit(session, found);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, designLabel]);

  async function handleLeaderboardSubmit(session: ReturnType<typeof getSession>, found: RocketDesign) {
    if (!session?.student || !found) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: {
            name: session.student.name,
            className: session.student.className,
            school: session.student.school,
          },
          inputs: found.inputs,
          badges: session.badges,
          experimentCount: session.experiments.length,
          challengeAttempts: session.challengeAttempts,
        }),
      });
      const data = await res.json();
      if (data.rank) {
        setRank(data.rank);
        if (data.rank <= 3) {
          setSubmitMessage(`رائع! وصلت إلى المركز ${data.rank === 1 ? 'الأول' : data.rank === 2 ? 'الثاني' : 'الثالث'} في لوحة مهندسي الفضاء. 🏆`);
        }
      }
    } catch {
      // Silent fail — leaderboard is optional
    }
    setSubmitting(false);
  }

  if (!design) return <div className="min-h-screen flex items-center justify-center"><div className="starfield" /><div className="text-white/50">جارٍ التحميل...</div></div>;

  const { score } = design;

  function scoreColor(s: number) {
    if (s >= 90) return '#ffd700';
    if (s >= 75) return '#22c55e';
    if (s >= 60) return '#38bdf8';
    if (s >= 40) return '#f59e0b';
    return '#fb923c';
  }

  // SVG score ring
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score.total / 100) * circumference;

  return (
    <div className="min-h-screen">
      <div className="starfield" />
      <Navigation />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Celebration header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="text-5xl mb-4">
            {score.total >= 90 ? '🏆' : score.total >= 75 ? '🎉' : score.total >= 60 ? '👏' : '💪'}
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ color: scoreColor(score.total) }}>
            {score.classification}
          </h1>
          {studentName && (
            <p className="text-lg text-white/65">
              أحسنت يا {studentName}! لقد أتممت تصميمك.
            </p>
          )}
        </div>

        {/* Score ring */}
        <div className="flex justify-center mb-8 animate-fade-in-up delay-100">
          <div className="relative">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
              <circle
                cx="80" cy="80" r={radius}
                fill="none"
                stroke={scoreColor(score.total)}
                strokeWidth="12"
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeDashoffset={circumference / 4}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
                style={{ transition: 'stroke-dasharray 1s ease-out', filter: `drop-shadow(0 0 12px ${scoreColor(score.total)}88)` }}
              />
              <text x="80" y="75" textAnchor="middle" fontSize="32" fontWeight="900" fill={scoreColor(score.total)} fontFamily="Cairo">
                {score.total}
              </text>
              <text x="80" y="98" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.4)" fontFamily="Cairo">
                من 100
              </text>
            </svg>
          </div>
        </div>

        {/* Leaderboard position */}
        {(submitting || rank !== null) && (
          <div className="glass-card-bright p-4 mb-6 text-center animate-fade-in-up">
            {submitting ? (
              <div className="flex items-center justify-center gap-2 text-white/60">
                <div className="w-4 h-4 rounded-full border-2 border-star-yellow border-t-transparent animate-spin" />
                جارٍ تحديث لوحة المهندسين...
              </div>
            ) : (
              <>
                <div className="text-lg font-bold text-star-yellow">
                  نتيجتك: {score.total}/100
                </div>
                {rank && <div className="text-white/60 text-sm mt-1">ترتيبك الحالي: {rank}</div>}
                {submitMessage && <div className="text-star-yellow text-sm mt-2 font-semibold">{submitMessage}</div>}
              </>
            )}
          </div>
        )}

        {/* Score components grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 animate-fade-in-up delay-200">
          {[
            { label: 'الاستقرار', score: score.stabilityScore, max: 40, icon: '🎯' },
            { label: 'الزعانف', score: score.finScore, max: 20, icon: '🪶' },
            { label: 'الأبعاد', score: score.proportionScore, max: 15, icon: '📏' },
            { label: 'الكتلة', score: score.massScore, max: 15, icon: '⚖️' },
            { label: 'التناسق', score: score.consistencyScore, max: 10, icon: '✅' },
          ].map((c, i) => (
            <div key={i} className="glass-card p-4 text-center">
              <div className="text-2xl mb-1">{c.icon}</div>
              <div className="text-xs text-white/50 mb-1">{c.label}</div>
              <div className="font-black text-xl" style={{ color: scoreColor((c.score / c.max) * 100) }}>
                {c.score}
              </div>
              <div className="text-xs text-white/30">/{c.max}</div>
            </div>
          ))}
        </div>

        {/* Badges earned */}
        {newBadges.length > 0 && (
          <div className="glass-card-bright p-5 mb-6 animate-fade-in-up delay-300">
            <h3 className="font-bold text-star-yellow mb-3">🏅 شاراتك</h3>
            <div className="flex flex-wrap gap-2">
              {newBadges.map((b, i) => (
                <span key={i} className="badge-card text-sm">{b}</span>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in-up delay-400">
          <button className="btn-primary py-3" onClick={() => router.push('/experiment')}>
            🔬 وضع التجربة
          </button>
          <button className="btn-secondary py-3" onClick={() => router.push('/compare')}>
            ⚖️ مقارنة A/B
          </button>
          <button className="btn-secondary py-3" onClick={() => router.push('/challenge')}>
            🏆 التحدي الأخير
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="starfield" /><div className="text-white/50">جارٍ التحميل...</div></div>}>
      <ResultsContent />
    </Suspense>
  );
}
