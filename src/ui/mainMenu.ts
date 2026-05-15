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

  type MenuItem = {
    label: string;
    screen: Parameters<typeof setScreen>[0];
    desc: string;
    icon: string;
    accent: 'green' | 'red' | 'teal' | 'gold';
    badge?: string;
  };

  const items: MenuItem[] = [
    { label: 'Tutorial',     screen: 'tutorial',     desc: 'Onboard with HR \u2014 learn the ropes',     icon: '\u{1F4CB}', accent: 'green', badge: 'New Hire' },
    { label: 'Quick Battle', screen: 'battle',       desc: 'Skip the meeting. Get straight to combat', icon: '\u26A1',    accent: 'red' },
    { label: 'Deck Builder', screen: 'deck-builder', desc: 'Assemble your dream synergy team',       icon: '\u{1F0CF}', accent: 'teal' },
    { label: 'Card Gallery', screen: 'test-cards',   desc: 'Browse the entire roster',               icon: '\u{1F5C2}', accent: 'gold' },
  ];

  for (const item of items) {
    const btn = document.createElement('button');
    btn.className = `main-menu__btn main-menu__btn--${item.accent}`;
    btn.innerHTML = `
      <span class="main-menu__btn-icon" aria-hidden="true">
        <span class="main-menu__btn-icon-glyph">${item.icon}</span>
      </span>
      <span class="main-menu__btn-text">
        <span class="main-menu__btn-label">
          ${item.label}${item.badge ? `<span class="main-menu__btn-badge">${item.badge}</span>` : ''}
        </span>
        <span class="main-menu__btn-desc">${item.desc}</span>
      </span>
      <span class="main-menu__btn-arrow" aria-hidden="true">&rsaquo;</span>
    `;
    btn.onclick = () => setScreen(item.screen);
    btnContainer.appendChild(btn);
  }

  container.appendChild(menu);
}
