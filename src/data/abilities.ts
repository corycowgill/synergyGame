import type { AbilityFn, BattleState, TurnOwner, CardInstance, PlayerState } from './types';

function getOwnerState(state: BattleState, owner: TurnOwner): PlayerState {
  return owner === 'player' ? state.player : state.opponent;
}

function getOpponentState(state: BattleState, owner: TurnOwner): PlayerState {
  return owner === 'player' ? state.opponent : state.player;
}

function findCard(ps: PlayerState, instanceId: string): CardInstance | null {
  if (ps.active?.instanceId === instanceId) return ps.active;
  return ps.bench.find(c => c.instanceId === instanceId) ?? null;
}

function allAllies(ps: PlayerState): CardInstance[] {
  const result: CardInstance[] = [];
  if (ps.active) result.push(ps.active);
  result.push(...ps.bench);
  return result;
}

export const abilities: Record<string, AbilityFn> = {
  // The Intern — cannot be targeted the turn played (checked in battle.ts)
  'its-my-first-day': (state, owner, casterId) => {
    const card = findCard(getOwnerState(state, owner), casterId);
    if (card) {
      card.statusEffects.push({ effect: 'protected', turnsRemaining: 1 });
      state.log.push(`${card.definitionId} is protected on their first day!`);
    }
  },

  // The Bootlicker — +5 Influence per bench ally (computed during damage calc)
  'yes-absolutely': (state, owner, casterId) => {
    const ps = getOwnerState(state, owner);
    const card = findCard(ps, casterId);
    if (card) {
      const benchCount = ps.bench.length;
      card.influence = card.baseInfluence + benchCount * 5;
    }
  },

  // The Quiet Quitter — 50% less damage dealt and taken (handled in damage calc)
  'acting-your-wage': () => {
    // Passive — resolved in battle.ts damage calculation
  },

  // The Office Gossip — reduce target Influence by 10 for 2 turns
  'rumor-mill': (state, owner, _casterId, targetId) => {
    const opp = getOpponentState(state, owner);
    const target = targetId ? findCard(opp, targetId) : opp.active;
    if (target) {
      target.influence = Math.max(0, target.influence - 10);
      target.statusEffects.push({ effect: 'burnout', turnsRemaining: 2 });
      state.log.push(`Rumor Mill reduces ${target.definitionId}'s Influence by 10!`);
    }
  },

  // The Middle Manager — attack uses a random bench ally's Influence
  'delegate': (state, owner, casterId) => {
    const ps = getOwnerState(state, owner);
    const card = findCard(ps, casterId);
    if (card && ps.bench.length > 0) {
      const pick = ps.bench[Math.floor(Math.random() * ps.bench.length)];
      card.influence = pick.influence;
      state.log.push(`Middle Manager delegates! Using ${pick.definitionId}'s Influence (${pick.influence}).`);
    }
  },

  // The IT Guy — clear all status effects on your side
  'turn-it-off-and-on': (state, owner) => {
    const ps = getOwnerState(state, owner);
    for (const card of allAllies(ps)) {
      card.statusEffects = [];
      card.influence = card.baseInfluence;
    }
    state.log.push('IT Guy clears all status effects!');
  },

  // The Sales Bro — double damage if opponent has Meeting status (checked in damage calc)
  'closing-the-deal': () => {
    // Passive — resolved in battle.ts damage calculation
  },

  // The HR Rep — put target in Meeting for 2 turns
  'lets-sync': (state, owner, _casterId, targetId) => {
    const opp = getOpponentState(state, owner);
    const target = targetId ? findCard(opp, targetId) : opp.active;
    if (target) {
      target.statusEffects.push({ effect: 'meeting', turnsRemaining: 2 });
      state.log.push(`${target.definitionId} is stuck in a meeting for 2 turns!`);
    }
  },

  // The Consultant — gain 2 extra energy next turn
  'billable-hours': (state, owner) => {
    const ps = getOwnerState(state, owner);
    ps.bonusEnergy += 2;
    state.log.push('Consultant bills extra hours — +2 energy next turn!');
  },

  // The Office Mom — heal 10 to all allies
  'banana-bread': (state, owner) => {
    const ps = getOwnerState(state, owner);
    for (const card of allAllies(ps)) {
      card.currentMorale = Math.min(card.maxMorale, card.currentMorale + 10);
    }
    state.log.push('Office Mom shares Banana Bread — all allies heal 10!');
  },

  // The Visionary — shuffle opponent bench back into deck
  'disrupt': (state, owner) => {
    const opp = getOpponentState(state, owner);
    for (const card of opp.bench) {
      opp.deck.push(card.definitionId);
    }
    const count = opp.bench.length;
    opp.bench = [];
    // Reshuffle
    for (let i = opp.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opp.deck[i], opp.deck[j]] = [opp.deck[j], opp.deck[i]];
    }
    state.log.push(`Visionary disrupts! ${count} bench cards shuffled back into opponent's deck!`);
  },

  // The CFO — reduce opponent max energy by 1
  'budget-cuts': (state, owner) => {
    const opp = getOpponentState(state, owner);
    opp.maxEnergy = Math.max(1, opp.maxEnergy - 1);
    state.log.push(`CFO makes budget cuts! Opponent's max energy reduced to ${opp.maxEnergy}!`);
  },

  // The CEO — +10 Influence to all your cards this turn
  'all-hands': (state, owner) => {
    const ps = getOwnerState(state, owner);
    for (const card of allAllies(ps)) {
      card.influence += 10;
    }
    state.log.push('CEO calls All-Hands! +10 Influence to all allies!');
  },

  // The CEO — if KO'd, you lose (checked in battle.ts KO resolution)
  'executive-presence': () => {
    // Passive — resolved in battle.ts KO check
  },

  // The Burnout — loses 10 Influence each turn after the first
  'caffeine-crash': (state, owner, casterId) => {
    const card = findCard(getOwnerState(state, owner), casterId);
    if (card && card.turnsInPlay > 0) {
      card.influence = Math.max(0, card.influence - 10);
      state.log.push(`${card.definitionId} is crashing — Influence drops to ${card.influence}!`);
    }
  },

  // The Overachiever — attack twice, take 15 self-damage (handled in battle.ts)
  'crunch-time': (state, owner, casterId) => {
    const card = findCard(getOwnerState(state, owner), casterId);
    if (card) {
      card.currentMorale = Math.max(0, card.currentMorale - 15);
      state.log.push(`${card.definitionId} pushes through Crunch Time! (-15 self damage)`);
    }
  },
};
