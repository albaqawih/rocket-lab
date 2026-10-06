// ==============================
// Core Input Types
// ==============================

export type NoseShape = 'conical' | 'rounded' | 'ogive';
export type FinPosition = 'low' | 'medium' | 'high';
export type MassDistribution = 'front' | 'balanced' | 'rear';

export interface RocketInputs {
  rocketLengthCm: number;       // 30–100
  bodyDiameterCm: number;       // 3–10
  noseShape: NoseShape;
  noseLengthCm: number;         // 5–25 (visual only)
  numberOfFins: 3 | 4;
  finHeightCm: number;          // 2–10
  finBaseLengthCm: number;      // 3–15
  finPosition: FinPosition;
  massG: number;                // 100–1000 (display/comparison only)
  massDistribution: MassDistribution;
}

// ==============================
// Calculated Metrics
// ==============================

export interface LDResult {
  value: number;
  classification: string;
}

export interface FinRatioResult {
  finArea: number;
  totalFinArea: number;
  bodyReferenceArea: number;
  finRatio: number;
  finRatioPercent: number;
}

export interface CGResult {
  cgCm: number;
}

export interface CPResult {
  cpCm: number;
}

export interface StabilityResult {
  value: number;
  classification: string;
}

export interface Metrics {
  lengthDiameterRatio: number;
  ldClassification: string;
  finRatioPercent: number;
  cgCm: number;
  cpCm: number;
  stabilityIndicator: number;
  stabilityClassification: string;
}

// ==============================
// Score Types
// ==============================

export interface ScoreResult {
  stabilityScore: number;
  finScore: number;
  proportionScore: number;
  massScore: number;
  consistencyScore: number;
  total: number;
  classification: string;
}

// ==============================
// Full Calculation Result
// ==============================

export interface FullCalculationResult {
  inputs: RocketInputs;
  metrics: Metrics;
  score: ScoreResult;
  strengths: string[];
  weaknesses: string[];
}

// ==============================
// AI Input Contract (sent to server)
// ==============================

export interface AIInputContract {
  student: {
    name: string;
    className: string;
    school: string;
  };
  inputs: {
    rocket_length_cm: number;
    body_diameter_cm: number;
    nose_shape: string;
    nose_length_cm: number;
    number_of_fins: number;
    fin_height_cm: number;
    fin_base_length_cm: number;
    fin_position: string;
    mass_g: number;
    mass_distribution: string;
  };
  metrics: {
    length_diameter_ratio: number;
    fin_ratio_percent: number;
    cg_cm: number;
    cp_cm: number;
    stability_indicator: number;
  };
  score: {
    total: number;
    stability: number;
    fins: number;
    proportions: number;
    mass_distribution: number;
    design_consistency: number;
    classification: string;
  };
  strengths: string[];
  weaknesses: string[];
}

// ==============================
// Storage Schemas
// ==============================

export interface StudentProfile {
  id: string;
  name: string;
  className: string;
  school: string;
  createdAt: string; // ISO-8601
}

export interface RocketDesign {
  id: string;
  studentId: string;
  label: 'A' | 'B' | 'challenge';
  inputs: RocketInputs;
  metrics: Metrics;
  score: ScoreResult;
  strengths: string[];
  weaknesses: string[];
  createdAt: string; // ISO-8601
}

export interface Hypothesis {
  id: string;
  studentId: string;
  experimentId: string;
  variable: string;
  prediction: string;
  createdAt: string;
}

export interface Experiment {
  id: string;
  studentId: string;
  designAId: string;
  designBId: string;
  changedVariable: string;
  hypothesisId: string;
  observation: string;
  conclusion: string;
  hypothesisCorrect: boolean;
  createdAt: string;
}

export type BadgeId =
  | 'beginner-engineer'
  | 'stability-researcher'
  | 'fin-expert'
  | 'mass-engineer'
  | 'young-scientist'
  | 'space-engineer';

export interface Badge {
  id: BadgeId;
  nameAr: string;
  descriptionAr: string;
  icon: string;
  unlockedAt?: string;
}

export interface SessionData {
  student: StudentProfile;
  onboardingDone: boolean;
  designs: RocketDesign[];
  experiments: Experiment[];
  hypotheses: Hypothesis[];
  badges: BadgeId[];
  bestScore: number;
  challengeAttempts: number;
  challengeCompleted: boolean;
}

// ==============================
// Leaderboard
// ==============================

export interface LeaderboardEntry {
  id: string;
  studentName: string;
  className: string;
  school: string;
  bestScore: number;
  stabilityScore: number;
  experimentCount: number;
  challengeAttempts: number;
  badges: BadgeId[];
  achievedAt: string;
  schoolScope: string;
  rank?: number;
}
