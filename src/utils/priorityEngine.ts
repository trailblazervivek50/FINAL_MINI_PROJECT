import type { StatusLevel } from '../types';

export interface PriorityEvaluationInput {
  fillPercentage: number;
  reportCount: number;
  unresolvedMinutes: number;
  areaSeverity: StatusLevel; // Area pressure level
}

export interface PriorityEvaluationResult {
  score: number; // 0 - 100
  level: StatusLevel;
  reasons: string[];
}

export function evaluatePriority(input: PriorityEvaluationInput): PriorityEvaluationResult {
  const reasons: string[] = [];
  let score = 0;

  // 1. Fill Percentage Weight (45%)
  const fillWeight = (input.fillPercentage / 100) * 45;
  score += fillWeight;
  if (input.fillPercentage >= 85) {
    reasons.push(`Dustbin near capacity (${input.fillPercentage}%)`);
  } else if (input.fillPercentage >= 70) {
    reasons.push(`High fill volume detected (${input.fillPercentage}%)`);
  }

  // 2. Citizen Reports Weight (25%)
  const reportPoints = Math.min(input.reportCount * 7, 25);
  score += reportPoints;
  if (input.reportCount >= 3) {
    reasons.push(`High citizen urgency: ${input.reportCount} reports logged`);
  } else if (input.reportCount > 0) {
    reasons.push(`${input.reportCount} citizen report(s) active`);
  }

  // 3. Unresolved Time Weight (15%)
  // Capped at 180 minutes (3 hours)
  const timePoints = Math.min((input.unresolvedMinutes / 120) * 15, 15);
  score += timePoints;
  if (input.unresolvedMinutes >= 60) {
    reasons.push(`Unattended for ${Math.round(input.unresolvedMinutes)} minutes`);
  }

  // 4. Area Severity Multiplier (15%)
  let areaPoints = 0;
  switch (input.areaSeverity) {
    case 'CRITICAL':
      areaPoints = 15;
      reasons.push('High-density critical commercial sector');
      break;
    case 'HIGH':
      areaPoints = 10;
      reasons.push('Elevated waste volume sector');
      break;
    case 'MODERATE':
      areaPoints = 5;
      break;
    case 'NORMAL':
    default:
      areaPoints = 2;
      break;
  }
  score += areaPoints;

  const roundedScore = Math.min(Math.round(score), 100);

  let level: StatusLevel = 'NORMAL';
  if (roundedScore >= 80) {
    level = 'CRITICAL';
  } else if (roundedScore >= 60) {
    level = 'HIGH';
  } else if (roundedScore >= 35) {
    level = 'MODERATE';
  } else {
    level = 'NORMAL';
  }

  return {
    score: roundedScore,
    level,
    reasons,
  };
}
