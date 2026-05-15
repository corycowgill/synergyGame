import type { Department } from '../data/types';

// Sales > People-Ops > Engineering > Finance > Creative > Operations > Sales
// Caffeine is neutral to everything
const advantageMap: Record<Department, Department | null> = {
  sales: 'people-ops',
  'people-ops': 'engineering',
  engineering: 'finance',
  finance: 'creative',
  creative: 'operations',
  operations: 'sales',
  caffeine: null,
};

export function getDamageMultiplier(
  attackerDepts: Department[],
  defenderDepts: Department[],
): number {
  let best = 1.0;

  for (const atk of attackerDepts) {
    for (const def of defenderDepts) {
      if (atk === 'caffeine' || def === 'caffeine') continue;
      if (advantageMap[atk] === def) best = Math.max(best, 1.5);
      if (advantageMap[def] === atk) best = Math.min(best, 0.75);
    }
  }

  return best;
}
