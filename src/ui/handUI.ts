import { getCard } from '../data/cards';
import { renderCard } from './cardComponent';

export function renderHand(
  cardIds: string[],
  energy: number,
  onPlay: (cardId: string) => void,
): HTMLElement {
  const el = document.createElement('div');
  el.className = 'hand';

  for (const id of cardIds) {
    const def = getCard(id);
    const card = renderCard(def, 'hand');
    const canAfford = energy >= def.energyCost;

    if (!canAfford) {
      card.classList.add('card--unplayable');
    }

    card.addEventListener('click', () => {
      if (canAfford) onPlay(id);
    });

    el.appendChild(card);
  }

  return el;
}
