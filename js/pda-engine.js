/**
 * PDA Simulation Engine
 * 
 * Executes formal Pushdown Automata transitions with:
 * - Deterministic / single-path transition resolution
 * - Epsilon-transition support
 * - Stack management (push, pop, top inspection)
 * - Input tape cursor tracking
 * - Step-by-step and time-travel (step back) execution
 * - Strict acceptance verification according to selected criterion:
 *     * Final State Acceptance: state ∈ F and cursor === input.length
 *     * Empty Stack Acceptance: stack.length === 0 and cursor === input.length
 * - Comprehensive error diagnostics and rejection reasons
 * - Infinite loop safety bounds
 */

export class PDAEngine {
  constructor(model, options = {}) {
    this.model = model;
    this.maxSteps = options.maxSteps || 500;
    
    // Engine State
    this.state = null;
    this.stack = []; // index 0 is TOP of stack, index length-1 is bottom
    this.input = '';
    this.cursor = 0;
    this.stepCount = 0;
    this.status = 'idle'; // 'idle' | 'ready' | 'running' | 'accepted' | 'rejected'
    this.statusReason = '';
    this.lastTransition = null;
    this.history = []; // snapshots for time travel / step back
  }

  /**
   * Load a new model and input string
   */
  load(model, inputString = '') {
    this.model = model;
    this.input = inputString.trim();
    this.state = model.startState;
    this.stack = [model.startStack];
    this.cursor = 0;
    this.stepCount = 0;
    this.status = 'ready';
    this.statusReason = 'Simulator ready. Press Step or Run to begin simulation.';
    this.lastTransition = null;
    this.history = [];

    // Save initial snapshot
    this.saveSnapshot(null, 'Initial configuration: start state ' + this.state + ', stack: [' + this.stack.join(', ') + ']');

    // Check if initial configuration itself is accepting (e.g., empty string for certain machines)
    this.checkInitialAcceptance();

    return this.getStateSnapshot();
  }

  /**
   * Reset the current simulation back to step 0
   */
  reset() {
    if (!this.model) return null;
    return this.load(this.model, this.input);
  }

  /**
   * Check if the initial configuration is already accepting
   */
  checkInitialAcceptance() {
    if (this.input.length === 0) {
      if (this.model.acceptanceType === 'empty_stack' && this.stack.length === 0) {
        this.status = 'accepted';
        this.statusReason = 'Accepted: Empty input string and initial stack is empty.';
      } else if (this.model.acceptanceType === 'final_state' && this.model.finalStates.includes(this.state)) {
        this.status = 'accepted';
        this.statusReason = `Accepted: Empty input string and start state ${this.state} is in F.`;
      }
    }
  }

  /**
   * Save a snapshot into history for undo/step-backward
   */
  saveSnapshot(transition, description) {
    this.history.push({
      stepCount: this.stepCount,
      state: this.state,
      stack: [...this.stack],
      cursor: this.cursor,
      status: this.status,
      statusReason: this.statusReason,
      lastTransition: transition ? { ...transition } : null,
      description: description || ''
    });
  }

  /**
   * Step backward in time
   */
  stepBack() {
    if (this.history.length <= 1) {
      return null; // Cannot step back before initial state
    }

    // Pop the current state snapshot
    this.history.pop();
    // Peek the previous state snapshot
    const prev = this.history[this.history.length - 1];

    this.stepCount = prev.stepCount;
    this.state = prev.state;
    this.stack = [...prev.stack];
    this.cursor = prev.cursor;
    this.status = prev.status === 'accepted' || prev.status === 'rejected' ? 'ready' : prev.status;
    this.statusReason = prev.statusReason;
    this.lastTransition = prev.lastTransition ? { ...prev.lastTransition } : null;

    return this.getStateSnapshot();
  }

  /**
   * Find the matching transition for the current configuration
   */
  findNextTransition() {
    if (!this.model || !this.model.transitions) return null;

    const currentState = this.state;
    const topOfStack = this.stack.length > 0 ? this.stack[0] : null;
    const currentInputChar = this.cursor < this.input.length ? this.input[this.cursor] : null;

    // A transition cannot occur if the stack is completely empty (nothing to pop)
    if (topOfStack === null) {
      return null;
    }

    // Filter transitions that match currentState and topOfStack
    const candidateTransitions = this.model.transitions.filter(t => {
      if (t.from !== currentState) return false;
      if (t.pop !== topOfStack) return false;

      // Symbol transition match
      if (currentInputChar !== null && t.input === currentInputChar) {
        return true;
      }
      // Epsilon transition match
      if (t.input === 'ε') {
        return true;
      }

      return false;
    });

    if (candidateTransitions.length === 0) {
      return null;
    }

    // If there is a symbol transition and an epsilon transition, deterministic PDAs prioritize symbol,
    // but in our models they are strictly mutually exclusive.
    const symbolTrans = candidateTransitions.find(t => t.input !== 'ε');
    if (symbolTrans) return symbolTrans;

    return candidateTransitions[0];
  }

  /**
   * Execute one simulation step
   */
  step() {
    if (this.status === 'accepted' || this.status === 'rejected') {
      return this.getStateSnapshot();
    }

    if (this.stepCount >= this.maxSteps) {
      this.status = 'rejected';
      this.statusReason = `Simulation aborted: Exceeded safety limit of ${this.maxSteps} steps. Potential infinite loop detected.`;
      return this.getStateSnapshot();
    }

    this.status = 'running';
    const topOfStack = this.stack.length > 0 ? this.stack[0] : null;
    const currentInputChar = this.cursor < this.input.length ? this.input[this.cursor] : null;

    // Check if the stack is empty right now
    if (this.stack.length === 0) {
      this.evaluateTerminalState('Stack is empty; no further transitions possible.');
      return this.getStateSnapshot();
    }

    const transition = this.findNextTransition();

    if (!transition) {
      // No valid transition exists from this configuration: machine halts
      this.evaluateTerminalState(`No transition defined for δ(${this.state}, ${currentInputChar ? `'${currentInputChar}'` : 'ε'}, '${topOfStack}').`);
      return this.getStateSnapshot();
    }

    // Execute the transition:
    // 1. Pop the top element
    this.stack.shift();

    // 2. Push the new symbols (push[0] becomes new top)
    if (transition.push && transition.push.length > 0) {
      this.stack.unshift(...transition.push);
    }

    // 3. Move state
    const prevState = this.state;
    this.state = transition.to;

    // 4. Advance input cursor if this was a symbol transition
    let consumedChar = null;
    if (transition.input !== 'ε') {
      consumedChar = this.input[this.cursor];
      this.cursor++;
    }

    this.stepCount++;
    this.lastTransition = transition;

    // Generate descriptive explanation of what happened
    let description = '';
    if (transition.input === 'ε') {
      description = `Step ${this.stepCount}: [ε-transition] From ${prevState} to ${this.state}, popped '${transition.pop}'`;
    } else {
      description = `Step ${this.stepCount}: Read input '${consumedChar}' at index ${this.cursor - 1}. From ${prevState} to ${this.state}, popped '${transition.pop}'`;
    }

    if (transition.push.length > 0) {
      description += `, pushed [${transition.push.join(', ')}] onto stack.`;
    } else {
      description += `, stack popped clean without pushing.`;
    }

    // Check for acceptance or completion triggers:
    // In Empty Stack acceptance:
    if (this.model.acceptanceType === 'empty_stack') {
      if (this.stack.length === 0) {
        if (this.cursor === this.input.length) {
          this.status = 'accepted';
          this.statusReason = `ACCEPTED: Stack is empty (size 0) and entire input "${this.input || 'ε'}" has been consumed.`;
        } else {
          this.status = 'rejected';
          const remaining = this.input.slice(this.cursor);
          this.statusReason = `REJECTED: Stack became empty prematurely! Remaining unread input: "${remaining}".`;
        }
      }
    }

    // In Final State acceptance:
    if (this.model.acceptanceType === 'final_state') {
      // Notice: If in final state AND all input is consumed, does it accept?
      // Check if there are no further transitions needed, or if this state is final:
      if (this.model.finalStates.includes(this.state) && this.cursor === this.input.length) {
        // Lookahead: does it have any required transitions? In our models, q_f has no transitions.
        const nextTrans = this.findNextTransition();
        if (!nextTrans) {
          this.status = 'accepted';
          this.statusReason = `ACCEPTED: Reached final state ${this.state} ∈ F and entire input "${this.input || 'ε'}" has been consumed.`;
        }
      }
    }

    // If status is still running after the step, update statusReason to describe current progress
    if (this.status === 'running') {
      this.statusReason = description;
    }

    // Save snapshot for time-travel
    this.saveSnapshot(transition, description);

    return this.getStateSnapshot();
  }

  /**
   * Evaluate whether the halted machine configuration satisfies acceptance criteria
   */
  evaluateTerminalState(haltExplanation = '') {
    const isInputConsumed = this.cursor === this.input.length;
    const isStackEmpty = this.stack.length === 0;
    const isFinalState = this.model.finalStates.includes(this.state);

    if (this.model.acceptanceType === 'empty_stack') {
      if (isStackEmpty && isInputConsumed) {
        this.status = 'accepted';
        this.statusReason = `ACCEPTED: Stack is completely empty and all input has been consumed.`;
      } else if (!isInputConsumed) {
        this.status = 'rejected';
        const unread = this.input.slice(this.cursor);
        this.statusReason = `REJECTED: Machine halted with unconsumed input "${unread}". (${haltExplanation})`;
      } else {
        this.status = 'rejected';
        this.statusReason = `REJECTED: Input consumed, but stack is not empty (remaining stack: [${this.stack.join(', ')}]). (${haltExplanation})`;
      }
    } else if (this.model.acceptanceType === 'final_state') {
      if (isFinalState && isInputConsumed) {
        this.status = 'accepted';
        this.statusReason = `ACCEPTED: Reached final state ${this.state} ∈ {${this.model.finalStates.join(', ')}} and all input has been consumed.`;
      } else if (!isFinalState && isInputConsumed) {
        this.status = 'rejected';
        this.statusReason = `REJECTED: All input consumed, but state ${this.state} is not in final states F = {${this.model.finalStates.join(', ') || '∅'}}. (${haltExplanation})`;
      } else if (isFinalState && !isInputConsumed) {
        this.status = 'rejected';
        const unread = this.input.slice(this.cursor);
        this.statusReason = `REJECTED: In final state ${this.state}, but input was not fully consumed (remaining: "${unread}"). (${haltExplanation})`;
      } else {
        this.status = 'rejected';
        const unread = this.input.slice(this.cursor);
        this.statusReason = `REJECTED: Machine halted in non-final state ${this.state} with remaining input "${unread}". (${haltExplanation})`;
      }
    }
  }

  /**
   * Run simulation to completion
   */
  runToCompletion() {
    while (this.status === 'ready' || this.status === 'running') {
      this.step();
    }
    return this.getStateSnapshot();
  }

  /**
   * Get an immutable snapshot of current engine state
   */
  getStateSnapshot() {
    return {
      stepCount: this.stepCount,
      state: this.state,
      stack: [...this.stack],
      topOfStack: this.stack.length > 0 ? this.stack[0] : null,
      input: this.input,
      cursor: this.cursor,
      remainingInput: this.input.slice(this.cursor),
      isInputConsumed: this.cursor === this.input.length,
      status: this.status,
      statusReason: this.statusReason,
      lastTransition: this.lastTransition ? { ...this.lastTransition } : null,
      historyLength: this.history.length,
      modelName: this.model ? this.model.name : '',
      acceptanceType: this.model ? this.model.acceptanceType : ''
    };
  }
}
