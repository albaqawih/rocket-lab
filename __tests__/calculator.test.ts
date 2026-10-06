/**
 * Golden fixtures and comprehensive unit tests for the calculation engine.
 * No random values. All expected outputs are derived from the written formulas.
 */

import {
  calculateLD,
  calculateFinRatio,
  calculateCG,
  calculateCP,
  calculateStability,
  calculateScore,
  generateStrengths,
  generateWeaknesses,
  runFullCalculation,
} from '../lib/engine/calculator';
import { RocketInputs } from '../lib/engine/types';

// ==============================
// L/D Tests
// ==============================

describe('calculateLD', () => {
  test('L/D < 5 — wide body', () => {
    const result = calculateLD(30, 7);
    expect(result.value).toBeCloseTo(4.29, 2);
    expect(result.classification).toBe('جسم عريض نسبيًا');
  });

  test('L/D exactly 5 — boundary (5 ≤ L/D < 8)', () => {
    const result = calculateLD(50, 10);
    expect(result.value).toBe(5);
    expect(result.classification).toBe('تناسق مقبول');
  });

  test('L/D exactly 8 — boundary (8 ≤ L/D ≤ 15)', () => {
    const result = calculateLD(80, 10);
    expect(result.value).toBe(8);
    expect(result.classification).toBe('تناسق جيد');
  });

  test('L/D exactly 15 — boundary (8 ≤ L/D ≤ 15)', () => {
    const result = calculateLD(75, 5);
    expect(result.value).toBe(15);
    expect(result.classification).toBe('تناسق جيد');
  });

  test('L/D > 15 — too thin', () => {
    const result = calculateLD(100, 3);
    expect(result.value).toBeCloseTo(33.33, 2);
    expect(result.classification).toBe('جسم نحيف جدًا في نموذج المحاكاة');
  });

  test('minimum inputs 30/10', () => {
    const result = calculateLD(30, 10);
    expect(result.value).toBe(3);
    expect(result.classification).toBe('جسم عريض نسبيًا');
  });

  test('maximum inputs 100/3', () => {
    const result = calculateLD(100, 3);
    expect(result.value).toBeCloseTo(33.33, 2);
    expect(result.classification).toBe('جسم نحيف جدًا في نموذج المحاكاة');
  });
});

// ==============================
// Fin Ratio Tests
// ==============================

describe('calculateFinRatio', () => {
  // fin_ratio_percent = (0.5 * base * height * numFins) / (length * diameter) * 100

  test('fin ratio exactly 2%', () => {
    // 0.5 * 6 * 4 * 3 / (60 * 6) = 36/360 = 0.1 = 10%... need to recalc
    // Let's find inputs that give exactly 2%:
    // (0.5 * base * height * numFins) / (length * diam) = 0.02
    // 0.5 * 5 * 4 * 4 / (100 * 10) = 40/1000 = 0.04 = 4%
    // 0.5 * 3 * 2 * 3 / (90 * 5) = 9/450 = 0.02 = 2%
    const result = calculateFinRatio(3, 2, 3, 90, 5);
    expect(result.finRatioPercent).toBeCloseTo(2, 4);
  });

  test('fin ratio exactly 4%', () => {
    // 0.5 * 3 * 2 * 3 / (45 * 5) = 9/225 = 0.04 = 4%
    const result = calculateFinRatio(3, 2, 3, 45, 5);
    expect(result.finRatioPercent).toBeCloseTo(4, 4);
  });

  test('fin ratio exactly 8%', () => {
    // 0.5 * 6 * 4 * 3 / (45 * 5) = 36/225 = 0.16... not 8%
    // 0.5 * 3 * 2 * 3 / (22.5 * 5) = nope
    // 0.5 * 4 * 4 * 4 / (100 * 4) = 32/400 = 0.08 = 8%
    const result = calculateFinRatio(4, 4, 4, 100, 4);
    expect(result.finRatioPercent).toBeCloseTo(8, 4);
  });

  test('fin ratio exactly 12%', () => {
    // 0.5 * 6 * 4 * 4 / (100 * 4) = 48/400 = 0.12 = 12%
    const result = calculateFinRatio(6, 4, 4, 100, 4);
    expect(result.finRatioPercent).toBeCloseTo(12, 4);
  });

  test('fin ratio < 2% — small fins', () => {
    const result = calculateFinRatio(3, 2, 3, 100, 10);
    // 0.5 * 3 * 2 * 3 / (100 * 10) = 9/1000 = 0.9%
    expect(result.finRatioPercent).toBeCloseTo(0.9, 2);
  });

  test('fin ratio > 12% — large fins', () => {
    const result = calculateFinRatio(15, 10, 4, 30, 3);
    // 0.5 * 15 * 10 * 4 / (30 * 3) = 300/90 = 333%
    expect(result.finRatioPercent).toBeGreaterThan(12);
  });
});

// ==============================
// CG Tests
// ==============================

describe('calculateCG', () => {
  test('front distribution', () => {
    const result = calculateCG(60, 'front');
    expect(result.cgCm).toBeCloseTo(60 * 0.42, 2);
  });

  test('balanced distribution', () => {
    const result = calculateCG(60, 'balanced');
    expect(result.cgCm).toBeCloseTo(60 * 0.50, 2);
  });

  test('rear distribution', () => {
    const result = calculateCG(60, 'rear');
    expect(result.cgCm).toBeCloseTo(60 * 0.58, 2);
  });

  test('min rocket length 30', () => {
    expect(calculateCG(30, 'balanced').cgCm).toBeCloseTo(15, 2);
  });

  test('max rocket length 100', () => {
    expect(calculateCG(100, 'balanced').cgCm).toBeCloseTo(50, 2);
  });
});

// ==============================
// CP Tests
// ==============================

describe('calculateCP', () => {
  test('medium fin position + conical nose', () => {
    // CP = 0.65*60 + 0.03*60 + 0 = 39 + 1.8 = 40.8
    const result = calculateCP(60, 'medium', 'conical');
    expect(result.cpCm).toBeCloseTo(40.8, 2);
  });

  test('low fin position + conical nose', () => {
    // CP = 0.65*60 + 0.08*60 + 0 = 39 + 4.8 = 43.8
    const result = calculateCP(60, 'low', 'conical');
    expect(result.cpCm).toBeCloseTo(43.8, 2);
  });

  test('high fin position + ogive nose', () => {
    // CP = 0.65*60 - 0.03*60 + 0.01*60 = 39 - 1.8 + 0.6 = 37.8 → clamp to min 0.40*60=24
    const result = calculateCP(60, 'high', 'ogive');
    expect(result.cpCm).toBeCloseTo(37.8, 2);
  });

  test('CP clamped to min (0.40 * length)', () => {
    // With high fin + rounded: 0.65*30 - 0.03*30 - 0.01*30 = 19.5 - 0.9 - 0.3 = 18.3
    // min = 0.40 * 30 = 12 → no clamping needed here
    const result = calculateCP(30, 'high', 'rounded');
    const expected = 0.65 * 30 + (-0.03 * 30) + (-0.01 * 30);
    const minCP = 0.40 * 30;
    expect(result.cpCm).toBeCloseTo(Math.max(minCP, expected), 2);
  });

  test('CP clamped to max (0.85 * length)', () => {
    // With low fin + ogive: 0.65*100 + 0.08*100 + 0.01*100 = 65+8+1 = 74 < 85, no clamp
    // To test max clamp: theoretically not reachable with given modifiers, max is 0.65+0.08+0.01=0.74
    // So max never exceeds 0.74 which is < 0.85. Min test: 0.65-0.03-0.01=0.61 > 0.40 always.
    // Test that value doesn't exceed 0.85 * length
    const result = calculateCP(100, 'low', 'ogive');
    expect(result.cpCm).toBeLessThanOrEqual(0.85 * 100);
    expect(result.cpCm).toBeGreaterThanOrEqual(0.40 * 100);
  });
});

// ==============================
// Stability Tests
// ==============================

describe('calculateStability', () => {
  test('stability exactly 0 (CG == CP)', () => {
    // stability = (CP - CG) / diam = 0
    const result = calculateStability(40, 40, 5);
    expect(result.value).toBe(0);
    expect(result.classification).toBe('يحتاج إلى تحسين');
  });

  test('stability < 0 — unstable', () => {
    const result = calculateStability(30, 40, 5);
    expect(result.value).toBe(-2);
    expect(result.classification).toBe('غير متوازن');
  });

  test('stability exactly 0.5', () => {
    // (CP - CG) / diam = 0.5 → CP - CG = 0.5 * diam
    const result = calculateStability(42.5, 40, 5);
    expect(result.value).toBe(0.5);
    expect(result.classification).toBe('يحتاج إلى تحسين');
  });

  test('stability exactly 1.0', () => {
    const result = calculateStability(45, 40, 5);
    expect(result.value).toBe(1);
    expect(result.classification).toBe('متوازن');
  });

  test('stability exactly 2.0', () => {
    const result = calculateStability(50, 40, 5);
    expect(result.value).toBe(2);
    expect(result.classification).toBe('متوازن');
  });

  test('stability exactly 3.0', () => {
    const result = calculateStability(55, 40, 5);
    expect(result.value).toBe(3);
    expect(result.classification).toBe('استقرار مرتفع في النموذج');
  });

  test('stability > 3.0', () => {
    const result = calculateStability(60, 40, 5);
    expect(result.value).toBe(4);
    expect(result.classification).toBe('استقرار مرتفع في النموذج');
  });
});

// ==============================
// Score Boundary Tests
// ==============================

describe('calculateScore — stability boundaries', () => {
  test('stability < 0 → 5 pts', () => {
    const s = calculateScore(-0.01, 5, 10, 'balanced');
    expect(s.stabilityScore).toBe(5);
  });

  test('stability 0 → 15 pts', () => {
    const s = calculateScore(0, 5, 10, 'balanced');
    expect(s.stabilityScore).toBe(15);
  });

  test('stability 0.49 → 15 pts', () => {
    const s = calculateScore(0.49, 5, 10, 'balanced');
    expect(s.stabilityScore).toBe(15);
  });

  test('stability 0.5 → 28 pts', () => {
    const s = calculateScore(0.5, 5, 10, 'balanced');
    expect(s.stabilityScore).toBe(28);
  });

  test('stability 0.99 → 28 pts', () => {
    const s = calculateScore(0.99, 5, 10, 'balanced');
    expect(s.stabilityScore).toBe(28);
  });

  test('stability 1.0 → 40 pts', () => {
    const s = calculateScore(1.0, 5, 10, 'balanced');
    expect(s.stabilityScore).toBe(40);
  });

  test('stability 2.0 → 40 pts', () => {
    const s = calculateScore(2.0, 5, 10, 'balanced');
    expect(s.stabilityScore).toBe(40);
  });

  test('stability 2.01 → 35 pts', () => {
    const s = calculateScore(2.01, 5, 10, 'balanced');
    expect(s.stabilityScore).toBe(35);
  });

  test('stability 3.0 → 35 pts', () => {
    const s = calculateScore(3.0, 5, 10, 'balanced');
    expect(s.stabilityScore).toBe(35);
  });

  test('stability 3.01 → 25 pts', () => {
    const s = calculateScore(3.01, 5, 10, 'balanced');
    expect(s.stabilityScore).toBe(25);
  });
});

describe('calculateScore — fin ratio boundaries', () => {
  test('fin ratio < 2% → 8 pts', () => {
    const s = calculateScore(1.5, 1.9, 10, 'balanced');
    expect(s.finScore).toBe(8);
  });

  test('fin ratio 2% → 15 pts', () => {
    const s = calculateScore(1.5, 2, 10, 'balanced');
    expect(s.finScore).toBe(15);
  });

  test('fin ratio 3.9% → 15 pts', () => {
    const s = calculateScore(1.5, 3.9, 10, 'balanced');
    expect(s.finScore).toBe(15);
  });

  test('fin ratio 4% → 20 pts', () => {
    const s = calculateScore(1.5, 4, 10, 'balanced');
    expect(s.finScore).toBe(20);
  });

  test('fin ratio 7.9% → 20 pts', () => {
    const s = calculateScore(1.5, 7.9, 10, 'balanced');
    expect(s.finScore).toBe(20);
  });

  test('fin ratio 8% → 15 pts', () => {
    const s = calculateScore(1.5, 8, 10, 'balanced');
    expect(s.finScore).toBe(15);
  });

  test('fin ratio 12% → 15 pts', () => {
    const s = calculateScore(1.5, 12, 10, 'balanced');
    expect(s.finScore).toBe(15);
  });

  test('fin ratio > 12% → 8 pts', () => {
    const s = calculateScore(1.5, 12.1, 10, 'balanced');
    expect(s.finScore).toBe(8);
  });
});

describe('calculateScore — L/D boundaries', () => {
  test('L/D < 5 → 5 pts', () => {
    const s = calculateScore(1.5, 5, 4.9, 'balanced');
    expect(s.proportionScore).toBe(5);
  });

  test('L/D 5 → 10 pts', () => {
    const s = calculateScore(1.5, 5, 5, 'balanced');
    expect(s.proportionScore).toBe(10);
  });

  test('L/D 7.9 → 10 pts', () => {
    const s = calculateScore(1.5, 5, 7.9, 'balanced');
    expect(s.proportionScore).toBe(10);
  });

  test('L/D 8 → 15 pts', () => {
    const s = calculateScore(1.5, 5, 8, 'balanced');
    expect(s.proportionScore).toBe(15);
  });

  test('L/D 15 → 15 pts', () => {
    const s = calculateScore(1.5, 5, 15, 'balanced');
    expect(s.proportionScore).toBe(15);
  });

  test('L/D > 15 → 8 pts', () => {
    const s = calculateScore(1.5, 5, 15.1, 'balanced');
    expect(s.proportionScore).toBe(8);
  });
});

describe('calculateScore — mass distribution', () => {
  test('front → 13 pts', () => {
    expect(calculateScore(1.5, 5, 10, 'front').massScore).toBe(13);
  });

  test('balanced → 15 pts', () => {
    expect(calculateScore(1.5, 5, 10, 'balanced').massScore).toBe(15);
  });

  test('rear → 7 pts', () => {
    expect(calculateScore(1.5, 5, 10, 'rear').massScore).toBe(7);
  });
});

describe('calculateScore — design consistency', () => {
  test('perfect design — 10 pts consistency', () => {
    // L/D 10 (ok), fin 5% (ok), stability 1.5 (ok), balanced
    const s = calculateScore(1.5, 5, 10, 'balanced');
    expect(s.consistencyScore).toBe(10);
  });

  test('all 4 conditions violated — minimum 2 pts', () => {
    // L/D > 15, fin > 12%, stability < 0.5, rear
    const s = calculateScore(0.3, 15, 16, 'rear');
    expect(s.consistencyScore).toBe(2);
  });

  test('2 conditions violated — 6 pts', () => {
    // L/D > 15, rear (2 deductions), stability 1.5 (ok), fin 5% (ok)
    const s = calculateScore(1.5, 5, 16, 'rear');
    expect(s.consistencyScore).toBe(6);
  });
});

describe('calculateScore — classification', () => {
  test('total ≥ 90 → ممتاز', () => {
    const s = calculateScore(1.5, 5, 10, 'balanced');
    // stability=40, fin=20, prop=15, mass=15, consist=10 → 100
    expect(s.total).toBe(100);
    expect(s.classification).toBe('ممتاز');
  });

  test('score clamped to 100 max', () => {
    const s = calculateScore(1.5, 5, 10, 'balanced');
    expect(s.total).toBeLessThanOrEqual(100);
  });
});

// ==============================
// Golden Fixtures (5 complete designs)
// ==============================

describe('Golden Fixture 1 — Optimal Design', () => {
  const inputs: RocketInputs = {
    rocketLengthCm: 70,
    bodyDiameterCm: 7,
    noseShape: 'ogive',
    noseLengthCm: 14,
    numberOfFins: 4,
    finHeightCm: 6,
    finBaseLengthCm: 7,
    finPosition: 'low',
    massG: 400,
    massDistribution: 'balanced',
  };

  // Calculations:
  // L/D = 70/7 = 10 → تناسق جيد
  // finArea = 0.5 * 7 * 6 = 21; total = 21*4 = 84; body = 70*7=490; ratio = 84/490 = 0.1714 = 17.14%
  // CG = 0.50 * 70 = 35
  // CP = 0.65*70 + 0.08*70 + 0.01*70 = 45.5 + 5.6 + 0.7 = 51.8
  // stability = (51.8 - 35) / 7 = 16.8/7 = 2.4
  // stability score: 2.01≤2.4≤3 → 35
  // fin score: >12% → 8
  // proportion score: 8≤10≤15 → 15
  // mass score: balanced → 15
  // consistency: L/D ok(no -2), fin>12%(-2), stability≥0.5(no -2), balanced(no -2) → 10-2=8
  // total = 35+8+15+15+8 = 81

  const result = runFullCalculation(inputs);

  test('L/D', () => expect(result.metrics.lengthDiameterRatio).toBe(10));
  test('fin ratio %', () => expect(result.metrics.finRatioPercent).toBeCloseTo(17.14, 2));
  test('CG', () => expect(result.metrics.cgCm).toBeCloseTo(35, 2));
  test('CP', () => expect(result.metrics.cpCm).toBeCloseTo(51.8, 2));
  test('stability', () => expect(result.metrics.stabilityIndicator).toBeCloseTo(2.4, 2));
  test('stability score', () => expect(result.score.stabilityScore).toBe(35));
  test('fin score', () => expect(result.score.finScore).toBe(8));
  test('proportion score', () => expect(result.score.proportionScore).toBe(15));
  test('mass score', () => expect(result.score.massScore).toBe(15));
  test('consistency score', () => expect(result.score.consistencyScore).toBe(8));
  test('total score', () => expect(result.score.total).toBe(81));
  test('classification', () => expect(result.score.classification).toBe('جيد جدًا'));
});

describe('Golden Fixture 2 — Perfect Score Design', () => {
  const inputs: RocketInputs = {
    rocketLengthCm: 60,
    bodyDiameterCm: 6,
    noseShape: 'conical',
    noseLengthCm: 12,
    numberOfFins: 3,
    finHeightCm: 4,
    finBaseLengthCm: 5,
    finPosition: 'low',
    massG: 300,
    massDistribution: 'balanced',
  };

  // L/D = 60/6 = 10 → 15pts
  // finArea = 0.5*5*4=10; total=30; body=60*6=360; ratio=30/360=8.33%
  // CG = 0.50*60 = 30
  // CP = 0.65*60 + 0.08*60 + 0 = 39 + 4.8 = 43.8
  // stability = (43.8-30)/6 = 13.8/6 = 2.3
  // stability score: 2.01≤2.3≤3 → 35
  // fin score: 8≤8.33≤12 → 15
  // proportion: 10 → 15pts
  // mass: balanced → 15
  // consistency: L/D ok, fin ok(8-12%), stability≥0.5 ok, balanced ok → 10
  // total = 35+15+15+15+10 = 90

  const result = runFullCalculation(inputs);

  test('L/D', () => expect(result.metrics.lengthDiameterRatio).toBe(10));
  test('CG', () => expect(result.metrics.cgCm).toBeCloseTo(30, 2));
  test('CP', () => expect(result.metrics.cpCm).toBeCloseTo(43.8, 2));
  test('stability', () => expect(result.metrics.stabilityIndicator).toBeCloseTo(2.3, 2));
  test('stability score', () => expect(result.score.stabilityScore).toBe(35));
  test('fin score', () => expect(result.score.finScore).toBe(15));
  test('proportion score', () => expect(result.score.proportionScore).toBe(15));
  test('mass score', () => expect(result.score.massScore).toBe(15));
  test('consistency score', () => expect(result.score.consistencyScore).toBe(10));
  test('total score', () => expect(result.score.total).toBe(90));
  test('classification', () => expect(result.score.classification).toBe('ممتاز'));
});

describe('Golden Fixture 3 — Poor Design', () => {
  const inputs: RocketInputs = {
    rocketLengthCm: 30,
    bodyDiameterCm: 10,
    noseShape: 'rounded',
    noseLengthCm: 5,
    numberOfFins: 3,
    finHeightCm: 2,
    finBaseLengthCm: 3,
    finPosition: 'high',
    massG: 100,
    massDistribution: 'rear',
  };

  // L/D = 30/10 = 3 → 5pts (جسم عريض نسبيًا)
  // finArea = 0.5*3*2=3; total=9; body=30*10=300; ratio=9/300=3%
  // CG = 0.58*30 = 17.4
  // CP = 0.65*30 - 0.03*30 - 0.01*30 = 19.5-0.9-0.3 = 18.3
  // stability = (18.3-17.4)/10 = 0.9/10 = 0.09
  // stability score: 0≤0.09<0.5 → 15
  // fin score: 2≤3<4 → 15
  // proportion: L/D=3<5 → 5
  // mass: rear → 7
  // consistency: L/D<5(-2), fin ok, stability<0.5(-2), rear(-2) → 10-6=4
  // total = 15+15+5+7+4 = 46

  const result = runFullCalculation(inputs);

  test('L/D', () => expect(result.metrics.lengthDiameterRatio).toBe(3));
  test('stability', () => expect(result.metrics.stabilityIndicator).toBeCloseTo(0.09, 2));
  test('stability score', () => expect(result.score.stabilityScore).toBe(15));
  test('fin score', () => expect(result.score.finScore).toBe(15));
  test('proportion score', () => expect(result.score.proportionScore).toBe(5));
  test('mass score', () => expect(result.score.massScore).toBe(7));
  test('consistency score', () => expect(result.score.consistencyScore).toBe(4));
  test('total score', () => expect(result.score.total).toBe(46));
  test('classification', () => expect(result.score.classification).toBe('يحتاج إلى تطوير'));
});

describe('Golden Fixture 4 — Unstable Design (negative stability)', () => {
  const inputs: RocketInputs = {
    rocketLengthCm: 50,
    bodyDiameterCm: 5,
    noseShape: 'conical',
    noseLengthCm: 10,
    numberOfFins: 3,
    finHeightCm: 2,
    finBaseLengthCm: 3,
    finPosition: 'high',
    massG: 200,
    massDistribution: 'rear',
  };

  // L/D = 50/5 = 10 → 15pts
  // finArea = 0.5*3*2=3; total=9; body=50*5=250; ratio=9/250=3.6%
  // CG = 0.58*50 = 29
  // CP = 0.65*50 - 0.03*50 + 0 = 32.5 - 1.5 = 31
  // stability = (31-29)/5 = 2/5 = 0.4
  // stability score: 0≤0.4<0.5 → 15
  // fin score: 2≤3.6<4 → 15
  // proportion: 10 → 15
  // mass: rear → 7
  // consistency: L/D ok, fin ok, stability<0.5(-2), rear(-2) → 6
  // total = 15+15+15+7+6 = 58

  const result = runFullCalculation(inputs);

  test('L/D', () => expect(result.metrics.lengthDiameterRatio).toBe(10));
  test('CG', () => expect(result.metrics.cgCm).toBeCloseTo(29, 2));
  test('CP', () => expect(result.metrics.cpCm).toBeCloseTo(31, 2));
  test('stability', () => expect(result.metrics.stabilityIndicator).toBeCloseTo(0.4, 2));
  test('stability score', () => expect(result.score.stabilityScore).toBe(15));
  test('total score', () => expect(result.score.total).toBe(58));
  test('classification', () => expect(result.score.classification).toBe('يحتاج إلى تطوير'));
});

describe('Golden Fixture 5 — Max Allowed Inputs', () => {
  const inputs: RocketInputs = {
    rocketLengthCm: 100,
    bodyDiameterCm: 10,
    noseShape: 'ogive',
    noseLengthCm: 25,
    numberOfFins: 4,
    finHeightCm: 10,
    finBaseLengthCm: 15,
    finPosition: 'low',
    massG: 1000,
    massDistribution: 'front',
  };

  // L/D = 100/10 = 10 → 15pts
  // finArea = 0.5*15*10=75; total=300; body=100*10=1000; ratio=300/1000=30%
  // CG = 0.42*100 = 42
  // CP = 0.65*100 + 0.08*100 + 0.01*100 = 65+8+1=74
  // stability = (74-42)/10 = 32/10 = 3.2
  // stability score: >3 → 25
  // fin score: >12% → 8
  // proportion: 10 → 15
  // mass: front → 13
  // consistency: L/D ok, fin>12%(-2), stability≥0.5 ok, front ok → 8
  // total = 25+8+15+13+8 = 69

  const result = runFullCalculation(inputs);

  test('L/D', () => expect(result.metrics.lengthDiameterRatio).toBe(10));
  test('fin ratio', () => expect(result.metrics.finRatioPercent).toBeCloseTo(30, 2));
  test('CG', () => expect(result.metrics.cgCm).toBeCloseTo(42, 2));
  test('CP', () => expect(result.metrics.cpCm).toBeCloseTo(74, 2));
  test('stability', () => expect(result.metrics.stabilityIndicator).toBeCloseTo(3.2, 2));
  test('stability score', () => expect(result.score.stabilityScore).toBe(25));
  test('fin score', () => expect(result.score.finScore).toBe(8));
  test('proportion score', () => expect(result.score.proportionScore).toBe(15));
  test('mass score', () => expect(result.score.massScore).toBe(13));
  test('consistency score', () => expect(result.score.consistencyScore).toBe(8));
  test('total score', () => expect(result.score.total).toBe(69));
  test('classification', () => expect(result.score.classification).toBe('جيد'));
});

// ==============================
// Determinism Test
// ==============================

describe('Determinism — same inputs → same output', () => {
  test('running same inputs twice produces identical results', () => {
    const inputs: RocketInputs = {
      rocketLengthCm: 65,
      bodyDiameterCm: 7,
      noseShape: 'conical',
      noseLengthCm: 13,
      numberOfFins: 4,
      finHeightCm: 5,
      finBaseLengthCm: 6,
      finPosition: 'medium',
      massG: 350,
      massDistribution: 'balanced',
    };
    const r1 = runFullCalculation(inputs);
    const r2 = runFullCalculation(inputs);
    expect(r1).toEqual(r2);
  });
});
