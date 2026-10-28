/**
 * Input Tape Visualizer Component
 * 
 * Displays:
 * - Tape cells for each input symbol
 * - Animated tape reading head pointing to current symbol
 * - Read/consumed status vs unread status
 * - End-of-tape marker ($ / EOF)
 * - Progress indicator and remaining string summary
 */

export class TapeVisualizer {
  constructor(containerElement) {
    this.container = containerElement;
  }

  /**
   * Render the input tape
   * @param {string} input - Full input string
   * @param {number} cursor - Current reading index (0 to input.length)
   * @param {Object} options - Status and flags
   */
  render(input, cursor, options = {}) {
    if (!this.container) return;

    this.container.innerHTML = '';

    const isConsumedAll = cursor >= input.length;
    const progressPercent = input.length > 0 ? Math.min(100, Math.round((cursor / input.length) * 100)) : 100;

    const wrapper = document.createElement('div');
    wrapper.className = 'tape-wrapper';

    // Header metrics
    const header = document.createElement('div');
    header.className = 'tape-header';
    header.innerHTML = `
      <div class="tape-metrics">
        <span class="label">Tape Head Position:</span>
        <span class="value font-mono">${cursor} / ${input.length}</span>
        <span class="badge ${isConsumedAll ? 'badge-success' : 'badge-primary'}">
          ${isConsumedAll ? 'All Input Consumed ✓' : `Reading '${input[cursor]}' next`}
        </span>
      </div>
      <div class="tape-progress-bar-bg">
        <div class="tape-progress-bar-fill" style="width: ${progressPercent}%;"></div>
      </div>
    `;
    wrapper.appendChild(header);

    // Tape Track
    const track = document.createElement('div');
    track.className = 'tape-track';

    if (input.length === 0) {
      // Empty input representation
      const emptyCell = document.createElement('div');
      emptyCell.className = 'tape-cell empty-cell active';
      emptyCell.innerHTML = `
        <div class="tape-head-pointer">▼ HEAD</div>
        <div class="cell-symbol font-mono">ε</div>
        <div class="cell-label">Empty String</div>
      `;
      track.appendChild(emptyCell);
    } else {
      // Create cells for each character
      for (let i = 0; i < input.length; i++) {
        const char = input[i];
        const isRead = i < cursor;
        const isCurrent = i === cursor;
        const isUnread = i > cursor;

        const cell = document.createElement('div');
        cell.className = 'tape-cell';
        if (isRead) cell.classList.add('cell-read');
        if (isCurrent) cell.classList.add('cell-current');
        if (isUnread) cell.classList.add('cell-unread');

        const headMarker = isCurrent ? `
          <div class="tape-head-pointer">
            <span class="head-arrow">▼</span>
            <span class="head-badge">HEAD</span>
          </div>
        ` : '';

        const statusLabel = isRead ? '✓' : (isCurrent ? 'ACTIVE' : '');

        cell.innerHTML = `
          ${headMarker}
          <div class="cell-symbol font-mono">${char}</div>
          <div class="cell-index">[${i}]</div>
          ${statusLabel ? `<div class="cell-status">${statusLabel}</div>` : ''}
        `;

        track.appendChild(cell);
      }

      // End-of-tape EOF cell
      const eofCell = document.createElement('div');
      eofCell.className = 'tape-cell eof-cell';
      const isCurrentEof = cursor === input.length;
      if (isCurrentEof) eofCell.classList.add('cell-current');

      const eofHeadMarker = isCurrentEof ? `
        <div class="tape-head-pointer">
          <span class="head-arrow">▼</span>
          <span class="head-badge">EOF</span>
        </div>
      ` : '';

      eofCell.innerHTML = `
        ${eofHeadMarker}
        <div class="cell-symbol font-mono">$</div>
        <div class="cell-index">[${input.length}]</div>
        <div class="cell-status">END</div>
      `;
      track.appendChild(eofCell);
    }

    wrapper.appendChild(track);
    this.container.appendChild(wrapper);
  }
}
