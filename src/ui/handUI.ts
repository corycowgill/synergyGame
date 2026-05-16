import { getCard } from '../data/cards';
import { renderCard } from './cardComponent';
import { attachCardInspect } from './cardInspector';

const DRAG_THRESHOLD_PX = 14;

export function renderHand(
  cardIds: string[],
  energy: number,
  onPlay: (cardId: string) => void,
): HTMLElement {
  const el = document.createElement('div');
  el.className = 'hand';

  const center = (cardIds.length - 1) / 2;
  // Tight curl for big hands so cards still fit; gentler for small hands
  const tilt = cardIds.length <= 5 ? 6 : cardIds.length <= 7 ? 4.5 : 3.5;
  const dip  = cardIds.length <= 5 ? 6 : cardIds.length <= 7 ? 4 : 3;

  for (let i = 0; i < cardIds.length; i++) {
    const id = cardIds[i];
    const def = getCard(id);
    const card = renderCard(def, 'hand');
    const canAfford = energy >= def.energyCost;

    // Fan: rotate each card around its bottom-center based on its offset
    // from the middle of the hand, and dip the wings slightly downward
    const offset = i - center;
    card.style.setProperty('--hand-rot', `${offset * tilt}deg`);
    card.style.setProperty('--hand-dip', `${Math.abs(offset) * dip}px`);
    card.style.zIndex = String(100 - Math.abs(Math.round(offset)));

    if (!canAfford) {
      card.classList.add('card--unplayable');
    }

    // Long-press / right-click → fullscreen inspector
    attachCardInspect(card, id);

    if (canAfford) {
      // Tap-to-play stays as the cheap fast path
      card.addEventListener('click', (ev) => {
        // The inspector's long-press handler swallows clicks when it fires,
        // so a click here means a real quick tap.
        if (!ev.defaultPrevented) onPlay(id);
      });

      // Drag-to-play: drag the card onto the player field to release it.
      enableDragToPlay(card, id, onPlay);
    }

    el.appendChild(card);
  }

  return el;
}

function enableDragToPlay(
  card: HTMLElement,
  cardId: string,
  onPlay: (cardId: string) => void,
): void {
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let pointerId: number | null = null;
  let ghost: HTMLElement | null = null;
  let dropZone: HTMLElement | null = null;

  card.style.touchAction = 'none';

  card.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    pointerId = e.pointerId;
  });

  card.addEventListener('pointermove', (e: PointerEvent) => {
    if (pointerId == null || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      // Engage drag
      dragging = true;
      card.setPointerCapture(e.pointerId);
      ghost = card.cloneNode(true) as HTMLElement;
      ghost.classList.add('card--dragging');
      const rect = card.getBoundingClientRect();
      ghost.style.position = 'fixed';
      ghost.style.width = `${rect.width}px`;
      ghost.style.height = `${rect.height}px`;
      ghost.style.pointerEvents = 'none';
      ghost.style.zIndex = '500';
      ghost.style.left = `${rect.left}px`;
      ghost.style.top = `${rect.top}px`;
      document.body.appendChild(ghost);
      card.classList.add('card--dragging-source');
      // Highlight the play surface as a drop target
      const player = document.querySelector('.battle__side--player');
      if (player) {
        player.classList.add('battle__side--drop-target');
        dropZone = player as HTMLElement;
      }
    }
    if (ghost) {
      ghost.style.left = `${e.clientX - ghost.offsetWidth / 2}px`;
      ghost.style.top = `${e.clientY - ghost.offsetHeight / 2}px`;
      // Detect if the cursor is over the drop zone for active state
      if (dropZone) {
        const r = dropZone.getBoundingClientRect();
        const over =
          e.clientX >= r.left && e.clientX <= r.right &&
          e.clientY >= r.top && e.clientY <= r.bottom;
        dropZone.classList.toggle('battle__side--drop-active', over);
      }
    }
  });

  const finish = (e: PointerEvent, played: boolean) => {
    if (ghost) { ghost.remove(); ghost = null; }
    card.classList.remove('card--dragging-source');
    if (dropZone) {
      dropZone.classList.remove('battle__side--drop-target');
      dropZone.classList.remove('battle__side--drop-active');
      dropZone = null;
    }
    if (pointerId != null && card.hasPointerCapture(pointerId)) {
      card.releasePointerCapture(pointerId);
    }
    pointerId = null;
    if (played) onPlay(cardId);
    if (dragging) {
      // Swallow the next click so we don't double-trigger
      const swallow = (ce: Event) => { ce.stopPropagation(); ce.preventDefault(); };
      card.addEventListener('click', swallow, { once: true, capture: true });
    }
    dragging = false;
    void e;
  };

  card.addEventListener('pointerup', (e: PointerEvent) => {
    if (pointerId == null || e.pointerId !== pointerId) return;
    if (!dragging) { pointerId = null; return; }
    const player = document.querySelector('.battle__side--player');
    let dropped = false;
    if (player) {
      const r = player.getBoundingClientRect();
      dropped =
        e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top && e.clientY <= r.bottom;
    }
    finish(e, dropped);
  });

  card.addEventListener('pointercancel', (e) => finish(e, false));
}
