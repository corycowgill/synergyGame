import type { CardDefinition } from '../data/types';
import { renderCard } from './cardComponent';

// Two faces of one card: a portrait-focused front and the full stats /
// abilities / flavor view on the back. Tap to flip. Both faces are
// produced by renderCard() — the cover just hides the body rows via CSS.
export function renderFlipCard(def: CardDefinition): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'card-flip';
  wrap.setAttribute('role', 'button');
  wrap.setAttribute('aria-label', `${def.name} — tap to flip`);
  wrap.tabIndex = 0;

  const inner = document.createElement('div');
  inner.className = 'card-flip__inner';

  // Front: portrait view (stats / abilities / flavor hidden by CSS)
  const front = renderCard(def, 'grid');
  front.classList.add('card-flip__face', 'card-flip__face--front');
  // Big "tap to flip" hint overlaid on the front
  const hint = document.createElement('div');
  hint.className = 'card-flip__hint';
  hint.textContent = 'Tap for stats →';
  front.appendChild(hint);

  // Back: full card with every row visible
  const back = renderCard(def, 'grid');
  back.classList.add('card-flip__face', 'card-flip__face--back');
  const backHint = document.createElement('div');
  backHint.className = 'card-flip__hint card-flip__hint--back';
  backHint.textContent = '← Tap to flip back';
  back.appendChild(backHint);

  inner.appendChild(front);
  inner.appendChild(back);
  wrap.appendChild(inner);

  const toggle = () => wrap.classList.toggle('card-flip--flipped');
  wrap.addEventListener('click', toggle);
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });

  return wrap;
}
