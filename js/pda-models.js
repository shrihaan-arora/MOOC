/**
 * PDA Formal Models for Models of Computation Seminar
 * 
 * Demonstrates:
 * 1. Seminar 1: Acceptance by Final State -> Acceptance by Empty Stack
 * 2. Seminar 2: Acceptance by Empty Stack -> Acceptance by Final State
 * 
 * Language: L = { a^n b^n | n >= 1 }
 */

const BOTTOM_MARKER = '⊥';
const START_STACK_SYM = 'Z₀';

/**
 * PDA Specification Schema:
 * {
 *   id: string,
 *   name: string,
 *   type: 'final_state' | 'empty_stack',
 *   language: string,
 *   states: string[],
 *   inputAlphabet: string[],
 *   stackAlphabet: string[],
 *   startState: string,
 *   startStack: string,
 *   finalStates: string[],
 *   transitions: [
 *     { from: string, input: string, pop: string, to: string, push: string[], id: string, note: string, phase: string }
 *   ]
 * }
 */

export const PDA_MODELS = {
  // ==========================================
  // SEMINAR 1: Final State -> Empty Stack
  // ==========================================
  seminar1: {
    id: 'seminar1',
    title: 'Seminar 1: Final State → Empty Stack',
    shortTitle: 'Final State → Empty Stack',
    goal: 'Convert PDA M₁ (accepts by Final State) into M₁\' (accepts by Empty Stack)',
    originalAcceptance: 'Final State (q₂ ∈ F)',
    convertedAcceptance: 'Empty Stack (Stack = ε and all input consumed)',
    
    // Original PDA M1 (Accepts by Final State)
    original: {
      name: 'Original PDA M₁',
      acceptanceType: 'final_state',
      states: ['q₀', 'q₁', 'q₂'],
      inputAlphabet: ['a', 'b'],
      stackAlphabet: ['A', 'Z₀'],
      startState: 'q₀',
      startStack: 'Z₀',
      finalStates: ['q₂'],
      transitions: [
        {
          id: 'm1_t1',
          from: 'q₀',
          input: 'a',
          pop: 'Z₀',
          to: 'q₀',
          push: ['A', 'Z₀'],
          note: 'First "a": push A above Z₀',
          phase: 'simulation'
        },
        {
          id: 'm1_t2',
          from: 'q₀',
          input: 'a',
          pop: 'A',
          to: 'q₀',
          push: ['A', 'A'],
          note: 'Subsequent "a": push another A',
          phase: 'simulation'
        },
        {
          id: 'm1_t3',
          from: 'q₀',
          input: 'b',
          pop: 'A',
          to: 'q₁',
          push: [],
          note: 'First "b": match and pop top A, switch to state q₁',
          phase: 'simulation'
        },
        {
          id: 'm1_t4',
          from: 'q₁',
          input: 'b',
          pop: 'A',
          to: 'q₁',
          push: [],
          note: 'Subsequent "b": pop matching A',
          phase: 'simulation'
        },
        {
          id: 'm1_t5',
          from: 'q₁',
          input: 'ε',
          pop: 'Z₀',
          to: 'q₂',
          push: ['Z₀'],
          note: 'All matching b\'s consumed; ε-transition to final state q₂ with Z₀ intact',
          phase: 'simulation'
        }
      ]
    },

    // Converted PDA M1' (Accepts by Empty Stack)
    converted: {
      name: 'Converted PDA M₁\'',
      acceptanceType: 'empty_stack',
      states: ['q_s', 'q₀', 'q₁', 'q₂', 'q_c'],
      inputAlphabet: ['a', 'b'],
      stackAlphabet: ['A', 'Z₀', '⊥'],
      startState: 'q_s',
      startStack: '⊥',
      finalStates: [],
      transitions: [
        // 1. New initialization transition
        {
          id: 's1_init',
          from: 'q_s',
          input: 'ε',
          pop: '⊥',
          to: 'q₀',
          push: ['Z₀', '⊥'],
          note: 'Initialization: Push original start symbol Z₀ above bottom marker ⊥',
          phase: 'init',
          constructionRole: 'Step 1 & 2: Places ⊥ below Z₀ to prevent premature empty-stack halt'
        },
        // 2. Copied transitions from M1
        {
          id: 's1_c1',
          from: 'q₀',
          input: 'a',
          pop: 'Z₀',
          to: 'q₀',
          push: ['A', 'Z₀'],
          note: 'Read "a": Push A onto stack',
          phase: 'simulation',
          constructionRole: 'Step 3: Copied transition from original PDA'
        },
        {
          id: 's1_c2',
          from: 'q₀',
          input: 'a',
          pop: 'A',
          to: 'q₀',
          push: ['A', 'A'],
          note: 'Read "a": Push another A onto stack',
          phase: 'simulation',
          constructionRole: 'Step 3: Copied transition from original PDA'
        },
        {
          id: 's1_c3',
          from: 'q₀',
          input: 'b',
          pop: 'A',
          to: 'q₁',
          push: [],
          note: 'Read "b": Pop matching A, switch to state q₁',
          phase: 'simulation',
          constructionRole: 'Step 3: Copied transition from original PDA'
        },
        {
          id: 's1_c4',
          from: 'q₁',
          input: 'b',
          pop: 'A',
          to: 'q₁',
          push: [],
          note: 'Read "b": Pop matching A',
          phase: 'simulation',
          constructionRole: 'Step 3: Copied transition from original PDA'
        },
        {
          id: 's1_c5',
          from: 'q₁',
          input: 'ε',
          pop: 'Z₀',
          to: 'q₂',
          push: ['Z₀'],
          note: 'ε-transition to original final state q₂',
          phase: 'simulation',
          constructionRole: 'Step 3: Reaches final state q₂ of original PDA'
        },
        // 3. Epsilon transitions from final state q2 to cleanup state qc
        {
          id: 's1_to_qc_Z0',
          from: 'q₂',
          input: 'ε',
          pop: 'Z₀',
          to: 'q_c',
          push: ['Z₀'],
          note: 'Reached final state q₂! ε-transition to cleanup state q_c',
          phase: 'cleanup_entry',
          constructionRole: 'Step 4: Bridge from final state q₂ to cleanup state q_c'
        },
        {
          id: 's1_to_qc_A',
          from: 'q₂',
          input: 'ε',
          pop: 'A',
          to: 'q_c',
          push: ['A'],
          note: 'Reached final state q₂ with A on stack! ε-transition to cleanup state q_c',
          phase: 'cleanup_entry',
          constructionRole: 'Step 4: Bridge from final state q₂ to cleanup state q_c'
        },
        {
          id: 's1_to_qc_bot',
          from: 'q₂',
          input: 'ε',
          pop: '⊥',
          to: 'q_c',
          push: ['⊥'],
          note: 'Reached final state q₂ with ⊥ exposed! ε-transition to cleanup state q_c',
          phase: 'cleanup_entry',
          constructionRole: 'Step 4: Bridge from final state q₂ to cleanup state q_c'
        },
        // 4. Cleanup pops in state qc
        {
          id: 's1_pop_A',
          from: 'q_c',
          input: 'ε',
          pop: 'A',
          to: 'q_c',
          push: [],
          note: 'In cleanup state q_c: pop symbol A',
          phase: 'cleanup',
          constructionRole: 'Step 5: Empty stack symbol A'
        },
        {
          id: 's1_pop_Z0',
          from: 'q_c',
          input: 'ε',
          pop: 'Z₀',
          to: 'q_c',
          push: [],
          note: 'In cleanup state q_c: pop symbol Z₀',
          phase: 'cleanup',
          constructionRole: 'Step 5: Empty stack symbol Z₀'
        },
        {
          id: 's1_pop_bot',
          from: 'q_c',
          input: 'ε',
          pop: '⊥',
          to: 'q_c',
          push: [],
          note: 'In cleanup state q_c: pop bottom marker ⊥ (Stack is now empty!)',
          phase: 'cleanup_final',
          constructionRole: 'Step 5 & 6: Final pop of ⊥ reveals empty stack!'
        }
      ]
    }
  },

  // ==========================================
  // SEMINAR 2: Empty Stack -> Final State
  // ==========================================
  seminar2: {
    id: 'seminar2',
    title: 'Seminar 2: Empty Stack → Final State',
    shortTitle: 'Empty Stack → Final State',
    goal: 'Convert PDA M₂ (accepts by Empty Stack) into M₂\' (accepts by Final State)',
    originalAcceptance: 'Empty Stack (Stack = ε and all input consumed)',
    convertedAcceptance: 'Final State (q_f reached and all input consumed)',

    // Original PDA M2 (Accepts by Empty Stack)
    original: {
      name: 'Original PDA M₂',
      acceptanceType: 'empty_stack',
      states: ['q₀', 'q₁'],
      inputAlphabet: ['a', 'b'],
      stackAlphabet: ['A', 'Z₀'],
      startState: 'q₀',
      startStack: 'Z₀',
      finalStates: [],
      transitions: [
        {
          id: 'm2_t1',
          from: 'q₀',
          input: 'a',
          pop: 'Z₀',
          to: 'q₀',
          push: ['A', 'Z₀'],
          note: 'First "a": push A above Z₀',
          phase: 'simulation'
        },
        {
          id: 'm2_t2',
          from: 'q₀',
          input: 'a',
          pop: 'A',
          to: 'q₀',
          push: ['A', 'A'],
          note: 'Subsequent "a": push another A',
          phase: 'simulation'
        },
        {
          id: 'm2_t3',
          from: 'q₀',
          input: 'b',
          pop: 'A',
          to: 'q₁',
          push: [],
          note: 'First "b": match and pop A, switch to state q₁',
          phase: 'simulation'
        },
        {
          id: 'm2_t4',
          from: 'q₁',
          input: 'b',
          pop: 'A',
          to: 'q₁',
          push: [],
          note: 'Subsequent "b": pop matching A',
          phase: 'simulation'
        },
        {
          id: 'm2_t5',
          from: 'q₁',
          input: 'ε',
          pop: 'Z₀',
          to: 'q₁',
          push: [],
          note: 'All matching b\'s consumed: pop Z₀ to empty the stack!',
          phase: 'simulation'
        }
      ]
    },

    // Converted PDA M2' (Accepts by Final State)
    converted: {
      name: 'Converted PDA M₂\'',
      acceptanceType: 'final_state',
      states: ['q_s', 'q₀', 'q₁', 'q_f'],
      inputAlphabet: ['a', 'b'],
      stackAlphabet: ['A', 'Z₀', '⊥'],
      startState: 'q_s',
      startStack: '⊥',
      finalStates: ['q_f'],
      transitions: [
        // 1. New initialization transition
        {
          id: 's2_init',
          from: 'q_s',
          input: 'ε',
          pop: '⊥',
          to: 'q₀',
          push: ['Z₀', '⊥'],
          note: 'Initialization: Push original start symbol Z₀ above bottom marker ⊥',
          phase: 'init',
          constructionRole: 'Step 1 & 2: Places ⊥ at stack bottom under Z₀'
        },
        // 2. Copied transitions from M2
        {
          id: 's2_c1',
          from: 'q₀',
          input: 'a',
          pop: 'Z₀',
          to: 'q₀',
          push: ['A', 'Z₀'],
          note: 'Read "a": Push A above Z₀',
          phase: 'simulation',
          constructionRole: 'Step 3: Copied transition from original PDA'
        },
        {
          id: 's2_c2',
          from: 'q₀',
          input: 'a',
          pop: 'A',
          to: 'q₀',
          push: ['A', 'A'],
          note: 'Read "a": Push another A',
          phase: 'simulation',
          constructionRole: 'Step 3: Copied transition from original PDA'
        },
        {
          id: 's2_c3',
          from: 'q₀',
          input: 'b',
          pop: 'A',
          to: 'q₁',
          push: [],
          note: 'Read "b": Pop matching A, switch to state q₁',
          phase: 'simulation',
          constructionRole: 'Step 3: Copied transition from original PDA'
        },
        {
          id: 's2_c4',
          from: 'q₁',
          input: 'b',
          pop: 'A',
          to: 'q₁',
          push: [],
          note: 'Read "b": Pop matching A',
          phase: 'simulation',
          constructionRole: 'Step 3: Copied transition from original PDA'
        },
        {
          id: 's2_c5',
          from: 'q₁',
          input: 'ε',
          pop: 'Z₀',
          to: 'q₁',
          push: [],
          note: 'Original PDA pops Z₀: This exposes the bottom marker ⊥!',
          phase: 'simulation',
          constructionRole: 'Step 4: Popping Z₀ exposes ⊥ at top of stack'
        },
        // 3. Epsilon transitions to final state qf when bottom marker is exposed
        {
          id: 's2_to_qf_q1',
          from: 'q₁',
          input: 'ε',
          pop: '⊥',
          to: 'q_f',
          push: ['⊥'],
          note: 'Bottom marker ⊥ exposed! ε-transition to final state q_f (⊥ is preserved)',
          phase: 'accept_transition',
          constructionRole: 'Step 5 & 6: Detects empty original stack via exposed ⊥, enters q_f'
        },
        {
          id: 's2_to_qf_q0',
          from: 'q₀',
          input: 'ε',
          pop: '⊥',
          to: 'q_f',
          push: ['⊥'],
          note: 'Bottom marker ⊥ exposed in q₀! ε-transition to final state q_f (⊥ is preserved)',
          phase: 'accept_transition',
          constructionRole: 'Step 5 & 6: Detects empty stack in q₀, enters q_f'
        }
      ]
    }
  }
};
