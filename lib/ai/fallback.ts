import { AIInputContract } from '../engine/types';

export interface AIExplanationResult {
  text: string;
  isFallback: boolean;
}

/**
 * Build deterministic fallback Arabic explanation from strengths/weaknesses.
 * Used when OpenRouter is unavailable.
 */
export function buildFallbackExplanation(
  data: AIInputContract
): AIExplanationResult {
  const { strengths, weaknesses, score, student } = data;

  let text = `أهلاً يا ${student.name}! إليك نتائج تصميمك:\n\n`;

  text += `حصل تصميمك على ${score.total} من 100 نقطة (${score.classification}).\n\n`;

  if (strengths.length > 0) {
    text += 'نقاط القوة في تصميمك:\n';
    strengths.forEach((s, i) => {
      text += `${i + 1}. ${s}\n`;
    });
    text += '\n';
  }

  if (weaknesses.length > 0) {
    text += 'نقاط تحتاج إلى تحسين:\n';
    weaknesses.forEach((w, i) => {
      text += `${i + 1}. ${w}\n`;
    });
    text += '\n';
  }

  text +=
    'جرّب تغيير متغير واحد فقط في المرة القادمة وراقب كيف تتغير النتيجة. هذه هي طريقة المهندس الحقيقي!';

  return { text, isFallback: true };
}
