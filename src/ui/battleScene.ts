import type { BattleState, CardInstance } from '../data/types';
import { getCard } from '../data/cards';
import { renderCard } from './cardComponent';
import { renderHud } from './hud';
import { renderHand } from './handUI';
import {
  attack, playCard, useAbility, swapActive, endTurn,
} from '../engine/battle';
import { runAiTurn } from '../engine/ai';
import { setBattle, setScreen } from '../store';
import {
  isTutorialActive, getTutorialStep, advanceTutorial,
  isActionAllowed, endTutorial,
} from '../engine/tutorial';
import { showTutorialOverlay, hideTutorialOverlay } from './tutorialOverlay';

let battleRoot: HTMLElement | null = null;
let animating = false;

export function mountBattle(container: HTMLElement, state: BattleState): void {
  battleRoot = container;
  renderBattle(state);
  showTutorialIfActive();
}

function showTutorialIfActive(): void {
  if (!isTutorialActive()) return;
  const step = getTutorialStep();
  if (!step) return;
  showTutorialOverlay(step, () => handleTutorialAdvance());
}

function handleTutorialAdvance(): void {
  const next = advanceTutorial();
  if (!next) {
    hideTutorialOverlay();
    endTutorial();
    return;
  }
  if (next.action.type === 'finish') {
    hideTutorialOverlay();
    endTutorial();
    setScreen('main-menu');
    return;
  }
  showTutorialOverlay(next, () => handleTutorialAdvance());
}

function tutorialGate(actionType: string, detail?: string): boolean {
  if (!isTutorialActive()) return true;
  return isActionAllowed(actionType, detail);
}

function afterTutorialAction(): void {
  if (!isTutorialActive()) return;
  handleTutorialAdvance();
}

function renderBattle(state: BattleState): void {
  if (!battleRoot) return;
  battleRoot.innerHTML = '';

  // Premium brand header sits ABOVE the play mat
  const brand = document.createElement('div');
  brand.className = 'battle__brand';
  brand.innerHTML = `<span class="battle__brand-mark">Performance Review &middot; Q4</span>`;
  battleRoot.appendChild(brand);

  const wrapper = document.createElement('div');
  wrapper.className = 'battle';

  // Atmospheric layers — stadium light sweep and floating motes
  const lights = document.createElement('div');
  lights.className = 'battle__lights';
  lights.setAttribute('aria-hidden', 'true');
  wrapper.appendChild(lights);

  const motes = document.createElement('div');
  motes.className = 'battle__motes';
  motes.setAttribute('aria-hidden', 'true');
  wrapper.appendChild(motes);

  // ── Opponent side ──
  const oppSection = document.createElement('div');
  oppSection.className = 'battle__side battle__side--opp';
  oppSection.dataset.zone = 'Rival Department';
  oppSection.appendChild(renderHud(state.opponent, 'Opponent'));

  const oppBench = document.createElement('div');
  oppBench.className = 'battle__bench';
  for (const card of state.opponent.bench) {
    oppBench.appendChild(renderFieldCard(card, 'bench', false));
  }
  oppSection.appendChild(oppBench);

  const oppActive = document.createElement('div');
  oppActive.className = 'battle__active';
  if (state.opponent.active) {
    const el = renderFieldCard(state.opponent.active, 'active', false);
    el.id = 'opp-active';
    oppActive.appendChild(el);
  } else {
    oppActive.innerHTML = '<div class="battle__empty-slot">No Active</div>';
  }
  oppSection.appendChild(oppActive);
  wrapper.appendChild(oppSection);

  // ── Divider ──
  const divider = document.createElement('div');
  const isPlayerTurn = state.currentTurn === 'player';
  divider.className = `battle__divider ${isPlayerTurn ? '' : 'battle__divider--opp'}`.trim();
  divider.innerHTML = `
    <span class="battle__divider-badge">
      <span class="battle__divider-dot" aria-hidden="true"></span>
      <span>Turn ${state.turn} &middot; ${isPlayerTurn ? 'Your Move' : "Opponent's Move"}</span>
    </span>
  `;
  wrapper.appendChild(divider);

  // ── Player side ──
  const playerSection = document.createElement('div');
  playerSection.className = 'battle__side battle__side--player';
  playerSection.dataset.zone = 'Your Team';

  const playerActive = document.createElement('div');
  playerActive.className = 'battle__active';
  if (state.player.active) {
    const activeEl = renderFieldCard(state.player.active, 'active', true);
    activeEl.id = 'player-active';
    playerActive.appendChild(activeEl);

    if (state.currentTurn === 'player' && state.phase === 'sprint' && !animating) {
      const atkBtn = document.createElement('button');
      atkBtn.className = 'battle__btn battle__btn--attack';
      atkBtn.textContent = 'Attack';
      atkBtn.disabled = state.player.active.hasAttacked;
      atkBtn.onclick = () => {
        if (!tutorialGate('attack')) return;
        doAttack(state);
        afterTutorialAction();
      };
      playerActive.appendChild(atkBtn);

      const def = getCard(state.player.active.definitionId);
      for (const ab of def.abilities) {
        if (ab.trigger !== 'active') continue;
        const abBtn = document.createElement('button');
        abBtn.className = 'battle__btn battle__btn--ability';
        const cost = ab.cost ?? 0;
        abBtn.textContent = `${ab.name}${cost > 0 ? ` (${cost})` : ''}`;
        abBtn.title = ab.description;
        abBtn.disabled = state.player.energy < cost
          || state.player.active.hasUsedAbility;
        abBtn.onclick = () => {
          if (!tutorialGate('use-ability', ab.id)) return;
          const targetId = state.opponent.active?.instanceId;
          if (useAbility(state, state.player.active!.instanceId, ab.id, targetId)) {
            syncAndRender(state);
            afterTutorialAction();
          }
        };
        playerActive.appendChild(abBtn);
      }
    }
  } else {
    playerActive.innerHTML = '<div class="battle__empty-slot">No Active</div>';
  }
  playerSection.appendChild(playerActive);

  // Player bench
  const playerBench = document.createElement('div');
  playerBench.className = 'battle__bench';
  for (const card of state.player.bench) {
    const benchEl = renderFieldCard(card, 'bench', true);
    if (state.currentTurn === 'player' && state.phase === 'sprint' && !animating) {
      benchEl.addEventListener('click', () => {
        if (!tutorialGate('swap')) return;
        if (swapActive(state, card.instanceId)) {
          syncAndRender(state);
          afterTutorialAction();
        }
      });
      benchEl.title = 'Click to swap to active';
    }
    playerBench.appendChild(benchEl);
  }
  playerSection.appendChild(playerBench);

  playerSection.appendChild(renderHud(state.player, 'You'));
  wrapper.appendChild(playerSection);

  // ── Player hand ──
  const isPlayerSprint = state.currentTurn === 'player'
    && state.phase === 'sprint' && !animating;
  const hand = renderHand(
    state.player.hand,
    isPlayerSprint ? state.player.energy : 0,
    isPlayerSprint
      ? (cardId) => {
          if (!tutorialGate('play-card', cardId)) return;
          if (playCard(state, cardId)) {
            syncAndRender(state);
            afterTutorialAction();
          }
        }
      : () => {},
  );
  wrapper.appendChild(hand);

  // ── Action bar ──
  const actionBar = document.createElement('div');
  actionBar.className = 'battle__actions';

  if (state.phase === 'game-over') {
    const msg = document.createElement('div');
    msg.className = 'battle__game-over';
    msg.textContent = state.winner === 'player'
      ? "You Won Q4!" : "You've Been PIP'd!";
    actionBar.appendChild(msg);

    const rematch = document.createElement('button');
    rematch.className = 'battle__btn';
    rematch.textContent = 'Rematch';
    rematch.onclick = () => setScreen('battle');
    actionBar.appendChild(rematch);

    const menuBtn = document.createElement('button');
    menuBtn.className = 'battle__btn';
    menuBtn.textContent = 'Main Menu';
    menuBtn.onclick = () => setScreen('main-menu');
    actionBar.appendChild(menuBtn);
  } else if (state.currentTurn === 'player' && !animating) {
    const endBtn = document.createElement('button');
    endBtn.className = 'battle__btn battle__btn--end-turn';
    endBtn.textContent = 'End Turn';
    endBtn.onclick = () => {
      if (!tutorialGate('end-turn')) return;
      doEndTurn(state);
      afterTutorialAction();
    };
    actionBar.appendChild(endBtn);
  } else if (state.currentTurn === 'opponent') {
    const waiting = document.createElement('div');
    waiting.className = 'battle__waiting';
    waiting.textContent = 'Opponent is thinking...';
    actionBar.appendChild(waiting);
  }

  wrapper.appendChild(actionBar);

  // ── Battle log ──
  const log = document.createElement('div');
  log.className = 'battle__log';
  for (const entry of state.log.slice(-8)) {
    const line = document.createElement('div');
    line.className = 'battle__log-entry';
    line.textContent = entry;
    log.appendChild(line);
  }
  wrapper.appendChild(log);

  battleRoot.appendChild(wrapper);
  log.scrollTop = log.scrollHeight;
}

// ── Animated actions ────────────────────────────────────────

function doAttack(state: BattleState): void {
  if (animating) return;
  const prevOppMorale = state.opponent.active?.currentMorale ?? 0;

  if (!attack(state)) return;

  animating = true;
  renderBattle(state);

  const atkEl = document.getElementById('player-active');
  if (atkEl) atkEl.classList.add('card--attacking');

  setTimeout(() => {
    const defEl = document.getElementById('opp-active');
    if (defEl) {
      defEl.classList.add('card--hit');
      const newMorale = state.opponent.active?.currentMorale ?? 0;
      const dmg = prevOppMorale - newMorale;
      if (dmg > 0) showDamageNumber(defEl, dmg);
    }
    setTimeout(() => {
      animating = false;
      syncAndRender(state);
    }, 400);
  }, 250);
}

function doEndTurn(state: BattleState): void {
  if (animating) return;
  hideTutorialOverlay();
  endTurn(state);
  syncAndRender(state);

  if (!state.winner && state.currentTurn === 'opponent') {
    setTimeout(() => {
      if (isTutorialActive()) {
        // Tutorial AI: just attack and end turn
        attack(state);
        endTurn(state);
      } else {
        runAiTurn(state);
      }
      syncAndRender(state);
      showTutorialIfActive();
    }, 800);
  }
}

function showDamageNumber(parent: HTMLElement, amount: number): void {
  const el = document.createElement('div');
  el.className = 'damage-number';
  el.textContent = `-${amount}`;
  if (amount >= 30) el.classList.add('damage-number--super');
  parent.style.position = 'relative';
  parent.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function renderFieldCard(
  card: CardInstance,
  size: 'active' | 'bench',
  isPlayer: boolean,
): HTMLElement {
  const def = getCard(card.definitionId);
  const el = renderCard(def, size);

  const hpPct = Math.round((card.currentMorale / card.maxMorale) * 100);
  const hpColor = hpPct > 50 ? '#4A7A5A' : hpPct > 25 ? '#C9A961' : '#C0392B';
  const hpOverlay = document.createElement('div');
  hpOverlay.className = 'field-card__hp';
  hpOverlay.innerHTML = `
    <div class="field-card__hp-bar">
      <div class="field-card__hp-fill" style="width:${hpPct}%;background:${hpColor}"></div>
    </div>
    <span class="field-card__hp-text">${card.currentMorale}/${card.maxMorale}</span>
  `;
  el.appendChild(hpOverlay);

  if (card.statusEffects.length > 0) {
    const bar = document.createElement('div');
    bar.className = 'field-card__statuses';
    for (const s of card.statusEffects) {
      const badge = document.createElement('span');
      badge.className = `field-card__status field-card__status--${s.effect}`;
      badge.textContent = s.effect;
      bar.appendChild(badge);
    }
    el.appendChild(bar);
  }

  if (!isPlayer) el.classList.add('card--opponent');
  return el;
}

function syncAndRender(state: BattleState): void {
  setBattle({ ...state });
  if (state.winner) state.phase = 'game-over';
  renderBattle(state);
}

export function unmountBattle(): void {
  hideTutorialOverlay();
  if (battleRoot) {
    battleRoot.innerHTML = '';
    battleRoot = null;
  }
}
