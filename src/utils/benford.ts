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

export const BENFORD_THEORETICAL_PERCENT = BENFORD_THEORETICAL.map((v) => Number((v * 100).toFixed(1)));

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
  mad: number; // Nigrini Mean Absolute Deviation
  chiSquare: number; // Chi-Square goodness-of-fit
  pValue: number;
  conformityLevel: string;
  totalValid: number;
  status: AccountStatus;
  isVolumeSufficient: boolean;
}

/**
 * Calculates Benford's Law distribution, Nigrini MAD, and Chi-Square statistic.
 * @param amounts array of transaction amounts
 * @param isFixedAmount whether account is excluded (fixed installments, standard dues, etc.)
 * @param minVolumeThreshold minimum transaction volume required (default 300)
 */
export function calculateBenford(
  amounts: number[],
  isFixedAmount: boolean = false,
  minVolumeThreshold: number = 300
): BenfordResult {
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
      chiSquare: 0,
      pValue: 1.0,
      conformityLevel: 'Data Kosong',
      totalValid: 0,
      status: 'Volume belum cukup',
      isVolumeSufficient: false,
    };
  }

  const frequencies = counts.map((c) => c / totalValid);
  let absDiffSum = 0;
  let chiSquareSum = 0;

  for (let i = 0; i < 9; i++) {
    const observedCount = counts[i];
    const expectedCount = totalValid * BENFORD_THEORETICAL[i];
    absDiffSum += Math.abs(frequencies[i] - BENFORD_THEORETICAL[i]);
    if (expectedCount > 0) {
      chiSquareSum += Math.pow(observedCount - expectedCount, 2) / expectedCount;
    }
  }

  const mad = absDiffSum / 9;
  const isVolumeSufficient = totalValid >= minVolumeThreshold;

  // Approximate p-value for chi-square with df=8 (critical value at 0.05 is 15.51)
  const pValue = chiSquareSum <= 15.51 ? Math.max(0.06, 1 - chiSquareSum / 20) : Math.max(0.001, 15.51 / (chiSquareSum * 1.5));

  let status: AccountStatus;
  let conformityLevel: string;

  if (isFixedAmount) {
    status = 'Dikecualikan (Nominal Tetap)';
    conformityLevel = 'Dikecualikan (Nominal Rutin / Tetap)';
  } else if (!isVolumeSufficient) {
    status = 'Volume belum cukup';
    conformityLevel = 'Volume Transaksi Belum Mencukupi Uji (<300)';
  } else if (mad <= 0.012) {
    status = 'Hijau';
    conformityLevel = 'Kepatuhan Dekat (Close Conformity)';
  } else if (mad <= 0.015) {
    status = 'Kuning';
    conformityLevel = 'Kepatuhan Moderat (Acceptable Conformity)';
  } else {
    status = 'Merah';
    conformityLevel = 'Deviasi Signifikan (Non-Conformity)';
  }

  return {
    digitCounts: counts,
    digitFrequencies: frequencies,
    mad,
    chiSquare: chiSquareSum,
    pValue,
    conformityLevel,
    totalValid,
    status,
    isVolumeSufficient,
  };
}
