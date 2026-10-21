/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransactionStatus } from '../types';

export interface ScoreBreakdown {
  isolationScore: number;
  ruleScore: number;
  finalScore: number;
  status: TransactionStatus;
  flagReasons: string[];
  isParentSensitive: boolean;
}

export interface ScoreContext {
  amount: number;
  timeStr: string; // "HH:mm:ss"
  accountAvgAmount: number;
  parentAccountStatus: string; // 'Wajar' | 'Mencurigakan' | 'Anomali Kuat' | etc.
  burstFactor?: number;
  isolationScore: number;
  fairDiscount?: number; // learned discount when previously marked "Ternyata wajar"
}

/**
 * Computes red-flag rule score and human-readable audit explanations.
 */
export function calculateScores(ctx: ScoreContext): ScoreBreakdown {
  const { amount, timeStr, accountAvgAmount, parentAccountStatus, burstFactor = 0, isolationScore, fairDiscount = 0 } = ctx;

  const flagReasons: string[] = [];
  let ruleScore = 0;

  const hour = parseInt(timeStr.split(':')[0], 10) || 12;
  const minute = parseInt(timeStr.split(':')[1], 10) || 0;

  // Rule 1: Outside operating hours (official cooperative hours are 08:00 - 16:00/17:00)
  if (hour >= 22 || hour < 5) {
    ruleScore += 35;
    flagReasons.push(`Penarikan pukul ${timeStr.slice(0, 5)} WIB di luar jam operasional resmi KSP (tutup 16:00 WIB)`);
  } else if (hour >= 18 && hour < 22) {
    ruleScore += 15;
    flagReasons.push(`Transaksi malam hari (${timeStr.slice(0, 5)} WIB)`);
  }

  // Rule 2: Smurfing / Structuring near regulatory threshold (Rp 10.000.000 PPATK threshold)
  if (amount >= 9000000 && amount < 10000000) {
    ruleScore += 35;
    const formatted = new Intl.NumberFormat('id-ID').format(amount);
    flagReasons.push(`Nominal tepat Rp ${formatted} mendekati batas lapor wajib PPATK Rp 10.000.000 (indikasi structuring/smurfing)`);
  }

  // Rule 3: Exact round number
  if (amount >= 1000000 && amount % 500000 === 0) {
    ruleScore += 20;
    const formatted = new Intl.NumberFormat('id-ID').format(amount);
    flagReasons.push(`Nominal bulat tepat Rp ${formatted} (pola pengeluaran non-alami berulang)`);
  }

  // Rule 4: Deviation from historical account average
  const safeAvg = Math.max(accountAvgAmount, 250000);
  if (amount > safeAvg * 3) {
    const multiple = Math.round(amount / safeAvg);
    ruleScore += 25;
    flagReasons.push(`Jauh di atas profil rata-rata akun (${multiple}x di atas rata-rata historis Rp ${new Intl.NumberFormat('id-ID').format(Math.round(safeAvg))})`);
  }

  // Rule 5: Rapid bursts
  if (burstFactor > 0.5) {
    ruleScore += 20;
    flagReasons.push(`Frekuensi transfer cepat berturut-turut dalam interval singkat`);
  }

  // Cap ruleScore at 100
  ruleScore = Math.min(100, ruleScore);

  // Weighted score: 60% Isolation Forest + 40% Red-Flag rules
  let weighted = 0.6 * isolationScore + 0.4 * ruleScore;

  // Apply human feedback learning deduction if user previously marked similar transactions as "Ternyata wajar"
  if (fairDiscount > 0) {
    weighted = Math.max(5, weighted - fairDiscount);
  }

  const finalScore = Math.round(Math.max(0, Math.min(100, weighted)));

  // Account Anomaly sensitivity check
  const isParentSensitive = parentAccountStatus === 'Anomali Kuat';

  if (isParentSensitive && flagReasons.length > 0) {
    flagReasons.push(`Akun induk berstatus Anomali Kuat (ambang kewaspadaan otomatis diperketat)`);
  }

  // Status assignment based on Nigrini / cooperative threshold
  let status: TransactionStatus;
  if (isParentSensitive) {
    // Tightened thresholds for accounts with Benford anomaly
    if (finalScore <= 30) {
      status = 'Normal';
    } else if (finalScore <= 60) {
      status = 'Perlu ditinjau';
    } else {
      status = 'Segera verifikasi';
    }
  } else {
    // Standard thresholds
    if (finalScore <= 40) {
      status = 'Normal';
    } else if (finalScore <= 70) {
      status = 'Perlu ditinjau';
    } else {
      status = 'Segera verifikasi';
    }
  }

  if (flagReasons.length === 0) {
    flagReasons.push('Pola transaksi selaras dengan profil historis operasional');
  }

  return {
    isolationScore,
    ruleScore,
    finalScore,
    status,
    flagReasons,
    isParentSensitive,
  };
}
