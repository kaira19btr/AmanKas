/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction, Account, AppMode, UserRole } from '../types';
import { maskName } from '../utils/privacy';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { soundEngine } from '../utils/soundEffects';
import { SadarText } from '../components/SadarText';
import { GradientButton } from '@/components/ui/gradient-button';

interface LiveMonitoringViewProps {
  transactions: Transaction[];
  accounts: Account[];
  mode: AppMode;
  userRole: UserRole;
  onSelectTransaction: (trx: Transaction) => void;
  onNavigateToQueue: () => void;
  onNavigateToAccounts: () => void;
  isMasked: boolean;
  streamingActive: boolean;
  setStreamingActive: (val: boolean) => void;
}

export const LiveMonitoringView: React.FC<LiveMonitoringViewProps> = ({
  transactions,
  accounts,
  mode,
  userRole,
  onSelectTransaction,
  onNavigateToQueue,
  onNavigateToAccounts,
  isMasked,
  streamingActive,
  setStreamingActive,
}) => {
  const [filterType, setFilterType] = useState<'Semua' | 'Perlu ditinjau' | 'Prioritas tinggi'>('Semua');
  const [activeKpiInfo, setActiveKpiInfo] = useState<number | null>(null);

  // Compute live KPIs
  const totalToday = transactions.length;
  const reviewCount = transactions.filter((t) => t.status === 'Perlu ditinjau').length;
  const criticalCount = transactions.filter((t) => t.status === 'Prioritas tinggi').length;
  const healthyAccountsCount = accounts.filter(
    (a) => a.status === 'Hijau' || a.status === 'Dikecualikan (Nominal Tetap)'
  ).length;
  const totalAccounts = accounts.length;
  const healthyPercent = totalAccounts > 0 ? ((healthyAccountsCount / totalAccounts) * 100).toFixed(1) : '100';

  // Filtered transactions for live table
  const displayedTransactions = transactions.filter((t) => {
    if (filterType === 'Perlu ditinjau') return t.status === 'Perlu ditinjau';
    if (filterType === 'Prioritas tinggi') return t.status === 'Prioritas tinggi';
    return true;
  });

  // Top urgent alerts
  const instantAlerts = transactions
    .filter((t) => t.status === 'Prioritas tinggi' || t.status === 'Perlu ditinjau')
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 1. Institutional Position Statement Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 rounded-xl bg-white/95 border border-[#F3D9CE] shadow-xs backdrop-blur-sm gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E0F4EE] flex items-center justify-center text-[#009770] shrink-0">
            <span className="material-symbols-outlined text-lg">verified</span>
          </div>
          <p className="text-xs font-medium text-[#0A2A22] leading-tight flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-[#009770] flex items-center gap-1">
              <span>Prinsip</span>
              <SadarText variant="light" className="text-xs font-black" />:
            </span>
            <span>
              <SadarText variant="light" className="text-xs font-bold mr-1 inline-flex" /> adalah alat bantu pengendalian internal: bukan alat penindakan dan bukan pengganti auditor.
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="font-mono-tabular text-[#6B5A55] text-[11px] bg-[#FFF8F4] px-2 py-0.5 rounded border border-[#F3D9CE]">
            Mode: {mode === 'koperasi' ? 'Koperasi Simpan Pinjam' : 'UMKM / Ritel'}
          </span>
          <button
            onClick={onNavigateToQueue}
            className="text-[#009770] hover:underline font-semibold flex items-center gap-0.5 text-xs cursor-pointer"
          >
            Antrean Tinjauan
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Informative Explanation Modal / Banner for Selected KPI */}
      {activeKpiInfo !== null && (
        <div className="p-4 rounded-2xl bg-white border border-[#009770]/40 shadow-lg flex items-start justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E0F4EE] text-[#009770] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-lg">info</span>
            </div>
            <div className="text-xs space-y-1">
              <div className="font-display font-bold text-sm text-[#0A2A22]">
                {activeKpiInfo === 1 && 'Metrik: Total Transaksi Terpantau'}
                {activeKpiInfo === 2 && 'Metrik: Indikator Risiko - Perlu Ditinjau'}
                {activeKpiInfo === 3 && 'Metrik: Indikator Risiko - Prioritas Tinggi'}
                {activeKpiInfo === 4 && 'Metrik: Akun Terverifikasi Benford'}
              </div>
              <p className="text-[#6B5A55] leading-relaxed">
                {activeKpiInfo === 1 &&
                  'Seluruh arus transaksi diproses di peramban tanpa pengiriman data mentah ke server eksternal, menjamin kerahasiaan buku kas.'}
                {activeKpiInfo === 2 &&
                  'Transaksi dengan deviasi statistik moderat (persentil P90) atau terpicu aturan red-flag. Diteliti manusia tanpa sanksi otomatis.'}
                {activeKpiInfo === 3 &&
                  'Transaksi deviasi ekstrem (persentil P98) atau akumulasi red-flag. Pengurus/pemilik perlu memverifikasi dokumen pendukung.'}
                {activeKpiInfo === 4 &&
                  'Uji digit pertama Benford (Chi-square & MAD). Akun bernominal tetap (angsuran/iuran) dikecualikan agar tidak menimbulkan bias.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveKpiInfo(null)}
            className="text-xs font-mono-tabular px-2.5 py-1 rounded-lg bg-[#FFF8F4] border border-[#F3D9CE] hover:bg-[#FFE9DF] text-[#0A2A22] cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 2. Top KPI 4-Card Bento Grid */}
      <section aria-label="Ringkasan Indikator Kunci" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Transaksi Terpantau */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-[#F3D9CE] shadow-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all relative group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-tabular text-[11px] text-[#6B5A55] uppercase tracking-wider font-semibold">
                Transaksi Terpantau
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveKpiInfo(1)}
                  className="w-5 h-5 rounded-full bg-[#FFF8F4] border border-[#F3D9CE] text-[#6B5A55] hover:text-[#009770] text-[11px] font-bold flex items-center justify-center cursor-pointer"
                  title="Penjelasan Metrik"
                >
                  ?
                </button>
                <span className="w-2 h-2 rounded-full bg-[#009770] animate-pulse"></span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-[#0A2A22]">
                <AnimatedCounter value={totalToday} />
              </span>
              <span className="text-xs font-semibold text-[#009770] bg-[#E0F4EE] px-2 py-0.5 rounded-full font-mono-tabular">
                {streamingActive ? 'Live Sync' : 'Jeda'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F3D9CE]/60 flex items-center justify-between text-xs text-[#6B5A55]">
            <span>Mode: {mode === 'koperasi' ? 'Buku Kas KSP' : 'POS / Mutasi Kas'}</span>
            <button
              onClick={() => {
                soundEngine.playClick(streamingActive ? 400 : 800);
                setStreamingActive(!streamingActive);
              }}
              className="text-[#009770] hover:underline font-semibold cursor-pointer"
            >
              {streamingActive ? 'Jeda Stream' : 'Lanjutkan'}
            </button>
          </div>
        </div>

        {/* Card 2: Perlu Ditinjau */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-[#F3D9CE] shadow-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-tabular text-[11px] text-[#86513D] uppercase tracking-wider font-semibold">
                Perlu Ditinjau (P90)
              </span>
              <button
                type="button"
                onClick={() => setActiveKpiInfo(2)}
                className="w-5 h-5 rounded-full bg-[#FFF8F4] border border-[#F3D9CE] text-[#6B5A55] hover:text-[#86513D] text-[11px] font-bold flex items-center justify-center cursor-pointer"
              >
                ?
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-[#86513D]">
                <AnimatedCounter value={reviewCount} />
              </span>
              <span className="text-xs font-semibold text-[#86513D] bg-[#FFE9DF] px-2 py-0.5 rounded-full font-mono-tabular">
                Indikator Risiko
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F3D9CE]/60 flex items-center justify-between text-xs text-[#6B5A55]">
            <span>Perlu evaluasi operasional</span>
            <button
              onClick={() => {
                setFilterType('Perlu ditinjau');
                onNavigateToQueue();
              }}
              className="text-[#86513D] hover:underline font-semibold cursor-pointer"
            >
              Buka Antrean &rarr;
            </button>
          </div>
        </div>

        {/* Card 3: Prioritas Tinggi */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-[#CE2F2E]/30 bg-gradient-to-br from-white via-white to-[#FDE8E8]/40 shadow-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-tabular text-[11px] text-[#CE2F2E] uppercase tracking-wider font-bold">
                Prioritas Tinggi (P98)
              </span>
              <button
                type="button"
                onClick={() => setActiveKpiInfo(3)}
                className="w-5 h-5 rounded-full bg-[#FDE8E8] border border-[#CE2F2E]/30 text-[#CE2F2E] text-[11px] font-bold flex items-center justify-center cursor-pointer"
              >
                ?
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-[#CE2F2E]">
                <AnimatedCounter value={criticalCount} />
              </span>
              <span className="text-xs font-bold text-[#CE2F2E] bg-[#FDE8E8] px-2 py-0.5 rounded-full font-mono-tabular">
                Verifikasi Dokumen
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#CE2F2E]/20 flex items-center justify-between text-xs text-[#CE2F2E]">
            <span>Tanpa sanksi otomatis</span>
            <button
              onClick={() => {
                setFilterType('Prioritas tinggi');
                onNavigateToQueue();
              }}
              className="text-[#CE2F2E] hover:underline font-bold cursor-pointer"
            >
              Tinjau Sekarang &rarr;
            </button>
          </div>
        </div>

        {/* Card 4: Kepatuhan Akun */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-[#F3D9CE] shadow-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-tabular text-[11px] text-[#009770] uppercase tracking-wider font-semibold">
                Kesehatan Akun (Benford)
              </span>
              <button
                type="button"
                onClick={() => setActiveKpiInfo(4)}
                className="w-5 h-5 rounded-full bg-[#FFF8F4] border border-[#F3D9CE] text-[#6B5A55] hover:text-[#009770] text-[11px] font-bold flex items-center justify-center cursor-pointer"
              >
                ?
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-[#009770]">{healthyPercent}%</span>
              <span className="text-xs font-semibold text-[#009770] bg-[#E0F4EE] px-2 py-0.5 rounded-full font-mono-tabular">
                {healthyAccountsCount}/{totalAccounts} Akun
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F3D9CE]/60 flex items-center justify-between text-xs text-[#6B5A55]">
            <span>Uji Chi-square &amp; MAD</span>
            <button
              onClick={onNavigateToAccounts}
              className="text-[#009770] hover:underline font-semibold cursor-pointer"
            >
              Detail Akun &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* 3. Main Split View: Stream Table & Urgent Panel */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Stream Table (8 cols) */}
        <section className="col-span-12 lg:col-span-8 bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-[#F3D9CE] shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#0A2A22]">
                Aliran Transaksi Terkini
              </h2>
              <p className="text-xs text-[#6B5A55]">
                {mode === 'koperasi' ? 'Buku kas dan pergerakan dana simpan pinjam' : 'Transaksi kasir POS, QRIS, dan mutasi kas'}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#FFF8F4] rounded-xl border border-[#F3D9CE] text-xs font-medium">
              <button
                onClick={() => setFilterType('Semua')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === 'Semua' ? 'bg-[#009770] text-white font-semibold shadow-xs' : 'text-[#6B5A55] hover:text-[#0A2A22]'
                }`}
              >
                Semua ({transactions.length})
              </button>
              <button
                onClick={() => setFilterType('Perlu ditinjau')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === 'Perlu ditinjau'
                    ? 'bg-[#86513D] text-white font-semibold shadow-xs'
                    : 'text-[#6B5A55] hover:text-[#0A2A22]'
                }`}
              >
                Perlu Ditinjau ({reviewCount})
              </button>
              <button
                onClick={() => setFilterType('Prioritas tinggi')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterType === 'Prioritas tinggi'
                    ? 'bg-[#CE2F2E] text-white font-semibold shadow-xs'
                    : 'text-[#6B5A55] hover:text-[#0A2A22]'
                }`}
              >
                Prioritas Tinggi ({criticalCount})
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-[#F3D9CE]/70 max-h-[520px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FFF8F4] text-[#6B5A55] font-semibold sticky top-0 z-10 border-b border-[#F3D9CE]">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">ID / Entitas</th>
                  <th className="py-2.5 px-3">Akun / Pos</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                  <th className="py-2.5 px-3 text-center">Skor Risiko</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3D9CE]/50">
                {displayedTransactions.slice(0, 30).map((t, idx) => {
                  const isCritical = t.status === 'Prioritas tinggi';
                  const isReview = t.status === 'Perlu ditinjau';
                  const rowBg = isCritical
                    ? 'bg-[#FDE8E8]/30 hover:bg-[#FDE8E8]/60'
                    : isReview
                    ? 'bg-[#FFE9DF]/20 hover:bg-[#FFE9DF]/50'
                    : 'hover:bg-[#FFF8F4]/80';

                  return (
                    <tr key={`${t.id}-${idx}`} className={`transition-colors ${rowBg}`}>
                      <td className="py-2.5 px-3 font-mono-tabular text-[#6B5A55] whitespace-nowrap">
                        {t.timestamp}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#0A2A22]">
                          {isMasked ? maskName(t.memberName) : t.memberName}
                        </div>
                        <div className="text-[10px] font-mono-tabular text-[#6B5A55]">{t.memberId}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-[#0A2A22] font-medium truncate max-w-[140px]">{t.accountName}</div>
                        <div className="text-[10px] font-mono-tabular text-[#6B5A55]">{t.accountId}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-tabular font-bold text-[#0A2A22] whitespace-nowrap">
                        Rp {new Intl.NumberFormat('id-ID').format(t.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-mono-tabular px-2 py-0.5 rounded text-[11px] font-bold ${
                            isCritical
                              ? 'bg-[#FDE8E8] text-[#CE2F2E] border border-[#CE2F2E]/30'
                              : isReview
                              ? 'bg-[#FFE9DF] text-[#86513D] border border-[#86513D]/30'
                              : 'bg-[#E0F4EE] text-[#009770]'
                          }`}
                        >
                          {t.finalScore}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isCritical
                              ? 'bg-[#CE2F2E] text-white'
                              : isReview
                              ? 'bg-[#86513D] text-white'
                              : 'bg-[#009770]/15 text-[#00694D]'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onSelectTransaction(t)}
                          className="px-2.5 py-1 rounded bg-white hover:bg-[#E0F4EE] text-[#009770] font-semibold border border-[#009770]/30 hover:border-[#009770] transition-colors cursor-pointer text-[11px]"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Top Urgent Alerts & SOP Checklist (4 cols) */}
        <section className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-[#F3D9CE] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-bold text-[#0A2A22]">
                Peringatan Indikator Teratas
              </h3>
              <span className="text-[10px] font-mono-tabular bg-[#FFE9DF] text-[#86513D] px-2 py-0.5 rounded font-bold">
                Prioritas
              </span>
            </div>

            {instantAlerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#6B5A55]">
                <span className="material-symbols-outlined text-2xl text-[#009770] block mb-1">check_circle</span>
                Tidak ada peringatan prioritas saat ini. Semua transaksi dalam ambang wajar.
              </div>
            ) : (
              <div className="space-y-3">
                {instantAlerts.map((alt, idx) => (
                  <div
                    key={`${alt.id}-${idx}`}
                    className="p-3 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4]/60 hover:bg-[#FFF8F4] transition-all cursor-pointer"
                    onClick={() => onSelectTransaction(alt)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              alt.status === 'Prioritas tinggi' ? 'bg-[#CE2F2E]' : 'bg-[#86513D]'
                            }`}
                          />
                          <span className="font-semibold text-xs text-[#0A2A22]">
                            {isMasked ? maskName(alt.memberName) : alt.memberName}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6B5A55] font-mono-tabular mt-0.5">
                          {alt.accountName} &bull; Rp {new Intl.NumberFormat('id-ID').format(alt.amount)}
                        </div>
                      </div>
                      <span className="font-mono-tabular text-xs font-bold text-[#CE2F2E] bg-white px-2 py-0.5 rounded border border-[#CE2F2E]/30">
                        {alt.finalScore}
                      </span>
                    </div>

                    {alt.flagReasons && alt.flagReasons.length > 0 && (
                      <div className="mt-2 text-[10px] text-[#86513D] bg-white/80 p-1.5 rounded border border-[#F3D9CE]">
                        {alt.flagReasons[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onNavigateToQueue}
              className="w-full mt-4 py-2 rounded-xl bg-[#009770] hover:bg-[#008260] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              Buka Semua Antrean Tinjauan
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* SOP Compliance Card */}
          <div className="bg-gradient-to-br from-[#FFF8F4] to-white rounded-2xl p-4 border border-[#F3D9CE] text-xs space-y-2">
            <div className="flex items-center gap-2 text-[#009770] font-bold text-xs">
              <span className="material-symbols-outlined text-base">policy</span>
              Standar Operasional Tinjauan
            </div>
            <p className="text-[#6B5A55] text-[11px] leading-relaxed">
              Hasil analisis SADAR hanya merupakan indikator risiko pendukung. Seluruh tindak lanjut wajib mengonfirmasi bukti fisik transaksi dan tidak dapat dijadikan dasar tunggal pembekuan sepihak.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
