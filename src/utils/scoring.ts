/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TransactionStatus, RuleConfig, SystemWeights, AttributionFactors, AppMode } from '../types';

export interface ScoreBreakdown {
  isolationScore: number;
  ruleScore: number;
  finalScore: number;
  status: TransactionStatus;
  flagReasons: string[];
  attribution: AttributionFactors;
  dataLimitations: string;
}

export interface ScoreContext {
  amount: number;
  timeStr: string; // "HH:mm:ss"
  channel: string;
  accountMedianAmount: number;
  accountMedianIntervalMin?: number;
  accountTotalTrx: number;
  parentAccountStatus: string; // 'Hijau' | 'Kuning' | 'Merah' | 'Volume belum cukup' | 'Dikecualikan (Nominal Tetap)'
  burstFactor?: number;
  isolationScore: number;
  ruleConfig: RuleConfig;
  systemWeights: SystemWeights;
  mode: AppMode;
  hasDocument?: boolean;
  isDuplicate?: boolean;
  isVoidOrReturn?: boolean;
  isCashGap?: boolean;
  isPersonalMixing?: boolean;
}

/**
 * Computes red-flag rule score, attribute contributions, and composite risk indicator score.
 */
export function calculateScores(ctxOrTrx: ScoreContext | any, fallbackIfScore?: number): ScoreBreakdown {
  const isDirectTrx = ctxOrTrx && typeof ctxOrTrx.amount === 'number' && !('ruleConfig' in ctxOrTrx);
  
  const ctx: ScoreContext = isDirectTrx
    ? {
        amount: ctxOrTrx.amount,
        timeStr: ctxOrTrx.timestamp || '12:00:00',
        channel: ctxOrTrx.channel || 'Buku Kas',
        accountMedianAmount: 1500000,
        accountMedianIntervalMin: 60,
        accountTotalTrx: 100,
        parentAccountStatus: 'Hijau',
        burstFactor: 0,
        isolationScore: fallbackIfScore ?? ctxOrTrx.isolationScore ?? 25,
        ruleConfig: {
          outOfHours: { enabled: true, startHour: 18, endHour: 7, points: 25 },
          duplicateTrx: { enabled: true, windowMinutes: 120, points: 30 },
          nominalSplitting: { enabled: true, threshold: 9500000, points: 35 },
          withoutDocument: { enabled: true, minAmount: 10000000, points: 20 },
          unusualAccountShift: { enabled: true, points: 20 },
          umkmRepeatedVoid: { enabled: true, maxThreshold: 3, points: 35 },
          umkmDailyCashGap: { enabled: true, maxGapPct: 10, points: 30 },
          umkmPersonalMixing: { enabled: true, points: 40 },
        },
        systemWeights: {
          ruleWeight: 50,
          anomalyWeight: 50,
          calibratedCount: 0,
          adaptiveThresholdEnabled: false,
          minVolumeThreshold: 300,
          percentileP90: 45,
          percentileP98: 72,
        },
        mode: 'koperasi',
      }
    : ctxOrTrx;

  const {
    amount,
    timeStr,
    channel,
    accountMedianAmount,
    accountMedianIntervalMin = 60,
    accountTotalTrx,
    parentAccountStatus,
    burstFactor = 0,
    isolationScore,
    ruleConfig,
    systemWeights,
    mode,
    hasDocument = true,
    isDuplicate = false,
    isVoidOrReturn = false,
    isCashGap = false,
    isPersonalMixing = false,
  } = ctx;

  const flagReasons: string[] = [];
  let ruleScore = 0;

  const hour = parseInt(timeStr.split(':')[0], 10) || 12;
  const minute = parseInt(timeStr.split(':')[1], 10) || 0;

  // 1. Out of hours
  if (ruleConfig.outOfHours.enabled) {
    if (hour >= ruleConfig.outOfHours.startHour || hour < ruleConfig.outOfHours.endHour) {
      ruleScore += ruleConfig.outOfHours.points;
      flagReasons.push(`Aktivitas pukul ${timeStr.slice(0, 5)} WIB di luar jam operasional standar (pukul ${ruleConfig.outOfHours.endHour}:00 - ${ruleConfig.outOfHours.startHour}:00 WIB)`);
    }
  }

  // 2. Duplicate transaction check
  if (ruleConfig.duplicateTrx.enabled && isDuplicate) {
    ruleScore += ruleConfig.duplicateTrx.points;
    flagReasons.push(`Indikasi transaksi kembar dengan nominal identik dalam rentang ${ruleConfig.duplicateTrx.windowMinutes} menit`);
  }

  // 3. Nominal splitting / smurfing
  if (ruleConfig.nominalSplitting.enabled) {
    const threshold = ruleConfig.nominalSplitting.threshold;
    if (amount >= threshold * 0.9 && amount < threshold) {
      ruleScore += ruleConfig.nominalSplitting.points;
      const formatted = new Intl.NumberFormat('id-ID').format(amount);
      const limitFormatted = new Intl.NumberFormat('id-ID').format(threshold);
      flagReasons.push(`Nominal Rp ${formatted} mendekati ambang batas lapor Rp ${limitFormatted} (indikasi pemecahan transaksi)`);
    }
  }

  // 4. Missing documentation
  if (ruleConfig.withoutDocument.enabled && !hasDocument && amount >= ruleConfig.withoutDocument.minAmount) {
    ruleScore += ruleConfig.withoutDocument.points;
    flagReasons.push(`Transaksi di atas Rp ${new Intl.NumberFormat('id-ID').format(ruleConfig.withoutDocument.minAmount)} tanpa lampiran kuitansi/dokumen pendukung`);
  }

  // 5. Significant shift from account median
  const safeMedian = Math.max(accountMedianAmount, 100000);
  const nominalRatio = amount / safeMedian;
  if (ruleConfig.unusualAccountShift.enabled && nominalRatio >= 2.5) {
    ruleScore += ruleConfig.unusualAccountShift.points;
    flagReasons.push(`Lonjakan nominal ${nominalRatio.toFixed(1)}x dibanding median historis akun (Rp ${new Intl.NumberFormat('id-ID').format(Math.round(safeMedian))})`);
  }

  // Mode specific checks for UMKM
  if (mode === 'umkm') {
    if (ruleConfig.umkmRepeatedVoid.enabled && isVoidOrReturn) {
      ruleScore += ruleConfig.umkmRepeatedVoid.points;
      flagReasons.push(`Pencatatan void/retur kasir berulang tanpa otorisasi tertulis`);
    }
    if (ruleConfig.umkmDailyCashGap.enabled && isCashGap) {
      ruleScore += ruleConfig.umkmDailyCashGap.points;
      flagReasons.push(`Selisih kas harian fisik melebihi ambang batas toleransi operasional`);
    }
    if (ruleConfig.umkmPersonalMixing.enabled && isPersonalMixing) {
      ruleScore += ruleConfig.umkmPersonalMixing.points;
      flagReasons.push(`Pengeluaran berindikasi keperluan pribadi pada rekening/buku kas usaha (pencampuran dana)`);
    }
  }

  ruleScore = Math.min(100, ruleScore);

  // Dynamic Composite Score based on System Weights (Default 50:50, calibrated by review feedback)
  const totalWeight = (systemWeights.ruleWeight + systemWeights.anomalyWeight) || 100;
  const normalizedRuleW = systemWeights.ruleWeight / totalWeight;
  const normalizedAnomW = systemWeights.anomalyWeight / totalWeight;

  // In UMKM mode, if volume is low, Isolation Forest anomaly has minimal weight and rule-based is primary
  const minVol = systemWeights.minVolumeThreshold ?? 300;
  let effectiveIsolation = isolationScore;
  if (mode === 'umkm' && accountTotalTrx < minVol) {
    effectiveIsolation = Math.min(isolationScore, ruleScore);
  }

  let finalScore = Math.round(normalizedAnomW * effectiveIsolation + normalizedRuleW * ruleScore);
  finalScore = Math.max(0, Math.min(100, finalScore));

  // Attribution: simple delta vs median
  const nominalDeltaMedianPct = Math.round(((amount - safeMedian) / safeMedian) * 100);
  const hourDeltaMedian = Math.abs(hour - 13); // reference midpoint of day
  const intervalDeltaMedianMin = Math.round(burstFactor * 45);

  const attribution: AttributionFactors = {
    nominalDeltaMedianPct,
    hourDeltaMedian,
    intervalDeltaMedianMin,
    nominalDeviation: Number((amount / safeMedian).toFixed(1)),
    hourDeviation: hourDeltaMedian,
    intervalDeviation: Number((1 + burstFactor * 2).toFixed(1)),
    ruleContribution: ruleScore,
    anomalyContribution: effectiveIsolation,
  };

  // Data Limitations
  let dataLimitations = '';
  if (accountTotalTrx < 50) {
    dataLimitations = `Riwayat akun baru ${accountTotalTrx} transaksi; baseline operasional belum stabil.`;
  } else if (accountTotalTrx < minVol) {
    dataLimitations = `Volume transaksi (${accountTotalTrx}) belum mencapai ${minVol}; model statistik memerlukan verifikasi manual.`;
  } else {
    dataLimitations = `Riwayat memadai (${accountTotalTrx} transaksi). Model anomali dan aturan berjalan dengan data stabil.`;
  }

  // Priority Level Classification based on historical percentiles
  let p90 = systemWeights.percentileP90 || 45;
  let p98 = systemWeights.percentileP98 || 72;

  // Adaptive Threshold Hypothesis (Toggleable)
  if (systemWeights.adaptiveThresholdEnabled && parentAccountStatus === 'Merah') {
    // If account has Benford red deviation, tighten alert threshold by 12 points
    p90 = Math.max(25, p90 - 12);
    p98 = Math.max(50, p98 - 12);
    flagReasons.push(`[HIPOTESIS ADAPTIF AKTIF] Akun berstatus Merah memperketat ambang peringatan (P90: ${p90}, P98: ${p98})`);
  }

  let status: TransactionStatus = 'Normal';
  if (finalScore >= p98) {
    status = 'Prioritas tinggi';
  } else if (finalScore >= p90) {
    status = 'Perlu ditinjau';
  }

  if (flagReasons.length === 0) {
    flagReasons.push('Pola transaksi selaras dengan profil historis dan pedoman pengendalian');
  }

  return {
    isolationScore: effectiveIsolation,
    ruleScore,
    finalScore,
    status,
    flagReasons,
    attribution,
    dataLimitations,
  };
}
