import { allCards } from '../data/cards';
import type { CardDefinition } from '../data/types';
import { renderCard } from './cardComponent';
import { saveDeck, setScreen, getState } from '../store';

const MAX_DECK_SIZE = 20;
const MAX_COPIES = 3;
const MAX_CSUITE = 1;

export function renderDeckBuilder(container: HTMLElement): void {
  container.innerHTML = '';

  const saved = getState().savedDeck;
  const deck: string[] = saved ? [...saved] : [];

  const wrapper = document.createElement('div');
  wrapper.className = 'deck-builder';

  // Header
  const header = document.createElement('div');
  header.className = 'deck-builder__header';
  header.innerHTML = `
    <h2 class="deck-builder__title">Deck Builder</h2>
    <p class="deck-builder__info">Select 20 cards. Max 3 copies per card. Max 1 C-Suite.</p>
  `;
  wrapper.appendChild(header);

  // Counter
  const counter = document.createElement('div');
  counter.className = 'deck-builder__counter';
  wrapper.appendChild(counter);

  // Two-panel layout
  const panels = document.createElement('div');
  panels.className = 'deck-builder__panels';

  // Left: card roster
  const roster = document.createElement('div');
  roster.className = 'deck-builder__roster';

  // Right: current deck
  const deckPanel = document.createElement('div');
  deckPanel.className = 'deck-builder__deck';
  deckPanel.innerHTML = '<h3 class="deck-builder__deck-title">Your Deck</h3>';
  const deckList = document.createElement('div');
  deckList.className = 'deck-builder__deck-list';
  deckPanel.appendChild(deckList);

  panels.appendChild(roster);
  panels.appendChild(deckPanel);
  wrapper.appendChild(panels);

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'deck-builder__actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'battle__btn';
  saveBtn.textContent = 'Save & Battle';

  const backBtn = document.createElement('button');
  backBtn.className = 'battle__btn';
  backBtn.textContent = 'Back to Menu';
  backBtn.onclick = () => setScreen('main-menu');

  actions.appendChild(saveBtn);
  actions.appendChild(backBtn);
  wrapper.appendChild(actions);

  container.appendChild(wrapper);

  function update(): void {
    counter.textContent = `${deck.length} / ${MAX_DECK_SIZE} cards`;
    counter.style.color = deck.length === MAX_DECK_SIZE ? 'var(--synergy-green)' : 'var(--warm-gray)';

    saveBtn.disabled = deck.length !== MAX_DECK_SIZE;
    saveBtn.onclick = deck.length === MAX_DECK_SIZE ? () => {
      saveDeck(deck);
      setScreen('battle');
    } : null;

    // Render roster
    roster.innerHTML = '';
    for (const def of allCards) {
      const copies = deck.filter(id => id === def.id).length;
      const cardEl = renderCard(def, 'bench');
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'deck-builder__card-slot';

      // Count badge
      const badge = document.createElement('div');
      badge.className = 'deck-builder__count';
      badge.textContent = `${copies}`;

      const canAdd = canAddCard(def, copies, deck);
      if (!canAdd) {
        cardEl.classList.add('card--unplayable');
      }

      cardEl.addEventListener('click', () => {
        if (canAdd) {
          deck.push(def.id);
          update();
        }
      });

      cardWrapper.appendChild(cardEl);
      cardWrapper.appendChild(badge);
      roster.appendChild(cardWrapper);
    }

    // Render deck list
    deckList.innerHTML = '';
    const grouped = groupDeck(deck);
    for (const [id, count] of grouped) {
      const def = allCards.find(c => c.id === id)!;
      const row = document.createElement('div');
      row.className = 'deck-builder__deck-row';
      row.innerHTML = `
        <span class="deck-builder__deck-name">${def.name}</span>
        <span class="deck-builder__deck-qty">x${count}</span>
      `;
      row.addEventListener('click', () => {
        const idx = deck.lastIndexOf(id);
        if (idx !== -1) {
          deck.splice(idx, 1);
          update();
        }
      });
      row.title = 'Click to remove';
      deckList.appendChild(row);
    }
  }

  update();
}

function canAddCard(def: CardDefinition, currentCopies: number, deck: string[]): boolean {
  if (deck.length >= MAX_DECK_SIZE) return false;
  if (currentCopies >= MAX_COPIES) return false;
  if (def.title === 'c-suite') {
    const csuiteCount = deck.filter(id => allCards.find(c => c.id === id)?.title === 'c-suite').length;
    if (csuiteCount >= MAX_CSUITE && currentCopies === 0) return false;
    if (currentCopies >= 1) return false; // Max 1 copy of any c-suite
  }
  return true;
}

function groupDeck(deck: string[]): [string, number][] {
  const map = new Map<string, number>();
  for (const id of deck) {
    map.set(id, (map.get(id) ?? 0) + 1);
  }
  return [...map.entries()];
}
