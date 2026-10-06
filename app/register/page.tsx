'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createNewSession } from '@/lib/storage/localStorage';

interface FormErrors {
  name?: string;
  className?: string;
  school?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [school, setSchool] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = 'يرجى كتابة اسم الطالب';
    if (!className.trim()) newErrors.className = 'يرجى تحديد الفصل';
    if (!school.trim()) newErrors.school = 'يرجى كتابة اسم المدرسة';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    createNewSession(name.trim(), className.trim(), school.trim());
    setTimeout(() => router.push('/onboarding'), 300);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="starfield" />

      <div className="relative z-10 w-full max-w-md mx-auto animate-fade-in-up">
        {/* Back */}
        <button
          className="btn-ghost mb-4 text-sm"
          onClick={() => router.push('/')}
        >
          ← العودة
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 animate-float">🚀</div>
          <h1 className="text-3xl font-black gradient-text-orange mb-2">
            ثورة الصواريخ
          </h1>
          <p className="text-white/60">
            مختبر الصاروخ الذكي
          </p>
        </div>

        <div className="glass-card-bright p-8">
          <h2 className="text-xl font-bold mb-1">مرحبًا بك أيها المهندس!</h2>
          <p className="text-white/55 text-sm mb-6 leading-relaxed">
            قبل أن تبدأ مهمتك الفضائية، عرّفنا بنفسك.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* اسم الطالب */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-white/80 mb-2">
                اسم الطالب <span className="text-rocket-orange">*</span>
              </label>
              <input
                id="student-name"
                type="text"
                className={`input-field ${errors.name ? 'error' : ''}`}
                placeholder="أدخل اسمك الكامل"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
                autoComplete="name"
                maxLength={80}
              />
              {errors.name && (
                <p className="mt-1.5 text-red-400 text-sm flex items-center gap-1">
                  <span>⚠️</span> {errors.name}
                </p>
              )}
            </div>

            {/* الفصل */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-white/80 mb-2">
                الفصل <span className="text-rocket-orange">*</span>
              </label>
              <input
                id="class-name"
                type="text"
                className={`input-field ${errors.className ? 'error' : ''}`}
                placeholder="مثال: 2/أ أو الثاني متوسط أ"
                value={className}
                onChange={(e) => { setClassName(e.target.value); setErrors(prev => ({ ...prev, className: undefined })); }}
                maxLength={50}
              />
              {errors.className && (
                <p className="mt-1.5 text-red-400 text-sm flex items-center gap-1">
                  <span>⚠️</span> {errors.className}
                </p>
              )}
            </div>

            {/* المدرسة */}
            <div className="mb-7">
              <label className="block text-sm font-semibold text-white/80 mb-2">
                المدرسة <span className="text-rocket-orange">*</span>
              </label>
              <input
                id="school-name"
                type="text"
                className={`input-field ${errors.school ? 'error' : ''}`}
                placeholder="أدخل اسم مدرستك"
                value={school}
                onChange={(e) => { setSchool(e.target.value); setErrors(prev => ({ ...prev, school: undefined })); }}
                maxLength={100}
              />
              {errors.school && (
                <p className="mt-1.5 text-red-400 text-sm flex items-center gap-1">
                  <span>⚠️</span> {errors.school}
                </p>
              )}
            </div>

            <button
              id="start-mission-btn"
              type="submit"
              className="btn-primary w-full text-lg py-4"
              disabled={loading}
            >
              {loading ? 'جارٍ التحضير...' : 'ابدأ المهمة 🚀'}
            </button>
          </form>

          {/* Privacy note */}
          <p className="mt-5 text-xs text-white/35 text-center leading-relaxed">
            تُحفظ بياناتك محليًا على جهازك وتُستخدم فقط للمشاركة في هذا المختبر التعليمي.
          </p>
        </div>
      </div>
    </div>
  );
}
