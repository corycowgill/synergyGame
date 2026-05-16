import { setScreen } from '../store';

const ACCENT_HEX: Record<string, string[]> = {
  green: ['#A4C639', '#D8F082', '#E0F4A8', '#FFFFFF'],
  red:   ['#E74C3C', '#FFB5A5', '#FFE4A0', '#FFFFFF'],
  teal:  ['#4FA0BC', '#B5E4F0', '#FFE4A0', '#FFFFFF'],
  gold:  ['#C9A961', '#FFE4A0', '#FFF1B8', '#FFFFFF'],
};

function burst(target: HTMLElement, ev: MouseEvent, accent: keyof typeof ACCENT_HEX): void {
  const colors = ACCENT_HEX[accent] ?? ACCENT_HEX.gold;
  const rect = target.getBoundingClientRect();
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;

  // Shock-ring at click point
  const ring = document.createElement('span');
  ring.className = 'menu-burst__ring';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  ring.style.setProperty('--c', colors[0]);
  target.appendChild(ring);
  setTimeout(() => ring.remove(), 700);

  // 18 confetti particles fan out from click
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('span');
    p.className = 'menu-burst__particle';
    const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.4;
    const dist = 70 + Math.random() * 70;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist - 12}px`);
    p.style.setProperty('--c', colors[Math.floor(Math.random() * colors.length)]);
    p.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
    p.style.setProperty('--delay', `${Math.random() * 60}ms`);
    target.appendChild(p);
    setTimeout(() => p.remove(), 900);
  }
}

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
        <button class="main-menu__sticker" type="button" aria-label="Q4 sale (dismiss)">
          <span class="main-menu__sticker-line1">Hot</span>
          <span class="main-menu__sticker-line2">Q4<br/>SALE</span>
          <span class="main-menu__sticker-line3">!!!</span>
        </button>
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

  // Tap the Q4 SALE sticker to dismiss it
  const sticker = menu.querySelector<HTMLButtonElement>('.main-menu__sticker');
  if (sticker) {
    sticker.addEventListener('click', () => {
      sticker.classList.add('main-menu__sticker--dismissed');
      setTimeout(() => sticker.remove(), 400);
    });
  }

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
    btn.onclick = (ev) => {
      burst(ev.currentTarget as HTMLElement, ev as MouseEvent, item.accent);
      menu.classList.remove('main-menu--shake');
      // force a reflow so the class can be re-applied and the animation restarts
      void menu.offsetWidth;
      menu.classList.add('main-menu--shake');
      // small delay so the burst is visible before screen swap
      setTimeout(() => setScreen(item.screen), 220);
    };
    btnContainer.appendChild(btn);
  }

  // Mouse-following gold glow trail layer
  const trail = document.createElement('div');
  trail.className = 'main-menu__cursor';
  trail.setAttribute('aria-hidden', 'true');
  menu.appendChild(trail);

  menu.addEventListener('mousemove', (ev) => {
    const rect = menu.getBoundingClientRect();
    trail.style.left = `${ev.clientX - rect.left}px`;
    trail.style.top = `${ev.clientY - rect.top}px`;
    trail.style.opacity = '1';
  });
  menu.addEventListener('mouseleave', () => {
    trail.style.opacity = '0';
  });

  // Floating buzzword toasts that drift up from random spots
  const toastLayer = document.createElement('div');
  toastLayer.className = 'main-menu__toasts';
  toastLayer.setAttribute('aria-hidden', 'true');
  menu.appendChild(toastLayer);

  const BUZZWORDS = [
    { icon: '⚡', text: '+10 SYNERGY',         tone: 'gold' },
    { icon: '☕', text: 'COFFEE BREAK',         tone: 'teal' },
    { icon: '📈', text: '+47% PRODUCTIVITY',    tone: 'green' },
    { icon: '🔥', text: 'STRETCH GOAL HIT',     tone: 'red' },
    { icon: '🏆', text: 'TEAM PLAYER UNLOCKED', tone: 'gold' },
    { icon: '📊', text: 'KPI SMASHED',          tone: 'green' },
    { icon: '💼', text: 'PROMOTION INCOMING',   tone: 'gold' },
    { icon: '📎', text: 'SUPPLIES REPLENISHED', tone: 'teal' },
    { icon: '✅', text: 'PIP AVOIDED',          tone: 'green' },
    { icon: '🚀', text: 'PIVOTING TO GROWTH',   tone: 'red' },
  ];

  function spawnToast() {
    // Stop firing once the menu has been swapped out of the DOM
    if (!document.body.contains(menu)) return;
    const buzz = BUZZWORDS[Math.floor(Math.random() * BUZZWORDS.length)];
    const t = document.createElement('div');
    t.className = `main-menu__toast main-menu__toast--${buzz.tone}`;
    t.innerHTML = `<span class="main-menu__toast-icon">${buzz.icon}</span> ${buzz.text}`;
    // Random horizontal position, but stay clear of the centered panel
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const x = side === 'left'
      ? Math.random() * 18 + 2  // 2vw - 20vw
      : Math.random() * 18 + 80; // 80vw - 98vw
    t.style.left = `${x}vw`;
    t.style.top = `${60 + Math.random() * 25}%`;
    toastLayer.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  // Toast cadence: occasional, calm down after a few so the menu
  // doesn't feel like spammy notifications
  let toastsLeft = 4;
  const tick = () => {
    if (toastsLeft-- <= 0) return;
    if (!document.body.contains(menu)) return;
    spawnToast();
    setTimeout(tick, 4500 + Math.random() * 2000);
  };
  setTimeout(tick, 1800);

  container.appendChild(menu);
}
