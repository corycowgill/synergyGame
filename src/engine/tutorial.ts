import type { BattleState } from '../data/types';
import { tutorialSteps, TUTORIAL_PLAYER_DECK, TUTORIAL_OPPONENT_DECK, TUTORIAL_RIGGED_HAND } from '../data/tutorialSteps';
import type { TutorialStep } from '../data/tutorialSteps';
import { initBattle } from './battle';
import { createInstance } from './deck';

let active = false;
let stepIndex = 0;

export function startTutorial(): BattleState {
  active = true;
  stepIndex = 0;

  const state = initBattle(TUTORIAL_PLAYER_DECK, TUTORIAL_OPPONENT_DECK);

  // Rig the player's hand to have the exact cards we need
  state.player.hand = [...TUTORIAL_RIGGED_HAND];

  // Give the player a known active card (the-bootlicker)
  state.player.active = createInstance('the-bootlicker');
  state.player.active.justPlayed = false;

  // Give enough energy for the tutorial steps
  state.player.energy = 5;

  // Give opponent a quiet quitter as active (tanky, low damage)
  state.opponent.active = createInstance('the-quiet-quitter');
  state.opponent.active.justPlayed = false;
  state.opponent.bench = [];

  state.log = ['Tutorial started! Follow the prompts to learn the game.'];

  return state;
}

export function isTutorialActive(): boolean {
  return active;
}

export function getTutorialStep(): TutorialStep | null {
  if (!active || stepIndex >= tutorialSteps.length) return null;
  return tutorialSteps[stepIndex];
}

export function advanceTutorial(): TutorialStep | null {
  stepIndex++;
  if (stepIndex >= tutorialSteps.length) {
    active = false;
    return null;
  }
  return tutorialSteps[stepIndex];
}

export function endTutorial(): void {
  active = false;
  stepIndex = 0;
}

export function isActionAllowed(actionType: string, detail?: string): boolean {
  const step = getTutorialStep();
  if (!step) return true;

  if (step.action.type !== actionType) return false;

  if (step.action.type === 'play-card' && actionType === 'play-card') {
    return step.action.cardId === detail;
  }
  if (step.action.type === 'use-ability' && actionType === 'use-ability') {
    return step.action.abilityId === detail;
  }
  if (step.action.type === 'swap' && actionType === 'swap') {
    // If the step pins a specific card, require it; otherwise any swap counts
    return !step.action.cardId || step.action.cardId === detail;
  }

  return true;
}
