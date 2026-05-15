// ── Core Types ──────────────────────────────────────────────

export type Department =
  | 'caffeine'
  | 'operations'
  | 'engineering'
  | 'sales'
  | 'people-ops'
  | 'creative'
  | 'finance';

export type Rarity = 'intern' | 'associate' | 'senior' | 'director' | 'vp' | 'c-suite';

export type AbilityTrigger = 'on-play' | 'active' | 'passive' | 'on-ko' | 'end-of-turn';

export interface AbilityRef {
  id: string;
  name: string;
  description: string;
  cost?: number;
  trigger: AbilityTrigger;
}

export interface CardDefinition {
  id: string;
  name: string;
  title: Rarity;
  departments: Department[];
  morale: number;
  influence: number;
  tenure: number;
  responseTime: number;
  energyCost: number;
  abilities: AbilityRef[];
  flavorText: string;
  imagePath: string;
}

// ── Battle State Types ──────────────────────────────────────

export type StatusEffect = 'meeting' | 'caffeinated' | 'burnout' | 'motivated' | 'protected';

export interface StatusInstance {
  effect: StatusEffect;
  turnsRemaining: number;
}

export interface CardInstance {
  instanceId: string;
  definitionId: string;
  currentMorale: number;
  maxMorale: number;
  influence: number;
  baseInfluence: number;
  tenure: number;
  responseTime: number;
  statusEffects: StatusInstance[];
  turnsInPlay: number;
  justPlayed: boolean;
  hasAttacked: boolean;
  hasUsedAbility: boolean;
}

export interface PlayerState {
  deck: string[];
  hand: string[];
  active: CardInstance | null;
  bench: CardInstance[];
  energy: number;
  maxEnergy: number;
  bonusEnergy: number;
  hrComplaints: number;
}

export type BattlePhase = 'coffee-break' | 'stand-up' | 'sprint' | 'end-of-day' | 'game-over';
export type TurnOwner = 'player' | 'opponent';

export interface BattleState {
  turn: number;
  phase: BattlePhase;
  currentTurn: TurnOwner;
  player: PlayerState;
  opponent: PlayerState;
  winner: TurnOwner | null;
  log: string[];
}

export type AbilityFn = (
  state: BattleState,
  casterOwner: TurnOwner,
  casterId: string,
  targetId?: string,
) => void;

// ── UI / Store Types ────────────────────────────────────────

export type Screen = 'main-menu' | 'deck-builder' | 'battle' | 'end-screen' | 'test-cards' | 'tutorial';

export interface GameState {
  screen: Screen;
  savedDeck: string[] | null;
  battle: BattleState | null;
}
