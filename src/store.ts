import type { GameState, Screen, BattleState } from './data/types';

type Listener = () => void;

const listeners = new Set<Listener>();

let state: GameState = {
  screen: 'test-cards',
  savedDeck: loadDeck(),
  battle: null,
};

function loadDeck(): string[] | null {
  try {
    const raw = localStorage.getItem('pr-deck');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getState(): GameState {
  return state;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(): void {
  for (const fn of listeners) fn();
}

export function setScreen(screen: Screen): void {
  state = { ...state, screen };
  notify();
}

export function saveDeck(deck: string[]): void {
  state = { ...state, savedDeck: deck };
  localStorage.setItem('pr-deck', JSON.stringify(deck));
  notify();
}

export function setBattle(battle: BattleState | null): void {
  // Battle state is owned by the battle scene; the store just mirrors it.
  // Don't notify — re-rendering the whole app on every action would re-run
  // startTutorial() / initBattle() and clobber the in-progress game.
  state = { ...state, battle };
}
