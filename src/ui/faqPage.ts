import { setScreen } from '../store';

// All content sourced directly from src/engine/battle.ts, combat.ts,
// matchups.ts, data/abilities.ts and data/cards.ts. If you change a
// mechanic, update the matching entry here.
interface FaqSection {
  id: string;
  icon: string;
  title: string;
  body: string;          // Plain HTML, internally curated
}

const SECTIONS: FaqSection[] = [
  {
    id: 'overview',
    icon: '\u{1F3E2}',
    title: 'What is this game?',
    body: `
      <p><strong>Performance Review</strong> is a turn-based card battler set in a hostile open-plan office. You assemble a team of office archetypes — interns, middle managers, the office gossip — and try to KO your rival's department before they KO yours.</p>
      <p>Each card is a coworker with stats and an ability. You spend <em>Bandwidth</em> to play them from your <em>Inbox</em>, swap them in and out of the active slot, and Escalate against the rival's active card until somebody runs out of employees.</p>
    `,
  },
  {
    id: 'goal',
    icon: '\u{1F3AF}',
    title: 'How do I win?',
    body: `
      <p>You win Q4 if any of these happens to your rival:</p>
      <ul>
        <li>Their active card AND every card on their bench is KO'd.</li>
        <li>Their <em>Pipeline</em> (deck) and <em>Inbox</em> (hand) both run dry — they've nobody left to hire.</li>
        <li>Their CEO is KO'd. The CEO is a powerful but high-risk play: if it dies you lose immediately.</li>
      </ul>
      <p>If any of those things happens to <em>you</em>, you've been PIP'd.</p>
    `,
  },
  {
    id: 'stats',
    icon: '\u{1F4CA}',
    title: 'What do the card stats mean?',
    body: `
      <p>Every card shows four numbers on the front:</p>
      <ul>
        <li><strong>MOR</strong> — Morale: a card's HP. When it hits 0 the card is KO'd.</li>
        <li><strong>INF</strong> — Influence: how much damage they deal when they escalate.</li>
        <li><strong>TEN</strong> — Tenure: defense. Halved and subtracted from incoming damage. A senior employee with high Tenure shrugs off attacks an Intern can't.</li>
        <li><strong>SPD</strong> — Response Time: flavor stat, for future mechanics.</li>
      </ul>
      <p>The blue orb in the top-right is the card's <em>Bandwidth</em> cost to play.</p>
    `,
  },
  {
    id: 'turn',
    icon: '\u{1F504}',
    title: 'How does a turn work?',
    body: `
      <p>Each turn for the active player has four phases — usually invisible, they just happen:</p>
      <ol>
        <li><strong>Coffee Break.</strong> Bandwidth refills to the current turn number (capped at 10) plus any banked bonus.</li>
        <li><strong>Stand-Up.</strong> You draw a card.</li>
        <li><strong>Sprint.</strong> The fun part. Play cards, swap to bench, use abilities, Escalate, then Clock Out.</li>
        <li><strong>End of Day.</strong> End-of-turn abilities (Office Mom's Banana Bread, etc.) fire, statuses tick down, KOs are resolved.</li>
      </ol>
      <p>On turn 1 each side gets 1 Bandwidth. By turn 5 it's 5. The cap is 10 unless the CFO has slashed your budget.</p>
    `,
  },
  {
    id: 'play',
    icon: '\u{1F3B4}',
    title: 'How do I play a card?',
    body: `
      <p>Two ways:</p>
      <ul>
        <li><strong>Tap</strong> a card in your Inbox to deploy it.</li>
        <li><strong>Drag</strong> a card from your Inbox onto the play surface. The drop zone lights up gold.</li>
      </ul>
      <p>If you don't have anyone in the active slot, the new card promotes straight to active. Otherwise it joins the bench. Bench holds up to <strong>three</strong> coworkers; if it's full and you also have an active, you can't play another body.</p>
      <p>Tap a bench portrait to swap them into the active slot. The previous active drops to the bench.</p>
    `,
  },
  {
    id: 'attack',
    icon: '\u{26A1}',
    title: 'How does Escalating work?',
    body: `
      <p>Your active card can <strong>Escalate</strong> once per turn against the rival's active. Two ways:</p>
      <ul>
        <li>Hit the red <strong>ESCALATE</strong> button below your card.</li>
        <li>Drag your active card onto the rival's active.</li>
      </ul>
      <p>Damage is calculated as:</p>
      <pre>damage = max(1, round(influence × deptMultiplier) − floor(tenure × 0.5))</pre>
      <p>If your card has a department advantage over the defender, the multiplier is <strong>1.5×</strong>. Disadvantage drops it to <strong>0.75×</strong>. Caffeine is neutral against everything.</p>
      <p>Minimum damage is always 1 — even a max-Tenure rival can't shrug off an attack entirely.</p>
    `,
  },
  {
    id: 'depts',
    icon: '\u{1F501}',
    title: 'Department matchups',
    body: `
      <p>Departments form a circular pecking order. Whoever's pointing forward gets the 1.5× boost, the target takes 1.5× damage; the other way is 0.75×.</p>
      <pre>Sales  →  People-Ops  →  Engineering  →  Finance
                                              ↓
                                       Creative
                                              ↓
Sales  ←──────────  Operations  ←─────────────┘</pre>
      <p><strong>Caffeine</strong> (Intern, Burnout) is neutral — it never gives or takes a multiplier. Useful as a flexible filler.</p>
      <p>Cards in multiple departments use the best matchup available.</p>
    `,
  },
  {
    id: 'abilities',
    icon: '\u{1F9EA}',
    title: 'Abilities',
    body: `
      <p>Abilities have one of five triggers:</p>
      <ul>
        <li><strong>On-Play</strong> — fires once, the instant the card enters the field (e.g. Intern's "It's My First Day" makes it untargetable for a turn).</li>
        <li><strong>Active</strong> — a button you press on your turn. Costs Bandwidth, limited to once per card per turn.</li>
        <li><strong>Passive</strong> — always on, no button. Things like Bootlicker's "+5 Influence per bench ally" or Quiet Quitter's 50% damage modifier.</li>
        <li><strong>End-of-Turn</strong> — fires automatically as you Clock Out. Office Mom's Banana Bread heals here.</li>
        <li><strong>On-KO</strong> — fires when the card is KO'd.</li>
      </ul>
      <p>Long-press any card to see its full ability text in a fullscreen card inspector.</p>
    `,
  },
  {
    id: 'status',
    icon: '\u{1F6A6}',
    title: 'Status effects',
    body: `
      <p>Cards can pick up status badges that float over their portrait:</p>
      <ul>
        <li>\u{1F4C5} <strong>In Meeting</strong> — can't Escalate this turn. From HR Rep's "Let's Sync".</li>
        <li>\u{1F6E1} <strong>Protected</strong> — can't be targeted by attacks or abilities. Interns get this on play for 1 turn.</li>
        <li>\u{1F525} <strong>Burnout</strong> — Influence reduced by 10. From Office Gossip's "Rumor Mill", 2 turns.</li>
        <li>\u{2615} <strong>Caffeinated</strong> / \u{1F4AA} <strong>Motivated</strong> — reserved for future cards.</li>
      </ul>
      <p>Status duration ticks down at end of turn. The IT Guy's "Turn It Off and On Again" wipes every status on your side at once.</p>
    `,
  },
  {
    id: 'rarity',
    icon: '\u{2B50}',
    title: 'Card rarity / titles',
    body: `
      <p>Cards have a job title that doubles as their rarity tier. Higher tier = stronger stats but pricier Bandwidth:</p>
      <ul>
        <li><strong>Intern</strong> — entry-level, cheap, frail.</li>
        <li><strong>Associate</strong> — bread and butter early-game pieces.</li>
        <li><strong>Senior</strong> — mid-cost workhorses with real abilities.</li>
        <li><strong>Director</strong> — strong mid-game plays, support effects.</li>
        <li><strong>VP</strong> — late-game power: Visionary, CFO.</li>
        <li><strong>C-Suite</strong> — the CEO. One copy max per deck. Win condition or instant loss.</li>
      </ul>
    `,
  },
  {
    id: 'deck',
    icon: '\u{1F0CF}',
    title: 'Building a deck',
    body: `
      <p>The Deck Builder lets you assemble a custom 20-card pipeline:</p>
      <ul>
        <li>Exactly <strong>20 cards</strong>.</li>
        <li>Up to <strong>3 copies</strong> of any single card.</li>
        <li>At most <strong>one C-Suite</strong> card across the whole deck — a CEO is a once-per-org commitment.</li>
      </ul>
      <p>Quick Battle uses a random deck if you haven't saved one yet. Build something tuned to your style and the random matchmaking starts feeling a lot less random.</p>
    `,
  },
  {
    id: 'tips',
    icon: '\u{1F4A1}',
    title: 'Tips that punch above their weight',
    body: `
      <ul>
        <li><strong>Lock in matchups</strong> before you Escalate. A 1.5× attack into a 0.5× counter often swings a trade.</li>
        <li><strong>Combo HR + Sales.</strong> HR Rep puts the rival in a Meeting; Sales Bro deals double to anyone in one.</li>
        <li><strong>Don't blow your only KO on the bench</strong> — the active card promotes from the bench when it dies. KO the active first, then mop up.</li>
        <li><strong>IT Guy is a panic button.</strong> Save him for when you're tangled in statuses.</li>
        <li><strong>The CEO is a glass cannon.</strong> +60 INF and 150 MOR sounds great until they get rumor-milled into a coffee crash. Only field a CEO if you can shield him.</li>
        <li><strong>Burnout decays.</strong> Card is at peak Influence the turn it lands, then loses 10 each turn. Use it then drop it.</li>
      </ul>
    `,
  },
  {
    id: 'gestures',
    icon: '\u{1F446}',
    title: 'Controls and gestures',
    body: `
      <ul>
        <li><strong>Tap</strong> a hand card → play it.</li>
        <li><strong>Drag</strong> a hand card to the player side → also plays it (gold drop zone).</li>
        <li><strong>Drag</strong> your active card onto the rival's active → Escalate.</li>
        <li><strong>Tap</strong> a bench portrait → swap into active.</li>
        <li><strong>Long-press</strong> any card (or right-click) → fullscreen inspector with all stats, abilities, and flavor.</li>
        <li><strong>Tap the log strip</strong> at the bottom → expand the full action history.</li>
        <li><strong>\u{2630} Menu button</strong> at top-right → bail out to main menu.</li>
      </ul>
    `,
  },
];

export function renderFaqPage(container: HTMLElement): void {
  container.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'faq';
  page.innerHTML = `
    <div class="faq__bg" aria-hidden="true"></div>
    <header class="faq__header">
      <button class="faq__back" type="button">&larr; Back to Menu</button>
      <div class="faq__title-block">
        <h1 class="faq__title">How to Play</h1>
        <p class="faq__subtitle">Performance Review &middot; Employee Handbook</p>
      </div>
      <div class="faq__back-spacer" aria-hidden="true"></div>
    </header>
    <nav class="faq__toc" aria-label="Topics">
      ${SECTIONS.map(s => `
        <a class="faq__toc-item" href="#faq-${s.id}">
          <span class="faq__toc-icon">${s.icon}</span>
          <span>${s.title}</span>
        </a>`).join('')}
    </nav>
    <main class="faq__body">
      ${SECTIONS.map(s => `
        <section class="faq__section" id="faq-${s.id}">
          <h2 class="faq__section-title"><span class="faq__section-icon">${s.icon}</span>${s.title}</h2>
          <div class="faq__section-body">${s.body}</div>
        </section>`).join('')}
    </main>
    <footer class="faq__footer">
      Need a refresher in the middle of a match? Hit \u{2630} Menu &rarr; this page.
    </footer>
  `;

  page.querySelector<HTMLButtonElement>('.faq__back')!
      .addEventListener('click', () => setScreen('main-menu'));

  // Smooth-scroll the TOC anchors instead of jumping
  for (const link of page.querySelectorAll<HTMLAnchorElement>('.faq__toc-item')) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('href')?.slice(1);
      if (!id) return;
      page.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  container.appendChild(page);
}
