'use client';

import { usePathname, useRouter } from 'next/navigation';
import { getSession } from '@/lib/storage/localStorage';

const NAV_ITEMS = [
  { href: '/', label: 'الرئيسية', icon: '🏠' },
  { href: '/lab', label: 'مختبر التصميم', icon: '🔧' },
  { href: '/experiment', label: 'تجاربي', icon: '🔬' },
  { href: '/achievements', label: 'إنجازاتي', icon: '🏅' },
  { href: '/leaderboard', label: 'لوحة المهندسين', icon: '🏆' },
  { href: '/summary', label: 'ملخصي', icon: '📋' },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const session = typeof window !== 'undefined' ? getSession() : null;
  const firstName = session?.student?.name?.split(' ')[0] || '';

  if (!session?.student) return null;

  return (
    <nav className="nav-bar">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 font-black text-lg shrink-0"
        >
          <span className="text-2xl">🚀</span>
          <span className="gradient-text-orange hidden sm:block">ثورة الصواريخ</span>
        </button>

        {/* Nav links - scrollable on mobile */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`nav-link ${pathname === item.href ? 'active' : ''} flex items-center gap-1.5`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="hidden lg:block">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Student badge */}
        {firstName && (
          <div className="shrink-0 glass-card px-3 py-1.5 text-xs font-semibold text-white/70 flex items-center gap-1.5 mr-2">
            <span>👤</span>
            <span className="hidden sm:block">{firstName}</span>
          </div>
        )}
      </div>
    </nav>
  );
}
