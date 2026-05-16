import type { CardDefinition } from '../data/types';
import { getCard } from '../data/cards';
import { renderCard } from './cardComponent';

const LONG_PRESS_MS = 450;
const MOVE_THRESHOLD_PX = 8;

let activeInspector: HTMLElement | null = null;

export function showCardInspector(def: CardDefinition): void {
  hideCardInspector();

  const overlay = document.createElement('div');
  overlay.className = 'card-inspector';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const card = renderCard(def, 'grid');
  card.classList.add('card-inspector__card');
  overlay.appendChild(card);

  const closeHint = document.createElement('div');
  closeHint.className = 'card-inspector__hint';
  closeHint.textContent = 'Tap anywhere or press Esc to close';
  overlay.appendChild(closeHint);

  overlay.addEventListener('click', () => hideCardInspector());

  document.body.appendChild(overlay);
  activeInspector = overlay;

  // Escape key dismiss — bind once, clear on hide
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') hideCardInspector();
  };
  document.addEventListener('keydown', onKey);
  (overlay as HTMLElement & { _onKey?: typeof onKey })._onKey = onKey;
}

export function hideCardInspector(): void {
  if (!activeInspector) return;
  const onKey = (activeInspector as HTMLElement & { _onKey?: (e: KeyboardEvent) => void })._onKey;
  if (onKey) document.removeEventListener('keydown', onKey);
  activeInspector.remove();
  activeInspector = null;
}

/**
 * Wire a card element to open the inspector on long-press, right-click,
 * or middle-click. Doesn't interfere with regular click handlers as long
 * as the user releases within the threshold + doesn't move.
 */
export function attachCardInspect(el: HTMLElement, cardId: string): void {
  let pressTimer: number | null = null;
  let startX = 0;
  let startY = 0;
  let opened = false;

  const def = getCard(cardId);

  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showCardInspector(def);
  });

  el.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.button !== 0) return; // only primary button / touch
    startX = e.clientX;
    startY = e.clientY;
    opened = false;
    pressTimer = window.setTimeout(() => {
      pressTimer = null;
      opened = true;
      showCardInspector(def);
    }, LONG_PRESS_MS);
  });

  const cancel = () => {
    if (pressTimer != null) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  el.addEventListener('pointermove', (e: PointerEvent) => {
    if (pressTimer == null) return;
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD_PX) cancel();
  });

  el.addEventListener('pointerup', cancel);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('pointerleave', cancel);

  // If the long-press fired, swallow the next click so we don't also
  // play/swap the card
  el.addEventListener('click', (e) => {
    if (opened) {
      e.stopPropagation();
      e.preventDefault();
      opened = false;
    }
  }, true);
}
