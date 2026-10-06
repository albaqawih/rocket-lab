/**
 * DETERMINISTIC CALCULATION ENGINE
 * All functions are pure — no randomness, no AI, no side effects.
 * The same inputs must always produce the same numerical result.
 */

import {
  RocketInputs,
  NoseShape,
  FinPosition,
  MassDistribution,
  LDResult,
  FinRatioResult,
  CGResult,
  CPResult,
  StabilityResult,
  Metrics,
  ScoreResult,
  FullCalculationResult,
} from './types';

// ==============================
// L/D Ratio
// ==============================

export function calculateLD(
  rocketLengthCm: number,
  bodyDiameterCm: number
): LDResult {
  const value = parseFloat((rocketLengthCm / bodyDiameterCm).toFixed(2));
  let classification: string;

  if (value < 5) {
    classification = 'جسم عريض نسبيًا';
  } else if (value < 8) {
    classification = 'تناسق مقبول';
  } else if (value <= 15) {
    classification = 'تناسق جيد';
  } else {
    classification = 'جسم نحيف جدًا في نموذج المحاكاة';
  }

  return { value, classification };
}

// ==============================
// Fin Ratio
// ==============================

export function calculateFinRatio(
  finBaseLengthCm: number,
  finHeightCm: number,
  numberOfFins: number,
  rocketLengthCm: number,
  bodyDiameterCm: number
): FinRatioResult {
  const finArea = 0.5 * finBaseLengthCm * finHeightCm;
  const totalFinArea = finArea * numberOfFins;
  const bodyReferenceArea = rocketLengthCm * bodyDiameterCm;
  const finRatio = totalFinArea / bodyReferenceArea;
  const finRatioPercent = parseFloat((finRatio * 100).toFixed(4));

  return {
    finArea,
    totalFinArea,
    bodyReferenceArea,
    finRatio,
    finRatioPercent,
  };
}

// ==============================
// Center of Gravity (CG)
// ==============================

export function calculateCG(
  rocketLengthCm: number,
  massDistribution: MassDistribution
): CGResult {
  let cgCm: number;

  switch (massDistribution) {
    case 'front':
      cgCm = 0.42 * rocketLengthCm;
      break;
    case 'balanced':
      cgCm = 0.50 * rocketLengthCm;
      break;
    case 'rear':
      cgCm = 0.58 * rocketLengthCm;
      break;
  }

  return { cgCm: parseFloat(cgCm.toFixed(2)) };
}

// ==============================
// Center of Pressure (CP)
// ==============================

export function calculateCP(
  rocketLengthCm: number,
  finPosition: FinPosition,
  noseShape: NoseShape
): CPResult {
  const cpBase = 0.65 * rocketLengthCm;

  let finPositionModifier: number;
  switch (finPosition) {
    case 'low':
      finPositionModifier = 0.08 * rocketLengthCm;
      break;
    case 'medium':
      finPositionModifier = 0.03 * rocketLengthCm;
      break;
    case 'high':
      finPositionModifier = -0.03 * rocketLengthCm;
      break;
  }

  let noseShapeModifier: number;
  switch (noseShape) {
    case 'conical':
      noseShapeModifier = 0;
      break;
    case 'rounded':
      noseShapeModifier = -0.01 * rocketLengthCm;
      break;
    case 'ogive':
      noseShapeModifier = 0.01 * rocketLengthCm;
      break;
  }

  let cp = cpBase + finPositionModifier + noseShapeModifier;

  // Clamp between 40% and 85% of rocket length
  const minCP = 0.40 * rocketLengthCm;
  const maxCP = 0.85 * rocketLengthCm;
  cp = Math.max(minCP, Math.min(maxCP, cp));

  return { cpCm: parseFloat(cp.toFixed(2)) };
}

// ==============================
// Stability Indicator
// ==============================

export function calculateStability(
  cpCm: number,
  cgCm: number,
  bodyDiameterCm: number
): StabilityResult {
  const value = parseFloat(((cpCm - cgCm) / bodyDiameterCm).toFixed(2));

  let classification: string;
  if (value < 0) {
    classification = 'غير متوازن';
  } else if (value < 1) {
    classification = 'يحتاج إلى تحسين';
  } else if (value <= 2) {
    classification = 'متوازن';
  } else {
    classification = 'استقرار مرتفع في النموذج';
  }

  return { value, classification };
}

// ==============================
// Score Calculation
// ==============================

export function calculateScore(
  stabilityIndicator: number,
  finRatioPercent: number,
  ldValue: number,
  massDistribution: MassDistribution
): ScoreResult {
  // 1. Stability — 40 points
  let stabilityScore: number;
  if (stabilityIndicator < 0) {
    stabilityScore = 5;
  } else if (stabilityIndicator < 0.5) {
    stabilityScore = 15;
  } else if (stabilityIndicator < 1) {
    stabilityScore = 28;
  } else if (stabilityIndicator <= 2) {
    stabilityScore = 40;
  } else if (stabilityIndicator <= 3) {
    stabilityScore = 35;
  } else {
    stabilityScore = 25;
  }

  // 2. Fin Geometry — 20 points
  let finScore: number;
  if (finRatioPercent < 2) {
    finScore = 8;
  } else if (finRatioPercent < 4) {
    finScore = 15;
  } else if (finRatioPercent < 8) {
    finScore = 20;
  } else if (finRatioPercent <= 12) {
    finScore = 15;
  } else {
    finScore = 8;
  }

  // 3. Body Proportions — 15 points
  let proportionScore: number;
  if (ldValue < 5) {
    proportionScore = 5;
  } else if (ldValue < 8) {
    proportionScore = 10;
  } else if (ldValue <= 15) {
    proportionScore = 15;
  } else {
    proportionScore = 8;
  }

  // 4. Mass Distribution — 15 points
  let massScore: number;
  switch (massDistribution) {
    case 'front':
      massScore = 13;
      break;
    case 'balanced':
      massScore = 15;
      break;
    case 'rear':
      massScore = 7;
      break;
  }

  // 5. Design Consistency — 10 points
  let consistencyScore = 10;
  if (ldValue < 5 || ldValue > 15) consistencyScore -= 2;
  if (finRatioPercent < 2 || finRatioPercent > 12) consistencyScore -= 2;
  if (stabilityIndicator < 0.5) consistencyScore -= 2;
  if (massDistribution === 'rear') consistencyScore -= 2;
  consistencyScore = Math.max(2, Math.min(10, consistencyScore));

  const total = Math.max(
    0,
    Math.min(
      100,
      stabilityScore + finScore + proportionScore + massScore + consistencyScore
    )
  );

  let classification: string;
  if (total >= 90) {
    classification = 'ممتاز';
  } else if (total >= 75) {
    classification = 'جيد جدًا';
  } else if (total >= 60) {
    classification = 'جيد';
  } else if (total >= 40) {
    classification = 'يحتاج إلى تطوير';
  } else {
    classification = 'جرّب تصميمًا جديدًا';
  }

  return {
    stabilityScore,
    finScore,
    proportionScore,
    massScore,
    consistencyScore,
    total,
    classification,
  };
}

// ==============================
// Strengths & Weaknesses (Deterministic)
// ==============================

export function generateStrengths(
  ldValue: number,
  finRatioPercent: number,
  stabilityIndicator: number,
  massDistribution: MassDistribution
): string[] {
  const strengths: string[] = [];

  // L/D strengths
  if (ldValue >= 5 && ldValue < 8) {
    strengths.push('نسبة طول الجسم إلى قطره مقبولة في المحاكاة.');
  }
  if (ldValue >= 8 && ldValue <= 15) {
    strengths.push('أبعاد جسم الصاروخ متناسقة بشكل جيد في المحاكاة.');
  }

  // Fin ratio strengths
  if (finRatioPercent >= 2 && finRatioPercent < 4) {
    strengths.push('مساحة الزعانف ضمن نطاق مقبول.');
  }
  if (finRatioPercent >= 4 && finRatioPercent < 8) {
    strengths.push('مساحة الزعانف متوازنة مع أبعاد جسم الصاروخ.');
  }
  if (finRatioPercent >= 8 && finRatioPercent <= 12) {
    strengths.push('مساحة الزعانف ضمن النطاق المقبول، لكنها قريبة من الحد الأعلى.');
  }

  // Stability strengths
  if (stabilityIndicator >= 0.5 && stabilityIndicator < 1) {
    strengths.push('مؤشر الاستقرار مقبول، ويمكن تحسينه.');
  }
  if (stabilityIndicator >= 1 && stabilityIndicator <= 2) {
    strengths.push('مؤشر الاستقرار ضمن النطاق المستهدف في المحاكاة.');
  }
  if (stabilityIndicator > 2 && stabilityIndicator <= 3) {
    strengths.push('يظهر التصميم مؤشر استقرار مرتفعًا في المحاكاة.');
  }

  // Mass distribution strengths
  if (massDistribution === 'front') {
    strengths.push('توزيع الكتلة الأمامي يدعم موضع مركز الكتلة في النموذج.');
  }
  if (massDistribution === 'balanced') {
    strengths.push('توزيع الكتلة متوازن في نموذج المحاكاة.');
  }

  return strengths;
}

export function generateWeaknesses(
  ldValue: number,
  finRatioPercent: number,
  stabilityIndicator: number,
  massDistribution: MassDistribution,
  cgCm: number,
  cpCm: number
): string[] {
  const weaknesses: string[] = [];

  // L/D weaknesses
  if (ldValue < 5) {
    weaknesses.push('جسم الصاروخ عريض نسبيًا مقارنة بطوله.');
  }
  if (ldValue > 15) {
    weaknesses.push('جسم الصاروخ نحيف جدًا في نموذج المحاكاة.');
  }

  // Fin ratio weaknesses
  if (finRatioPercent < 2) {
    weaknesses.push('مساحة الزعانف صغيرة نسبيًا مقارنة بجسم الصاروخ.');
  }
  if (finRatioPercent > 12) {
    weaknesses.push('مساحة الزعانف كبيرة نسبيًا مقارنة بجسم الصاروخ.');
  }

  // Stability weaknesses
  if (stabilityIndicator < 0) {
    weaknesses.push(
      'مركز الكتلة ومركز الضغط في ترتيب غير مناسب في نموذج المحاكاة.'
    );
  }
  if (stabilityIndicator >= 0 && stabilityIndicator < 0.5) {
    weaknesses.push(
      'مؤشر الاستقرار منخفض ويحتاج التصميم إلى تجربة تعديلات.'
    );
  }
  if (stabilityIndicator > 3) {
    weaknesses.push(
      'مؤشر الاستقرار أعلى من النطاق المستهدف؛ جرّب تعديل التصميم وقارن النتيجة.'
    );
  }

  // Mass distribution weaknesses
  if (massDistribution === 'rear') {
    weaknesses.push('توزيع الكتلة الخلفي خفّض تقييم توزيع الكتلة.');
  }

  // CG >= CP
  if (cgCm >= cpCm) {
    weaknesses.push(
      'موضع مركز الكتلة بالنسبة لمركز الضغط يحتاج إلى إعادة تجربة.'
    );
  }

  return weaknesses;
}

// ==============================
// Full Calculation (orchestrator)
// ==============================

export function runFullCalculation(inputs: RocketInputs): FullCalculationResult {
  const {
    rocketLengthCm,
    bodyDiameterCm,
    noseShape,
    numberOfFins,
    finHeightCm,
    finBaseLengthCm,
    finPosition,
    massDistribution,
  } = inputs;

  const ld = calculateLD(rocketLengthCm, bodyDiameterCm);
  const finRatioResult = calculateFinRatio(
    finBaseLengthCm,
    finHeightCm,
    numberOfFins,
    rocketLengthCm,
    bodyDiameterCm
  );
  const { cgCm } = calculateCG(rocketLengthCm, massDistribution);
  const { cpCm } = calculateCP(rocketLengthCm, finPosition, noseShape);
  const stability = calculateStability(cpCm, cgCm, bodyDiameterCm);

  const score = calculateScore(
    stability.value,
    finRatioResult.finRatioPercent,
    ld.value,
    massDistribution
  );

  const strengths = generateStrengths(
    ld.value,
    finRatioResult.finRatioPercent,
    stability.value,
    massDistribution
  );

  const weaknesses = generateWeaknesses(
    ld.value,
    finRatioResult.finRatioPercent,
    stability.value,
    massDistribution,
    cgCm,
    cpCm
  );

  const metrics: Metrics = {
    lengthDiameterRatio: ld.value,
    ldClassification: ld.classification,
    finRatioPercent: finRatioResult.finRatioPercent,
    cgCm,
    cpCm,
    stabilityIndicator: stability.value,
    stabilityClassification: stability.classification,
  };

  return {
    inputs,
    metrics,
    score,
    strengths,
    weaknesses,
  };
}
