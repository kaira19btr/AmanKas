/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Transaction, Account, DecisionStatus, SystemWeights } from '../types';
import { maskName } from '../utils/privacy';
import { soundEngine } from '../utils/soundEffects';
import { SadarText } from './SadarText';

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
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm font-mono-tabular ${
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
                <h3 className="font-display text-base font-bold text-[#0A2A22] flex items-center gap-1.5">
                  <span>Dekomposisi Penjelasan Skor</span>
                  <SadarText variant="light" className="text-base font-black" />
                </h3>
                <span
                  className={`text-[10px] font-mono-tabular font-bold px-2 py-0.5 rounded ${
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
              <p className="text-xs text-[#6B5A55] font-mono-tabular">
                ID: {transaction.id} &bull; {transaction.timestamp} WIB &bull;{' '}
                {isMasked ? maskName(transaction.memberName) : transaction.memberName} ({transaction.memberId})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-xl border border-[#F3D9CE] bg-white hover:bg-[#FFF8F4] text-xs font-medium text-[#0A2A22] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-sm">{copiedText ? 'check' : 'content_copy'}</span>
              {copiedText ? 'Tersalin' : 'Salin Ikhtisar'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#FFF8F4] hover:bg-[#FFE9DF] text-[#6B5A55] flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
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
                    <span className="text-xs font-bold text-[#0A2A22] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#009770]">rule</span>
                      Sinyal Aturan Red-Flags
                    </span>
                    <span className="font-mono-tabular text-xs font-bold text-[#009770] bg-[#E0F4EE] px-2 py-0.5 rounded">
                      Bobot: {systemWeights.ruleWeight}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-mono-tabular text-[#0A2A22]">
                      {transaction.ruleScore}/100
                    </span>
                    <span className="text-[11px] text-[#6B5A55]">
                      Kontribusi efektif: {Math.round((transaction.ruleScore * systemWeights.ruleWeight) / 100)} poin
                    </span>
                  </div>
                  <div className="w-full bg-[#FFF8F4] h-2 rounded-full overflow-hidden border border-[#F3D9CE]">
                    <div
                      style={{ width: `${transaction.ruleScore}%` }}
                      className="bg-[#009770] h-full rounded-full transition-all"
                    />
                  </div>
                  <div className="text-[11px] text-[#6B5A55] space-y-1">
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
                    <span className="text-xs font-bold text-[#0A2A22] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[#CE2F2E]">hub</span>
                      Model Anomali (Isolation Forest)
                    </span>
                    <span className="font-mono-tabular text-xs font-bold text-[#CE2F2E] bg-[#FDE8E8] px-2 py-0.5 rounded">
                      Bobot: {systemWeights.anomalyWeight}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-mono-tabular text-[#0A2A22]">
                      {transaction.isolationScore || transaction.anomalyScore || 50}/100
                    </span>
                    <span className="text-[11px] text-[#6B5A55]">
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
                  <div className="text-[11px] text-[#6B5A55]">
                    Evaluasi kedalaman isolasi (100 ensemble pohon). Mendeteksi titik pencilan multi-dimensi tanpa ketergantungan aturan kaku.
                  </div>
                </div>
              </div>

              {/* Dynamic Calibration Explanation */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFF8F4] to-white border border-[#F3D9CE] text-xs space-y-1.5">
                <div className="font-bold text-[#0A2A22] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#009770] text-sm">tune</span>
                  Kalibrasi Adaptif Umpan Balik Tinjauan (Human-in-the-Loop)
                </div>
                <p className="text-[#6B5A55] leading-relaxed">
                  Bobot sistem dimulai netral (50:50) dan tidak pernah kaku. Keputusan <strong>"Wajar"</strong> secara otomatis menurunkan bobot sinyal yang paling dominan menghasilkan false-alarm pada transaksi ini. Sebaliknya, <strong>"Perlu pemeriksaan lanjut"</strong> menaikkan bobot sinyal pendeteksi terkait.
                </p>
                <div className="text-[11px] font-mono-tabular text-[#009770] font-semibold">
                  Telah terkalibrasi melalui {systemWeights.calibratedCount} keputusan pengawas/pemilik.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'atribusi' && (
            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold text-[#0A2A22]">
                Simpangan Parameter Terhadap Median Akun
              </h4>
              <div className="space-y-3">
                {/* Nominal Deviation */}
                <div className="p-3.5 rounded-xl border border-[#F3D9CE] bg-white space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0A2A22]">Simpangan Nominal terhadap Median</span>
                    <span className="font-mono-tabular font-bold text-[#0A2A22]">
                      {nomDev.toFixed(1)}x Median
                    </span>
                  </div>
                  <div className="w-full bg-[#FFF8F4] h-2 rounded-full overflow-hidden border border-[#F3D9CE]">
                    <div
                      style={{ width: `${Math.min(100, nomDev * 25)}%` }}
                      className={`h-full rounded-full ${
                        nomDev > 2.5 ? 'bg-[#CE2F2E]' : 'bg-[#009770]'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-[#6B5A55] block">
                    Median historis akun: Rp {new Intl.NumberFormat('id-ID').format(transaction.amount / Math.max(1, nomDev))}
                  </span>
                </div>

                {/* Hour Deviation */}
                <div className="p-3.5 rounded-xl border border-[#F3D9CE] bg-white space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0A2A22]">Simpangan Jam terhadap Jam Operasional</span>
                    <span className="font-mono-tabular font-bold text-[#0A2A22]">
                      {hrDev > 0 ? `+${hrDev} Jam di luar jam operasional` : 'Dalam jam operasional'}
                    </span>
                  </div>
                  <div className="w-full bg-[#FFF8F4] h-2 rounded-full overflow-hidden border border-[#F3D9CE]">
                    <div
                      style={{ width: `${Math.min(100, (hrDev / 6) * 100)}%` }}
                      className={`h-full rounded-full ${hrDev > 0 ? 'bg-[#86513D]' : 'bg-[#009770]'}`}
                    />
                  </div>
                  <span className="text-[10px] text-[#6B5A55] block">
                    Jam operasional normal: 08:00 - 17:00 WIB. Waktu transaksi: {transaction.timestamp} WIB
                  </span>
                </div>

                {/* Interval Deviation */}
                <div className="p-3.5 rounded-xl border border-[#F3D9CE] bg-white space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0A2A22]">Kerapatan Waktu (Interval terhadap Transaksi Sebelumnya)</span>
                    <span className="font-mono-tabular font-bold text-[#0A2A22]">
                      {intDev.toFixed(1)}x Kerapatan Biasa
                    </span>
                  </div>
                  <div className="w-full bg-[#FFF8F4] h-2 rounded-full overflow-hidden border border-[#F3D9CE]">
                    <div
                      style={{ width: `${Math.min(100, intDev * 30)}%` }}
                      className="h-full rounded-full bg-[#009770]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'riwayat' && (
            <div className="space-y-3">
              <h4 className="font-display text-sm font-bold text-[#0A2A22]">
                Transaksi Terkait pada Entitas / Akun Ini
              </h4>
              {transaction.relatedTransactions && transaction.relatedTransactions.length > 0 ? (
                <div className="border border-[#F3D9CE] rounded-xl overflow-hidden divide-y divide-[#F3D9CE]/60">
                  {transaction.relatedTransactions.map((rt) => (
                    <div key={rt.id} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-[#0A2A22]">{rt.description}</div>
                        <div className="text-[11px] font-mono-tabular text-[#6B5A55]">
                          {rt.id} &bull; {rt.timestamp} WIB
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono-tabular font-bold text-[#0A2A22]">
                          Rp {new Intl.NumberFormat('id-ID').format(rt.amount)}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono-tabular bg-[#FFF8F4] border border-[#F3D9CE] text-[#6B5A55]">
                          {rt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#6B5A55] bg-[#FFF8F4] rounded-xl border border-[#F3D9CE]">
                  Belum ada transaksi historis terkait yang mencurigakan dalam 30 hari terakhir.
                </div>
              )}
            </div>
          )}

          {activeTab === 'koreksi' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-sm font-bold text-[#0A2A22]">
                  Jejak Perubahan Hak Koreksi
                </h4>
                <span className="text-[11px] text-[#6B5A55]">
                  Sesuai UU 27/2022 Pasal 37 (Hak Pembaruan &amp; Koreksi Data)
                </span>
              </div>
              {transaction.correctionHistory && transaction.correctionHistory.length > 0 ? (
                <div className="space-y-2">
                  {transaction.correctionHistory.map((ch, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-[#F3D9CE] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#0A2A22]">{ch.actor} ({ch.role})</span>
                        <span className="font-mono-tabular text-[11px] text-[#6B5A55]">{ch.timestamp}</span>
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
                <div className="p-6 text-center text-xs text-[#6B5A55] bg-[#FFF8F4] rounded-xl border border-[#F3D9CE]">
                  Keputusan saat ini: <strong>{transaction.decisionStatus || 'Menunggu Keputusan'}</strong>. Belum ada koreksi riwayat yang dilakukan.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Decision Panel with the 3 MANDATORY BUTTONS */}
        <div className="px-6 py-4 border-t border-[#F3D9CE] bg-white space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Catatan peninjau / nomor dokumen fisik pendukung..."
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] text-[#0A2A22] focus:outline-none focus:border-[#009770]"
            />
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
