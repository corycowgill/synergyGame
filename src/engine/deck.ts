import type { CardInstance } from '../data/types';
import { getCard } from '../data/cards';

let instanceCounter = 0;

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createInstance(definitionId: string): CardInstance {
  const def = getCard(definitionId);
  instanceCounter++;
  return {
    instanceId: `${definitionId}-${instanceCounter}`,
    definitionId,
    currentMorale: def.morale,
    maxMorale: def.morale,
    influence: def.influence,
    baseInfluence: def.influence,
    tenure: def.tenure,
    responseTime: def.responseTime,
    statusEffects: [],
    turnsInPlay: 0,
    justPlayed: true,
    hasAttacked: false,
    hasUsedAbility: false,
  };
}

export function drawCard(deck: string[], hand: string[]): { deck: string[]; hand: string[]; drawn: string | null } {
  if (deck.length === 0) return { deck, hand, drawn: null };
  const [drawn, ...rest] = deck;
  return { deck: rest, hand: [...hand, drawn], drawn };
}

export function buildStartingDeck(cardIds: string[]): string[] {
  return shuffle(cardIds);
}

export function pickRandomNonLegendary(deck: string[]): { cardId: string; remaining: string[] } {
  const eligible = deck.filter(id => getCard(id).title !== 'c-suite');
  if (eligible.length === 0) {
    return { cardId: deck[0], remaining: deck.slice(1) };
  }
  const pick = eligible[Math.floor(Math.random() * eligible.length)];
  const idx = deck.indexOf(pick);
  const remaining = [...deck.slice(0, idx), ...deck.slice(idx + 1)];
  return { cardId: pick, remaining };
}
