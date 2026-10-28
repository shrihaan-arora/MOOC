/**
 * Main Application Controller for PDA Conversion Simulator
 * 
 * Manages UI interactions, state synchronization, timer-based auto-run,
 * preset loading, modal handling, and visual component orchestration.
 */

import { PDA_MODELS } from './pda-models.js';
import { PDAEngine } from './pda-engine.js';
import { StackVisualizer } from './stack-visualizer.js';
import { TapeVisualizer } from './tape-visualizer.js';
import { TransitionLogger } from './transition-logger.js';
import { runAllVerificationTests } from './test-suite.js';

class SimulatorApp {
  constructor() {
    this.currentSeminarKey = 'seminar1';
    this.currentVariant = 'converted'; // 'converted' | 'original'
    this.engine = null;
    this.autoRunTimer = null;
    this.autoRunSpeedMs = 600; // default speed

    // Initialize DOM elements cache
    this.cacheElements();

    // Initialize visualizer components
    this.stackVis = new StackVisualizer(this.dom.stackContainer);
    this.tapeVis = new TapeVisualizer(this.dom.tapeContainer);
    this.transLogger = new TransitionLogger({
      activeTransition: this.dom.activeTransitionContainer,
      historyTable: this.dom.historyContainer,
      rulesTable: this.dom.rulesContainer
    });

    // Attach event listeners
    this.bindEvents();

    // Load initial model and default string 'aabb'
    this.loadCurrentModel('aabb');
  }

  cacheElements() {
    this.dom = {
      // Seminar Mode Selectors
      seminar1Tab: document.getElementById('tab-seminar1'),
      seminar2Tab: document.getElementById('tab-seminar2'),
      variantConvertedBtn: document.getElementById('btn-variant-converted'),
      variantOriginalBtn: document.getElementById('btn-variant-original'),
      seminarTitle: document.getElementById('seminar-heading-title'),
      seminarGoal: document.getElementById('seminar-heading-goal'),
      seminarAcceptBadge: document.getElementById('seminar-acceptance-badge'),

      // Input Controls
      inputField: document.getElementById('input-string'),
      inputError: document.getElementById('input-error'),
      presetBtns: document.querySelectorAll('.preset-btn'),

      // Playback Controls
      btnStepForward: document.getElementById('btn-step-forward'),
      btnStepBack: document.getElementById('btn-step-back'),
      btnAutoRun: document.getElementById('btn-auto-run'),
      btnRunAll: document.getElementById('btn-run-all'),
      btnReset: document.getElementById('btn-reset'),
      speedSlider: document.getElementById('speed-slider'),
      speedLabel: document.getElementById('speed-label'),

      // Machine Status Displays
      currentStateBadge: document.getElementById('current-state-badge'),
      currentStateRole: document.getElementById('current-state-role'),
      currentConfigDisplay: document.getElementById('current-config-display'),
      stepCounterBadge: document.getElementById('step-counter-badge'),

      // Result Banner
      resultBanner: document.getElementById('result-banner'),
      resultStatusText: document.getElementById('result-status-text'),
      resultDetailText: document.getElementById('result-detail-text'),

      // Containers
      stackContainer: document.getElementById('stack-visualizer-target'),
      tapeContainer: document.getElementById('tape-visualizer-target'),
      activeTransitionContainer: document.getElementById('active-transition-target'),
      historyContainer: document.getElementById('history-table-target'),
      rulesContainer: document.getElementById('rules-table-target'),

      // Modals and Educational Buttons
      btnOpenTheory: document.getElementById('btn-open-theory'),
      btnOpenBottomMarker: document.getElementById('btn-open-bottom-marker'),
      btnOpenArchitecture: document.getElementById('btn-open-architecture'),
      btnOpenTestSuite: document.getElementById('btn-open-test-suite'),
      modalOverlay: document.getElementById('modal-overlay'),
      modalTitle: document.getElementById('modal-title'),
      modalBody: document.getElementById('modal-body'),
      modalCloseBtn: document.getElementById('modal-close-btn')
    };
  }

  /**
   * Get the current active model based on seminar key and variant
   */
  getCurrentModel() {
    const seminar = PDA_MODELS[this.currentSeminarKey];
    return this.currentVariant === 'converted' ? seminar.converted : seminar.original;
  }

  /**
   * Load the selected model and initialize the engine
   */
  loadCurrentModel(initialInput = null) {
    this.stopAutoRun();

    const inputVal = initialInput !== null ? initialInput : this.dom.inputField.value.trim();
    if (initialInput !== null) {
      this.dom.inputField.value = initialInput;
    }

    const model = this.getCurrentModel();
    const seminar = PDA_MODELS[this.currentSeminarKey];

    // Update UI headers
    this.updateHeaderInfo(seminar, model);

    // Initialize or update PDA Engine
    this.engine = new PDAEngine(model);
    this.engine.load(model, inputVal);

    // Update all visual components
    this.updateAllViews();
  }

  updateHeaderInfo(seminar, model) {
    if (this.dom.seminarTitle) {
      this.dom.seminarTitle.textContent = `${seminar.title} (${this.currentVariant === 'converted' ? 'Converted M\'' : 'Original M'})`;
    }
    if (this.dom.seminarGoal) {
      this.dom.seminarGoal.textContent = seminar.goal;
    }
    if (this.dom.seminarAcceptBadge) {
      const isConverted = this.currentVariant === 'converted';
      const cond = isConverted ? seminar.convertedAcceptance : seminar.originalAcceptance;
      this.dom.seminarAcceptBadge.textContent = `Criterion: ${cond}`;
      this.dom.seminarAcceptBadge.className = `badge ${model.acceptanceType === 'empty_stack' ? 'badge-amber' : 'badge-emerald'}`;
    }

    // Update tabs active state
    if (this.dom.seminar1Tab && this.dom.seminar2Tab) {
      this.dom.seminar1Tab.classList.toggle('active', this.currentSeminarKey === 'seminar1');
      this.dom.seminar2Tab.classList.toggle('active', this.currentSeminarKey === 'seminar2');
    }

    if (this.dom.variantConvertedBtn && this.dom.variantOriginalBtn) {
      this.dom.variantConvertedBtn.classList.toggle('active', this.currentVariant === 'converted');
      this.dom.variantOriginalBtn.classList.toggle('active', this.currentVariant === 'original');
    }
  }

  /**
   * Update all visual panels to match engine state
   */
  updateAllViews() {
    const snapshot = this.engine.getStateSnapshot();
    const model = this.getCurrentModel();

    // 1. Update State Badges and Step Counter
    this.updateStateDisplay(snapshot);

    // 2. Update Result Banner
    this.updateResultBanner(snapshot);

    // 3. Render Stack Visualizer
    this.stackVis.render(snapshot.stack, {
      state: snapshot.state,
      lastTransition: snapshot.lastTransition,
      acceptanceType: snapshot.acceptanceType
    });

    // 4. Render Input Tape Visualizer
    this.tapeVis.render(snapshot.input, snapshot.cursor, {
      status: snapshot.status
    });

    // 5. Render Active Transition Card
    this.transLogger.renderActiveTransition(snapshot.lastTransition, snapshot, model);

    // 6. Render Chronological History Table
    this.transLogger.renderHistory(this.engine.history);

    // 7. Render Model Transitions Table with highlighted active rule
    this.transLogger.renderRulesTable(model, snapshot.lastTransition);

    // 8. Update button states (disabled when appropriate)
    this.updateButtonStates(snapshot);

    // 9. Update architecture pipeline highlight
    this.updateArchitecturePipeline(snapshot);
  }

  updateStateDisplay(snapshot) {
    if (this.dom.currentStateBadge) {
      this.dom.currentStateBadge.textContent = snapshot.state;
      this.dom.currentStateBadge.className = 'state-pill font-mono';

      // Special classes based on state semantics
      if (snapshot.state === 'q_s') {
        this.dom.currentStateBadge.classList.add('state-start-new');
      } else if (snapshot.state === 'q_c') {
        this.dom.currentStateBadge.classList.add('state-cleanup');
      } else if (snapshot.state === 'q_f' || snapshot.state === 'q₂') {
        this.dom.currentStateBadge.classList.add('state-final');
      } else {
        this.dom.currentStateBadge.classList.add('state-standard');
      }
    }

    if (this.dom.currentStateRole) {
      let roleDesc = '';
      if (snapshot.state === 'q_s') roleDesc = 'Fresh Start State: Sets up bottom marker ⊥';
      else if (snapshot.state === 'q₀') roleDesc = 'State q₀: Reading prefix "a" and pushing symbols';
      else if (snapshot.state === 'q₁') roleDesc = 'State q₁: Matching "b" by popping stack symbols';
      else if (snapshot.state === 'q₂') roleDesc = 'Original Final State: All "a"s and "b"s matched';
      else if (snapshot.state === 'q_c') roleDesc = 'Cleanup State: Flushes all stack symbols to empty';
      else if (snapshot.state === 'q_f') roleDesc = 'Final Accepting State: Reached on exposed ⊥';
      this.dom.currentStateRole.textContent = roleDesc;
    }

    if (this.dom.currentConfigDisplay) {
      const topSym = snapshot.stack.length > 0 ? snapshot.stack[0] : 'ε';
      const rem = snapshot.remainingInput || 'ε';
      this.dom.currentConfigDisplay.textContent = `(${snapshot.state}, "${rem}", [${snapshot.stack.join(', ')}])`;
    }

    if (this.dom.stepCounterBadge) {
      this.dom.stepCounterBadge.textContent = `Step ${snapshot.stepCount}`;
    }
  }

  updateResultBanner(snapshot) {
    if (!this.dom.resultBanner) return;

    this.dom.resultBanner.className = 'result-banner';

    if (snapshot.status === 'accepted') {
      this.dom.resultBanner.classList.add('banner-accepted');
      this.dom.resultStatusText.innerHTML = `<span class="icon">✅</span> ACCEPTED`;
      this.dom.resultDetailText.textContent = snapshot.statusReason;
    } else if (snapshot.status === 'rejected') {
      this.dom.resultBanner.classList.add('banner-rejected');
      this.dom.resultStatusText.innerHTML = `<span class="icon">❌</span> REJECTED`;
      this.dom.resultDetailText.textContent = snapshot.statusReason;
    } else if (snapshot.status === 'running') {
      this.dom.resultBanner.classList.add('banner-running');
      this.dom.resultStatusText.innerHTML = `<span class="icon">⚙️</span> SIMULATING (Step ${snapshot.stepCount})`;
      this.dom.resultDetailText.textContent = snapshot.statusReason;
    } else {
      this.dom.resultBanner.classList.add('banner-ready');
      this.dom.resultStatusText.innerHTML = `<span class="icon">🎯</span> READY`;
      this.dom.resultDetailText.textContent = snapshot.statusReason;
    }
  }

  updateButtonStates(snapshot) {
    const isTerminated = snapshot.status === 'accepted' || snapshot.status === 'rejected';
    const canStepBack = snapshot.historyLength > 1;

    if (this.dom.btnStepForward) this.dom.btnStepForward.disabled = isTerminated;
    if (this.dom.btnRunAll) this.dom.btnRunAll.disabled = isTerminated;
    if (this.dom.btnStepBack) this.dom.btnStepBack.disabled = !canStepBack;

    if (isTerminated && this.autoRunTimer) {
      this.stopAutoRun();
    }
  }

  updateArchitecturePipeline(snapshot) {
    // Pipeline components: input -> engine -> stack -> checker -> result
    const nodes = document.querySelectorAll('.pipeline-node');
    nodes.forEach(n => n.classList.remove('pipeline-active'));

    const isTerminated = snapshot.status === 'accepted' || snapshot.status === 'rejected';

    if (isTerminated) {
      const resultNode = document.getElementById('pipe-node-result');
      if (resultNode) resultNode.classList.add('pipeline-active');
      const checkerNode = document.getElementById('pipe-node-checker');
      if (checkerNode) checkerNode.classList.add('pipeline-active');
    } else if (snapshot.status === 'running') {
      const engineNode = document.getElementById('pipe-node-engine');
      if (engineNode) engineNode.classList.add('pipeline-active');
      const stackNode = document.getElementById('pipe-node-stack');
      if (stackNode) stackNode.classList.add('pipeline-active');
    } else {
      const inputNode = document.getElementById('pipe-node-input');
      if (inputNode) inputNode.classList.add('pipeline-active');
    }
  }

  // ==========================================
  // Execution Control Handlers
  // ==========================================

  stepForward() {
    if (!this.engine) return;
    this.engine.step();
    this.updateAllViews();
  }

  stepBackward() {
    if (!this.engine) return;
    this.engine.stepBack();
    this.updateAllViews();
  }

  toggleAutoRun() {
    if (this.autoRunTimer) {
      this.stopAutoRun();
    } else {
      this.startAutoRun();
    }
  }

  startAutoRun() {
    if (!this.engine) return;

    const snap = this.engine.getStateSnapshot();
    if (snap.status === 'accepted' || snap.status === 'rejected') {
      this.resetSimulation();
    }

    if (this.dom.btnAutoRun) {
      this.dom.btnAutoRun.innerHTML = `<span class="icon">⏸️</span> Pause`;
      this.dom.btnAutoRun.classList.add('btn-pause-active');
    }

    this.autoRunTimer = setInterval(() => {
      this.engine.step();
      this.updateAllViews();

      const current = this.engine.getStateSnapshot();
      if (current.status === 'accepted' || current.status === 'rejected') {
        this.stopAutoRun();
      }
    }, this.autoRunSpeedMs);
  }

  stopAutoRun() {
    if (this.autoRunTimer) {
      clearInterval(this.autoRunTimer);
      this.autoRunTimer = null;
    }
    if (this.dom.btnAutoRun) {
      this.dom.btnAutoRun.innerHTML = `<span class="icon">▶️</span> Auto-Run`;
      this.dom.btnAutoRun.classList.remove('btn-pause-active');
    }
  }

  runAll() {
    this.stopAutoRun();
    if (!this.engine) return;
    this.engine.runToCompletion();
    this.updateAllViews();
  }

  resetSimulation() {
    this.stopAutoRun();
    if (!this.engine) return;
    this.engine.reset();
    this.updateAllViews();
  }

  // ==========================================
  // Event Binding
  // ==========================================

  bindEvents() {
    // Seminar Mode Tabs
    if (this.dom.seminar1Tab) {
      this.dom.seminar1Tab.addEventListener('click', () => {
        if (this.currentSeminarKey !== 'seminar1') {
          this.currentSeminarKey = 'seminar1';
          this.loadCurrentModel();
        }
      });
    }

    if (this.dom.seminar2Tab) {
      this.dom.seminar2Tab.addEventListener('click', () => {
        if (this.currentSeminarKey !== 'seminar2') {
          this.currentSeminarKey = 'seminar2';
          this.loadCurrentModel();
        }
      });
    }

    // Converted vs Original Variant Buttons
    if (this.dom.variantConvertedBtn) {
      this.dom.variantConvertedBtn.addEventListener('click', () => {
        if (this.currentVariant !== 'converted') {
          this.currentVariant = 'converted';
          this.loadCurrentModel();
        }
      });
    }

    if (this.dom.variantOriginalBtn) {
      this.dom.variantOriginalBtn.addEventListener('click', () => {
        if (this.currentVariant !== 'original') {
          this.currentVariant = 'original';
          this.loadCurrentModel();
        }
      });
    }

    // Input Field
    if (this.dom.inputField) {
      this.dom.inputField.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        // Validate alphabet {a, b}
        const isValid = /^[ab]*$/.test(val);
        if (!isValid) {
          if (this.dom.inputError) {
            this.dom.inputError.textContent = 'Only symbols "a" and "b" belong to input alphabet Σ = {a, b}.';
            this.dom.inputError.classList.remove('hidden');
          }
        } else {
          if (this.dom.inputError) {
            this.dom.inputError.classList.add('hidden');
          }
          this.loadCurrentModel(val);
        }
      });
    }

    // Preset Buttons
    if (this.dom.presetBtns) {
      this.dom.presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const presetVal = btn.getAttribute('data-input') ?? '';
          this.dom.inputField.value = presetVal;
          if (this.dom.inputError) this.dom.inputError.classList.add('hidden');
          this.loadCurrentModel(presetVal);
        });
      });
    }

    // Step / Run Controls
    if (this.dom.btnStepForward) this.dom.btnStepForward.addEventListener('click', () => this.stepForward());
    if (this.dom.btnStepBack) this.dom.btnStepBack.addEventListener('click', () => this.stepBackward());
    if (this.dom.btnAutoRun) this.dom.btnAutoRun.addEventListener('click', () => this.toggleAutoRun());
    if (this.dom.btnRunAll) this.dom.btnRunAll.addEventListener('click', () => this.runAll());
    if (this.dom.btnReset) this.dom.btnReset.addEventListener('click', () => this.resetSimulation());

    // Speed Slider
    if (this.dom.speedSlider) {
      this.dom.speedSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        // Slider value 1 (slow) to 5 (fast)
        const speedMap = {
          1: { ms: 1400, label: '0.7x (Slow)' },
          2: { ms: 900,  label: '1.0x (Normal)' },
          3: { ms: 500,  label: '2.0x (Brisk)' },
          4: { ms: 250,  label: '4.0x (Fast)' },
          5: { ms: 80,   label: '10.0x (Turbo)' }
        };
        const selected = speedMap[val] || speedMap[2];
        this.autoRunSpeedMs = selected.ms;
        if (this.dom.speedLabel) this.dom.speedLabel.textContent = selected.label;

        // If currently running, restart timer with new interval
        if (this.autoRunTimer) {
          this.stopAutoRun();
          this.startAutoRun();
        }
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT') return;

      if (e.code === 'ArrowRight' || e.code === 'KeyS') {
        e.preventDefault();
        this.stepForward();
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyB') {
        e.preventDefault();
        this.stepBackward();
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.toggleAutoRun();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        this.resetSimulation();
      }
    });

    // Modals and Educational Panels
    if (this.dom.btnOpenTheory) {
      this.dom.btnOpenTheory.addEventListener('click', () => this.showTheoryModal());
    }
    if (this.dom.btnOpenBottomMarker) {
      this.dom.btnOpenBottomMarker.addEventListener('click', () => this.showBottomMarkerModal());
    }
    if (this.dom.btnOpenArchitecture) {
      this.dom.btnOpenArchitecture.addEventListener('click', () => this.showArchitectureModal());
    }
    if (this.dom.btnOpenTestSuite) {
      this.dom.btnOpenTestSuite.addEventListener('click', () => this.showTestSuiteModal());
    }

    // Modal Close
    if (this.dom.modalCloseBtn) {
      this.dom.modalCloseBtn.addEventListener('click', () => this.closeModal());
    }
    if (this.dom.modalOverlay) {
      this.dom.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.dom.modalOverlay) this.closeModal();
      });
    }

    // Clickable Pipeline Nodes
    const pipeNodes = document.querySelectorAll('.pipeline-node');
    pipeNodes.forEach(node => {
      node.addEventListener('click', () => {
        const componentId = node.getAttribute('data-component');
        this.showPipelineDetail(componentId);
      });
    });
  }

  // ==========================================
  // Educational Modals
  // ==========================================

  openModal(title, htmlContent) {
    if (!this.dom.modalOverlay) return;
    this.dom.modalTitle.textContent = title;
    this.dom.modalBody.innerHTML = htmlContent;
    this.dom.modalOverlay.classList.remove('hidden');
  }

  closeModal() {
    if (!this.dom.modalOverlay) return;
    this.dom.modalOverlay.classList.add('hidden');
  }

  showTheoryModal() {
    this.openModal(
      'Formal Language Equivalence Theorem',
      `
      <div class="theory-modal-content">
        <div class="theory-section">
          <h3>Equivalence of Acceptance Criteria</h3>
          <p>
            In the formal theory of computation (Hopcroft, Motwani, Ullman), a Pushdown Automaton (PDA) can accept strings in two standard ways:
          </p>
          <ul>
            <li><strong>L(M) — Acceptance by Final State:</strong> The machine reaches a configuration <code>(q, ε, γ)</code> where <code>q ∈ F</code>, all input is consumed, and the stack contents <code>γ ∈ Γ*</code> are arbitrary.</li>
            <li><strong>N(M) — Acceptance by Empty Stack:</strong> The machine reaches a configuration <code>(q, ε, ε)</code> where the stack is completely empty, all input is consumed, and the state <code>q ∈ Q</code> is arbitrary.</li>
          </ul>
          <div class="theory-theorem-box">
            <strong>Fundamental Theorem:</strong><br>
            A language <em>L</em> is accepted by some PDA by final state if and only if <em>L</em> is accepted by some PDA by empty stack:
            <div class="math-banner">L = L(M₁) &iff; L = N(M₁') &nbsp;&nbsp;&&nbsp;&nbsp; L = N(M₂) &iff; L = L(M₂')</div>
          </div>
        </div>

        <div class="theory-section">
          <h3>The Test Language: L = { aⁿbⁿ | n &ge; 1 }</h3>
          <p>
            This seminar uses the canonical context-free language <code>L = { aⁿbⁿ | n &ge; 1 }</code>.
            Because a finite automaton cannot count unbounded repetitions of <code>a</code>'s and <code>b</code>'s,
            a pushdown stack is required:
          </p>
          <ol>
            <li>For every <code>a</code> read from the input tape, push a marker <code>A</code> onto the stack.</li>
            <li>When <code>b</code>'s begin, pop one <code>A</code> for each <code>b</code> read.</li>
            <li>If the stack matches the bottom symbol at the exact moment input terminates, the counts match (<em>n = m</em>).</li>
          </ol>
        </div>
      </div>
      `
    );
  }

  showBottomMarkerModal() {
    this.openModal(
      'The Bottom Marker (⊥): Purpose and Mechanics',
      `
      <div class="bottom-marker-content">
        <div class="marker-intro-banner">
          <span class="marker-symbol">⊥</span>
          <div>
            <h4>Why is a fresh bottom marker required?</h4>
            <p>The symbol <code>⊥ &notin; &Gamma;</code> is a freshly introduced stack symbol placed at the very bottom under the original start symbol <code>Z₀</code>.</p>
          </div>
        </div>

        <div class="marker-grid">
          <div class="marker-card">
            <h4>Seminar 1: Final State &rarr; Empty Stack</h4>
            <div class="marker-role-tag role-s1">Shields Against Accidental Acceptance</div>
            <p>
              In the original PDA <em>M₁</em>, the stack may happen to become empty during an intermediate computation 
              before reaching a final state or before finishing the input.
            </p>
            <div class="code-box font-mono">
              Initial Stack: [ Z₀ , ⊥ ]<br>
              Intermediate:  [ A , Z₀ , ⊥ ] &rarr; [ ⊥ ]
            </div>
            <p>
              <strong>The Safeguard:</strong> Because <code>⊥</code> sits at the bottom, the converted machine's stack 
              <strong>never becomes truly empty</strong> during ordinary simulation!
            </p>
            <p>
              Only when the machine reaches an original final state <code>q ∈ F</code> does it enter the cleanup state <code>q_c</code>, 
              which explicitly pops all symbols including <code>⊥</code> to accept.
            </p>
          </div>

          <div class="marker-card">
            <h4>Seminar 2: Empty Stack &rarr; Final State</h4>
            <div class="marker-role-tag role-s2">Detects Original Stack Emptiness</div>
            <p>
              The original PDA <em>M₂</em> signals acceptance when its stack becomes empty. But a physical PDA cannot 
              "sense" an empty stack without crashing (no transitions are defined on an empty stack).
            </p>
            <div class="code-box font-mono">
              Initial Stack: [ Z₀ , ⊥ ]<br>
              When M₂ empties: [ ⊥ ] exposed at TOP!
            </div>
            <p>
              <strong>The Sensor:</strong> When <em>M₂</em> pops its last symbol (<code>Z₀</code>), <code>⊥</code> becomes 
              exposed at the top of the stack!
            </p>
            <p>
              The converted machine catches this condition via <code>&delta;'(q, &epsilon;, ⊥) = (q_f, ⊥)</code> and jumps 
              directly to the new final accepting state <code>q_f</code>!
            </p>
          </div>
        </div>
      </div>
      `
    );
  }

  showArchitectureModal() {
    this.openModal(
      'Simulator Architecture & Conversion Pipeline',
      `
      <div class="architecture-modal-content">
        <p>The simulator implements a decoupled, modular pipeline running purely client-side:</p>
        
        <div class="arch-flow-diagram font-mono">
          [User Input] &rarr; [PDA Transition Engine] &rarr; [Stack Manager] &rarr; [Acceptance Checker] &rarr; [Result]
        </div>

        <div class="arch-components-grid">
          <div class="arch-card">
            <h4>1. User Input & Tape Manager</h4>
            <p>Validates alphabet symbols &Sigma; = {a, b}, manages cursor pointer index, tracks read symbols vs unread symbols.</p>
          </div>
          <div class="arch-card">
            <h4>2. PDA Transition Engine</h4>
            <p>Pure mathematical transition resolver. Matches &delta;(q, a, X), handles &epsilon;-transitions, maintains state transitions, enforces safety limits.</p>
          </div>
          <div class="arch-card">
            <h4>3. Stack Manager (LIFO)</h4>
            <p>Strict pushdown store with animated DOM rendering, top pointer detection, and bottom marker (⊥) isolation.</p>
          </div>
          <div class="arch-card">
            <h4>4. Acceptance Checker</h4>
            <p>Enforces formal acceptance criteria. Seminar 1: Stack is empty (size 0). Seminar 2: Reached state q_f &isin; F. Both require 100% input consumption.</p>
          </div>
        </div>
      </div>
      `
    );
  }

  showPipelineDetail(componentId) {
    const details = {
      input: {
        title: 'Component 1: User Input & Tape Head',
        body: 'Parses string w &isin; &Sigma;*, maintains read head cursor position, checks EOF condition ($). Ensures every character is processed one symbol at a time.'
      },
      engine: {
        title: 'Component 2: PDA Transition Engine',
        body: 'Evaluates matching rules &delta;(q, a, X). Deterministically prioritizes matching symbol transitions or &epsilon;-transitions. Manages state machine lifecycle and step-history snapshots.'
      },
      stack: {
        title: 'Component 3: Stack Manager (Pushdown Store)',
        body: 'Maintains LIFO pushdown memory. Pushes symbol sequences [A, Z₀], pops top symbols, exposes bottom marker ⊥, and executes the cleanup flush in state q_c.'
      },
      checker: {
        title: 'Component 4: Acceptance Checker',
        body: 'Verifies formal criteria upon machine halt. In Seminar 1: checks if stack.length === 0 and cursor === input.length. In Seminar 2: checks if state &isin; F and cursor === input.length.'
      },
      result: {
        title: 'Component 5: Result & Explanation Generator',
        body: 'Formulates clear academic diagnostic feedback explaining whether string was accepted or rejected with formal mathematical reasoning.'
      }
    };

    const item = details[componentId] || details.engine;
    this.openModal(item.title, `<p style="font-size: 1.05rem; line-height: 1.6;">${item.body}</p>`);
  }

  showTestSuiteModal() {
    const report = runAllVerificationTests();

    const renderTable = (suiteName, res) => `
      <div class="suite-table-block">
        <h4>${suiteName} <span class="badge ${res.allPassed ? 'badge-success' : 'badge-danger'}">${res.passedCount}/${res.total} Passed</span></h4>
        <table class="test-results-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Input</th>
              <th>Expected</th>
              <th>Actual</th>
              <th>Steps</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${res.results.map(r => `
              <tr class="${r.passed ? 'test-pass' : 'test-fail'}">
                <td>${r.passed ? '✅ PASS' : '❌ FAIL'}</td>
                <td class="font-mono"><strong>"${r.input}"</strong></td>
                <td class="font-mono">${r.expected}</td>
                <td class="font-mono">${r.actual}</td>
                <td class="font-mono">${r.stepCount}</td>
                <td>${r.label}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    const html = `
      <div class="test-suite-modal-content">
        <div class="test-suite-header">
          <p>
            The automated test runner executes the exact 8 canonical test cases mandated by the seminar specification 
            across both original and converted machines for both Seminar 1 and Seminar 2.
          </p>
          <div class="overall-test-banner ${report.overallSuccess ? 'test-all-good' : 'test-has-failures'}">
            ${report.overallSuccess ? '🎉 ALL 16 TESTS PASSED — LANGUAGE EQUIVALENCE VERIFIED' : '⚠️ SOME TESTS FAILED'}
          </div>
        </div>

        ${renderTable('Seminar 1: Converted PDA M₁\' (Empty Stack)', report.seminar1.converted)}
        ${renderTable('Seminar 1: Original PDA M₁ (Final State)', report.seminar1.original)}
        ${renderTable('Seminar 2: Converted PDA M₂\' (Final State)', report.seminar2.converted)}
        ${renderTable('Seminar 2: Original PDA M₂ (Empty Stack)', report.seminar2.original)}
      </div>
    `;

    this.openModal('Automated Verification Test Suite', html);
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SimulatorApp();
});
