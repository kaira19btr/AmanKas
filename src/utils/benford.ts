/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AccountStatus } from '../types';

export const BENFORD_THEORETICAL = [
  Math.log10(1 + 1 / 1), // 0.30103
  Math.log10(1 + 1 / 2), // 0.17609
  Math.log10(1 + 1 / 3), // 0.12494
  Math.log10(1 + 1 / 4), // 0.09691
  Math.log10(1 + 1 / 5), // 0.07918
  Math.log10(1 + 1 / 6), // 0.06695
  Math.log10(1 + 1 / 7), // 0.05799
  Math.log10(1 + 1 / 8), // 0.05115
  Math.log10(1 + 1 / 9), // 0.04576
];

export const BENFORD_THEORETICAL_PERCENT = BENFORD_THEORETICAL.map(v => Number((v * 100).toFixed(1)));

/**
 * Extracts the first non-zero leading digit from a numeric amount.
 */
export function getFirstDigit(amount: number): number | null {
  const abs = Math.abs(amount);
  if (abs < 1) return null;
  const str = abs.toString().replace(/[^1-9]/, '');
  if (!str.length) return null;
  const digit = parseInt(str[0], 10);
  return digit >= 1 && digit <= 9 ? digit : null;
}

export interface BenfordResult {
  digitCounts: number[]; // counts for 1..9
  digitFrequencies: number[]; // 0..1 proportion for 1..9
  mad: number;
  totalValid: number;
  status: AccountStatus;
}

/**
 * Calculates Benford's Law distribution and Nigrini Mean Absolute Deviation (MAD).
 */
export function calculateBenford(amounts: number[], isFixedAmount: boolean = false): BenfordResult {
  const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  let totalValid = 0;

  for (const amt of amounts) {
    const digit = getFirstDigit(amt);
    if (digit !== null) {
      counts[digit - 1]++;
      totalValid++;
    }
  }

  if (totalValid === 0) {
    return {
      digitCounts: counts,
      digitFrequencies: counts.map(() => 0),
      mad: 0,
      totalValid: 0,
      status: 'Data belum cukup',
    };
  }

  const frequencies = counts.map(c => c / totalValid);
  let absDiffSum = 0;
  for (let i = 0; i < 9; i++) {
    absDiffSum += Math.abs(frequencies[i] - BENFORD_THEORETICAL[i]);
  }
  const mad = absDiffSum / 9;

  let status: AccountStatus;
  if (isFixedAmount) {
    status = 'Dikecualikan (Nominal Tetap)';
  } else if (totalValid < 30) {
    status = 'Data belum cukup';
  } else if (mad <= 0.012) {
    status = 'Wajar';
  } else if (mad <= 0.015) {
    status = 'Mencurigakan';
  } else {
    status = 'Anomali Kuat';
  }

  return {
    digitCounts: counts,
    digitFrequencies: frequencies,
    mad,
    totalValid,
    status,
  };
}
