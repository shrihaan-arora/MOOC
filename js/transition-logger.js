/**
 * Transition Logger and Explanation Component
 * 
 * Manages:
 * - Current active transition card with formal notation
 * - Transition history table with chronological steps
 * - Full transition table with live active rule highlighting
 * - Plain English pedagogical narration of what happened
 */

export class TransitionLogger {
  constructor(containers = {}) {
    this.activeTransitionContainer = containers.activeTransition;
    this.historyTableContainer = containers.historyTable;
    this.rulesTableContainer = containers.rulesTable;
  }

  /**
   * Render the currently active transition card
   */
  renderActiveTransition(transition, engineSnapshot, model) {
    if (!this.activeTransitionContainer) return;

    if (!transition) {
      this.activeTransitionContainer.innerHTML = `
        <div class="active-rule-card empty-rule">
          <div class="rule-empty-text">No active transition firing (Initial configuration or machine halted)</div>
          <div class="rule-hint font-mono text-dim">Current Configuration: (${engineSnapshot.state}, "${engineSnapshot.remainingInput || 'ε'}", [${engineSnapshot.stack.join(', ')}])</div>
        </div>
      `;
      return;
    }

    const pushStr = transition.push.length === 0 ? 'ε' : transition.push.join(' ');
    const formula = `δ(${transition.from}, ${transition.input}, ${transition.pop}) = (${transition.to}, ${pushStr})`;

    // Action badge type
    let badgeClass = 'badge-primary';
    let actionLabel = 'TRANSITION';
    if (transition.phase === 'init') {
      badgeClass = 'badge-cyan';
      actionLabel = 'INITIALIZATION';
    } else if (transition.phase === 'cleanup_entry') {
      badgeClass = 'badge-amber';
      actionLabel = 'CLEANUP BRIDGE';
    } else if (transition.phase === 'cleanup' || transition.phase === 'cleanup_final') {
      badgeClass = 'badge-orange';
      actionLabel = 'STACK FLUSH';
    } else if (transition.phase === 'accept_transition') {
      badgeClass = 'badge-emerald';
      actionLabel = 'ACCEPTANCE TRIGGER';
    }

    this.activeTransitionContainer.innerHTML = `
      <div class="active-rule-card">
        <div class="rule-header">
          <span class="badge ${badgeClass}">${actionLabel}</span>
          <span class="rule-id font-mono">${transition.id}</span>
        </div>
        <div class="rule-formula font-mono">${formula}</div>
        <div class="rule-breakdown">
          <div class="breakdown-item">
            <span class="lbl">State:</span>
            <span class="val font-mono">${transition.from} ➔ ${transition.to}</span>
          </div>
          <div class="breakdown-item">
            <span class="lbl">Input:</span>
            <span class="val font-mono">${transition.input === 'ε' ? 'ε (No input consumed)' : `'${transition.input}' (Consumed)`}</span>
          </div>
          <div class="breakdown-item">
            <span class="lbl">Stack Pop:</span>
            <span class="val font-mono text-amber">Popped '${transition.pop}'</span>
          </div>
          <div class="breakdown-item">
            <span class="lbl">Stack Push:</span>
            <span class="val font-mono text-emerald">${transition.push.length > 0 ? `Pushed [${transition.push.join(', ')}]` : 'ε (No push)'}</span>
          </div>
        </div>
        ${transition.constructionRole ? `
          <div class="rule-construction-role">
            <span class="role-icon">📌</span>
            <span class="role-desc"><strong>Seminar Construction:</strong> ${transition.constructionRole}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render the chronological transition history
   */
  renderHistory(history) {
    if (!this.historyTableContainer) return;

    if (!history || history.length <= 1) {
      this.historyTableContainer.innerHTML = `
        <div class="history-empty">No transitions recorded yet. Step forward or auto-run to log execution steps.</div>
      `;
      return;
    }

    // Skip initial step 0 snapshot for transition table, or include as init
    const rows = history.slice(1).map((entry, idx) => {
      const t = entry.lastTransition;
      if (!t) return '';

      const pushStr = t.push.length === 0 ? 'ε' : t.push.join(' ');
      const isLatest = idx === history.length - 2;

      return `
        <tr class="history-row ${isLatest ? 'row-latest' : ''}">
          <td class="col-step font-mono">#${entry.stepCount}</td>
          <td class="col-state font-mono">${t.from} ➔ ${t.to}</td>
          <td class="col-input font-mono">${t.input}</td>
          <td class="col-pop font-mono text-amber">${t.pop}</td>
          <td class="col-push font-mono text-emerald">${pushStr}</td>
          <td class="col-stack font-mono">[${entry.stack.join(', ')}]</td>
          <td class="col-note">${t.note || ''}</td>
        </tr>
      `;
    }).join('');

    this.historyTableContainer.innerHTML = `
      <div class="history-table-wrapper">
        <table class="history-table">
          <thead>
            <tr>
              <th>Step</th>
              <th>State</th>
              <th>Input</th>
              <th>Pop</th>
              <th>Push</th>
              <th>Stack Result</th>
              <th>Algorithmic Explanation</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;

    // Auto-scroll to bottom of table wrapper
    const tableWrapper = this.historyTableContainer.querySelector('.history-table-wrapper');
    if (tableWrapper) {
      tableWrapper.scrollTop = tableWrapper.scrollHeight;
    }
  }

  /**
   * Render the complete transition rule table of the active model,
   * highlighting the current rule.
   */
  renderRulesTable(model, activeTransition) {
    if (!this.rulesTableContainer || !model || !model.transitions) return;

    const rows = model.transitions.map(t => {
      const isActive = activeTransition && activeTransition.id === t.id;
      const pushStr = t.push.length === 0 ? 'ε' : t.push.join(' ');

      return `
        <tr class="rule-row ${isActive ? 'rule-active' : ''}">
          <td class="col-id font-mono">${t.id}</td>
          <td class="col-from font-mono">${t.from}</td>
          <td class="col-input font-mono">${t.input}</td>
          <td class="col-pop font-mono">${t.pop}</td>
          <td class="col-to font-mono">${t.to}</td>
          <td class="col-push font-mono">${pushStr}</td>
          <td class="col-desc">${t.constructionRole || t.note}</td>
        </tr>
      `;
    }).join('');

    this.rulesTableContainer.innerHTML = `
      <div class="rules-table-wrapper">
        <table class="rules-table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Current (q)</th>
              <th>Input (a)</th>
              <th>Top (X)</th>
              <th>Next (p)</th>
              <th>Push (γ)</th>
              <th>Role in Seminar Construction</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }
}
