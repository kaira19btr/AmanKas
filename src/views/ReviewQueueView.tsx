/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction, Account, DecisionStatus } from '../types';
import { maskName } from '../utils/privacy';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { soundEngine } from '../utils/soundEffects';

interface ReviewQueueViewProps {
  transactions: Transaction[];
  accounts: Account[];
  selectedTransaction: Transaction | null;
  onSelectTransaction: (trx: Transaction) => void;
  onMakeDecision: (trxId: string, decision: DecisionStatus, note: string) => void;
  isMasked: boolean;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  transactions,
  accounts,
  selectedTransaction,
  onSelectTransaction,
  onMakeDecision,
  isMasked,
}) => {
  const [filterTab, setFilterTab] = useState<'Semua' | 'Segera verifikasi' | 'Perlu ditinjau' | 'Sudah diputuskan'>('Semua');
  const [sortBy, setSortBy] = useState<'Skor Tertinggi' | 'Waktu Terkini' | 'Nominal Terbesar'>('Skor Tertinggi');
  const [investigatorNote, setInvestigatorNote] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Compute counts
  const totalCount = transactions.filter(t => t.status !== 'Normal' || t.decisionStatus !== 'Menunggu Keputusan').length;
  const criticalCount = transactions.filter(t => t.status === 'Segera verifikasi' && t.decisionStatus === 'Menunggu Keputusan').length;
  const reviewCount = transactions.filter(t => t.status === 'Perlu ditinjau' && t.decisionStatus === 'Menunggu Keputusan').length;
  const decidedCount = transactions.filter(t => t.decisionStatus !== 'Menunggu Keputusan').length;

  // Filter queue
  let queueList = transactions.filter((t) => {
    if (filterTab === 'Segera verifikasi') {
      return t.status === 'Segera verifikasi' && t.decisionStatus === 'Menunggu Keputusan';
    }
    if (filterTab === 'Perlu ditinjau') {
      return t.status === 'Perlu ditinjau' && t.decisionStatus === 'Menunggu Keputusan';
    }
    if (filterTab === 'Sudah diputuskan') {
      return t.decisionStatus !== 'Menunggu Keputusan';
    }
    // 'Semua' shows flagged pending or decided
    return t.status !== 'Normal' || t.decisionStatus !== 'Menunggu Keputusan';
  });

  // Sort queue
  queueList = [...queueList].sort((a, b) => {
    if (sortBy === 'Skor Tertinggi') return b.finalScore - a.finalScore;
    if (sortBy === 'Nominal Terbesar') return b.amount - a.amount;
    return b.timestamp.localeCompare(a.timestamp);
  });

  // Default active transaction if none selected
  const activeTrx = selectedTransaction || queueList[0] || transactions[0];
  const activeAccount = accounts.find((a) => a.id === activeTrx?.accountId);

  const handleDecisionClick = (decision: DecisionStatus) => {
    if (!activeTrx) return;
    
    // Play sound effect matching decision
    if (decision === 'Ditindaklanjuti') {
      soundEngine.playAlert();
    } else if (decision === 'Dinyatakan Wajar') {
      soundEngine.playClick(1150);
    } else {
      soundEngine.playClick(720);
    }

    onMakeDecision(activeTrx.id, decision, investigatorNote);
    const msg =
      decision === 'Dinyatakan Wajar'
        ? `Keputusan tersimpan: Dinyatakan Wajar. Sensitivitas model disesuaikan (-25 poin untuk transaksi sejenis pada ${activeTrx.accountName}).`
        : decision === 'Ditindaklanjuti'
        ? `Keputusan tersimpan: Perlu Ditindaklanjuti. Laporan investigasi diteruskan ke Pengawas KSP.`
        : `Keputusan tersimpan: Minta Dokumen Pendukung ke Anggota ${activeTrx.memberId}.`;
    setFeedbackToast(msg);
    setInvestigatorNote('');
    setTimeout(() => setFeedbackToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Institutional Human Mandate Banner */}
      <div className="bg-gradient-to-r from-[#FFF8F4] via-[#FFE9DF] to-[#FFF8F4] border border-[#F3D9CE] rounded-2xl px-6 py-3 flex flex-col md:flex-row items-start md:items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-2.5 text-[#0A2A22]">
          <span className="material-symbols-outlined text-[#009770] text-[22px]">gavel</span>
          <span className="font-medium leading-relaxed">
            <strong>Pedoman Verifikasi Koperasi:</strong> Keputusan pembekuan atau eskalasi hukum sepenuhnya wewenang pengurus. Masukan Anda melatih algoritma adaptif koperasi tanpa aksi otomatis membekukan dana.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#F3D9CE] text-[11px] font-mono-tabular font-semibold text-[#6B5A55]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#009770]" />
            Protokol ISO 27001
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#F3D9CE] text-[11px] font-mono-tabular font-semibold text-[#6B5A55]">
            Kemenkop-UKM Compliant
          </span>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="p-4 rounded-xl bg-[#E0F4EE] border border-[#009770] text-[#00694D] font-mono-tabular text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">verified</span>
            <span>{feedbackToast}</span>
          </div>
          <button onClick={() => setFeedbackToast(null)} className="font-bold text-sm">✕</button>
        </div>
      )}

      {/* 2. Top Section: Filter Tabs & Sorting Bar */}
      <section className="flex flex-wrap items-center justify-between gap-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#F3D9CE] shadow-xs">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterTab('Semua')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
              filterTab === 'Semua'
                ? 'bg-[#009770] text-white border-[#009770] font-semibold'
                : 'bg-[#FFF8F4] text-[#6B5A55] hover:bg-[#FFE9DF] border-[#F3D9CE]'
            }`}
          >
            Semua <span className="ml-1 opacity-80 font-mono-tabular">({totalCount})</span>
          </button>

          <button
            onClick={() => setFilterTab('Segera verifikasi')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
              filterTab === 'Segera verifikasi'
                ? 'bg-[#CE2F2E] text-white border-[#CE2F2E] shadow-xs'
                : 'bg-[#FDE8E8] text-[#CE2F2E] border-[#CE2F2E]/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#CE2F2E] radar-pulse-red" />
            Segera verifikasi
            <span className="bg-[#CE2F2E] text-white text-[10px] font-mono-tabular px-1.5 py-0.2 rounded-full">
              {criticalCount}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('Perlu ditinjau')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'Perlu ditinjau'
                ? 'bg-[#FFF637] text-[#6B5F00] border-[#6B5F00] shadow-xs font-bold'
                : 'bg-[#FFF637]/30 text-[#6B5F00] border-[#FFF637]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#6B5F00]" />
            Perlu ditinjau
            <span className="font-mono-tabular font-bold">({reviewCount})</span>
          </button>

          <button
            onClick={() => setFilterTab('Sudah diputuskan')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'Sudah diputuskan'
                ? 'bg-[#009770] text-white border-[#009770] font-bold'
                : 'bg-white text-[#6B5A55] hover:bg-[#FFF8F4] border-[#F3D9CE]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-[#009770]">check_circle</span>
            Sudah diputuskan
            <span className="opacity-70 font-mono-tabular">({decidedCount})</span>
          </button>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 bg-[#FFF8F4] border border-[#F3D9CE] rounded-xl px-3 py-1.5 text-xs">
          <span className="material-symbols-outlined text-[18px] text-[#6B5A55]">sort</span>
          <span className="text-[#0A2A22] font-medium">Urutkan:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent font-mono-tabular font-semibold text-[#009770] border-none focus:ring-0 p-0 cursor-pointer text-xs"
          >
            <option value="Skor Tertinggi">Skor Tertinggi (Paling Kritis)</option>
            <option value="Waktu Terkini">Waktu Terkini (Real-time)</option>
            <option value="Nominal Terbesar">Nominal Terbesar (Rp)</option>
          </select>
        </div>
      </section>

      {/* 3. Core 2-Column Layout */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: TRANSACTIONS QUEUE LIST (5 COLS)             */}
        {/* ========================================================= */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-sm text-[#0A2A22]">
                Antrean Transaksi Tertahan
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-[#FFF8F4] border border-[#F3D9CE] font-mono-tabular text-[11px] text-[#6B5A55]">
                {queueList.length} Kasus
              </span>
            </div>
            <span className="text-[#6B5A55] flex items-center gap-1 font-mono-tabular">
              <span className="material-symbols-outlined text-[14px] text-[#009770]">tune</span>
              Filter Aktif
            </span>
          </div>

          {/* Cards List */}
          <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1">
            {queueList.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 text-center text-[#6B5A55]">
                <span className="material-symbols-outlined text-4xl text-[#009770] mb-2">done_all</span>
                <p className="font-semibold text-xs text-[#0A2A22]">Antrean Bersih</p>
                <p className="text-[11px] mt-1">Tidak ada transaksi yang perlu diverifikasi pada filter ini.</p>
              </div>
            ) : (
              queueList.map((trx) => {
                const isSelected = activeTrx?.id === trx.id;
                const isCrit = trx.status === 'Segera verifikasi';
                const isRev = trx.status === 'Perlu ditinjau';

                return (
                  <div
                    key={trx.id}
                    onClick={() => onSelectTransaction(trx)}
                    className={`rounded-2xl p-4 transition-all duration-150 cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-white border-2 border-[#009770] shadow-md ring-4 ring-[#009770]/10'
                        : 'bg-white/90 hover:bg-white border border-[#F3D9CE] shadow-xs'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#009770]" />
                    )}

                    <div className="pl-1">
                      {/* Top Row: Account & Risk Score Pill */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="font-mono-tabular text-[11px] font-bold text-[#86513D] uppercase tracking-wide">
                            {trx.accountId} · {trx.accountName}
                          </span>
                          <h3 className="font-bold text-xs text-[#0A2A22] mt-0.5">
                            {maskName(trx.memberName, isMasked)}{' '}
                            <span className="font-normal text-[#6B5A55] font-mono-tabular">
                              ({trx.memberId})
                            </span>
                          </h3>
                        </div>

                        {/* Risk Score Pill */}
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${
                            isCrit
                              ? 'bg-[#FDE8E8] border-[#CE2F2E]/30 text-[#CE2F2E]'
                              : isRev
                              ? 'bg-[#FFF637]/40 border-[#FFF637] text-[#6B5F00]'
                              : 'bg-[#E0F4EE] border-[#009770]/30 text-[#009770]'
                          }`}
                        >
                          {isCrit && <span className="w-1.5 h-1.5 rounded-full bg-[#CE2F2E] radar-pulse-red" />}
                          <span className="font-mono-tabular font-bold text-sm">{trx.finalScore}</span>
                          <span className="text-[9px] font-mono-tabular font-bold uppercase tracking-tight">
                            {isCrit ? 'Kritis' : isRev ? 'Tinjau' : 'Wajar'}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Nominal & Timestamp */}
                      <div className="mt-2.5 flex items-baseline justify-between py-1.5 border-y border-[#F3D9CE]/60">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6B5A55] uppercase font-mono-tabular">
                            Nominal
                          </span>
                          <span className="font-display font-bold text-sm text-[#0A2A22]">
                            Rp {new Intl.NumberFormat('id-ID').format(trx.amount)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-mono-tabular text-[#6B5A55] flex items-center gap-1 justify-end">
                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                            {trx.timestamp} WIB
                          </span>
                          {trx.decisionStatus !== 'Menunggu Keputusan' && (
                            <span className="text-[10px] font-semibold text-[#009770] block">
                              ✓ {trx.decisionStatus}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Flag Reasons */}
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {trx.flagReasons.slice(0, 2).map((reason, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-tabular truncate max-w-[210px] ${
                              isCrit ? 'bg-[#FDE8E8] text-[#CE2F2E]' : 'bg-[#FFF637]/40 text-[#6B5F00]'
                            }`}
                          >
                            {reason}
                          </span>
                        ))}
                        {isSelected && (
                          <span className="ml-auto text-[10px] font-bold text-[#009770] flex items-center gap-0.5">
                            Ditinjau Sekarang
                            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: TRANSACTION DETAIL & HUMAN DECISION (7 COLS) */}
        {/* ========================================================= */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
          {activeTrx ? (
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-[#F3D9CE] shadow-md p-6 flex flex-col gap-6">
              {/* Header Panel */}
              <div className="flex items-start justify-between pb-4 border-b border-[#F3D9CE]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-display font-bold text-lg text-[#0A2A22]">
                      {activeTrx.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono-tabular font-bold border ${
                        activeTrx.decisionStatus === 'Menunggu Keputusan'
                          ? 'bg-[#FFF637]/40 text-[#6B5F00] border-[#FFF637]'
                          : 'bg-[#E0F4EE] text-[#009770] border-[#009770]/30'
                      }`}
                    >
                      {activeTrx.decisionStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#6B5A55] mt-1 font-mono-tabular">
                    <span>{activeTrx.channel}</span>
                    <span>•</span>
                    <span className="text-[#009770] font-medium">
                      Deteksi Audit: {activeTrx.timestamp} WIB
                    </span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end text-xs">
                  <span className="text-[#6B5A55]">Penyidik Ditugaskan</span>
                  <span className="font-semibold text-[#009770]">Sari W. (Bendahara Utama)</span>
                </div>
              </div>

              {/* 1. Score Breakdown & Algorithmic Decomposition */}
              <div className="bg-[#FFF8F4] rounded-2xl p-4 border border-[#F3D9CE] flex flex-col md:flex-row items-center gap-6">
                {/* Score Gauge Block */}
                <div className="flex flex-col items-center justify-center min-w-[130px] p-3 rounded-xl bg-white border border-[#F3D9CE] shadow-xs">
                  <div
                    className={`flex items-baseline ${
                      activeTrx.finalScore >= 71
                        ? 'text-[#CE2F2E]'
                        : activeTrx.finalScore >= 41
                        ? 'text-[#6B5F00]'
                        : 'text-[#009770]'
                    }`}
                  >
                    <span className="font-display text-4xl font-bold leading-none">
                      <AnimatedCounter value={activeTrx.finalScore} />
                    </span>
                    <span className="font-mono-tabular text-xs text-[#6B5A55] ml-0.5">/100</span>
                  </div>
                  <span
                    className={`text-[11px] font-mono-tabular font-bold tracking-tight uppercase mt-1 ${
                      activeTrx.finalScore >= 71
                        ? 'text-[#CE2F2E]'
                        : activeTrx.finalScore >= 41
                        ? 'text-[#6B5F00]'
                        : 'text-[#009770]'
                    }`}
                  >
                    {activeTrx.status}
                  </span>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full ${
                        activeTrx.finalScore >= 71
                          ? 'bg-[#CE2F2E]'
                          : activeTrx.finalScore >= 41
                          ? 'bg-[#6B5F00]'
                          : 'bg-[#009770]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, activeTrx.finalScore))}%` }}
                    />
                  </div>
                </div>

                {/* Progress bars decomposition */}
                <div className="flex-1 w-full flex flex-col gap-3">
                  {/* Isolation Forest 60% */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#0A2A22] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#009770]">
                          bubble_chart
                        </span>
                        Anomali Pola (Isolation Forest ML)
                      </span>
                      <span className="font-mono-tabular font-bold text-[#009770]">
                        60% Bobot · Skor {activeTrx.isolationScore}
                      </span>
                    </div>
                    <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#F3D9CE]">
                      <div
                        className="bg-gradient-to-r from-[#009770] to-[#FFB89F] h-full"
                        style={{ width: `${activeTrx.isolationScore}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[#6B5A55]">
                      Deviasi pohon isolasi acak dari klaster historis transaksi koperasi.
                    </span>
                  </div>

                  {/* Red-Flag Rules 40% */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#0A2A22] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#CE2F2E]">
                          policy
                        </span>
                        Aturan Red-Flag Kepatuhan
                      </span>
                      <span className="font-mono-tabular font-bold text-[#CE2F2E]">
                        40% Bobot · Skor {activeTrx.ruleScore}
                      </span>
                    </div>
                    <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#F3D9CE]">
                      <div
                        className="bg-[#CE2F2E] h-full"
                        style={{ width: `${activeTrx.ruleScore}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-[#6B5A55]">
                      Pola penarikan malam hari, pecahan smurfing, dan nominal bulat.
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Audit Evidence & Warning Indicators */}
              <div className="flex flex-col gap-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B5A55] flex items-center gap-1.5 font-mono-tabular">
                  <span className="material-symbols-outlined text-[16px] text-[#009770]">fact_check</span>
                  Bukti Audit &amp; Indikator Peringatan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {activeTrx.flagReasons.map((reason, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#FFF2F2] border border-[#CE2F2E]/30 flex flex-col gap-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#CE2F2E] text-[18px]">
                          priority_high
                        </span>
                        <span className="font-bold text-[#CE2F2E]">Penanda Forensik #{idx + 1}</span>
                      </div>
                      <p className="text-[#0A2A22] leading-snug">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Parent Account Health Link */}
              <div className="p-3.5 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] flex items-center gap-3.5 text-xs">
                <div className="w-10 h-10 rounded-lg bg-[#FFE9DF] flex items-center justify-center text-[#86513D] shrink-0">
                  <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[#0A2A22]">
                    Kesehatan Akun Induk: {activeTrx.accountId} · {activeTrx.accountName}
                  </span>
                  <span className="text-[#6B5A55] mt-0.5">
                    Status:{' '}
                    <strong
                      className={
                        activeAccount?.status === 'Anomali Kuat'
                          ? 'text-[#CE2F2E]'
                          : activeAccount?.status === 'Mencurigakan'
                          ? 'text-[#6B5F00]'
                          : 'text-[#009770]'
                      }
                    >
                      {activeAccount?.status || 'Wajar'}
                    </strong>{' '}
                    (MAD: {activeAccount?.mad?.toFixed(4) || '0.0072'}).{' '}
                    {activeAccount?.status === 'Anomali Kuat'
                      ? 'Skor akun induk memperketat ambang batas kewaspadaan transaksi ini.'
                      : 'Akun induk berada dalam batas kepatuhan wajar.'}
                  </span>
                </div>
              </div>

              {/* 4. Verifier Notes & Audit Trail Timeline */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6B5A55] flex items-center justify-between font-mono-tabular">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#009770]">
                      edit_note
                    </span>
                    Catatan Investigasi Verifikator (Wajib untuk Akuntabilitas)
                  </span>
                  <span className="text-[11px] text-[#009770]">Tersimpan Terenkripsi di Ledger</span>
                </label>
                <textarea
                  value={investigatorNote}
                  onChange={(e) => setInvestigatorNote(e.target.value)}
                  placeholder="Tuliskan catatan verifikasi (contoh: sudah konfirmasi telepon ke anggota; dana dibutuhkan darurat untuk pembelian stok sembako dini hari...)"
                  className="w-full p-3 rounded-xl border border-[#F3D9CE] text-xs font-mono-tabular text-[#0A2A22] placeholder-[#6B5A55]/60 focus:ring-2 focus:ring-[#009770] focus:border-[#009770] bg-[#FFF8F4]/50 focus:bg-white transition-all shadow-inner"
                  rows={2}
                />

                {/* Mini Timeline */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-[#F3D9CE] text-[11px] font-mono-tabular text-[#6B5A55]">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#009770]" /> {activeTrx.timestamp} Tercatat Switch
                  </span>
                  <span>→</span>
                  <span className="flex items-center gap-1 text-[#CE2F2E] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CE2F2E]" /> Skor {activeTrx.finalScore} (AI Flag)
                  </span>
                  <span>→</span>
                  <span className="flex items-center gap-1 text-[#009770] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#009770]" /> Dialokasikan ke Sari W.
                  </span>
                </div>
              </div>

              {/* 5. Three Human-in-the-Loop Decision Buttons */}
              <div className="pt-2 border-t border-[#F3D9CE] flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Button 1: Perlu Ditindaklanjuti */}
                  <button
                    onClick={() => handleDecisionClick('Ditindaklanjuti')}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#CE2F2E] hover:bg-[#b51b1f] text-white font-display text-xs font-semibold shadow-md active:scale-98 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">notification_important</span>
                    <span>Perlu Ditindaklanjuti</span>
                  </button>

                  {/* Button 2: Ternyata Wajar */}
                  <button
                    onClick={() => handleDecisionClick('Dinyatakan Wajar')}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#009770] to-[#00B386] hover:opacity-95 text-white font-display text-xs font-semibold shadow-md active:scale-98 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    <span>Ternyata Wajar</span>
                  </button>

                  {/* Button 3: Minta Dokumen */}
                  <button
                    onClick={() => handleDecisionClick('Menunggu Dokumen')}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-[#E0F4EE] border-2 border-[#009770] text-[#009770] font-display text-xs font-semibold active:scale-98 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
                    <span>Minta Dokumen</span>
                  </button>
                </div>

                {/* Compliance Guarantee Note */}
                <div className="flex items-center gap-2 text-xs text-[#6B5A55] bg-[#FFF8F4] p-2.5 rounded-xl border border-[#F3D9CE]">
                  <span className="material-symbols-outlined text-[18px] text-[#009770] shrink-0">verified_user</span>
                  <span>
                    <strong>Prinsip Koperasi:</strong> Memilih <em>"Ternyata Wajar"</em> secara otomatis mengurangi skor anomali pada transaksi sejenis berikutnya di akun ini. Keputusan Anda mendidik parameter algoritma. Tidak ada tindakan pemblokiran dana otomatis.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-8 text-center text-[#6B5A55]">
              Pilih transaksi di kolom kiri untuk melihat rincian bukti audit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
