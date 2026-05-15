import { setScreen } from '../store';

export function renderMainMenu(container: HTMLElement): void {
  container.innerHTML = '';

  const menu = document.createElement('div');
  menu.className = 'main-menu';

  menu.innerHTML = `
    <div class="main-menu__hero">
      <img src="/cover.png" alt="Performance Review — The Office Battle Card Game" class="main-menu__cover" />
      <div class="main-menu__hero-fade"></div>
    </div>
  `;

  const buttons = document.createElement('div');
  buttons.className = 'main-menu__buttons';

  const items: { label: string; screen: Parameters<typeof setScreen>[0]; desc: string }[] = [
    { label: 'Tutorial', screen: 'tutorial', desc: 'Learn the basics in a guided match' },
    { label: 'Quick Battle', screen: 'battle', desc: 'Jump into a match with a random deck' },
    { label: 'Deck Builder', screen: 'deck-builder', desc: 'Construct your dream team' },
    { label: 'Card Gallery', screen: 'test-cards', desc: 'Browse all available cards' },
  ];

  for (const item of items) {
    const btn = document.createElement('button');
    btn.className = 'main-menu__btn';
    btn.innerHTML = `
      <span class="main-menu__btn-label">${item.label}</span>
      <span class="main-menu__btn-desc">${item.desc}</span>
    `;
    btn.onclick = () => setScreen(item.screen);
    buttons.appendChild(btn);
  }

  menu.appendChild(buttons);

  const footer = document.createElement('div');
  footer.className = 'main-menu__footer';
  footer.textContent = 'v1.0 — "The Q1 Release"';
  menu.appendChild(footer);

  container.appendChild(menu);
}
