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
import { attachCardInspect } from './cardInspector';

// Pseudo-random "office event" that gets picked once per battle and
// surfaces as a ribbon in the middle of the play mat
const OFFICE_EVENTS: { tag: string; icon: string; text: string }[] = [
  { tag: 'Q4',     icon: '\u{1F525}', text: 'Quarter-End Crunch' },
  { tag: 'All-Hands', icon: '\u{1F4E3}', text: 'Mandatory All-Hands' },
  { tag: 'OOO',    icon: '\u{1F334}', text: 'Half the Team is OOO' },
  { tag: 'Audit',  icon: '\u{1F50D}', text: 'Surprise Audit' },
  { tag: 'Reorg',  icon: '\u{1F501}', text: 'Reorg Rumors Spreading' },
  { tag: 'Sales',  icon: '\u{1F4C8}', text: 'End-of-Quarter Sales Push' },
];
let activeEvent: typeof OFFICE_EVENTS[number] | null = null;

const STATUS_ICONS: Record<string, { icon: string; label: string }> = {
  meeting:      { icon: '\u{1F4C5}', label: 'In Meeting' },     // calendar
  caffeinated:  { icon: '☕',    label: 'Caffeinated' },    // coffee
  burnout:      { icon: '\u{1F525}', label: 'Burnout' },        // fire
  motivated:    { icon: '\u{1F4AA}', label: 'Motivated' },      // muscle
  protected:    { icon: '\u{1F6E1}', label: 'Protected' },      // shield
};

let battleRoot: HTMLElement | null = null;
let animating = false;
let logExpanded = false;

export function mountBattle(container: HTMLElement, state: BattleState): void {
  battleRoot = container;
  // Pick a fresh office event for this battle
  activeEvent = OFFICE_EVENTS[Math.floor(Math.random() * OFFICE_EVENTS.length)];
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
  // Track what step we were on *before* advancing so the finish overlay
  // gets shown to the user and only then sends them back to the menu
  const prev = getTutorialStep();
  const next = advanceTutorial();
  if (!next) {
    hideTutorialOverlay();
    endTutorial();
    // We just dismissed the celebratory "finish" step → return to menu
    if (prev?.action.type === 'finish') {
      setScreen('main-menu');
    }
    return;
  }
  showTutorialOverlay(next, () => handleTutorialAdvance());
}

function tutorialGate(actionType: string, detail?: string): boolean {
  if (!isTutorialActive()) return true;
  return isActionAllowed(actionType, detail);
}

// ── Drag-to-attack: drop the player's active onto the opponent's active ───
function enableDragToAttack(cardEl: HTMLElement, state: BattleState): void {
  const DRAG_THRESHOLD = 14;
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let pointerId: number | null = null;
  let ghost: HTMLElement | null = null;
  let targetEl: HTMLElement | null = null;

  cardEl.style.touchAction = 'none';
  cardEl.classList.add('field-card--draggable');

  cardEl.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    // Don't engage drag when the press lands on a button next to the card
    if ((e.target as HTMLElement).closest('button')) return;
    startX = e.clientX;
    startY = e.clientY;
    pointerId = e.pointerId;
  });

  cardEl.addEventListener('pointermove', (e) => {
    if (pointerId == null || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      dragging = true;
      cardEl.setPointerCapture(e.pointerId);
      const rect = cardEl.getBoundingClientRect();
      ghost = cardEl.cloneNode(true) as HTMLElement;
      ghost.classList.add('card--attacking-drag');
      ghost.style.position = 'fixed';
      ghost.style.left = `${rect.left}px`;
      ghost.style.top = `${rect.top}px`;
      ghost.style.width = `${rect.width}px`;
      ghost.style.height = `${rect.height}px`;
      ghost.style.zIndex = '500';
      ghost.style.pointerEvents = 'none';
      document.body.appendChild(ghost);
      cardEl.classList.add('card--dragging-source');
      targetEl = document.getElementById('opp-active');
      targetEl?.classList.add('field-card--attack-target');
    }
    if (ghost) {
      ghost.style.left = `${e.clientX - ghost.offsetWidth / 2}px`;
      ghost.style.top = `${e.clientY - ghost.offsetHeight / 2}px`;
      if (targetEl) {
        const r = targetEl.getBoundingClientRect();
        const over =
          e.clientX >= r.left && e.clientX <= r.right &&
          e.clientY >= r.top && e.clientY <= r.bottom;
        targetEl.classList.toggle('field-card--attack-target-active', over);
      }
    }
  });

  const cleanup = () => {
    if (ghost) { ghost.remove(); ghost = null; }
    cardEl.classList.remove('card--dragging-source');
    if (targetEl) {
      targetEl.classList.remove('field-card--attack-target');
      targetEl.classList.remove('field-card--attack-target-active');
    }
    if (pointerId != null && cardEl.hasPointerCapture(pointerId)) {
      cardEl.releasePointerCapture(pointerId);
    }
    pointerId = null;
  };

  cardEl.addEventListener('pointerup', (e) => {
    if (pointerId == null || e.pointerId !== pointerId) return;
    if (!dragging) { pointerId = null; return; }
    let dropped = false;
    if (targetEl) {
      const r = targetEl.getBoundingClientRect();
      dropped =
        e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top && e.clientY <= r.bottom;
    }
    const wasDragging = dragging;
    dragging = false;
    cleanup();
    if (dropped) {
      if (!tutorialGate('attack')) return;
      doAttack(state);
      afterTutorialAction();
    }
    if (wasDragging) {
      // Swallow the click that follows the pointerup
      cardEl.addEventListener('click', (ce) => {
        ce.stopPropagation();
        ce.preventDefault();
      }, { once: true, capture: true });
    }
  });

  cardEl.addEventListener('pointercancel', () => {
    dragging = false;
    cleanup();
  });
}

function afterTutorialAction(): void {
  if (!isTutorialActive()) return;
  handleTutorialAdvance();
}

function renderBattle(state: BattleState): void {
  if (!battleRoot) return;
  battleRoot.innerHTML = '';

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

  // Global office event ribbon — sits over the centerline
  if (activeEvent) {
    const event = document.createElement('div');
    event.className = 'battle__event';
    event.innerHTML = `
      <span class="battle__event-icon" aria-hidden="true">${activeEvent.icon}</span>
      <span>${activeEvent.text}</span>
      <span class="battle__event-tag">${activeEvent.tag}</span>
    `;
    wrapper.appendChild(event);
  }

  // ── Opponent side ──
  const oppSection = document.createElement('div');
  oppSection.className = 'battle__side battle__side--opp';
  oppSection.dataset.zone = 'Rival Department';
  oppSection.appendChild(renderHud(state.opponent, 'Opponent'));

  const oppBench = document.createElement('div');
  oppBench.className = 'battle__bench';
  for (const card of state.opponent.bench) {
    oppBench.appendChild(renderBenchOrb(card, false));
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
    const cardWrap = document.createElement('div');
    cardWrap.className = 'battle__active-card-wrap';
    const activeEl = renderFieldCard(state.player.active, 'active', true);
    activeEl.id = 'player-active';
    if (state.currentTurn === 'player' && state.phase === 'sprint' && !animating) {
      const halo = document.createElement('div');
      halo.className = 'field-card-halo';
      halo.setAttribute('aria-hidden', 'true');
      cardWrap.appendChild(halo);
    }
    cardWrap.appendChild(activeEl);
    playerActive.appendChild(cardWrap);

    if (state.currentTurn === 'player' && state.phase === 'sprint' && !animating) {
      const canAttack = !state.player.active.hasAttacked && !!state.opponent.active;
      if (canAttack) {
        enableDragToAttack(activeEl, state);
      }

      const atkBtn = document.createElement('button');
      atkBtn.className = 'battle__btn battle__btn--attack';
      atkBtn.innerHTML = '<span class="battle__btn-label">Escalate</span>';
      atkBtn.disabled = state.player.active.hasAttacked;
      atkBtn.title = 'Click to escalate — or drag your card onto the rival';
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
    const benchEl = renderBenchOrb(card, true);
    if (state.currentTurn === 'player' && state.phase === 'sprint' && !animating) {
      benchEl.classList.add('bench-orb--swappable');
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
    endBtn.innerHTML = '<span class="battle__btn-label">Clock Out</span>';
    endBtn.title = 'End your turn (Clock Out for the day)';
    endBtn.onclick = () => {
      if (!tutorialGate('end-turn')) return;
      doEndTurn(state);
      afterTutorialAction();
    };
    actionBar.appendChild(endBtn);
  } else if (state.currentTurn === 'opponent') {
    const waiting = document.createElement('div');
    waiting.className = 'battle__waiting';
    waiting.textContent = 'Opponent thinking';
    actionBar.appendChild(waiting);
  }

  // Menu / exit button — always present, lives on the right
  if (state.phase !== 'game-over') {
    const menuBtn = document.createElement('button');
    menuBtn.className = 'battle__btn battle__btn--menu';
    menuBtn.title = 'Exit to Main Menu';
    menuBtn.setAttribute('aria-label', 'Menu');
    menuBtn.innerHTML = '☰';
    menuBtn.onclick = () => {
      if (confirm('Leave the current battle and return to the main menu?')) {
        endTutorial();
        setScreen('main-menu');
      }
    };
    actionBar.appendChild(menuBtn);
  }

  wrapper.appendChild(actionBar);

  // ── Battle log (collapsible activity ticker) ──
  const log = document.createElement('div');
  log.className = `battle__log${logExpanded ? ' battle__log--open' : ''}`;
  log.setAttribute('role', 'log');

  const entries = state.log.slice(-12);
  // When collapsed, only the most recent entry shows; when open, all do
  for (const entry of entries) {
    const line = document.createElement('div');
    line.className = 'battle__log-entry';
    line.textContent = entry;
    log.appendChild(line);
  }

  const toggle = document.createElement('span');
  toggle.className = 'battle__log-toggle';
  toggle.textContent = logExpanded ? 'Hide ▲' : 'Log ▼';
  log.appendChild(toggle);

  log.addEventListener('click', () => {
    logExpanded = !logExpanded;
    log.classList.toggle('battle__log--open', logExpanded);
    toggle.textContent = logExpanded ? 'Hide ▲' : 'Log ▼';
    if (logExpanded) log.scrollTop = log.scrollHeight;
  });

  wrapper.appendChild(log);

  battleRoot.appendChild(wrapper);
  if (logExpanded) log.scrollTop = log.scrollHeight;
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
        // Tutorial AI: just attack and end turn. After the turn flips
        // back to the player, top them up so they always have enough
        // bandwidth to execute the scripted tutorial steps
        attack(state);
        endTurn(state);
        state.player.energy = Math.max(state.player.energy, 5);
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

// Compact circular portrait used on the bench — portrait, HP ring, cost
function renderBenchOrb(card: CardInstance, isPlayer: boolean): HTMLElement {
  const def = getCard(card.definitionId);
  const el = document.createElement('div');
  el.className = `bench-orb ${isPlayer ? 'bench-orb--player' : 'bench-orb--opp'}`;
  el.dataset.cardId = def.id;
  el.title = `${def.name} — ${card.currentMorale}/${card.maxMorale} Morale`;

  const hpPct = Math.max(0, Math.min(100, (card.currentMorale / card.maxMorale) * 100));
  // Stroke-dasharray on an SVG circle: circumference ≈ 2π·22 = 138.23
  const C = 138.23;
  const dash = (hpPct / 100) * C;
  const hpColor = hpPct > 50 ? '#7BB07F' : hpPct > 25 ? '#E0BF6A' : '#E74C3C';

  el.innerHTML = `
    <svg class="bench-orb__ring" viewBox="0 0 50 50" aria-hidden="true">
      <circle cx="25" cy="25" r="22" class="bench-orb__ring-track"/>
      <circle cx="25" cy="25" r="22" class="bench-orb__ring-fill"
        stroke="${hpColor}"
        stroke-dasharray="${dash} ${C}"
        transform="rotate(-90 25 25)" />
    </svg>
    <div class="bench-orb__portrait">
      <img src="${def.imagePath}" alt="" loading="lazy" />
    </div>
    <span class="bench-orb__cost" aria-label="cost">${def.energyCost}</span>
    ${card.statusEffects.length ? `<span class="bench-orb__status-dot" title="${card.statusEffects.length} status effect(s)"></span>` : ''}
  `;

  // Long-press inspect works on bench orbs too
  attachCardInspect(el, def.id);
  return el;
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
  if (hpPct <= 25) hpOverlay.classList.add('field-card__hp--critical');
  else if (hpPct <= 50) hpOverlay.classList.add('field-card__hp--warning');
  hpOverlay.innerHTML = `
    <div class="field-card__hp-bar">
      <div class="field-card__hp-fill" style="width:${hpPct}%;background:${hpColor}"></div>
      ${hpPct <= 25 ? '<div class="field-card__hp-cracks" aria-hidden="true"></div>' : ''}
    </div>
    <span class="field-card__hp-text">${card.currentMorale}/${card.maxMorale}</span>
  `;
  el.appendChild(hpOverlay);

  if (hpPct <= 25) el.classList.add('field-card--critical');

  if (card.statusEffects.length > 0) {
    const bar = document.createElement('div');
    bar.className = 'field-card__statuses';
    for (const s of card.statusEffects) {
      const info = STATUS_ICONS[s.effect] ?? { icon: '?', label: s.effect };
      const badge = document.createElement('span');
      badge.className = `field-card__status field-card__status--${s.effect}`;
      badge.title = `${info.label} (${s.turnsRemaining}t)`;
      badge.innerHTML = `<span class="field-card__status-icon">${info.icon}</span>`;
      if (s.turnsRemaining > 1) {
        const count = document.createElement('span');
        count.className = 'field-card__status-count';
        count.textContent = String(s.turnsRemaining);
        badge.appendChild(count);
      }
      bar.appendChild(badge);
    }
    el.appendChild(bar);
  }

  if (!isPlayer) el.classList.add('card--opponent');

  // Long-press / right-click → fullscreen card inspector
  attachCardInspect(el, card.definitionId);

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
