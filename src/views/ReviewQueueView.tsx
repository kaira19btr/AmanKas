/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Transaction, Account, DecisionStatus, SystemWeights, AppMode, UserRole } from '../types';
import { maskName } from '../utils/privacy';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { soundEngine } from '../utils/soundEffects';
import { ScoreDetailModal } from '../components/ScoreDetailModal';

interface ReviewQueueViewProps {
  transactions: Transaction[];
  accounts: Account[];
  mode: AppMode;
  userRole: UserRole;
  selectedTransaction: Transaction | null;
  onSelectTransaction: (trx: Transaction) => void;
  onMakeDecision: (trxId: string, decision: DecisionStatus, note: string) => void;
  systemWeights: SystemWeights;
  isMasked: boolean;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  transactions,
  accounts,
  mode,
  userRole,
  selectedTransaction,
  onSelectTransaction,
  onMakeDecision,
  systemWeights,
  isMasked,
}) => {
  const [filterTab, setFilterTab] = useState<'Semua' | 'Prioritas tinggi' | 'Perlu ditinjau' | 'Sudah diputuskan'>('Semua');
  const [sortBy, setSortBy] = useState<'Skor Tertinggi' | 'Waktu Terkini' | 'Nominal Terbesar'>('Skor Tertinggi');
  const [searchTerm, setSearchTerm] = useState('');
  const [investigatorNote, setInvestigatorNote] = useState('');
  const [scoreModalTrx, setScoreModalTrx] = useState<Transaction | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ msg: string; type: 'success' | 'alert' | 'info' } | null>(null);

  // Counters
  const totalCount = transactions.filter((t) => t.status !== 'Normal' || t.decisionStatus !== 'Menunggu Keputusan').length;
  const criticalCount = transactions.filter((t) => t.status === 'Prioritas tinggi' && t.decisionStatus === 'Menunggu Keputusan').length;
  const reviewCount = transactions.filter((t) => t.status === 'Perlu ditinjau' && t.decisionStatus === 'Menunggu Keputusan').length;
  const decidedCount = transactions.filter((t) => t.decisionStatus !== 'Menunggu Keputusan').length;

  // Filter queue
  const queueList = useMemo(() => {
    let list = transactions.filter((t) => {
      if (filterTab === 'Prioritas tinggi') {
        return t.status === 'Prioritas tinggi' && t.decisionStatus === 'Menunggu Keputusan';
      }
      if (filterTab === 'Perlu ditinjau') {
        return t.status === 'Perlu ditinjau' && t.decisionStatus === 'Menunggu Keputusan';
      }
      if (filterTab === 'Sudah diputuskan') {
        return t.decisionStatus !== 'Menunggu Keputusan';
      }
      return t.status !== 'Normal' || t.decisionStatus !== 'Menunggu Keputusan';
    });

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.memberName.toLowerCase().includes(q) ||
          t.memberId.toLowerCase().includes(q) ||
          t.accountId.toLowerCase().includes(q) ||
          t.accountName.toLowerCase().includes(q) ||
          t.amount.toString().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'Skor Tertinggi') return b.finalScore - a.finalScore;
      if (sortBy === 'Nominal Terbesar') return b.amount - a.amount;
      return b.timestamp.localeCompare(a.timestamp);
    });
  }, [transactions, filterTab, sortBy, searchTerm]);

  const activeTrx = selectedTransaction || queueList[0] || transactions[0];

  const handleDecision = (decision: DecisionStatus) => {
    if (!activeTrx) return;

    if (decision === 'Perlu pemeriksaan lanjut') {
      soundEngine.playAlert();
    } else {
      soundEngine.playClick(1000);
    }

    onMakeDecision(activeTrx.id, decision, investigatorNote);

    const isCorrection = activeTrx.decisionStatus !== 'Menunggu Keputusan';
    const toastMsg = isCorrection
      ? `Hak Koreksi diterapkan: Transaksi ${activeTrx.id} diperbarui menjadi "${decision}". Jejak perubahan tercatat di log audit.`
      : decision === 'Wajar'
      ? `Keputusan tersimpan: "Wajar". Bobot sinyal dominan diturunkan secara adaptif.`
      : decision === 'Perlu pemeriksaan lanjut'
      ? `Keputusan tersimpan: "Perlu pemeriksaan lanjut". Bobot sinyal pendeteksi dinaikkan secara adaptif.`
      : `Keputusan tersimpan: "Perlu dokumen pendukung". Permintaan bukti fisik dicatat.`;

    setFeedbackToast({
      msg: toastMsg,
      type: decision === 'Wajar' ? 'success' : decision === 'Perlu pemeriksaan lanjut' ? 'alert' : 'info',
    });
    setInvestigatorNote('');
    setTimeout(() => setFeedbackToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Compliance Banner */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 px-6 border border-[#F3D9CE] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-[#009770]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E0F4EE] text-[#009770] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">fact_check</span>
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-[#0A2A22]">
              Antrean Tinjauan Manusia (Human-in-the-Loop)
            </h2>
            <p className="text-xs text-[#6B5A55] mt-0.5">
              Setiap keputusan mengalibrasi bobot sistem secara dinamis. Anda berhak mengoreksi keputusan kapan saja (Hak Koreksi UU 27/2022).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="font-mono-tabular text-xs text-[#009770] bg-[#E0F4EE] px-3 py-1.5 rounded-lg border border-[#009770]/30 font-semibold">
            Peran Aktif: {userRole}
          </span>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackToast && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-xs animate-fadeIn ${
            feedbackToast.type === 'success'
              ? 'bg-[#E0F4EE] border-[#009770] text-[#00694D]'
              : feedbackToast.type === 'alert'
              ? 'bg-[#FDE8E8] border-[#CE2F2E] text-[#CE2F2E]'
              : 'bg-[#FFE9DF] border-[#86513D] text-[#86513D]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              {feedbackToast.type === 'success' ? 'check_circle' : 'info'}
            </span>
            <span>{feedbackToast.msg}</span>
          </div>
          <button onClick={() => setFeedbackToast(null)} className="font-bold text-sm cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* 2. KPI Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-3.5 border border-[#F3D9CE]">
          <span className="text-[10px] font-mono-tabular text-[#6B5A55] uppercase block">Total Antrean</span>
          <span className="font-display text-2xl font-bold text-[#0A2A22] mt-0.5 block">
            <AnimatedCounter value={totalCount} />
          </span>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-[#CE2F2E]/30 bg-gradient-to-br from-white to-[#FDE8E8]/30">
          <span className="text-[10px] font-mono-tabular text-[#CE2F2E] uppercase font-bold block">
            Prioritas Tinggi
          </span>
          <span className="font-display text-2xl font-bold text-[#CE2F2E] mt-0.5 block">
            <AnimatedCounter value={criticalCount} />
          </span>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-[#86513D]/30 bg-gradient-to-br from-white to-[#FFE9DF]/30">
          <span className="text-[10px] font-mono-tabular text-[#86513D] uppercase font-bold block">
            Perlu Ditinjau
          </span>
          <span className="font-display text-2xl font-bold text-[#86513D] mt-0.5 block">
            <AnimatedCounter value={reviewCount} />
          </span>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-[#009770]/30 bg-gradient-to-br from-white to-[#E0F4EE]/30">
          <span className="text-[10px] font-mono-tabular text-[#009770] uppercase font-bold block">
            Sudah Diputuskan
          </span>
          <span className="font-display text-2xl font-bold text-[#009770] mt-0.5 block">
            <AnimatedCounter value={decidedCount} />
          </span>
        </div>
      </div>

      {/* 3. Main Split View: Queue List (5 cols) & Investigation Panel (7 cols) */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column: Queue List */}
        <section className="col-span-12 lg:col-span-5 bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-[#F3D9CE] shadow-xs flex flex-col gap-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#0A2A22]">
                Daftar Indikator Risiko ({queueList.length})
              </h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-[11px] font-mono-tabular px-2 py-1 rounded-lg border border-[#F3D9CE] bg-[#FFF8F4] text-[#0A2A22]"
              >
                <option value="Skor Tertinggi">Skor Tertinggi</option>
                <option value="Waktu Terkini">Waktu Terkini</option>
                <option value="Nominal Terbesar">Nominal Terbesar</option>
              </select>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[16px] text-[#6B5A55]">
                search
              </span>
              <input
                type="text"
                placeholder="Cari ID transaksi, anggota, atau pos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] focus:outline-none focus:border-[#009770] font-sans text-[#0A2A22]"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1 text-[11px]">
              {(['Semua', 'Prioritas tinggi', 'Perlu ditinjau', 'Sudah diputuskan'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                    filterTab === tab
                      ? 'bg-[#009770] text-white shadow-xs'
                      : 'bg-[#FFF8F4] border border-[#F3D9CE] text-[#6B5A55] hover:text-[#0A2A22]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Queue Items */}
          <div className="max-h-[580px] overflow-y-auto space-y-2.5 pr-1">
            {queueList.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B5A55] bg-[#FFF8F4] rounded-xl border border-[#F3D9CE]">
                Tidak ada transaksi dalam kategori ini.
              </div>
            ) : (
              queueList.map((t, idx) => {
                const isSelected = activeTrx?.id === t.id;
                const isCritical = t.status === 'Prioritas tinggi';
                const isReview = t.status === 'Perlu ditinjau';
                const hasDecision = t.decisionStatus !== 'Menunggu Keputusan';

                return (
                  <div
                    key={`${t.id}-${idx}`}
                    onClick={() => {
                      soundEngine.playClick(750);
                      onSelectTransaction(t);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'border-[#009770] bg-[#E0F4EE]/30 shadow-xs ring-1 ring-[#009770]'
                        : 'border-[#F3D9CE] bg-white hover:bg-[#FFF8F4]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCritical ? 'bg-[#CE2F2E]' : isReview ? 'bg-[#86513D]' : 'bg-[#009770]'
                            }`}
                          />
                          <span className="font-semibold text-[#0A2A22]">
                            {isMasked ? maskName(t.memberName) : t.memberName}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono-tabular text-[#6B5A55] mt-0.5">
                          {t.id} &bull; {t.timestamp} WIB
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-mono-tabular text-xs font-bold px-2 py-0.5 rounded ${
                            isCritical
                              ? 'bg-[#FDE8E8] text-[#CE2F2E]'
                              : isReview
                              ? 'bg-[#FFE9DF] text-[#86513D]'
                              : 'bg-[#E0F4EE] text-[#009770]'
                          }`}
                        >
                          {t.finalScore}
                        </span>
                        <div className="font-mono-tabular font-bold text-[#0A2A22] text-xs mt-1">
                          Rp {new Intl.NumberFormat('id-ID').format(t.amount)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] text-[#6B5A55] truncate">
                      {t.accountName} ({t.accountId})
                    </div>

                    {hasDecision ? (
                      <div className="mt-2 pt-2 border-t border-[#F3D9CE]/60 flex items-center justify-between text-[11px]">
                        <span className="text-[#009770] font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">done</span>
                          {t.decisionStatus}
                        </span>
                        {t.correctionHistory && t.correctionHistory.length > 0 && (
                          <span className="text-[10px] text-[#86513D] font-mono-tabular">
                            (Pernah dikoreksi)
                          </span>
                        )}
                      </div>
                    ) : (
                      t.flagReasons &&
                      t.flagReasons.length > 0 && (
                        <div className="mt-2 text-[10px] text-[#86513D] bg-[#FFE9DF]/50 px-2 py-1 rounded truncate">
                          {t.flagReasons[0]}
                        </div>
                      )
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: Detailed Investigation & Explainability Panel */}
        <section className="col-span-12 lg:col-span-7 bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-[#F3D9CE] shadow-xs flex flex-col gap-5">
          {activeTrx ? (
            <>
              {/* Header Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F3D9CE]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tabular text-xs font-bold text-[#009770] bg-[#E0F4EE] px-2.5 py-0.5 rounded">
                      {activeTrx.id}
                    </span>
                    <h3 className="font-display text-base font-bold text-[#0A2A22]">
                      {isMasked ? maskName(activeTrx.memberName) : activeTrx.memberName}
                    </h3>
                  </div>
                  <p className="text-xs text-[#6B5A55] mt-1 font-mono-tabular">
                    ID Entitas: {activeTrx.memberId} &bull; Waktu: {activeTrx.timestamp} WIB &bull; Pos: {activeTrx.accountName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setScoreModalTrx(activeTrx)}
                    className="px-3 py-1.5 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">troubleshoot</span>
                    Dekomposisi Skor &amp; Animasi
                  </button>
                </div>
              </div>

              {/* Data Limitation Notice Row (Section D) */}
              <div className="p-3.5 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] flex items-start gap-2.5 text-xs">
                <span className="material-symbols-outlined text-[#86513D] text-base shrink-0 mt-0.5">info</span>
                <div>
                  <span className="font-bold text-[#86513D]">Keterbatasan Data: </span>
                  <span className="text-[#6B5A55]">
                    {activeTrx.dataLimitation ||
                      'Volume akun memenuhi syarat statistik. Baseline operasional stabil.'}
                  </span>
                </div>
              </div>

              {/* Primary Attributes Bento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#FFF8F4] rounded-xl border border-[#F3D9CE]">
                  <span className="text-[10px] text-[#6B5A55] block">Nominal Transaksi</span>
                  <span className="font-mono-tabular font-bold text-sm text-[#0A2A22] block mt-0.5">
                    Rp {new Intl.NumberFormat('id-ID').format(activeTrx.amount)}
                  </span>
                </div>
                <div className="p-3 bg-[#FFF8F4] rounded-xl border border-[#F3D9CE]">
                  <span className="text-[10px] text-[#6B5A55] block">Skor Risiko Total</span>
                  <span className="font-mono-tabular font-bold text-sm text-[#CE2F2E] block mt-0.5">
                    {activeTrx.finalScore}/100
                  </span>
                </div>
                <div className="p-3 bg-[#FFF8F4] rounded-xl border border-[#F3D9CE]">
                  <span className="text-[10px] text-[#6B5A55] block">Sinyal Aturan ({systemWeights.ruleWeight}%)</span>
                  <span className="font-mono-tabular font-bold text-sm text-[#009770] block mt-0.5">
                    {activeTrx.ruleScore}/100
                  </span>
                </div>
                <div className="p-3 bg-[#FFF8F4] rounded-xl border border-[#F3D9CE]">
                  <span className="text-[10px] text-[#6B5A55] block">Model Anomali ({systemWeights.anomalyWeight}%)</span>
                  <span className="font-mono-tabular font-bold text-sm text-[#86513D] block mt-0.5">
                    {activeTrx.isolationScore || activeTrx.anomalyScore || 50}/100
                  </span>
                </div>
              </div>

              {/* Attribution Factors & Triggers */}
              <div className="space-y-3">
                <h4 className="font-display text-xs font-bold text-[#0A2A22] uppercase tracking-wider">
                  Faktor Pemicu &amp; Atribusi Simpangan
                </h4>
                <div className="space-y-2">
                  {activeTrx.flagReasons && activeTrx.flagReasons.length > 0 ? (
                    activeTrx.flagReasons.map((reason, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white border border-[#F3D9CE] text-xs flex items-center justify-between"
                      >
                        <span className="font-medium text-[#0A2A22]">{reason}</span>
                        <span className="text-[10px] font-mono-tabular bg-[#FFE9DF] text-[#86513D] px-2 py-0.5 rounded font-semibold">
                          Red-Flag Terpicu
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-xl bg-white border border-[#F3D9CE] text-xs text-[#6B5A55]">
                      Terdeteksi melalui kedalaman pencilan pohon Isolation Forest.
                    </div>
                  )}

                  {activeTrx.attribution && (
                    <div className="p-3 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] text-xs space-y-1">
                      <div className="font-semibold text-[#0A2A22]">Atribusi Deviasi terhadap Median Akun:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono-tabular text-[11px] text-[#6B5A55]">
                        <div>Nominal: <strong>{(activeTrx.attribution.nominalDeviation ?? 1.5).toFixed(1)}x median</strong></div>
                        <div>Jam: <strong>{(activeTrx.attribution.hourDeviation ?? 0) > 0 ? `+${activeTrx.attribution.hourDeviation} jam deviasi` : 'Normal'}</strong></div>
                        <div>Kerapatan: <strong>{(activeTrx.attribution.intervalDeviation ?? 1.0).toFixed(1)}x normal</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hak Koreksi & Status Keputusan Terkini */}
              <div className="p-4 rounded-xl border border-[#F3D9CE] bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0A2A22]">
                    Status Keputusan: <strong className="text-[#009770]">{activeTrx.decisionStatus || 'Menunggu Keputusan'}</strong>
                  </span>
                  {activeTrx.decisionStatus !== 'Menunggu Keputusan' && (
                    <span className="text-[10px] font-mono-tabular bg-[#E0F4EE] text-[#00694D] px-2 py-0.5 rounded">
                      Dapat Dikoreksi (Hak Koreksi)
                    </span>
                  )}
                </div>
                {activeTrx.notes && (
                  <p className="text-xs text-[#6B5A55] italic bg-[#FFF8F4] p-2.5 rounded-lg border border-[#F3D9CE]">
                    Catatan peninjau: "{activeTrx.notes}"
                  </p>
                )}
              </div>

              {/* Action Form: Investigator Note & 3 Buttons */}
              <div className="pt-2 border-t border-[#F3D9CE] space-y-3">
                <input
                  type="text"
                  placeholder="Tuliskan catatan pertimbangan / bukti fisik slip / nomor nota..."
                  value={investigatorNote}
                  onChange={(e) => setInvestigatorNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] text-[#0A2A22] focus:outline-none focus:border-[#009770]"
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <span className="text-[11px] text-[#6B5A55]">
                    Pilih keputusan hasil verifikasi manusia:
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Button 1: Wajar */}
                    <button
                      onClick={() => handleDecision('Wajar')}
                      className="px-3.5 py-2 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Wajar
                    </button>

                    {/* Button 2: Perlu dokumen pendukung */}
                    <button
                      onClick={() => handleDecision('Perlu dokumen pendukung')}
                      className="px-3.5 py-2 rounded-xl bg-[#86513D] hover:bg-[#724433] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">receipt_long</span>
                      Perlu dokumen pendukung
                    </button>

                    {/* Button 3: Perlu pemeriksaan lanjut */}
                    <button
                      onClick={() => handleDecision('Perlu pemeriksaan lanjut')}
                      className="px-3.5 py-2 rounded-xl bg-[#CE2F2E] hover:bg-[#B32726] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">priority_high</span>
                      Perlu pemeriksaan lanjut
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-[#6B5A55]">
              Pilih transaksi dari daftar di sebelah kiri untuk meninjau.
            </div>
          )}
        </section>
      </div>

      {/* Futuristic Score Detail Modal */}
      {scoreModalTrx && (
        <ScoreDetailModal
          transaction={scoreModalTrx}
          isOpen={true}
          onClose={() => setScoreModalTrx(null)}
          onMakeDecision={(trxId, decision, note) => {
            onMakeDecision(trxId, decision, note);
            setScoreModalTrx((prev) => (prev ? { ...prev, decisionStatus: decision } : null));
          }}
          systemWeights={systemWeights}
          isMasked={isMasked}
        />
      )}
    </div>
  );
};
