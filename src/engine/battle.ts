import type { BattleState, PlayerState } from '../data/types';
import { getCard } from '../data/cards';
import { abilities } from '../data/abilities';
import { buildStartingDeck, createInstance, drawCard, pickRandomNonLegendary } from './deck';
import { calculateDamage, checkKOs, checkWinConditions, getAllCards, findCardInPlayerState, hasStatus } from './combat';

// ── Initialize a new battle ─────────────────────────────────

export function initBattle(playerDeck: string[], opponentDeck: string[]): BattleState {
  return {
    turn: 1,
    phase: 'sprint',
    currentTurn: 'player',
    player: createPlayerState(playerDeck),
    opponent: createPlayerState(opponentDeck),
    winner: null,
    log: ['Battle started!'],
  };
}

function createPlayerState(deckIds: string[]): PlayerState {
  let deck = buildStartingDeck(deckIds);
  const { cardId: activeId, remaining } = pickRandomNonLegendary(deck);
  deck = remaining;

  const active = createInstance(activeId);
  active.justPlayed = false;

  let hand: string[] = [];
  for (let i = 0; i < 5; i++) {
    const result = drawCard(deck, hand);
    deck = result.deck;
    hand = result.hand;
  }

  return { deck, hand, active, bench: [], energy: 1, maxEnergy: 10, bonusEnergy: 0, hrComplaints: 0 };
}

// ── Turn phase runners ──────────────────────────────────────

export function runCoffeeBreak(state: BattleState): void {
  const ps = getOwnerState(state);
  ps.energy = Math.min(state.turn, ps.maxEnergy) + ps.bonusEnergy;
  ps.bonusEnergy = 0;
  state.phase = 'coffee-break';
  state.log.push(`Coffee Break! Energy refills to ${ps.energy}.`);
}

export function runStandUp(state: BattleState): void {
  const ps = getOwnerState(state);
  const { deck, hand, drawn } = drawCard(ps.deck, ps.hand);
  ps.deck = deck;
  ps.hand = hand;
  state.phase = 'stand-up';
  state.log.push(drawn
    ? `Drew a card. (${hand.length} in hand, ${deck.length} in deck)`
    : 'Deck is empty — no card drawn!');
}

export function beginSprint(state: BattleState): void {
  state.phase = 'sprint';
  const ps = getOwnerState(state);
  if (ps.active) { ps.active.hasAttacked = false; ps.active.hasUsedAbility = false; }
  for (const c of ps.bench) { c.hasAttacked = false; c.hasUsedAbility = false; }
  runPassives(state);
}

function runPassives(state: BattleState): void {
  for (const card of getAllCards(getOwnerState(state))) {
    const def = getCard(card.definitionId);
    for (const ab of def.abilities) {
      if (ab.trigger === 'passive' && abilities[ab.id]) {
        abilities[ab.id](state, state.currentTurn, card.instanceId);
      }
    }
  }
}

export function runEndOfDay(state: BattleState): void {
  state.phase = 'end-of-day';
  const cards = getAllCards(getOwnerState(state));

  for (const card of cards) {
    const def = getCard(card.definitionId);
    for (const ab of def.abilities) {
      if (ab.trigger === 'end-of-turn' && abilities[ab.id]) {
        abilities[ab.id](state, state.currentTurn, card.instanceId);
      }
    }
  }

  for (const card of cards) {
    card.statusEffects = card.statusEffects.filter(s => { s.turnsRemaining--; return s.turnsRemaining > 0; });
    card.turnsInPlay++;
    card.justPlayed = false;
  }

  checkKOs(state, state.currentTurn);
  checkKOs(state, state.currentTurn === 'player' ? 'opponent' : 'player');
  if (!state.winner) checkWinConditions(state);
}

// ── Player Actions ──────────────────────────────────────────

export function playCard(state: BattleState, cardId: string): boolean {
  const ps = getOwnerState(state);
  const handIdx = ps.hand.indexOf(cardId);
  if (handIdx === -1) return false;

  const def = getCard(cardId);
  if (ps.energy < def.energyCost) return false;
  if (ps.active !== null && ps.bench.length >= 3) return false;

  ps.energy -= def.energyCost;
  ps.hand.splice(handIdx, 1);
  const instance = createInstance(cardId);

  if (!ps.active) {
    ps.active = instance;
  } else {
    ps.bench.push(instance);
  }

  state.log.push(`${def.name} enters the field! (${ps.energy} energy remaining)`);

  for (const ab of def.abilities) {
    if (ab.trigger === 'on-play' && abilities[ab.id]) {
      abilities[ab.id](state, state.currentTurn, instance.instanceId);
    }
  }
  return true;
}

export function attack(state: BattleState): boolean {
  const ps = getOwnerState(state);
  const opp = getOpponentState(state);
  if (!ps.active || !opp.active) return false;
  if (ps.active.hasAttacked) return false;

  if (hasStatus(ps.active, 'meeting')) {
    state.log.push(`${getCard(ps.active.definitionId).name} is stuck in a meeting!`);
    return false;
  }
  if (hasStatus(opp.active, 'protected')) {
    state.log.push(`${getCard(opp.active.definitionId).name} is protected!`);
    return false;
  }

  const damage = calculateDamage(ps.active, opp.active);
  opp.active.currentMorale = Math.max(0, opp.active.currentMorale - damage);
  state.log.push(`${getCard(ps.active.definitionId).name} attacks ${getCard(opp.active.definitionId).name} for ${damage} damage!`);
  ps.active.hasAttacked = true;

  checkKOs(state, state.currentTurn === 'player' ? 'opponent' : 'player');
  return true;
}

export function useAbility(state: BattleState, instanceId: string, abilityId: string, targetId?: string): boolean {
  const ps = getOwnerState(state);
  const card = findCardInPlayerState(ps, instanceId);
  if (!card || card.hasUsedAbility) return false;

  const def = getCard(card.definitionId);
  const ref = def.abilities.find(a => a.id === abilityId);
  if (!ref || ref.trigger !== 'active') return false;

  const cost = ref.cost ?? 0;
  if (ps.energy < cost) return false;

  const fn = abilities[abilityId];
  if (!fn) return false;

  ps.energy -= cost;
  card.hasUsedAbility = true;
  fn(state, state.currentTurn, instanceId, targetId);

  if (abilityId === 'crunch-time') card.hasAttacked = false;

  checkKOs(state, state.currentTurn);
  checkKOs(state, state.currentTurn === 'player' ? 'opponent' : 'player');
  return true;
}

export function swapActive(state: BattleState, benchInstanceId: string): boolean {
  const ps = getOwnerState(state);
  if (!ps.active) return false;
  const idx = ps.bench.findIndex(c => c.instanceId === benchInstanceId);
  if (idx === -1) return false;

  const old = ps.active;
  ps.active = ps.bench[idx];
  ps.bench[idx] = old;
  state.log.push(`Swapped ${getCard(ps.active.definitionId).name} to active!`);
  return true;
}

export function endTurn(state: BattleState): void {
  runEndOfDay(state);
  if (state.winner) { state.phase = 'game-over'; return; }

  state.currentTurn = state.currentTurn === 'player' ? 'opponent' : 'player';
  if (state.currentTurn === 'player') state.turn++;

  runCoffeeBreak(state);
  runStandUp(state);
  beginSprint(state);
}

// Re-export hasStatus for external use
export { hasStatus } from './combat';

function getOwnerState(state: BattleState): PlayerState {
  return state.currentTurn === 'player' ? state.player : state.opponent;
}

function getOpponentState(state: BattleState): PlayerState {
  return state.currentTurn === 'player' ? state.opponent : state.player;
}
