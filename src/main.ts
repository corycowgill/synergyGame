import './styles/main.css';
import './styles/cards.css';
import './styles/battle.css';

import { allCards } from './data/cards';
import { renderCard } from './ui/cardComponent';
import { renderMainMenu } from './ui/mainMenu';
import { renderDeckBuilder } from './ui/deckBuilder';
import { renderFaqPage } from './ui/faqPage';
import { mountBattle, unmountBattle } from './ui/battleScene';
import { initBattle } from './engine/battle';
import { startTutorial } from './engine/tutorial';
import { shuffle } from './engine/deck';
import { getState, subscribe, setScreen } from './store';

const app = document.querySelector<HTMLDivElement>('#app')!;

function render(): void {
  const state = getState();
  unmountBattle();
  app.innerHTML = '';

  switch (state.screen) {
    case 'main-menu':
      renderMainMenu(app);
      break;

    case 'test-cards':
      renderTestCards();
      break;

    case 'deck-builder':
      renderDeckBuilder(app);
      break;

    case 'faq':
      renderFaqPage(app);
      break;

    case 'battle': {
      const playerDeck = state.savedDeck ?? buildRandomDeck();
      const opponentDeck = buildRandomDeck();
      const battle = initBattle(playerDeck, opponentDeck);
      mountBattle(app, battle);
      break;
    }

    case 'tutorial': {
      const battle = startTutorial();
      mountBattle(app, battle);
      break;
    }

    case 'end-screen':
      break;
  }
}

function renderTestCards(): void {
  const container = document.createElement('div');
  container.className = 'test-cards';

  const header = document.createElement('div');
  header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;';

  const titleBlock = document.createElement('div');
  titleBlock.innerHTML = `
    <h1 class="test-cards__title">Performance Review</h1>
    <p class="test-cards__subtitle">Card Gallery — ${allCards.length} cards loaded</p>
  `;

  const backBtn = document.createElement('button');
  backBtn.className = 'battle__btn';
  backBtn.textContent = 'Back to Menu';
  backBtn.onclick = () => setScreen('main-menu');

  header.appendChild(titleBlock);
  header.appendChild(backBtn);
  container.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'test-cards__grid';

  for (const card of allCards) {
    grid.appendChild(renderCard(card, 'grid'));
  }

  container.appendChild(grid);
  app.appendChild(container);
}

function buildRandomDeck(): string[] {
  const pool: string[] = [];
  for (const card of allCards) {
    const copies = card.title === 'c-suite' ? 1 : 3;
    for (let i = 0; i < copies; i++) {
      pool.push(card.id);
    }
  }
  return shuffle(pool).slice(0, 20);
}

subscribe(render);
setScreen('main-menu');
