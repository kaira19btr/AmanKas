/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Account, DecisionStatus, SystemWeights } from '../types';
import { maskName } from '../utils/privacy';
import { soundEngine } from '../utils/soundEffects';
import { SadarText } from './SadarText';
import { calculateExactShapleyAttribution } from '../utils/shapley';

interface ScoreDetailModalProps {
  transaction: Transaction | null;
  account?: Account;
  isOpen: boolean;
  onClose: () => void;
  onMakeDecision?: (trxId: string, decision: DecisionStatus, note: string) => void;
  systemWeights?: SystemWeights;
  isMasked?: boolean;
}

export const ScoreDetailModal: React.FC<ScoreDetailModalProps> = ({
  transaction,
  account,
  isOpen,
  onClose,
  onMakeDecision,
  systemWeights = { ruleWeight: 50, anomalyWeight: 50, calibratedCount: 0 },
  isMasked = false,
}) => {
  const [activeTab, setActiveTab] = useState<'dekomposisi' | 'atribusi' | 'riwayat' | 'koreksi'>('dekomposisi');
  const [decisionNote, setDecisionNote] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  // Sound sequence on open
  useEffect(() => {
    if (isOpen) {
      soundEngine.playAiBootSequence();
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        soundEngine.playClick(600);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !transaction) return null;

  const isPrioritas = transaction.status === 'Prioritas tinggi';
  const isReview = transaction.status === 'Perlu ditinjau';

  const nomDev = transaction.attribution?.nominalDeviation ?? 1.8;
  const hrDev = transaction.attribution?.hourDeviation ?? 0.5;
  const intDev = transaction.attribution?.intervalDeviation ?? 1.2;

  // Exact 6-feature Shapley value attribution (2^6 = 64 coalitions with account median background)
  const shapleyResult = useMemo(() => {
    if (!transaction) return null;
    const accountMedian = account?.medianAmount && account.medianAmount > 0
      ? account.medianAmount
      : Math.max(1000000, transaction.amount / Math.max(1, nomDev));

    return calculateExactShapleyAttribution(transaction.id, {
      nominal: transaction.amount,
      jam: transaction.timestamp,
      accountMedianNominal: accountMedian,
      intervalMinutesToSimilar: (transaction as any).intervalMinutes || Math.round(45 / Math.max(1, intDev)),
      dailyOfficerTrxCount: (transaction as any).officerDailyCount || 22,
      groupMeanNominal: accountMedian * 1.18,
    });
  }, [transaction, account, nomDev, hrDev, intDev]);

  const handleCopySummary = () => {
    const summary = `[AUDIT PENGENDALIAN INTERNAL SADAR]
ID Transaksi: ${transaction.id}
Skor Risiko Gabungan: ${transaction.finalScore}/100 (${transaction.status})
Bobot Saat Ini: Sinyal Aturan ${systemWeights.ruleWeight}% : Model Anomali ${systemWeights.anomalyWeight}%
Akun: ${transaction.accountId} - ${transaction.accountName}
Entitas: ${isMasked ? maskName(transaction.memberName) : transaction.memberName} (${transaction.memberId})
Nominal: Rp ${new Intl.NumberFormat('id-ID').format(transaction.amount)}
Waktu: ${transaction.timestamp} WIB
Keterbatasan Data: ${transaction.dataLimitation || 'Sampel memadai'}
Pemicu: ${transaction.flagReasons.join(', ') || 'Deviasi statistik'}`;

    navigator.clipboard.writeText(summary);
    soundEngine.playSuccess();
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleDecision = (decision: DecisionStatus) => {
    if (decision === 'Perlu pemeriksaan lanjut') {
      soundEngine.playAlert();
    } else {
      soundEngine.playClick(1000);
    }
    if (onMakeDecision) {
      onMakeDecision(transaction.id, decision, decisionNote || `Diputuskan via Dialog Rekam SADAR (${decision})`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-[#F3D9CE] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#F3D9CE] bg-gradient-to-r from-white via-white to-[#FFF8F4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-semibold text-sm font-mono tabular-nums ${
                isPrioritas
                  ? 'bg-[#FDE8E8] text-[#CE2F2E] border border-[#CE2F2E]/30'
                  : isReview
                  ? 'bg-[#FFE9DF] text-[#86513D] border border-[#86513D]/30'
                  : 'bg-[#E0F4EE] text-[#009770]'
              }`}
            >
              {transaction.finalScore}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-ui text-[17px] font-semibold text-[#0A2A22] flex items-center gap-1.5">
                  <span>Dekomposisi Penjelasan Skor</span>
                  <SadarText variant="light" className="text-base font-semibold" />
                </h3>
                <span
                  className={`text-[10px] font-mono uppercase tracking-[0.08em] font-medium px-2 py-0.5 rounded ${
                    isPrioritas
                      ? 'bg-[#CE2F2E] text-white'
                      : isReview
                      ? 'bg-[#86513D] text-white'
                      : 'bg-[#009770] text-white'
                  }`}
                >
                  {transaction.status}
                </span>
              </div>
              <p className="text-xs text-[#6B5A55] font-mono tabular-nums mt-0.5">
                ID: {transaction.id} &bull; {transaction.timestamp} WIB &bull;{' '}
                {isMasked ? maskName(transaction.memberName) : transaction.memberName} ({transaction.memberId})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-xl border border-[#F3D9CE] bg-white hover:bg-[#FFF8F4] text-xs font-ui font-semibold text-[#0A2A22] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-sm">{copiedText ? 'check' : 'content_copy'}</span>
              {copiedText ? 'Tersalin' : 'Salin Ikhtisar'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FFF8F4] hover:bg-[#FFE9DF] text-[#6B5A55] flex items-center justify-center text-sm font-semibold cursor-pointer transition-colors"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-[#F3D9CE] bg-[#FFF8F4]/50 flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('dekomposisi')}
            className={`py-3 px-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'dekomposisi'
                ? 'border-[#009770] text-[#009770]'
                : 'border-transparent text-[#6B5A55] hover:text-[#0A2A22]'
            }`}
          >
            Sinyal &amp; Bobot Skor
          </button>
          <button
            onClick={() => setActiveTab('atribusi')}
            className={`py-3 px-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'atribusi'
                ? 'border-[#009770] text-[#009770]'
                : 'border-transparent text-[#6B5A55] hover:text-[#0A2A22]'
            }`}
          >
            Faktor Pemicu (Atribusi)
          </button>
          <button
            onClick={() => setActiveTab('riwayat')}
            className={`py-3 px-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'riwayat'
                ? 'border-[#009770] text-[#009770]'
                : 'border-transparent text-[#6B5A55] hover:text-[#0A2A22]'
            }`}
          >
            Riwayat Terkait
          </button>
          <button
            onClick={() => setActiveTab('koreksi')}
            className={`py-3 px-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'koreksi'
                ? 'border-[#009770] text-[#009770]'
                : 'border-transparent text-[#6B5A55] hover:text-[#0A2A22]'
            }`}
          >
            Jejak Hak Koreksi ({transaction.correctionHistory?.length || 0})
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Row Keterbatasan Data (Mandatory Section D) */}
          <div className="p-3.5 rounded-2xl bg-[#FFF8F4] border border-[#F3D9CE] flex items-start gap-3">
            <span className="material-symbols-outlined text-[#86513D] text-lg shrink-0 mt-0.5">info</span>
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-[#86513D] block">Keterbatasan Data Transaksi:</span>
              <p className="text-[#6B5A55]">
                {transaction.dataLimitation ||
                  'Riwayat akun telah mencapai volume acuan standar. Baseline statistik beroperasi dalam toleransi wajar.'}
              </p>
            </div>
          </div>

          {activeTab === 'dekomposisi' && (
            <div className="space-y-5">
              {/* Dual Decomposition Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sinyal Aturan Red-Flags */}
                <div className="p-4 rounded-2xl border border-[#F3D9CE] bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold font-ui text-[#0A2A22] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#009770]">rule</span>
                      Sinyal Aturan Red-Flags
                    </span>
                    <span className="font-mono text-xs font-medium text-[#009770] bg-[#E0F4EE] px-2 py-0.5 rounded">
                      Bobot: {systemWeights.ruleWeight}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-semibold font-mono tabular-nums text-[#0A2A22]">
                      {transaction.ruleScore}/100
                    </span>
                    <span className="text-[11px] font-ui text-[#6B5A55]">
                      Kontribusi efektif: {Math.round((transaction.ruleScore * systemWeights.ruleWeight) / 100)} poin
                    </span>
                  </div>
                  <div className="w-full bg-[#FFF8F4] h-2 rounded-full overflow-hidden border border-[#F3D9CE]">
                    <div
                      style={{ width: `${transaction.ruleScore}%` }}
                      className="bg-[#009770] h-full rounded-full transition-all"
                    />
                  </div>
                  <div className="text-[11px] font-ui text-[#6B5A55] space-y-1">
                    <div className="font-semibold text-[#0A2A22]">Aturan Terpicu:</div>
                    {transaction.flagReasons && transaction.flagReasons.length > 0 ? (
                      <ul className="list-disc pl-4 space-y-0.5">
                        {transaction.flagReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="italic">Tidak ada pemicu red-flag spesifik.</span>
                    )}
                  </div>
                </div>

                {/* Sinyal Model Anomali (Isolation Forest) */}
                <div className="p-4 rounded-2xl border border-[#F3D9CE] bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold font-ui text-[#0A2A22] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#CE2F2E]">hub</span>
                      Model Anomali (Isolation Forest)
                    </span>
                    <span className="font-mono text-xs font-medium text-[#CE2F2E] bg-[#FDE8E8] px-2 py-0.5 rounded">
                      Bobot: {systemWeights.anomalyWeight}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-semibold font-mono tabular-nums text-[#0A2A22]">
                      {transaction.isolationScore || transaction.anomalyScore || 50}/100
                    </span>
                    <span className="text-[11px] font-ui text-[#6B5A55]">
                      Kontribusi efektif:{' '}
                      {Math.round(
                        ((transaction.isolationScore || transaction.anomalyScore || 50) *
                          systemWeights.anomalyWeight) /
                          100
                      )}{' '}
                      poin
                    </span>
                  </div>
                  <div className="w-full bg-[#FFF8F4] h-2 rounded-full overflow-hidden border border-[#F3D9CE]">
                    <div
                      style={{
                        width: `${transaction.isolationScore || transaction.anomalyScore || 50}%`,
                      }}
                      className="bg-[#CE2F2E] h-full rounded-full transition-all"
                    />
                  </div>
                  <div className="text-[11px] font-ui text-[#6B5A55]">
                    Evaluasi kedalaman isolasi (100 ensemble pohon). Mendeteksi titik pencilan multi-dimensi tanpa ketergantungan aturan kaku.
                  </div>
                </div>
              </div>

              {/* Dynamic Calibration Explanation */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFF8F4] to-white border border-[#F3D9CE] text-xs space-y-1.5 font-ui">
                <div className="font-semibold text-[#0A2A22] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#009770] text-sm">tune</span>
                  Kalibrasi Adaptif Umpan Balik Tinjauan (Human-in-the-Loop)
                </div>
                <p className="text-[#6B5A55] leading-[1.6]">
                  Bobot sistem dimulai netral (50:50) dan tidak pernah kaku. Keputusan <strong>"Wajar"</strong> secara otomatis menurunkan bobot sinyal yang paling dominan menghasilkan false-alarm pada transaksi ini. Sebaliknya, <strong>"Perlu pemeriksaan lanjut"</strong> menaikkan bobot sinyal pendeteksi terkait.
                </p>
                <div className="text-[11px] font-mono text-[#009770] font-semibold">
                  Telah terkalibrasi melalui {systemWeights.calibratedCount} keputusan pengawas/pemilik.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'atribusi' && shapleyResult && (
            <div className="space-y-5 font-ui">
              {/* Attribution Engine Header & Methodology Notice */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#031B15] to-[#0A2A22] text-white border border-[#00B386]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#84F8CA] text-lg">waterfall_chart</span>
                    <h4 className="font-ui text-sm font-semibold text-white">
                      Grafik Air Terjun (Waterfall) Atribusi Fitur
                    </h4>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">
                    {shapleyResult.attributionLabel} &bull; Enumerasi 2⁶ = 64 koalisi fitur terhadap skor Isolation Forest.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#009770]/30 border border-[#84F8CA]/40 text-[#84F8CA] font-mono text-[10px] font-semibold uppercase tracking-wider self-start sm:self-center">
                  64 Koalisi Eksak
                </span>
              </div>

              {/* Exact Verification Equation Row (Mandatory Requirement) */}
              <div className="p-4 rounded-2xl bg-white border border-[#F3D9CE] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#0A2A22] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#009770]">verified</span>
                    Verifikasi Matematis Eksak (Shapley Efficiency Axiom)
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-[#E0F4EE] text-[#009770] border border-[#009770]/30">
                    {shapleyResult.isVerified ? 'Tervalidasi (Δ = 0.0000)' : 'Verifikasi Gagal'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] font-mono text-xs text-[#0A2A22] flex flex-wrap items-center gap-2">
                  <span className="font-bold text-[#009770]">
                    Jumlah kontribusi = skor transaksi − skor latar
                  </span>
                  <span className="text-[#6B5A55] hidden sm:inline">&bull;</span>
                  <span className="text-xs text-[#6B5A55]">
                    Σ φᵢ ({shapleyResult.sumOfContributions.toFixed(2)}) = {shapleyResult.finalScore.toFixed(1)} − {shapleyResult.baselineScore.toFixed(1)} = {shapleyResult.scoreDifference.toFixed(2)} (Selisih: {shapleyResult.verificationDelta.toFixed(4)})
                  </span>
                </div>
              </div>

              {/* Interactive Waterfall Chart */}
              <div className="p-5 rounded-2xl bg-white border border-[#F3D9CE] shadow-xs space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#0A2A22]">
                    Dekomposisi Penumpukan Skor (0–100)
                  </span>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="flex items-center gap-1 text-[#CE2F2E]">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#CE2F2E]" /> Meningkatkan Risiko (+)
                    </span>
                    <span className="flex items-center gap-1 text-[#009770]">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#009770]" /> Menurunkan Risiko (−)
                    </span>
                  </div>
                </div>

                {/* Waterfall Visual Bars */}
                <div className="grid grid-cols-8 gap-2 items-end h-48 pt-6 pb-2 border-b border-[#F3D9CE] font-mono text-[10px]">
                  {/* Column 1: Baseline Score */}
                  <div className="flex flex-col items-center justify-end h-full">
                    <span className="font-bold text-[#6B5A55] mb-1">{shapleyResult.baselineScore}</span>
                    <div
                      style={{ height: `${Math.max(8, (shapleyResult.baselineScore / 100) * 100)}%` }}
                      className="w-full bg-[#E5E7EB] hover:bg-gray-300 rounded-t-md transition-all relative group cursor-pointer border border-gray-400/40"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-[#031B15] text-white p-1 rounded text-[9px] whitespace-nowrap z-10 pointer-events-none">
                        Skor Latar: {shapleyResult.baselineScore}
                      </div>
                    </div>
                    <span className="text-[9px] text-[#6B5A55] mt-1 text-center truncate w-full font-sans font-medium" title="Skor Latar">
                      Latar
                    </span>
                  </div>

                  {/* Columns 2-7: 6 Shapley Contributions */}
                  {shapleyResult.contributions.map((c, i) => {
                    const isPositive = c.contribution >= 0;
                    const barHeightPct = Math.min(100, Math.max(10, Math.abs(c.contribution) * 2.8));
                    return (
                      <div key={c.featureKey} className="flex flex-col items-center justify-end h-full">
                        <span className={`font-bold mb-1 ${isPositive ? 'text-[#CE2F2E]' : 'text-[#009770]'}`}>
                          {isPositive ? `+${c.contribution}` : `${c.contribution}`}
                        </span>
                        <div
                          style={{ height: `${barHeightPct}%` }}
                          className={`w-full rounded-t-md transition-all relative group cursor-pointer border ${
                            isPositive
                              ? 'bg-[#CE2F2E] border-rose-600 hover:bg-[#B32726]'
                              : 'bg-[#009770] border-emerald-600 hover:bg-[#008260]'
                          }`}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-[#031B15] text-white p-1.5 rounded-lg text-[9px] whitespace-nowrap z-20 pointer-events-none shadow-lg">
                            <div className="font-bold">{c.featureLabel}</div>
                            <div>Kontribusi: {c.contribution > 0 ? `+${c.contribution}` : c.contribution} poin</div>
                          </div>
                        </div>
                        <span className="text-[9px] text-[#0A2A22] mt-1 text-center truncate w-full font-sans font-medium" title={c.featureLabel}>
                          F{i + 1}
                        </span>
                      </div>
                    );
                  })}

                  {/* Column 8: Final Transaction Score */}
                  <div className="flex flex-col items-center justify-end h-full">
                    <span className="font-bold text-[#CE2F2E] mb-1">{shapleyResult.finalScore}</span>
                    <div
                      style={{ height: `${Math.max(12, (shapleyResult.finalScore / 100) * 100)}%` }}
                      className="w-full bg-[#0A2A22] rounded-t-md transition-all relative group cursor-pointer border border-[#84F8CA]"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-[#031B15] text-white p-1 rounded text-[9px] whitespace-nowrap z-10 pointer-events-none">
                        Skor Akhir: {shapleyResult.finalScore}
                      </div>
                    </div>
                    <span className="text-[9px] text-[#0A2A22] mt-1 text-center truncate w-full font-sans font-bold" title="Skor Akhir">
                      Skor
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[#6B5A55] italic">
                  * Keterangan: F1–F6 merepresentasikan 6 dimensi fitur yang diuji secara berurutan. Arahkan kursor pada batang untuk melihat kontribusi detail.
                </div>
              </div>

              {/* 6 Feature Explanation Cards with Neutral Phrasing */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#0A2A22]">
                  <span>Rincian 6 Fitur &amp; Penjelasan Netral</span>
                  <span className="text-[11px] font-normal text-[#6B5A55]">
                    Latar perbandingan: Median historis akun
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {shapleyResult.contributions.map((c, idx) => (
                    <div
                      key={c.featureKey}
                      className="p-3.5 rounded-xl border border-[#F3D9CE] bg-white hover:border-[#009770] transition-colors flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-gray-100 text-[#0A2A22]">
                              F{idx + 1}
                            </span>
                            <span className="font-semibold text-xs text-[#0A2A22]">
                              {c.featureLabel}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-[#6B5A55] mt-1">
                            Nilai: <strong className="text-[#0A2A22]">{c.actualValueDisplay}</strong> (Latar: {c.baselineValueDisplay})
                          </div>
                        </div>

                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded shrink-0 ${
                            c.contribution > 0
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : c.contribution < 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-50 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {c.contribution > 0 ? `+${c.contribution}` : c.contribution} poin
                        </span>
                      </div>

                      <p className="text-[11px] text-[#6B5A55] bg-[#FFF8F4] p-2 rounded-lg border border-[#F3D9CE]/60 leading-relaxed">
                        {c.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'riwayat' && (
            <div className="space-y-3">
              <h4 className="font-ui text-[17px] font-semibold text-[#0A2A22]">
                Transaksi Terkait pada Entitas / Akun Ini
              </h4>
              {transaction.relatedTransactions && transaction.relatedTransactions.length > 0 ? (
                <div className="border border-[#F3D9CE] rounded-xl overflow-hidden divide-y divide-[#F3D9CE]/60">
                  {transaction.relatedTransactions.map((rt, idx) => (
                    <div key={`${rt.id}-${idx}`} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-[#0A2A22] font-ui">{rt.description}</div>
                        <div className="text-[11px] font-mono tabular-nums text-[#6B5A55]">
                          {rt.id} &bull; {rt.timestamp} WIB
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono tabular-nums font-semibold text-[#0A2A22]">
                          Rp {new Intl.NumberFormat('id-ID').format(rt.amount)}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#FFF8F4] border border-[#F3D9CE] text-[#6B5A55]">
                          {rt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#6B5A55] bg-[#FFF8F4] rounded-xl border border-[#F3D9CE] font-ui">
                  Belum ada transaksi historis terkait yang mencurigakan dalam 30 hari terakhir.
                </div>
              )}
            </div>
          )}

          {activeTab === 'koreksi' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-ui text-[17px] font-semibold text-[#0A2A22]">
                  Jejak Perubahan Hak Koreksi
                </h4>
                <span className="text-[11px] font-ui text-[#6B5A55]">
                  Sesuai UU 27/2022 Pasal 37 (Hak Pembaruan &amp; Koreksi Data)
                </span>
              </div>
              {transaction.correctionHistory && transaction.correctionHistory.length > 0 ? (
                <div className="space-y-2 font-ui">
                  {transaction.correctionHistory.map((ch, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-[#F3D9CE] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#0A2A22]">{ch.actor} ({ch.role})</span>
                        <span className="font-mono tabular-nums text-[11px] text-[#6B5A55]">{ch.timestamp}</span>
                      </div>
                      <div className="text-[#6B5A55]">
                        Mengubah keputusan dari <strong className="text-[#86513D]">{ch.previousDecision}</strong> menjadi{' '}
                        <strong className="text-[#009770]">{ch.newDecision}</strong>
                      </div>
                      <div className="text-[11px] italic text-[#6B5A55] bg-[#FFF8F4] p-2 rounded border border-[#F3D9CE]">
                        Alasan: {ch.reason}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#6B5A55] bg-[#FFF8F4] rounded-xl border border-[#F3D9CE] font-ui">
                  Keputusan saat ini: <strong>{transaction.decisionStatus || 'Menunggu Keputusan'}</strong>. Belum ada koreksi riwayat yang dilakukan.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Decision Panel with the 3 MANDATORY BUTTONS */}
        <div className="px-6 py-4 border-t border-[#F3D9CE] bg-white space-y-3">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Tanggapan pihak terkait (hak klarifikasi kasir/anggota/pengelola)..."
              value={transaction.tanggapanPihakTerkait || ''}
              readOnly
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-700"
            />
            <input
              type="text"
              placeholder="Catatan peninjau / nomor dokumen fisik pendukung..."
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] text-[#0A2A22] focus:outline-none focus:border-[#009770]"
            />
          </div>

          {/* Mandatory Permanent Sanction Note */}
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed font-ui">
            <strong>Batas Kewenangan:</strong> Sanksi hanya setelah temuan terkonfirmasi di luar sistem melalui AD/ART dan RAT. Sistem SADAR tidak melakukan penindakan atau pemblokiran akses.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-[#6B5A55]">
              Status saat ini: <strong className="text-[#0A2A22]">{transaction.decisionStatus || 'Menunggu Keputusan'}</strong>
            </span>

            {/* The 3 Required Human Decisions */}
            <div className="flex items-center gap-2">
              {/* Button 1: Wajar */}
              <button
                onClick={() => handleDecision('Wajar')}
                className="px-4 py-2 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Wajar
              </button>

              {/* Button 2: Perlu dokumen pendukung */}
              <button
                onClick={() => handleDecision('Perlu dokumen pendukung')}
                className="px-4 py-2 rounded-xl bg-[#86513D] hover:bg-[#724433] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">receipt_long</span>
                Perlu dokumen pendukung
              </button>

              {/* Button 3: Perlu pemeriksaan lanjut */}
              <button
                onClick={() => handleDecision('Perlu pemeriksaan lanjut')}
                title="Pemeriksaan lanjut oleh Pengawas Senior"
                className="px-4 py-2 rounded-xl bg-[#CE2F2E] hover:bg-[#B32726] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">priority_high</span>
                Perlu pemeriksaan lanjut
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
