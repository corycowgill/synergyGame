import type { BattleState, PlayerState, TurnOwner, CardInstance } from '../data/types';
import { getCard } from '../data/cards';
import { abilities } from '../data/abilities';
import { getDamageMultiplier } from './matchups';

// ── Damage Calculation ──────────────────────────────────────

export function calculateDamage(attacker: CardInstance, defender: CardInstance): number {
  const atkDef = getCard(attacker.definitionId);
  const defDef = getCard(defender.definitionId);

  let dmg = attacker.influence;

  // Department matchup
  const multiplier = getDamageMultiplier(atkDef.departments, defDef.departments);
  dmg = Math.round(dmg * multiplier);

  // Tenure reduces damage
  const reduction = Math.floor(defender.tenure * 0.5);
  dmg = Math.max(1, dmg - reduction);

  // Quiet Quitter passive: 50% less damage dealt
  if (atkDef.abilities.some(a => a.id === 'acting-your-wage')) {
    dmg = Math.round(dmg * 0.5);
  }

  // Quiet Quitter passive: 50% less damage taken
  if (defDef.abilities.some(a => a.id === 'acting-your-wage')) {
    dmg = Math.round(dmg * 0.5);
  }

  // Sales Bro passive: double if opponent has meeting
  if (atkDef.abilities.some(a => a.id === 'closing-the-deal')) {
    if (hasStatus(defender, 'meeting')) {
      dmg *= 2;
    }
  }

  return Math.max(1, dmg);
}

// ── KO / Win Checks ────────────────────────────────────────

export function checkKOs(state: BattleState, side: TurnOwner): void {
  const ps = side === 'player' ? state.player : state.opponent;
  const other: TurnOwner = side === 'player' ? 'opponent' : 'player';

  if (ps.active && ps.active.currentMorale <= 0) {
    const def = getCard(ps.active.definitionId);
    state.log.push(`${def.name} is KO'd!`);

    // CEO executive presence check
    if (def.abilities.some(a => a.id === 'executive-presence')) {
      state.winner = other;
      state.log.push(`The CEO has fallen! ${other} wins!`);
      return;
    }

    // Fire on-ko abilities
    for (const ab of def.abilities) {
      if (ab.trigger === 'on-ko' && abilities[ab.id]) {
        abilities[ab.id](state, side, ps.active.instanceId);
      }
    }

    ps.active = null;

    // Promote first bench card
    if (ps.bench.length > 0) {
      ps.active = ps.bench.shift()!;
      state.log.push(`${getCard(ps.active.definitionId).name} steps up to active!`);
    }
  }

  // Check bench KOs
  ps.bench = ps.bench.filter(card => {
    if (card.currentMorale <= 0) {
      state.log.push(`${getCard(card.definitionId).name} (bench) is KO'd!`);
      return false;
    }
    return true;
  });
}

export function checkWinConditions(state: BattleState): void {
  if (!state.player.active && state.player.bench.length === 0) {
    state.winner = 'opponent';
    state.log.push("You're out of employees! You've been PIP'd!");
  } else if (!state.opponent.active && state.opponent.bench.length === 0) {
    state.winner = 'player';
    state.log.push("Opponent is out of employees! You won Q4!");
  }

  if (!state.winner && state.player.deck.length === 0 && state.player.hand.length === 0) {
    state.winner = 'opponent';
    state.log.push('You ran out of talent pipeline!');
  } else if (!state.winner && state.opponent.deck.length === 0 && state.opponent.hand.length === 0) {
    state.winner = 'player';
    state.log.push('Opponent ran out of talent pipeline!');
  }
}

// ── Helpers ─────────────────────────────────────────────────

export function getAllCards(ps: PlayerState): CardInstance[] {
  const result: CardInstance[] = [];
  if (ps.active) result.push(ps.active);
  result.push(...ps.bench);
  return result;
}

export function findCardInPlayerState(ps: PlayerState, instanceId: string): CardInstance | null {
  if (ps.active?.instanceId === instanceId) return ps.active;
  return ps.bench.find(c => c.instanceId === instanceId) ?? null;
}

export function hasStatus(card: CardInstance, effect: string): boolean {
  return card.statusEffects.some(s => s.effect === effect);
}
