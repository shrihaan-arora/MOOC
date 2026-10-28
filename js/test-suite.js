/**
 * Automated Verification Test Suite for PDA Conversions
 * 
 * Verifies that both Seminar 1 and Seminar 2 converted machines recognize
 * the exact language L = { a^n b^n | n >= 1 }.
 * 
 * Test cases required by specification:
 * - "ab"     -> accepted
 * - "aabb"   -> accepted
 * - "aaabbb" -> accepted
 * - "aab"    -> rejected
 * - "abb"    -> rejected
 * - "ba"     -> rejected
 * - "abab"   -> rejected
 * - ""       -> rejected
 */

import { PDA_MODELS } from './pda-models.js';
import { PDAEngine } from './pda-engine.js';

export const TEST_CASES = [
  { input: 'ab', expected: 'accepted', label: 'ab (n=1, minimal valid string)' },
  { input: 'aabb', expected: 'accepted', label: 'aabb (n=2, standard valid string)' },
  { input: 'aaabbb', expected: 'accepted', label: 'aaabbb (n=3, higher power)' },
  { input: 'aab', expected: 'rejected', label: 'aab (excess \'a\': stack not empty / no match)' },
  { input: 'abb', expected: 'rejected', label: 'abb (excess \'b\': premature stack empty / unread input)' },
  { input: 'ba', expected: 'rejected', label: 'ba (wrong symbol order)' },
  { input: 'abab', expected: 'rejected', label: 'abab (alternating patterns not in language)' },
  { input: '', expected: 'rejected', label: 'ε (empty string: rejected since n ≥ 1)' }
];

/**
 * Run test cases on a given PDA model
 */
export function runTestSuiteForModel(model) {
  const engine = new PDAEngine(model);
  const results = [];

  for (const tc of TEST_CASES) {
    engine.load(model, tc.input);
    const finalState = engine.runToCompletion();
    const passed = finalState.status === tc.expected;
    
    results.push({
      input: tc.input === '' ? 'ε' : tc.input,
      expected: tc.expected,
      actual: finalState.status,
      passed,
      stepCount: finalState.stepCount,
      reason: finalState.statusReason,
      label: tc.label
    });
  }

  const allPassed = results.every(r => r.passed);
  return {
    modelName: model.name,
    acceptanceType: model.acceptanceType,
    allPassed,
    total: results.length,
    passedCount: results.filter(r => r.passed).length,
    results
  };
}

/**
 * Run full verification for both seminars
 */
export function runAllVerificationTests() {
  const s1Original = runTestSuiteForModel(PDA_MODELS.seminar1.original);
  const s1Converted = runTestSuiteForModel(PDA_MODELS.seminar1.converted);
  const s2Original = runTestSuiteForModel(PDA_MODELS.seminar2.original);
  const s2Converted = runTestSuiteForModel(PDA_MODELS.seminar2.converted);

  return {
    seminar1: {
      original: s1Original,
      converted: s1Converted,
      equivalent: s1Original.allPassed && s1Converted.allPassed
    },
    seminar2: {
      original: s2Original,
      converted: s2Converted,
      equivalent: s2Original.allPassed && s2Converted.allPassed
    },
    overallSuccess: s1Converted.allPassed && s2Converted.allPassed
  };
}

// If executed directly in Node.js
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.endsWith('test-suite.js')) {
  console.log('=====================================================');
  console.log('PDA CONVERSION SIMULATOR - AUTOMATED VERIFICATION');
  console.log('=====================================================\n');

  const report = runAllVerificationTests();

  const printReport = (title, res) => {
    console.log(`--- ${title} (${res.passedCount}/${res.total} Passed) ---`);
    for (const r of res.results) {
      const mark = r.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`  [${mark}] "${r.input}" => Expected: ${r.expected}, Got: ${r.actual} (${r.stepCount} steps)`);
      if (!r.passed) {
        console.log(`         Reason: ${r.reason}`);
      }
    }
    console.log('');
  };

  printReport('Seminar 1: Original M₁ (Final State)', report.seminar1.original);
  printReport('Seminar 1: Converted M₁\' (Empty Stack)', report.seminar1.converted);
  printReport('Seminar 2: Original M₂ (Empty Stack)', report.seminar2.original);
  printReport('Seminar 2: Converted M₂\' (Final State)', report.seminar2.converted);

  console.log('=====================================================');
  console.log(`Seminar 1 Language Equivalence: ${report.seminar1.equivalent ? 'VERIFIED ✓' : 'FAILED ✗'}`);
  console.log(`Seminar 2 Language Equivalence: ${report.seminar2.equivalent ? 'VERIFIED ✓' : 'FAILED ✗'}`);
  console.log(`Overall Automated Test Suite:   ${report.overallSuccess ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);
  console.log('=====================================================');
}
