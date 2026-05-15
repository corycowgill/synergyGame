import type { PlayerState } from '../data/types';

export function renderHud(ps: PlayerState, label: string): HTMLElement {
  const isPlayer = label === 'You';
  const el = document.createElement('div');
  el.className = `hud ${isPlayer ? 'hud--player' : 'hud--opponent'}`;

  const initial = isPlayer ? 'Y' : 'O';
  const subtitle = isPlayer ? 'Performance Review' : 'Rival Department';

  el.innerHTML = `
    <div class="hud__identity">
      <div class="hud__avatar" aria-hidden="true">
        <span class="hud__avatar-initial">${initial}</span>
        <span class="hud__avatar-status"></span>
      </div>
      <div class="hud__name">
        <span class="hud__label">${label.toUpperCase()}</span>
        <span class="hud__subtitle">${subtitle}</span>
      </div>
    </div>
    <div class="hud__stats">
      <div class="hud__stat hud__stat--energy" title="Energy">
        <span class="hud__stat-icon" aria-hidden="true">&#9889;</span>
        <span class="hud__stat-meta">
          <span class="hud__stat-value">${ps.energy}</span>
          <span class="hud__stat-label">Energy</span>
        </span>
      </div>
      <div class="hud__stat hud__stat--deck" title="Cards in deck">
        <span class="hud__stat-icon" aria-hidden="true">&#9707;</span>
        <span class="hud__stat-meta">
          <span class="hud__stat-value">${ps.deck.length}</span>
          <span class="hud__stat-label">Deck</span>
        </span>
      </div>
      <div class="hud__stat hud__stat--hand" title="Cards in hand">
        <span class="hud__stat-icon" aria-hidden="true">&#9646;&#9646;</span>
        <span class="hud__stat-meta">
          <span class="hud__stat-value">${ps.hand.length}</span>
          <span class="hud__stat-label">Hand</span>
        </span>
      </div>
    </div>
  `;

  return el;
}
