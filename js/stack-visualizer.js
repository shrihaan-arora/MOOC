/**
 * Stack Visualizer Component
 * 
 * Renders the vertical pushdown stack with:
 * - Animated push / pop transitions
 * - Clear TOP marker with directional indicator
 * - Distinct visual highlight for bottom marker ⊥
 * - Distinct visual highlight for start symbol Z₀
 * - Stack index indicators (depth from top or bottom)
 * - Empty stack state display
 * - Special highlight during Seminar 1 cleanup phase (qc)
 * - Special highlight during Seminar 2 exposed bottom marker phase
 */

export class StackVisualizer {
  constructor(containerElement) {
    this.container = containerElement;
  }

  /**
   * Render the current stack state
   * @param {Array<string>} stack - Array where stack[0] is TOP
   * @param {Object} options - Additional context (state, lastTransition, phase)
   */
  render(stack, options = {}) {
    if (!this.container) return;

    const { state, lastTransition, acceptanceType } = options;
    const isCleanup = state === 'q_c';
    const isBottomExposed = stack.length === 1 && stack[0] === '⊥';
    const isStackEmpty = stack.length === 0;

    this.container.innerHTML = '';

    // Create stack wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'stack-wrapper';

    // Header info bar
    const infoBar = document.createElement('div');
    infoBar.className = 'stack-info-bar';
    infoBar.innerHTML = `
      <div class="stack-metric">
        <span class="label">Stack Depth:</span>
        <span class="value ${isStackEmpty ? 'text-amber' : ''}">${stack.length} symbol${stack.length === 1 ? '' : 's'}</span>
      </div>
      <div class="stack-metric">
        <span class="label">Top Symbol:</span>
        <span class="value font-mono ${isStackEmpty ? 'text-dim' : 'text-accent'}">
          ${isStackEmpty ? 'ε (Empty)' : stack[0]}
        </span>
      </div>
    `;
    wrapper.appendChild(infoBar);

    // Main vertical stack chamber
    const chamber = document.createElement('div');
    chamber.className = 'stack-chamber';

    // Special banner if bottom marker is exposed or in cleanup
    if (isCleanup) {
      const banner = document.createElement('div');
      banner.className = 'stack-alert-banner alert-cleanup';
      banner.innerHTML = `<span>🧹 Cleanup State Active: Popping remaining stack symbols</span>`;
      chamber.appendChild(banner);
    } else if (isBottomExposed) {
      const banner = document.createElement('div');
      banner.className = 'stack-alert-banner alert-bottom-exposed';
      banner.innerHTML = `<span>⚠️ Bottom Marker ⊥ Exposed: Original PDA stack is empty!</span>`;
      chamber.appendChild(banner);
    }

    if (isStackEmpty) {
      // Empty stack display
      const emptyBox = document.createElement('div');
      emptyBox.className = 'stack-empty-state';
      emptyBox.innerHTML = `
        <div class="empty-icon">∅</div>
        <div class="empty-title">Stack is Empty (ε)</div>
        <div class="empty-desc">
          ${acceptanceType === 'empty_stack' 
            ? 'Condition for Seminar 1 empty-stack acceptance satisfied!' 
            : 'No symbols currently residing in the stack memory.'}
        </div>
      `;
      chamber.appendChild(emptyBox);
    } else {
      // Elements container
      const itemsList = document.createElement('div');
      itemsList.className = 'stack-items-list';

      stack.forEach((symbol, index) => {
        const isTop = index === 0;
        const isBottom = index === stack.length - 1;
        const isBottomMarker = symbol === '⊥';
        const isStartSymbol = symbol === 'Z₀';

        const item = document.createElement('div');
        item.className = 'stack-item';
        
        if (isTop) item.classList.add('is-top');
        if (isBottomMarker) item.classList.add('is-bottom-marker');
        if (isStartSymbol) item.classList.add('is-start-symbol');
        if (isCleanup) item.classList.add('is-cleaning');

        // Pointer for TOP
        const topIndicator = isTop ? `
          <div class="stack-top-pointer">
            <span class="pointer-arrow">👉</span>
            <span class="pointer-badge">TOP</span>
          </div>
        ` : '';

        // Role tag
        let roleTag = '';
        if (isBottomMarker) {
          roleTag = '<span class="item-tag tag-bottom">Bottom Marker</span>';
        } else if (isStartSymbol) {
          roleTag = '<span class="item-tag tag-start">Initial Symbol</span>';
        } else {
          roleTag = '<span class="item-tag tag-symbol">Symbol</span>';
        }

        item.innerHTML = `
          ${topIndicator}
          <div class="item-content">
            <span class="item-index">[${stack.length - 1 - index}]</span>
            <span class="item-symbol font-mono">${symbol}</span>
            ${roleTag}
          </div>
        `;

        itemsList.appendChild(item);
      });

      chamber.appendChild(itemsList);
    }

    // Stack bottom base plate
    const basePlate = document.createElement('div');
    basePlate.className = 'stack-baseplate';
    basePlate.innerHTML = `<span>STACK BOTTOM BASE</span>`;
    chamber.appendChild(basePlate);

    wrapper.appendChild(chamber);
    this.container.appendChild(wrapper);
  }
}
