import { setScreen } from '../store';

export function renderMainMenu(container: HTMLElement): void {
  container.innerHTML = '';

  const menu = document.createElement('div');
  menu.className = 'main-menu';

  menu.innerHTML = `
    <div class="main-menu__bg">
      <img src="/cover.png" alt="" class="main-menu__bg-img" />
      <div class="main-menu__bg-vignette"></div>
      <div class="main-menu__particles" aria-hidden="true"></div>
      <div class="main-menu__lightning" aria-hidden="true"></div>
    </div>

    <div class="main-menu__content">
      <div class="main-menu__spacer"></div>

      <div class="main-menu__title-block">
        <h1 class="main-menu__title">Corporate Clash</h1>
        <p class="main-menu__subtitle">The Office Battle Card Game</p>
      </div>

      <div class="main-menu__rating">
        <span class="main-menu__rating-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
        <span>Rated 5.0 on Glassdoor &middot; Q4 Edition</span>
      </div>

      <div class="main-menu__panel">
        <div class="main-menu__sticker" aria-hidden="true">
          <span class="main-menu__sticker-line1">Hot</span>
          <span class="main-menu__sticker-line2">Q4<br/>SALE</span>
          <span class="main-menu__sticker-line3">!!!</span>
        </div>
        <div class="main-menu__spotlight" aria-hidden="true"></div>
        <div class="main-menu__panel-inner" id="menu-buttons"></div>
      </div>

      <div class="main-menu__footer">v1.0 &mdash; &ldquo;The Q1 Release&rdquo;</div>
    </div>

    <div class="main-menu__ticker" aria-hidden="true">
      <div class="main-menu__ticker-track">
        <span class="main-menu__ticker-item">
          <span class="main-menu__ticker-dot"></span> Live
        </span>
        <span class="main-menu__ticker-item"><span class="main-menu__ticker-num">12,847</span> Employees Online Now</span>
        <span class="main-menu__ticker-sep">&#9670;</span>
        <span class="main-menu__ticker-item"><span class="main-menu__ticker-num">384,921</span> Battles Today</span>
        <span class="main-menu__ticker-sep">&#9670;</span>
        <span class="main-menu__ticker-item">&#127942; Ranked <span class="main-menu__ticker-num">#1</span> Office TCG</span>
        <span class="main-menu__ticker-sep">&#9670;</span>
        <span class="main-menu__ticker-item">&#127881; Q4 Bonus Cards Dropping Now</span>
        <span class="main-menu__ticker-sep">&#9670;</span>
        <span class="main-menu__ticker-item"><span class="main-menu__ticker-num">5.0&#9733;</span> Glassdoor Approved</span>
        <span class="main-menu__ticker-sep">&#9670;</span>
        <span class="main-menu__ticker-item">&#128293; <span class="main-menu__ticker-num">+47%</span> Synergy This Week</span>
        <span class="main-menu__ticker-sep">&#9670;</span>
        <span class="main-menu__ticker-item">&#128202; <span class="main-menu__ticker-num">98%</span> Recommend to a Friend</span>
        <span class="main-menu__ticker-sep">&#9670;</span>
      </div>
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
