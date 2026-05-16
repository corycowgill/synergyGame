import type { PlayerState } from '../data/types';

export function renderHud(ps: PlayerState, label: string): HTMLElement {
  const isPlayer = label === 'You';
  const el = document.createElement('div');
  el.className = `hud ${isPlayer ? 'hud--player' : 'hud--opponent'}`;
  const initial = isPlayer ? 'Y' : 'O';
  const displayLabel = isPlayer ? 'You' : 'Rival';

  // Compact one-liner: avatar + name + three stat chips
  el.innerHTML = `
    <div class="hud__avatar" aria-hidden="true">
      <span class="hud__avatar-initial">${initial}</span>
      <span class="hud__avatar-status"></span>
    </div>
    <span class="hud__label">${displayLabel}</span>
    <div class="hud__stats">
      <span class="hud__stat hud__stat--energy" title="Bandwidth (energy)">
        <span class="hud__stat-icon" aria-hidden="true">&#9889;</span>
        <span class="hud__stat-value">${ps.energy}</span>
        <span class="hud__stat-label">BW</span>
      </span>
      <span class="hud__stat hud__stat--deck" title="Pipeline (deck)">
        <span class="hud__stat-icon" aria-hidden="true">&#9707;</span>
        <span class="hud__stat-value">${ps.deck.length}</span>
        <span class="hud__stat-label">Pipe</span>
      </span>
      <span class="hud__stat hud__stat--hand" title="Inbox (hand)">
        <span class="hud__stat-icon" aria-hidden="true">&#9993;</span>
        <span class="hud__stat-value">${ps.hand.length}</span>
        <span class="hud__stat-label">Inbox</span>
      </span>
    </div>
  `;

  return el;
}
