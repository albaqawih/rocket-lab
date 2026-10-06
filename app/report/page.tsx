'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RocketSVG from '@/components/rocket/RocketSVG';
import { getSession } from '@/lib/storage/localStorage';
import { SessionData, RocketDesign } from '@/lib/engine/types';

export default function TeacherReportPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [bestDesign, setBestDesign] = useState<RocketDesign | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s?.student) {
      router.push('/register');
      return;
    }
    setSession(s);

    if (s.designs.length > 0) {
      const sorted = [...s.designs].sort((a, b) => b.score.total - a.score.total);
      setBestDesign(sorted[0]);
    }
  }, [router]);

  if (!session?.student) return null;

  const { student, bestScore, badges, experiments, challengeAttempts, challengeCompleted } = session;

  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans dir-rtl p-4 md:p-8 print:p-0 print:bg-white print:text-black">
      {/* Action Bar (Hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center bg-slate-800 p-4 rounded-2xl border border-slate-700 print:hidden">
        <button
          onClick={() => router.back()}
          className="text-slate-300 hover:text-white text-sm font-bold flex items-center gap-1"
        >
          <span>➡️</span> العودة
        </button>
        <button
          onClick={() => window.print()}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-6 py-2.5 rounded-xl text-sm shadow-lg flex items-center gap-2 transition-all"
        >
          <span>🖨️</span> طباعة التقرير (A4 / PDF)
        </button>
      </div>

      {/* A4 Printable Sheet Container */}
      <div className="max-w-4xl mx-auto bg-white text-slate-900 p-8 md:p-12 rounded-2xl shadow-2xl print:shadow-none print:rounded-none print:w-full print:max-w-none space-y-8 border border-slate-200">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex justify-between items-center">
          <div>
            <div className="text-xs font-bold text-slate-500">المملكة العربية السعودية — وزارة التعليم</div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">تقرير تقويم الأداء العلمي للمهندس الصغير</h1>
            <p className="text-xs text-slate-600 mt-0.5">مختبر الصاروخ الذكي — منصة ثورة الصواريخ</p>
          </div>
          <div className="text-left font-mono text-xs text-slate-500">
            <div>التاريخ: {currentDate}</div>
            <div>معرّف التقرير: #{student.id.slice(0, 8)}</div>
          </div>
        </div>

        {/* Student Profile Info */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">اسم الطالب:</span>
            <span className="font-black text-sm text-slate-900">{student.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">الصف الدراسي:</span>
            <span className="font-bold text-slate-900">{student.className}</span>
          </div>
          <div>
            <span className="text-slate-500 block">المدرسة:</span>
            <span className="font-bold text-slate-900">{student.school}</span>
          </div>
          <div>
            <span className="text-slate-500 block">الدرجة النهائية:</span>
            <span className="font-black text-base text-emerald-700 font-mono">{bestScore} / 100</span>
          </div>
        </div>

        {/* Evaluation Summary Cards */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500">التجريب والتطبيق</div>
            <div className="text-2xl font-black text-indigo-700 font-mono mt-1">{experiments.length} تجارب</div>
            <div className="text-[10px] text-slate-400 mt-0.5">دورة منهج علمي كاملة</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500">التحدي النهائي</div>
            <div className="text-lg font-black text-slate-900 mt-1">
              {challengeCompleted ? '✅ اجتاز التحدي' : '⏳ قيد المحاولة'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{challengeAttempts} محاولات مستهلكة</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500">الأوسمة المستحقة</div>
            <div className="text-2xl font-black text-amber-600 font-mono mt-1">{badges.length} / 6</div>
            <div className="text-[10px] text-slate-400 mt-0.5">وسام تم فتحه</div>
          </div>
        </div>

        {/* Best Design & Scientific Metrics */}
        {bestDesign && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold border-r-4 border-emerald-600 pr-3 text-slate-900">
              📊 نتائج تحليل أفضل نموذج مصمم
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="md:col-span-5 flex justify-center">
                <RocketSVG
                  inputs={bestDesign.inputs}
                  cgCm={bestDesign.metrics.cgCm}
                  cpCm={bestDesign.metrics.cpCm}
                  rocketLengthCm={bestDesign.inputs.rocketLengthCm}
                  className="max-h-64"
                />
              </div>

              <div className="md:col-span-7 space-y-3 text-xs">
                <table className="w-full text-right border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 text-slate-500">مؤشر الاستقرار (Calibers):</td>
                      <td className="py-2 font-black font-mono text-emerald-800">
                        {bestDesign.metrics.stabilityIndicator.toFixed(2)} cal ({bestDesign.metrics.stabilityClassification})
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 text-slate-500">موقع مركز الكتلة (CG):</td>
                      <td className="py-2 font-mono font-bold">{bestDesign.metrics.cgCm.toFixed(1)} cm</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 text-slate-500">موقع مركز الضغط (CP):</td>
                      <td className="py-2 font-mono font-bold">{bestDesign.metrics.cpCm.toFixed(1)} cm</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2 text-slate-500">نسبة الطول إلى القطر (L/D):</td>
                      <td className="py-2 font-mono font-bold">
                        {bestDesign.metrics.lengthDiameterRatio.toFixed(1)} ({bestDesign.metrics.ldClassification})
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-500">نسبة مساحة الزعانف:</td>
                      <td className="py-2 font-mono font-bold">
                        {bestDesign.metrics.finRatioPercent.toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Scientific Competencies Matrix */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold border-r-4 border-indigo-600 pr-3 text-slate-900">
            🎯 مصفوفة الكفايات والمهارات العلمية
          </h2>

          <table className="w-full text-right text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">الكفاية العلمية المستهدفة</th>
                <th className="p-3 text-center">المعيار</th>
                <th className="p-3 text-center">مستوى الإتقان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-3 font-bold">مفهوم استقرار الصواريخ (CG vs CP)</td>
                <td className="p-3 text-slate-600 text-center">وضع CP خلف CG بمقدار 1 - 2 cal</td>
                <td className="p-3 text-center font-bold text-emerald-700">
                  {bestDesign?.metrics.stabilityClassification === 'استقرار مثالي' ? 'متقن ممتاز ✅' : 'متقن جزيئاً ⏳'}
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold">النسب الهندسية وديناميكا الهواء (L/D)</td>
                <td className="p-3 text-slate-600 text-center">نسبة L/D بين 8 و 15</td>
                <td className="p-3 text-center font-bold text-emerald-700">
                  {bestDesign?.metrics.ldClassification === 'مثالي' ? 'متقن ممتاز ✅' : 'مقبول ⏳'}
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold">المنهج العلمي والصياغة العلمية</td>
                <td className="p-3 text-slate-600 text-center">صياغة الفرضية وتوثيق الملاحظة</td>
                <td className="p-3 text-center font-bold text-emerald-700">
                  {experiments.length >= 1 ? 'متقن ممتاز ✅' : 'يحتاج ممارسة ⏳'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Teacher Signature Box */}
        <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-2">
            <div className="font-bold text-slate-800">ملاحظات معلم العلوم / المشرف:</div>
            <div className="h-20 bg-slate-50 rounded-xl border border-slate-200 p-2 text-slate-400 italic">
              ........................................................................................................................................
            </div>
          </div>
          <div className="flex flex-col justify-between items-end text-left">
            <div>
              <div className="font-bold text-slate-800">توقيع المعلم: ............................</div>
              <div className="text-slate-500 mt-1">ختم المدرسة:</div>
            </div>
            <div className="text-[10px] text-slate-400">طُبع بواسطة منصة ثورة الصواريخ التعليمية</div>
          </div>
        </div>
      </div>
    </div>
  );
}
