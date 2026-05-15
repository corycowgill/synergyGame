import { setScreen } from '../store';

export function renderMainMenu(container: HTMLElement): void {
  container.innerHTML = '';

  const menu = document.createElement('div');
  menu.className = 'main-menu';

  menu.innerHTML = `
    <div class="main-menu__bg">
      <img src="/cover.png" alt="" class="main-menu__bg-img" />
      <div class="main-menu__bg-vignette"></div>
    </div>

    <div class="main-menu__content">
      <div class="main-menu__spacer"></div>

      <div class="main-menu__title-block">
        <h1 class="main-menu__title">Corporate Clash</h1>
        <p class="main-menu__subtitle">The Office Battle Card Game</p>
      </div>

      <div class="main-menu__panel">
        <div class="main-menu__panel-inner" id="menu-buttons"></div>
      </div>

      <div class="main-menu__footer">v1.0 &mdash; &ldquo;The Q1 Release&rdquo;</div>
    </div>
  `;

  const btnContainer = menu.querySelector('#menu-buttons')!;

  const items: { label: string; screen: Parameters<typeof setScreen>[0]; desc: string; icon: string }[] = [
    { label: 'Tutorial', screen: 'tutorial', desc: 'Learn the basics', icon: '\u{1F4CB}' },
    { label: 'Quick Battle', screen: 'battle', desc: 'Random deck showdown', icon: '\u26A1' },
    { label: 'Deck Builder', screen: 'deck-builder', desc: 'Build your team', icon: '\u{1F0CF}' },
    { label: 'Card Gallery', screen: 'test-cards', desc: 'Browse all cards', icon: '\u{1F5C2}' },
  ];

  for (const item of items) {
    const btn = document.createElement('button');
    btn.className = 'main-menu__btn';
    btn.innerHTML = `
      <span class="main-menu__btn-icon">${item.icon}</span>
      <span class="main-menu__btn-text">
        <span class="main-menu__btn-label">${item.label}</span>
        <span class="main-menu__btn-desc">${item.desc}</span>
      </span>
    `;
    btn.onclick = () => setScreen(item.screen);
    btnContainer.appendChild(btn);
  }

  container.appendChild(menu);
}
