'use client';

import React from 'react';
import { RocketInputs, NoseShape } from '@/lib/engine/types';

interface RocketSVGProps {
  inputs: RocketInputs;
  cgCm: number;
  cpCm: number;
  rocketLengthCm: number;
  className?: string;
}

/**
 * Deterministic SVG rocket visualization.
 * All rendering is purely based on inputs — no randomness.
 * CG and CP markers are shown as colored rings on the rocket body.
 */
export default function RocketSVG({ inputs, cgCm, cpCm, rocketLengthCm, className = '' }: RocketSVGProps) {
  const SVG_WIDTH = 200;
  const SVG_HEIGHT = 500;
  const ROCKET_WIDTH = 60;
  const ROCKET_X = SVG_WIDTH / 2 - ROCKET_WIDTH / 2;

  // Scale rocket body to SVG height (leaving margin for fins/nose)
  const NOSE_TOP = 30;
  const FINS_BOTTOM = SVG_HEIGHT - 30;
  const ROCKET_TOTAL_HEIGHT = FINS_BOTTOM - NOSE_TOP;

  // Nose proportions
  const noseFraction = Math.min(inputs.noseLengthCm / inputs.rocketLengthCm, 0.4);
  const NOSE_HEIGHT = ROCKET_TOTAL_HEIGHT * noseFraction;
  const BODY_TOP = NOSE_TOP + NOSE_HEIGHT;
  const BODY_HEIGHT = ROCKET_TOTAL_HEIGHT * (1 - noseFraction);

  // CG/CP positions on the SVG (measured from nose tip)
  const cgY = NOSE_TOP + (cgCm / rocketLengthCm) * ROCKET_TOTAL_HEIGHT;
  const cpY = NOSE_TOP + (cpCm / rocketLengthCm) * ROCKET_TOTAL_HEIGHT;

  // Fin dimensions (scaled)
  const finWidthScale = Math.min(inputs.finHeightCm / 10, 1);
  const FIN_WIDTH = 25 + finWidthScale * 20;
  const finHeightScale = Math.min(inputs.finBaseLengthCm / 15, 1);
  const FIN_HEIGHT = BODY_HEIGHT * 0.2 + finHeightScale * BODY_HEIGHT * 0.2;

  // Number of fins determines rendering (3 or 4)
  const numFins = inputs.numberOfFins;

  // Nose shape path
  function nosePath(shape: NoseShape): string {
    const midX = SVG_WIDTH / 2;
    const noseLeft = ROCKET_X;
    const noseRight = ROCKET_X + ROCKET_WIDTH;
    const noseTip = NOSE_TOP;
    const noseBase = BODY_TOP;

    switch (shape) {
      case 'conical':
        return `M${midX},${noseTip} L${noseRight},${noseBase} L${noseLeft},${noseBase} Z`;
      case 'rounded':
        return `M${noseLeft},${noseBase} Q${noseLeft},${noseTip + 10} ${midX},${noseTip} Q${noseRight},${noseTip + 10} ${noseRight},${noseBase} Z`;
      case 'ogive':
        return `M${noseLeft},${noseBase} C${noseLeft},${noseBase - NOSE_HEIGHT * 0.3} ${midX - 10},${noseTip + 5} ${midX},${noseTip} C${midX + 10},${noseTip + 5} ${noseRight},${noseBase - NOSE_HEIGHT * 0.3} ${noseRight},${noseBase} Z`;
      default:
        return `M${midX},${noseTip} L${noseRight},${noseBase} L${noseLeft},${noseBase} Z`;
    }
  }

  const bodyGradientId = 'bodyGrad';
  const noseGradientId = 'noseGrad';
  const glowId = 'glowFilter';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        width="160"
        height="400"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="رسم الصاروخ الافتراضي"
      >
        <defs>
          <linearGradient id={bodyGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e4080" />
            <stop offset="30%" stopColor="#2d5fa8" />
            <stop offset="70%" stopColor="#1a3a6e" />
            <stop offset="100%" stopColor="#0f2347" />
          </linearGradient>
          <linearGradient id={noseGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6b35" />
            <stop offset="100%" stopColor="#cc3d00" />
          </linearGradient>
          <linearGradient id="finGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e4080" />
            <stop offset="100%" stopColor="#0f2347" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Engine glow */}
        <ellipse
          cx={SVG_WIDTH / 2}
          cy={FINS_BOTTOM + 10}
          rx={ROCKET_WIDTH / 2.5}
          ry={15}
          fill="rgba(255, 107, 53, 0.3)"
          filter={`url(#${glowId})`}
        />

        {/* Side fins (always rendered as 2 visible side fins) */}
        {/* Left fin */}
        <polygon
          points={`
            ${ROCKET_X},${FINS_BOTTOM}
            ${ROCKET_X - FIN_WIDTH},${FINS_BOTTOM + 5}
            ${ROCKET_X - FIN_WIDTH * 0.3},${FINS_BOTTOM - FIN_HEIGHT}
            ${ROCKET_X},${FINS_BOTTOM - FIN_HEIGHT * 0.8}
          `}
          fill={`url(#finGrad)`}
          stroke="rgba(56, 189, 248, 0.3)"
          strokeWidth="0.5"
        />
        {/* Right fin */}
        <polygon
          points={`
            ${ROCKET_X + ROCKET_WIDTH},${FINS_BOTTOM}
            ${ROCKET_X + ROCKET_WIDTH + FIN_WIDTH},${FINS_BOTTOM + 5}
            ${ROCKET_X + ROCKET_WIDTH + FIN_WIDTH * 0.3},${FINS_BOTTOM - FIN_HEIGHT}
            ${ROCKET_X + ROCKET_WIDTH},${FINS_BOTTOM - FIN_HEIGHT * 0.8}
          `}
          fill={`url(#finGrad)`}
          stroke="rgba(56, 189, 248, 0.3)"
          strokeWidth="0.5"
        />
        {/* Extra fins for 4-fin design */}
        {numFins === 4 && (
          <>
            <polygon
              points={`
                ${ROCKET_X + ROCKET_WIDTH * 0.15},${FINS_BOTTOM}
                ${ROCKET_X + ROCKET_WIDTH * 0.15},${FINS_BOTTOM + FIN_WIDTH * 0.6}
                ${ROCKET_X + ROCKET_WIDTH * 0.5 - 4},${FINS_BOTTOM - FIN_HEIGHT * 0.6}
                ${ROCKET_X + ROCKET_WIDTH * 0.5 - 4},${FINS_BOTTOM - FIN_HEIGHT * 0.8}
              `}
              fill="rgba(26, 58, 110, 0.7)"
              stroke="rgba(56, 189, 248, 0.2)"
              strokeWidth="0.5"
            />
            <polygon
              points={`
                ${ROCKET_X + ROCKET_WIDTH * 0.85},${FINS_BOTTOM}
                ${ROCKET_X + ROCKET_WIDTH * 0.85},${FINS_BOTTOM + FIN_WIDTH * 0.6}
                ${ROCKET_X + ROCKET_WIDTH * 0.5 + 4},${FINS_BOTTOM - FIN_HEIGHT * 0.6}
                ${ROCKET_X + ROCKET_WIDTH * 0.5 + 4},${FINS_BOTTOM - FIN_HEIGHT * 0.8}
              `}
              fill="rgba(26, 58, 110, 0.7)"
              stroke="rgba(56, 189, 248, 0.2)"
              strokeWidth="0.5"
            />
          </>
        )}

        {/* Rocket body */}
        <rect
          x={ROCKET_X}
          y={BODY_TOP}
          width={ROCKET_WIDTH}
          height={BODY_HEIGHT}
          fill={`url(#${bodyGradientId})`}
          stroke="rgba(56, 189, 248, 0.25)"
          strokeWidth="0.8"
        />

        {/* Body detail lines */}
        <line
          x1={ROCKET_X + 5}
          y1={BODY_TOP + BODY_HEIGHT * 0.3}
          x2={ROCKET_X + ROCKET_WIDTH - 5}
          y2={BODY_TOP + BODY_HEIGHT * 0.3}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.5"
        />
        <line
          x1={ROCKET_X + 5}
          y1={BODY_TOP + BODY_HEIGHT * 0.6}
          x2={ROCKET_X + ROCKET_WIDTH - 5}
          y2={BODY_TOP + BODY_HEIGHT * 0.6}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.5"
        />

        {/* Nose */}
        <path
          d={nosePath(inputs.noseShape)}
          fill={`url(#${noseGradientId})`}
          stroke="rgba(255, 107, 53, 0.4)"
          strokeWidth="0.8"
        />

        {/* Engine nozzle */}
        <rect
          x={ROCKET_X + ROCKET_WIDTH * 0.2}
          y={FINS_BOTTOM - 2}
          width={ROCKET_WIDTH * 0.6}
          height={12}
          rx={4}
          fill="#0a0a1a"
          stroke="rgba(255, 107, 53, 0.4)"
          strokeWidth="0.8"
        />

        {/* CP marker ring */}
        <ellipse
          cx={SVG_WIDTH / 2}
          cy={cpY}
          rx={ROCKET_WIDTH / 2 + 6}
          ry={5}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          opacity={0.9}
          strokeDasharray="4 2"
        />
        <circle cx={SVG_WIDTH / 2 + ROCKET_WIDTH / 2 + 10} cy={cpY} r={3} fill="#38bdf8" />
        <text
          x={SVG_WIDTH / 2 + ROCKET_WIDTH / 2 + 16}
          y={cpY + 4}
          fontSize="9"
          fill="#38bdf8"
          fontFamily="Cairo, sans-serif"
          fontWeight="bold"
        >
          CP
        </text>

        {/* CG marker ring */}
        <ellipse
          cx={SVG_WIDTH / 2}
          cy={cgY}
          rx={ROCKET_WIDTH / 2 + 6}
          ry={5}
          fill="none"
          stroke="#ffd700"
          strokeWidth="2"
          opacity={0.9}
        />
        <circle cx={SVG_WIDTH / 2 + ROCKET_WIDTH / 2 + 10} cy={cgY} r={3} fill="#ffd700" />
        <text
          x={SVG_WIDTH / 2 + ROCKET_WIDTH / 2 + 16}
          y={cgY + 4}
          fontSize="9"
          fill="#ffd700"
          fontFamily="Cairo, sans-serif"
          fontWeight="bold"
        >
          CG
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-star-yellow" />
          <span className="text-white/60">CG — مركز الكتلة (تقديري)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-info" />
          <span className="text-white/60">CP — مركز الضغط (تقديري)</span>
        </div>
      </div>
    </div>
  );
}
