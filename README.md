# Pushdown Automaton (PDA) Acceptance Conversion Simulator
**Course / Subject:** Models of Computation • Automata & Formal Languages  
**Seminar 1:** Acceptance by Final State $\to$ Acceptance by Empty Stack ($L(M) \implies N(M')$)  
**Seminar 2:** Acceptance by Empty Stack $\to$ Acceptance by Final State ($N(M) \implies L(M')$)

---

## 🎯 Project Objective
In formal language theory, a Pushdown Automaton (PDA) can be defined under two distinct acceptance criteria:
1. **Acceptance by Final State ($L(M)$):** The machine halts with all input consumed and reaches a state $q \in F$. Stack contents are disregarded.
2. **Acceptance by Empty Stack ($N(M)$):** The machine halts with all input consumed and the pushdown stack completely empty ($\text{Stack} = \varepsilon$). The final state does not matter.

This web application simulates and visually demonstrates both standard equivalence conversion constructions using the canonical non-regular context-free language:
$$L = \{ a^n b^n \mid n \ge 1 \}$$

---

## 🚀 Quick Start / How to Run Locally

Because the project uses ES6 JavaScript modules for clean separation of concerns, run it with any standard local HTTP static server:

### Option 1: Python 3 (Built-in)
```bash
# Navigate to the MOOC directory
cd /Users/SHREEHANARORA/dev/programs/MOOC

# Start local web server on port 8000
python3 -m http.server 8000
```
Then open your web browser and navigate to:
[http://localhost:8000](http://localhost:8000)

### Option 2: Node.js (npx serve / http-server)
```bash
cd /Users/SHREEHANARORA/dev/programs/MOOC
npx serve .
```

### Option 3: Automated CLI Verification Suite
You can also run the built-in mathematical test suite directly in Node.js without opening a browser:
```bash
node /Users/SHREEHANARORA/dev/programs/MOOC/js/test-suite.js
```

---

## 🔬 Formal Construction Details

### 1. Seminar 1: Final State $\to$ Empty Stack ($L(M_1) \implies N(M_1')$)
Given PDA $M_1 = (Q, \Sigma, \Gamma, \delta, q_0, Z_0, F)$ accepting by final state:
1. **New Start State $q_s$:** Introduce a fresh start state $q_s \notin Q$.
2. **Bottom Marker $\bot$:** Introduce a fresh stack bottom marker $\bot \notin \Gamma$ and start with stack symbol $\bot$.
3. **Initialization:** Add transition $\delta'(q_s, \varepsilon, \bot) = (q_0, Z_0 \bot)$. This pushes $Z_0$ above $\bot$.
4. **Simulation:** Copy all transitions from $M_1$ unchanged ($\delta'(q, a, X) = \delta(q, a, X)$).
5. **Bridge to Cleanup State $q_c$:** For every final state $q \in F$ and symbol $X \in \Gamma \cup \{\bot\}$, add:
   $$\delta'(q, \varepsilon, X) = (q_c, X)$$
6. **Stack Flush in $q_c$:** In state $q_c$, pop every symbol on the stack without reading input:
   $$\delta'(q_c, \varepsilon, X) = (q_c, \varepsilon) \quad \forall X \in \Gamma \cup \{\bot\}$$
7. **Acceptance:** When $\bot$ is popped, the stack is completely empty. If all input has been read, $M_1'$ accepts by empty stack.

> **Role of $\bot$ in Seminar 1:** Shields the machine against premature empty-stack halting. If $M_1$'s stack accidentally becomes empty before reading all input or reaching a final state, $M_1'$'s stack still contains $\bot$ and does not accept.

---

### 2. Seminar 2: Empty Stack $\to$ Final State ($N(M_2) \implies L(M_2')$)
Given PDA $M_2 = (Q, \Sigma, \Gamma, \delta, q_0, Z_0, \emptyset)$ accepting by empty stack:
1. **New Start State $q_s$ & Final State $q_f$:** Introduce $q_s, q_f \notin Q$. Final state set $F' = \{q_f\}$.
2. **Bottom Marker $\bot$:** Start with $\bot$ on stack.
3. **Initialization:** Add $\delta'(q_s, \varepsilon, \bot) = (q_0, Z_0 \bot)$.
4. **Simulation:** Copy all transitions from $M_2$.
5. **Detect Empty Stack via $\bot$:** In $M_2$, emptying the stack occurs when $Z_0$ is popped. In $M_2'$, popping $Z_0$ leaves $\bot$ exposed at the top of the stack!
6. **Acceptance Bridge:** When $\bot$ is on top, transition to final state $q_f$ without popping $\bot$:
   $$\delta'(q, \varepsilon, \bot) = (q_f, \bot) \quad \forall q \in Q$$
7. **Acceptance:** If all input is consumed, $M_2'$ halts in $q_f \in F'$ and accepts by final state.

> **Role of $\bot$ in Seminar 2:** Acts as an empty-stack detector. A PDA cannot execute transitions on an empty stack (it would crash); by placing $\bot$ underneath $Z_0$, the exposure of $\bot$ signals that $M_2$ emptied its stack.

---

## 📊 Canonical Test Cases & Language Equivalence

Language: $L = \{ a^n b^n \mid n \ge 1 \}$ on $\Sigma = \{a, b\}$.

| Input String | Expected Result | Seminar 1 ($M_1'$) | Seminar 2 ($M_2'$) | Mathematical Explanation |
| :--- | :---: | :---: | :---: | :--- |
| `ab` | **ACCEPTED** | ✅ PASS (7 steps) | ✅ PASS (5 steps) | $n=1$, minimal matching string |
| `aabb` | **ACCEPTED** | ✅ PASS (9 steps) | ✅ PASS (7 steps) | $n=2$, 2 pushes of $A$, 2 pops |
| `aaabbb` | **ACCEPTED** | ✅ PASS (11 steps) | ✅ PASS (9 steps) | $n=3$, 3 pushes of $A$, 3 pops |
| `aab` | **REJECTED** | ✅ PASS (4 steps) | ✅ PASS (4 steps) | Excess $a$: stack not empty ($A Z_0 \bot$) |
| `abb` | **REJECTED** | ✅ PASS (7 steps) | ✅ PASS (5 steps) | Excess $b$: unconsumed input `'b'` |
| `ba` | **REJECTED** | ✅ PASS (1 step) | ✅ PASS (1 step) | Invalid order: no transition on `'b'` in $q_0$ |
| `abab` | **REJECTED** | ✅ PASS (7 steps) | ✅ PASS (5 steps) | Alternating order not in language |
| `ε` (empty) | **REJECTED** | ✅ PASS (1 step) | ✅ PASS (1 step) | Language requires $n \ge 1$ |

---

## 🏗️ Architecture Pipeline

The simulator implements a decoupled, pure client-side pipeline:

```
[User Input & Tape] ──▶ [PDA Transition Engine] ──▶ [Stack Manager (LIFO)] ──▶ [Acceptance Checker] ──▶ [Diagnostic Result]
```

1. **User Input & Tape:** Validates alphabet $\Sigma = \{a, b\}$, maintains read head cursor, tracks read vs unread symbols, and checks EOF marker (`$`).
2. **PDA Transition Engine (`js/pda-engine.js`):** Formal transition resolver. Matches $\delta(q, a, X)$, handles $\varepsilon$-transitions, maintains execution history snapshots for time-travel debugging.
3. **Stack Manager (`js/stack-visualizer.js`):** Strict pushdown memory. Pushes symbol sequences, pops top elements, highlights bottom marker $\bot$, and renders push/pop CSS animations.
4. **Acceptance Checker:** Strictly evaluates the terminal configuration against the chosen criterion (Empty Stack vs Final State) and requires 100% input consumption.
5. **Diagnostic Generator:** Produces detailed academic feedback explaining the exact mathematical justification.

---

## ⌨️ Controls & Keyboard Shortcuts

- **Step Forward (`Right Arrow` or `S`):** Execute a single transition rule.
- **Step Backward (`Left Arrow` or `B`):** Step back in time (undo last transition).
- **Auto-Run / Pause (`Space`):** Continuously execute steps at chosen speed.
- **Fast End (`Run All`):** Run immediately to final accepted/rejected state.
- **Reset (`R`):** Reset configuration to step 0.
- **Speed Slider:** Adjust auto-run delay from 0.7x (1400ms) to 10.0x (80ms).

---

## 📁 Source Code Organization

```
MOOC/
├── index.html              # University seminar dashboard UI layout
├── README.md               # Documentation, proofs, and launch instructions
├── css/
│   ├── style.css           # Academic color tokens, layout grids, controls
│   ├── stack.css           # 3D stack chamber, push/pop animations, bottom marker glow
│   └── components.css      # Tape visualizer, result banner, tables, pipeline, modals
└── js/
    ├── pda-models.js       # Formal 7-tuple models for Seminar 1 and Seminar 2
    ├── pda-engine.js       # Core PDA execution engine with time-travel snapshots
    ├── stack-visualizer.js # Pushdown stack rendering and cleanup alert banners
    ├── tape-visualizer.js  # Interactive symbol tape with read head pointer
    ├── transition-logger.js# Active transition formulas, history trace, and rule table
    ├── test-suite.js       # Automated verification suite (runs in CLI and browser)
    └── app.js              # Application controller wiring all components
```
