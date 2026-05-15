import type { CardDefinition, Department } from '../data/types';

type CardSize = 'hand' | 'active' | 'bench' | 'grid';

const DEPT_COLORS: Record<Department, string> = {
  caffeine: 'var(--dept-caffeine)',
  operations: 'var(--dept-operations)',
  engineering: 'var(--dept-engineering)',
  sales: 'var(--dept-sales)',
  'people-ops': 'var(--dept-people-ops)',
  creative: 'var(--dept-creative)',
  finance: 'var(--dept-finance)',
};

const DEPT_LABELS: Record<Department, string> = {
  caffeine: 'CAF',
  operations: 'OPS',
  engineering: 'ENG',
  sales: 'SAL',
  'people-ops': 'PPL',
  creative: 'CRE',
  finance: 'FIN',
};

export function renderCard(def: CardDefinition, size: CardSize): HTMLElement {
  const el = document.createElement('div');
  el.className = `card card--${size} card--${def.title}`;
  el.dataset.cardId = def.id;

  // Inner frame — mimics the inset border of real TCG cards
  const frame = document.createElement('div');
  frame.className = 'card__frame';

  // ── Header: name + energy cost ──
  const header = document.createElement('div');
  header.className = 'card__header';
  header.innerHTML = `
    <span class="card__name">${def.name}</span>
    <span class="card__cost">${def.energyCost}</span>
  `;
  frame.appendChild(header);

  // ── Art window with dept badge overlay ──
  const art = document.createElement('div');
  art.className = 'card__art';

  const img = document.createElement('img');
  img.src = def.imagePath;
  img.alt = def.name;
  img.loading = 'lazy';
  img.onerror = () => {
    img.remove();
    const placeholder = document.createElement('div');
    placeholder.className = 'card__art-placeholder';
    placeholder.style.background = DEPT_COLORS[def.departments[0]].replace(')', ', 0.15)').replace('var(', 'rgba(');
    placeholder.textContent = def.name.split(' ').map(w => w[0]).join('');
    art.appendChild(placeholder);
  };
  art.appendChild(img);

  // Dept badges sit inside the art area (positioned absolute)
  const deptBar = document.createElement('div');
  deptBar.className = 'card__dept-bar';
  for (const dept of def.departments) {
    const badge = document.createElement('span');
    badge.className = 'card__dept';
    badge.style.background = DEPT_COLORS[dept];
    badge.textContent = DEPT_LABELS[dept];
    deptBar.appendChild(badge);
  }
  art.appendChild(deptBar);

  frame.appendChild(art);

  // ── Stats bar ──
  const stats = document.createElement('div');
  stats.className = 'card__stats';
  const statData = [
    { key: 'mor', label: 'MOR', value: def.morale },
    { key: 'inf', label: 'INF', value: def.influence },
    { key: 'ten', label: 'TEN', value: def.tenure },
    { key: 'spd', label: 'SPD', value: def.responseTime },
  ];
  for (const s of statData) {
    const stat = document.createElement('div');
    stat.className = `card__stat card__stat--${s.key}`;
    stat.innerHTML = `
      <span class="card__stat-label">${s.label}</span>
      <span class="card__stat-value">${s.value}</span>
    `;
    stats.appendChild(stat);
  }
  frame.appendChild(stats);

  // ── Abilities ──
  const abilitiesEl = document.createElement('div');
  abilitiesEl.className = 'card__abilities';
  for (const ability of def.abilities) {
    const div = document.createElement('div');
    div.className = 'card__ability';
    const costHtml = ability.cost
      ? `<span class="card__ability-cost">${ability.cost}</span>`
      : '';
    div.innerHTML = `
      <span class="card__ability-name">${ability.name}</span>${costHtml}
      <span class="card__ability-desc"> ${ability.description}</span>
    `;
    abilitiesEl.appendChild(div);
  }
  frame.appendChild(abilitiesEl);

  // ── Flavor text ──
  const flavor = document.createElement('div');
  flavor.className = 'card__flavor';
  flavor.textContent = def.flavorText;
  frame.appendChild(flavor);

  // ── Footer: rarity ──
  const footer = document.createElement('div');
  footer.className = 'card__footer';
  footer.innerHTML = `<span class="card__rarity">${def.title}</span>`;
  frame.appendChild(footer);

  el.appendChild(frame);
  return el;
}
