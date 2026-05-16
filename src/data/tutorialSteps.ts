export interface TutorialStep {
  id: string;
  message: string;
  highlight: string;
  position: 'above' | 'below' | 'left' | 'right';
  action: TutorialAction;
}

export type TutorialAction =
  | { type: 'dismiss' }
  | { type: 'play-card'; cardId: string }
  | { type: 'attack' }
  | { type: 'use-ability'; abilityId: string }
  | { type: 'swap' }
  | { type: 'end-turn' }
  | { type: 'finish' };

export const TUTORIAL_PLAYER_DECK: string[] = [
  'the-intern', 'the-intern',
  'the-office-gossip', 'the-office-gossip',
  'the-bootlicker', 'the-bootlicker',
  'the-middle-manager', 'the-middle-manager',
  'the-it-guy', 'the-it-guy',
  'the-burnout', 'the-burnout',
  'the-overachiever', 'the-overachiever',
  'the-sales-bro', 'the-sales-bro',
  'the-hr-rep', 'the-hr-rep',
  'the-office-mom', 'the-office-mom',
];

export const TUTORIAL_OPPONENT_DECK: string[] = [
  'the-quiet-quitter', 'the-quiet-quitter', 'the-quiet-quitter',
  'the-intern', 'the-intern', 'the-intern',
  'the-bootlicker', 'the-bootlicker', 'the-bootlicker',
  'the-burnout', 'the-burnout', 'the-burnout',
  'the-middle-manager', 'the-middle-manager',
  'the-office-gossip', 'the-office-gossip',
  'the-it-guy', 'the-it-guy',
  'the-overachiever', 'the-overachiever',
];

// Rigged opening hand for the player — these are the exact cards they'll see
export const TUTORIAL_RIGGED_HAND: string[] = [
  'the-intern',
  'the-office-gossip',
  'the-bootlicker',
  'the-middle-manager',
  'the-it-guy',
];

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    message: 'Welcome to Performance Review! This tutorial will teach you the basics of office warfare. Let\'s get started.',
    highlight: '.battle__divider',
    position: 'below',
    action: { type: 'dismiss' },
  },
  {
    id: 'explain-hud',
    message: 'This is your HUD. The lightning bolt is your Energy — you spend it to play cards. Energy refills each turn (up to the turn number, max 10).',
    highlight: '.battle__side--player .hud',
    position: 'above',
    action: { type: 'dismiss' },
  },
  {
    id: 'explain-hand',
    message: 'These are the cards in your hand. Each card has an energy cost shown in the blue circle. Click a card to play it to the field.',
    highlight: '.hand',
    position: 'above',
    action: { type: 'dismiss' },
  },
  {
    id: 'play-intern',
    message: 'Let\'s play The Intern! It only costs 1 energy — perfect for getting started. Click it in your hand now.',
    highlight: '.hand [data-card-id="the-intern"]',
    position: 'above',
    action: { type: 'play-card', cardId: 'the-intern' },
  },
  {
    id: 'explain-bench',
    message: 'The Intern went to your bench since you already have an active card. You can have up to 3 cards on the bench. Click a bench card to swap it to the active slot.',
    highlight: '.battle__side--player .battle__bench',
    position: 'above',
    action: { type: 'dismiss' },
  },
  {
    id: 'do-attack',
    message: 'Your active card can escalate against the rival! Damage = your Influence minus their Tenure defense. Department matchups matter too. Hit Escalate — or drag your card onto the enemy.',
    highlight: '.battle__btn--attack',
    position: 'below',
    action: { type: 'attack' },
  },
  {
    id: 'explain-abilities',
    message: 'Nice hit! Some cards have special abilities you can activate. They cost energy and have powerful effects. Let\'s try one on the next turn.',
    highlight: '#player-active',
    position: 'below',
    action: { type: 'dismiss' },
  },
  {
    id: 'end-turn-1',
    message: 'When you\'re done, press Clock Out. The rival takes their turn, then you get a fresh card and refilled Bandwidth.',
    highlight: '.battle__btn--end-turn',
    position: 'above',
    action: { type: 'end-turn' },
  },
  {
    id: 'play-gossip',
    message: 'Great! You drew a new card and your energy refilled. Now let\'s play The Office Gossip — she has the "Rumor Mill" ability.',
    highlight: '.hand [data-card-id="the-office-gossip"]',
    position: 'above',
    action: { type: 'play-card', cardId: 'the-office-gossip' },
  },
  {
    id: 'swap-active',
    message: 'Now let\'s swap The Office Gossip to the active slot so we can use her ability. Click her on the bench.',
    highlight: '.battle__side--player .battle__bench',
    position: 'above',
    action: { type: 'swap' },
  },
  {
    id: 'use-ability',
    message: 'Now activate Rumor Mill! It costs 1 energy and reduces the opponent\'s Influence by 10 for 2 turns. Click the ability button.',
    highlight: '.battle__btn--ability',
    position: 'below',
    action: { type: 'use-ability', abilityId: 'rumor-mill' },
  },
  {
    id: 'finish',
    message: 'You\'ve learned the basics! Play cards, attack, use abilities, and swap between bench and active. KO all the opponent\'s cards to win. Good luck in Q4!',
    highlight: '.battle__divider',
    position: 'below',
    action: { type: 'finish' },
  },
];
