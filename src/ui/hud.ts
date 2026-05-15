import type { PlayerState } from '../data/types';

export function renderHud(ps: PlayerState, label: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'hud';

  el.innerHTML = `
    <div class="hud__label">${label}</div>
    <div class="hud__stats">
      <span class="hud__stat hud__energy" title="Energy">
        <span class="hud__icon">&#9889;</span> ${ps.energy}
      </span>
      <span class="hud__stat hud__deck" title="Deck">
        <span class="hud__icon">&#128195;</span> ${ps.deck.length}
      </span>
      <span class="hud__stat hud__hand-count" title="Hand">
        <span class="hud__icon">&#9995;</span> ${ps.hand.length}
      </span>
    </div>
  `;

  return el;
}
