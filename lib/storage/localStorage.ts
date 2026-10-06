/**
 * Browser localStorage session management
 * All data is scoped to the student's session
 */

import { v4 as uuidv4 } from 'uuid';
import {
  SessionData,
  StudentProfile,
  RocketDesign,
  Experiment,
  Hypothesis,
  BadgeId,
} from '../engine/types';

const SESSION_KEY = 'rocket_lab_session';

export function getSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function saveSession(data: SessionData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export function createNewSession(
  name: string,
  className: string,
  school: string
): SessionData {
  const student: StudentProfile = {
    id: uuidv4(),
    name,
    className,
    school,
    createdAt: new Date().toISOString(),
  };

  const session: SessionData = {
    student,
    onboardingDone: false,
    designs: [],
    experiments: [],
    hypotheses: [],
    badges: [],
    bestScore: 0,
    challengeAttempts: 0,
    challengeCompleted: false,
  };

  saveSession(session);
  return session;
}

export function completeOnboarding(): void {
  const session = getSession();
  if (!session) return;
  session.onboardingDone = true;
  saveSession(session);
}

export function saveDesign(design: RocketDesign): void {
  const session = getSession();
  if (!session) return;

  // Remove existing design with same label (keep only latest A/B/challenge per label)
  const existing = session.designs.findIndex((d) => d.label === design.label && design.label !== 'challenge');
  if (existing !== -1 && design.label !== 'challenge') {
    session.designs[existing] = design;
  } else {
    session.designs.push(design);
  }

  // Update best score
  if (design.score.total > session.bestScore) {
    session.bestScore = design.score.total;
  }

  saveSession(session);
}

export function getDesign(label: 'A' | 'B' | 'challenge'): RocketDesign | null {
  const session = getSession();
  if (!session) return null;
  if (label === 'challenge') {
    // Return last challenge design
    const challenges = session.designs.filter((d) => d.label === 'challenge');
    return challenges[challenges.length - 1] || null;
  }
  return session.designs.find((d) => d.label === label) || null;
}

export function saveExperiment(experiment: Experiment): void {
  const session = getSession();
  if (!session) return;
  const idx = session.experiments.findIndex((e) => e.id === experiment.id);
  if (idx !== -1) {
    session.experiments[idx] = experiment;
  } else {
    session.experiments.push(experiment);
  }
  saveSession(session);
}

export function saveHypothesis(hypothesis: Hypothesis): void {
  const session = getSession();
  if (!session) return;
  const idx = session.hypotheses.findIndex((h) => h.id === hypothesis.id);
  if (idx !== -1) {
    session.hypotheses[idx] = hypothesis;
  } else {
    session.hypotheses.push(hypothesis);
  }
  saveSession(session);
}

export function awardBadge(badgeId: BadgeId): void {
  const session = getSession();
  if (!session) return;
  if (!session.badges.includes(badgeId)) {
    session.badges.push(badgeId);
    saveSession(session);
  }
}

export function incrementChallengeAttempts(): number {
  const session = getSession();
  if (!session) return 0;
  session.challengeAttempts += 1;
  saveSession(session);
  return session.challengeAttempts;
}

export function completeChallengeFlag(): void {
  const session = getSession();
  if (!session) return;
  session.challengeCompleted = true;
  saveSession(session);
}

export function checkAndAwardBadges(): BadgeId[] {
  const session = getSession();
  if (!session) return [];
  const newBadges: BadgeId[] = [];

  const addBadge = (id: BadgeId) => {
    if (!session.badges.includes(id)) {
      session.badges.push(id);
      newBadges.push(id);
    }
  };

  // مهندس مبتدئ — first completed design
  if (session.designs.length >= 1) {
    addBadge('beginner-engineer');
  }

  // باحث الاستقرار — compared 2 designs on stability
  const hasA = session.designs.find((d) => d.label === 'A');
  const hasB = session.designs.find((d) => d.label === 'B');
  if (hasA && hasB) {
    addBadge('stability-researcher');
  }

  // خبير الزعانف — experiment where only a fin variable changes
  const finExperiment = session.experiments.find((e) =>
    ['finHeightCm', 'finBaseLengthCm', 'numberOfFins', 'finPosition'].includes(
      e.changedVariable
    )
  );
  if (finExperiment) {
    addBadge('fin-expert');
  }

  // مهندس الكتلة — tested 2 different mass distributions
  const massDistributions = new Set(
    session.designs.map((d) => d.inputs.massDistribution)
  );
  if (massDistributions.size >= 2) {
    addBadge('mass-engineer');
  }

  // عالم صغير — hypothesis + experiment + result + conclusion
  const completedExp = session.experiments.find(
    (e) => e.hypothesisId && e.observation && e.conclusion
  );
  if (completedExp) {
    addBadge('young-scientist');
  }

  // مهندس فضاء — completed the final challenge
  if (session.challengeCompleted) {
    addBadge('space-engineer');
  }

  if (newBadges.length > 0) {
    saveSession(session);
  }

  return newBadges;
}
