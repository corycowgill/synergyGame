import type { TutorialStep } from '../data/tutorialSteps';

let overlayEl: HTMLElement | null = null;
let onAdvance: (() => void) | null = null;

export function showTutorialOverlay(step: TutorialStep, advanceFn: () => void): void {
  hideTutorialOverlay();
  onAdvance = advanceFn;

  // Wait a frame so the DOM element we're highlighting has been laid out
  requestAnimationFrame(() => {
    const target = document.querySelector(step.highlight);
    const rect = target?.getBoundingClientRect();

    // Create overlay container
    overlayEl = document.createElement('div');
    overlayEl.className = 'tutorial-overlay';

    // Spotlight cutout — darkens everything except the highlighted element
    const spotlight = document.createElement('div');
    spotlight.className = 'tutorial-spotlight';
    if (rect) {
      const pad = 6;
      spotlight.style.top = `${rect.top - pad}px`;
      spotlight.style.left = `${rect.left - pad}px`;
      spotlight.style.width = `${rect.width + pad * 2}px`;
      spotlight.style.height = `${rect.height + pad * 2}px`;
    }
    overlayEl.appendChild(spotlight);

    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = `tutorial-tooltip tutorial-tooltip--${step.position}`;

    // Position tooltip relative to target
    if (rect) {
      const tooltipWidth = 300;
      let top = 0;
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;

      // Clamp left to viewport
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));

      if (step.position === 'below') {
        top = rect.bottom + 12;
      } else if (step.position === 'above') {
        top = rect.top - 12;
      }

      tooltip.style.left = `${left}px`;

      if (step.position === 'above') {
        tooltip.style.bottom = `${window.innerHeight - top}px`;
      } else {
        tooltip.style.top = `${top}px`;
      }
    } else {
      // Fallback: center the tooltip
      tooltip.style.top = '50%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
    }

    tooltip.innerHTML = `
      <div class="tutorial-tooltip__message">${step.message}</div>
      ${step.action.type === 'dismiss' || step.action.type === 'finish'
        ? `<button class="tutorial-tooltip__btn">${step.action.type === 'finish' ? 'Start Playing!' : 'Got it'}</button>`
        : '<div class="tutorial-tooltip__hint">Do the highlighted action to continue</div>'}
    `;

    overlayEl.appendChild(tooltip);
    document.body.appendChild(overlayEl);

    // Wire up dismiss button
    const btn = tooltip.querySelector('.tutorial-tooltip__btn');
    if (btn) {
      btn.addEventListener('click', () => {
        if (onAdvance) onAdvance();
      });
    }
  });
}

export function hideTutorialOverlay(): void {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
  onAdvance = null;
}
