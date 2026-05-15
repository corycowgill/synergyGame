import type { BattleState } from '../data/types';
import { getCard } from '../data/cards';
import { attack, playCard, useAbility, swapActive, endTurn, hasStatus } from './battle';

export function runAiTurn(state: BattleState): void {
  const opp = state.opponent;

  // 1. Play cards from hand (greedy: play highest-cost card we can afford)
  playCards(state);

  // 2. Use active abilities if available
  useActiveAbilities(state);

  // 3. Consider swapping if active is low HP
  maybeSwap(state);

  // 4. Attack if possible
  if (opp.active && !opp.active.hasAttacked && !hasStatus(opp.active, 'meeting')) {
    attack(state);
  }

  // 5. Try playing more cards after attacking (if energy remains)
  playCards(state);

  // 6. End turn
  endTurn(state);
}

function playCards(state: BattleState): void {
  const opp = state.opponent;

  // Sort hand by energy cost descending — play big cards first
  const sortedHand = [...opp.hand].sort((a, b) => {
    return getCard(b).energyCost - getCard(a).energyCost;
  });

  for (const cardId of sortedHand) {
    const def = getCard(cardId);
    if (def.energyCost <= opp.energy) {
      // Check if we have room (1 active + 3 bench)
      const hasActive = opp.active !== null;
      if (!hasActive || opp.bench.length < 3) {
        playCard(state, cardId);
      }
    }
  }
}

function useActiveAbilities(state: BattleState): void {
  const opp = state.opponent;
  if (!opp.active) return;

  const def = getCard(opp.active.definitionId);
  for (const ab of def.abilities) {
    if (ab.trigger !== 'active') continue;
    if (opp.active.hasUsedAbility) break;

    const cost = ab.cost ?? 0;
    if (opp.energy < cost) continue;

    // Decide whether to use it
    if (shouldUseAbility(state, ab.id)) {
      // For targeted abilities, target opponent's active
      const targetId = state.player.active?.instanceId;
      useAbility(state, opp.active.instanceId, ab.id, targetId);
    }
  }
}

function shouldUseAbility(state: BattleState, abilityId: string): boolean {
  switch (abilityId) {
    case 'lets-sync':
      // Use if opponent active has high influence
      return (state.player.active?.influence ?? 0) >= 30;
    case 'turn-it-off-and-on': {
      // Use if any ally has status effects
      const allCards = [state.opponent.active, ...state.opponent.bench].filter(Boolean);
      return allCards.some(c => c!.statusEffects.length > 0);
    }
    case 'billable-hours':
      return true; // Always good
    case 'budget-cuts':
      return state.player.maxEnergy > 3;
    case 'disrupt':
      return state.player.bench.length >= 2;
    case 'all-hands':
      return true; // Always good if affordable
    case 'crunch-time':
      // Use if we can likely KO with double attack
      return (state.opponent.active?.influence ?? 0) * 2 >= (state.player.active?.currentMorale ?? 999);
    case 'delegate':
      return state.opponent.bench.length > 0;
    case 'rumor-mill':
      return (state.player.active?.influence ?? 0) >= 20;
    default:
      return true;
  }
}

function maybeSwap(state: BattleState): void {
  const opp = state.opponent;
  if (!opp.active || opp.bench.length === 0) return;

  // Swap if active is below 25% morale and bench has healthier card
  const hpRatio = opp.active.currentMorale / opp.active.maxMorale;
  if (hpRatio > 0.25) return;

  const best = opp.bench.reduce((a, b) =>
    (b.currentMorale / b.maxMorale) > (a.currentMorale / a.maxMorale) ? b : a
  );

  if (best.currentMorale / best.maxMorale > hpRatio) {
    swapActive(state, best.instanceId);
  }
}
