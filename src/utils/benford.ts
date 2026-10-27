/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AccountStatus } from '../types';

// =========================================================================
// 1. FIRST DIGIT (DIGIT PERTAMA: 1..9)
// =========================================================================
export const BENFORD_THEORETICAL_FIRST = [
  Math.log10(1 + 1 / 1), // 1: 0.30103 (30.1%)
  Math.log10(1 + 1 / 2), // 2: 0.17609 (17.6%)
  Math.log10(1 + 1 / 3), // 3: 0.12494 (12.5%)
  Math.log10(1 + 1 / 4), // 4: 0.09691 (9.7%)
  Math.log10(1 + 1 / 5), // 5: 0.07918 (7.9%)
  Math.log10(1 + 1 / 6), // 6: 0.06695 (6.7%)
  Math.log10(1 + 1 / 7), // 7: 0.05799 (5.8%)
  Math.log10(1 + 1 / 8), // 8: 0.05115 (5.1%)
  Math.log10(1 + 1 / 9), // 9: 0.04576 (4.6%)
];

export const BENFORD_FIRST_PERCENT = BENFORD_THEORETICAL_FIRST.map((v) => Number((v * 100).toFixed(1)));

// Legacy export compatibility
export const BENFORD_THEORETICAL = BENFORD_THEORETICAL_FIRST;
export const BENFORD_THEORETICAL_PERCENT = BENFORD_FIRST_PERCENT;

// =========================================================================
// 2. SECOND DIGIT (DIGIT KEDUA: 0..9) - Nigrini (2012)
// P(d2) = sum_{d1=1}^9 log10(1 + 1 / (10*d1 + d2))
// =========================================================================
export const BENFORD_THEORETICAL_SECOND: number[] = (() => {
  const probs: number[] = [];
  for (let d2 = 0; d2 <= 9; d2++) {
    let sum = 0;
    for (let d1 = 1; d1 <= 9; d1++) {
      sum += Math.log10(1 + 1 / (10 * d1 + d2));
    }
    probs.push(sum);
  }
  return probs;
})();

export const BENFORD_SECOND_PERCENT = BENFORD_THEORETICAL_SECOND.map((v) => Number((v * 100).toFixed(1)));

/**
 * Extracts the first non-zero leading digit from a numeric amount.
 */
export function getFirstDigit(amount: number): number | null {
  const abs = Math.abs(amount);
  if (abs < 1) return null;
  const str = abs.toString().replace(/[^0-9]/g, '').replace(/^0+/, '');
  if (!str.length) return null;
  const digit = parseInt(str[0], 10);
  return digit >= 1 && digit <= 9 ? digit : null;
}

/**
 * Extracts the second digit from a numeric amount (supports 0..9).
 */
export function getSecondDigit(amount: number): number | null {
  const abs = Math.abs(amount);
  const str = abs.toString().replace(/[^0-9]/g, '').replace(/^0+/, '');
  if (str.length < 2) return null;
  const digit = parseInt(str[1], 10);
  return digit >= 0 && digit <= 9 ? digit : null;
}

export type NigriniConformityLevel =
  | 'Sangat selaras'
  | 'Dapat diterima'
  | 'Batas'
  | 'Tidak selaras'
  | 'Volume belum cukup'
  | 'Dikecualikan (Nominal Tetap)';

export interface DigitAnalysisResult {
  digits: number[]; // 1..9 for first digit, 0..9 for second digit
  observedCounts: number[];
  observedFrequencies: number[];
  theoreticalFrequencies: number[];
  theoreticalPercents: number[];
  mad: number;
  chiSquare: number;
  pValue: number;
  conformityLevel: NigriniConformityLevel;
  totalValid: number;
  thresholdsDescription: string;
}

export interface BenfordResult {
  firstDigit: DigitAnalysisResult;
  secondDigit: DigitAnalysisResult;
  overallStatus: AccountStatus;
  overallConformity: NigriniConformityLevel;
  totalValid: number;
  isVolumeSufficient: boolean;
  isFixedAmount: boolean;

  // Backward compatibility fields
  digitCounts: number[];
  digitFrequencies: number[];
  mad: number;
  chiSquare: number;
  pValue: number;
  conformityLevel: string;
  status: AccountStatus;
}

/**
 * Evaluates First Digit MAD under Nigrini (2012) thresholds:
 * ≤ 0.006: Sangat selaras
 * ≤ 0.012: Dapat diterima
 * ≤ 0.015: Batas
 * > 0.015: Tidak selaras
 */
export function evaluateFirstDigitMAD(mad: number): NigriniConformityLevel {
  if (mad <= 0.006) return 'Sangat selaras';
  if (mad <= 0.012) return 'Dapat diterima';
  if (mad <= 0.015) return 'Batas';
  return 'Tidak selaras';
}

/**
 * Evaluates Second Digit MAD under Nigrini (2012) thresholds:
 * ≤ 0.008: Sangat selaras
 * ≤ 0.010: Dapat diterima
 * ≤ 0.012: Batas
 * > 0.012: Tidak selaras
 */
export function evaluateSecondDigitMAD(mad: number): NigriniConformityLevel {
  if (mad <= 0.008) return 'Sangat selaras';
  if (mad <= 0.010) return 'Dapat diterima';
  if (mad <= 0.012) return 'Batas';
  return 'Tidak selaras';
}

/**
 * Maps conformity to standard essay risk status:
 * 'Hijau · Risiko rendah' | 'Kuning · Risiko sedang (≥ P90)' | 'Merah · Risiko tinggi (≥ P98)'
 */
export function conformityToAccountStatus(conformity: NigriniConformityLevel): AccountStatus {
  switch (conformity) {
    case 'Sangat selaras':
    case 'Dapat diterima':
      return 'Hijau · Risiko rendah';
    case 'Batas':
      return 'Kuning · Risiko sedang (≥ P90)';
    case 'Tidak selaras':
      return 'Merah · Risiko tinggi (≥ P98)';
    case 'Volume belum cukup':
      return 'Volume belum cukup';
    case 'Dikecualikan (Nominal Tetap)':
      return 'Dikecualikan (Nominal Tetap)';
    default:
      return 'Hijau · Risiko rendah';
  }
}

/**
 * Resolves the worst of two conformity levels.
 * Priority: Tidak selaras (Merah) > Batas (Kuning) > Dapat diterima > Sangat selaras (Hijau)
 */
export function resolveWorstConformity(
  c1: NigriniConformityLevel,
  c2: NigriniConformityLevel
): NigriniConformityLevel {
  if (c1 === 'Tidak selaras' || c2 === 'Tidak selaras') return 'Tidak selaras';
  if (c1 === 'Batas' || c2 === 'Batas') return 'Batas';
  if (c1 === 'Dapat diterima' || c2 === 'Dapat diterima') return 'Dapat diterima';
  return 'Sangat selaras';
}

/**
 * Calculates dual Benford's Law distribution (First & Second Digit), Nigrini MAD, and Chi-Square statistic.
 * Status akun diambil dari yang terburuk di antara keduanya.
 */
export function calculateBenford(
  amounts: number[],
  isFixedAmount: boolean = false,
  minVolumeThreshold: number = 300
): BenfordResult {
  // 1. First digit tally (1..9)
  const firstCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  // 2. Second digit tally (0..9)
  const secondCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let firstValid = 0;
  let secondValid = 0;

  for (const amt of amounts) {
    const d1 = getFirstDigit(amt);
    if (d1 !== null) {
      firstCounts[d1 - 1]++;
      firstValid++;
    }
    const d2 = getSecondDigit(amt);
    if (d2 !== null) {
      secondCounts[d2]++;
      secondValid++;
    }
  }

  const isVolumeSufficient = firstValid >= minVolumeThreshold;

  // Handle special exclusions & insufficient volume
  if (isFixedAmount) {
    const emptyFirst = createEmptyDigitResult([1, 2, 3, 4, 5, 6, 7, 8, 9], BENFORD_THEORETICAL_FIRST, BENFORD_FIRST_PERCENT, 'Dikecualikan (Nominal Tetap)', 'Dikecualikan kebijakan nominal tetap');
    const emptySecond = createEmptyDigitResult([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], BENFORD_THEORETICAL_SECOND, BENFORD_SECOND_PERCENT, 'Dikecualikan (Nominal Tetap)', 'Dikecualikan kebijakan nominal tetap');
    return {
      firstDigit: emptyFirst,
      secondDigit: emptySecond,
      overallStatus: 'Dikecualikan (Nominal Tetap)',
      overallConformity: 'Dikecualikan (Nominal Tetap)',
      totalValid: firstValid,
      isVolumeSufficient,
      isFixedAmount: true,
      digitCounts: firstCounts,
      digitFrequencies: firstCounts.map(() => 0),
      mad: 0,
      chiSquare: 0,
      pValue: 1.0,
      conformityLevel: 'Dikecualikan (Nominal Tetap)',
      status: 'Dikecualikan (Nominal Tetap)',
    };
  }

  if (!isVolumeSufficient || firstValid === 0) {
    const emptyFirst = createEmptyDigitResult([1, 2, 3, 4, 5, 6, 7, 8, 9], BENFORD_THEORETICAL_FIRST, BENFORD_FIRST_PERCENT, 'Volume belum cukup', `Volume transaksi (${firstValid}) belum memenuhi batas minimum (${minVolumeThreshold})`);
    const emptySecond = createEmptyDigitResult([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], BENFORD_THEORETICAL_SECOND, BENFORD_SECOND_PERCENT, 'Volume belum cukup', `Volume transaksi (${secondValid}) belum memenuhi batas minimum (${minVolumeThreshold})`);
    return {
      firstDigit: emptyFirst,
      secondDigit: emptySecond,
      overallStatus: 'Volume belum cukup',
      overallConformity: 'Volume belum cukup',
      totalValid: firstValid,
      isVolumeSufficient: false,
      isFixedAmount: false,
      digitCounts: firstCounts,
      digitFrequencies: firstCounts.map((c) => (firstValid > 0 ? c / firstValid : 0)),
      mad: 0,
      chiSquare: 0,
      pValue: 1.0,
      conformityLevel: 'Volume belum cukup',
      status: 'Volume belum cukup',
    };
  }

  // --- Process First Digit ---
  const firstFrequencies = firstCounts.map((c) => c / firstValid);
  let firstAbsDiffSum = 0;
  let firstChiSquareSum = 0;
  for (let i = 0; i < 9; i++) {
    const obs = firstCounts[i];
    const exp = firstValid * BENFORD_THEORETICAL_FIRST[i];
    firstAbsDiffSum += Math.abs(firstFrequencies[i] - BENFORD_THEORETICAL_FIRST[i]);
    if (exp > 0) {
      firstChiSquareSum += Math.pow(obs - exp, 2) / exp;
    }
  }
  const firstMAD = firstAbsDiffSum / 9;
  const firstConformity = evaluateFirstDigitMAD(firstMAD);
  const firstPVal = firstChiSquareSum <= 15.51 ? Math.max(0.06, 1 - firstChiSquareSum / 20) : Math.max(0.001, 15.51 / (firstChiSquareSum * 1.5));

  const firstResult: DigitAnalysisResult = {
    digits: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    observedCounts: firstCounts,
    observedFrequencies: firstFrequencies,
    theoreticalFrequencies: BENFORD_THEORETICAL_FIRST,
    theoreticalPercents: BENFORD_FIRST_PERCENT,
    mad: firstMAD,
    chiSquare: firstChiSquareSum,
    pValue: firstPVal,
    conformityLevel: firstConformity,
    totalValid: firstValid,
    thresholdsDescription: 'Nigrini (2012) Digit 1: ≤0.006 (sangat selaras), ≤0.012 (dapat diterima), ≤0.015 (batas), >0.015 (tidak selaras)',
  };

  // --- Process Second Digit ---
  const secondFrequencies = secondValid > 0 ? secondCounts.map((c) => c / secondValid) : secondCounts.map(() => 0);
  let secondAbsDiffSum = 0;
  let secondChiSquareSum = 0;
  for (let i = 0; i < 10; i++) {
    const obs = secondCounts[i];
    const exp = secondValid * BENFORD_THEORETICAL_SECOND[i];
    secondAbsDiffSum += Math.abs(secondFrequencies[i] - BENFORD_THEORETICAL_SECOND[i]);
    if (exp > 0) {
      secondChiSquareSum += Math.pow(obs - exp, 2) / exp;
    }
  }
  const secondMAD = secondAbsDiffSum / 10;
  const secondConformity = evaluateSecondDigitMAD(secondMAD);
  // df = 9 for second digit (critical at 0.05 is 16.92)
  const secondPVal = secondChiSquareSum <= 16.92 ? Math.max(0.06, 1 - secondChiSquareSum / 22) : Math.max(0.001, 16.92 / (secondChiSquareSum * 1.5));

  const secondResult: DigitAnalysisResult = {
    digits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    observedCounts: secondCounts,
    observedFrequencies: secondFrequencies,
    theoreticalFrequencies: BENFORD_THEORETICAL_SECOND,
    theoreticalPercents: BENFORD_SECOND_PERCENT,
    mad: secondMAD,
    chiSquare: secondChiSquareSum,
    pValue: secondPVal,
    conformityLevel: secondConformity,
    totalValid: secondValid,
    thresholdsDescription: 'Nigrini (2012) Digit 2: ≤0.008 (sangat selaras), ≤0.010 (dapat diterima), ≤0.012 (batas), >0.012 (tidak selaras)',
  };

  // Status diambil dari yang terburuk di antara keduanya
  const worstConformity = resolveWorstConformity(firstConformity, secondConformity);
  const overallStatus = conformityToAccountStatus(worstConformity);

  return {
    firstDigit: firstResult,
    secondDigit: secondResult,
    overallStatus,
    overallConformity: worstConformity,
    totalValid: firstValid,
    isVolumeSufficient: true,
    isFixedAmount: false,
    // Backward compatibility
    digitCounts: firstCounts,
    digitFrequencies: firstFrequencies,
    mad: Math.max(firstMAD, secondMAD),
    chiSquare: Math.max(firstChiSquareSum, secondChiSquareSum),
    pValue: Math.min(firstPVal, secondPVal),
    conformityLevel: worstConformity,
    status: overallStatus,
  };
}

function createEmptyDigitResult(
  digits: number[],
  theoret: number[],
  percents: number[],
  level: NigriniConformityLevel,
  desc: string
): DigitAnalysisResult {
  return {
    digits,
    observedCounts: digits.map(() => 0),
    observedFrequencies: digits.map(() => 0),
    theoreticalFrequencies: theoret,
    theoreticalPercents: percents,
    mad: 0,
    chiSquare: 0,
    pValue: 1.0,
    conformityLevel: level,
    totalValid: 0,
    thresholdsDescription: desc,
  };
}
