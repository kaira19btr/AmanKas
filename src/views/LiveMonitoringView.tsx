import React, { useState } from 'react';
import { Transaction, Account } from '../types';
import { maskName } from '../utils/privacy';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { soundEngine } from '../utils/soundEffects';

interface LiveMonitoringViewProps {
  transactions: Transaction[];
  accounts: Account[];
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
  onSelectTransaction,
  onNavigateToQueue,
  onNavigateToAccounts,
  isMasked,
  streamingActive,
  setStreamingActive,
}) => {
  const [filterType, setFilterType] = useState<'Semua' | 'Perlu Ditinjau' | 'Segera Verifikasi'>('Semua');
  const [activeKpiInfo, setActiveKpiInfo] = useState<number | null>(null);

  // Compute live KPIs
  const totalToday = transactions.length;
  const reviewCount = transactions.filter((t) => t.status === 'Perlu ditinjau').length;
  const criticalCount = transactions.filter((t) => t.status === 'Segera verifikasi').length;
  const healthyAccountsCount = accounts.filter((a) => a.status === 'Wajar' || a.status === 'Dikecualikan (Nominal Tetap)').length;
  const totalAccounts = accounts.length;
  const healthyPercent = ((healthyAccountsCount / totalAccounts) * 100).toFixed(1);

  // Filtered transactions for live table
  const displayedTransactions = transactions.filter((t) => {
    if (filterType === 'Perlu Ditinjau') return t.status === 'Perlu ditinjau';
    if (filterType === 'Segera Verifikasi') return t.status === 'Segera verifikasi';
    return true;
  });

  // Top 3 urgent alerts for the right panel
  const instantAlerts = transactions.filter((t) => t.status === 'Segera verifikasi' || t.status === 'Perlu ditinjau').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 1. Institutional Reminder Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/95 border border-[#F3D9CE] shadow-xs backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#FFDBCF]/50 flex items-center justify-center text-[#86513D]">
            <span className="material-symbols-outlined text-base">shield_with_heart</span>
          </div>
          <p className="text-xs font-medium text-[#0A2A22]">
            <span className="font-semibold text-[#86513D]">Pedoman Integritas:</span> AmanKas hanya menandai. Keputusan akhir ada pada pengurus.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono-tabular text-[#6B5A55] text-[11px]">SOP No. 04/KSP-MS/2025</span>
          <button
            onClick={onNavigateToQueue}
            className="text-[#009770] hover:underline font-semibold flex items-center gap-0.5 text-xs cursor-pointer"
          >
            Pelajari Panduan
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
                {activeKpiInfo === 2 && 'Metrik: Antrean Transaksi Perlu Ditinjau (Skor 41–70)'}
                {activeKpiInfo === 3 && 'Metrik: Anomali Kritis Segera Verifikasi (Skor 71–100)'}
                {activeKpiInfo === 4 && 'Metrik: Indeks Kesehatan Akun Berbasis Benford’s Law'}
              </div>
              <p className="text-[#6B5A55] leading-relaxed">
                {activeKpiInfo === 1 &&
                  'Seluruh arus transaksi simpanan, pinjaman, dan angsuran diproses real-time oleh model machine learning lokal tanpa jeda server eksternal.'}
                {activeKpiInfo === 2 &&
                  'Ditandai oleh kombinasi 60% Isolation Forest + 40% Red-Flags (pembulatan tidak lazim, penarikan malam hari di luar jam operasional, atau mendekati ambang batas otorisasi).'}
                {activeKpiInfo === 3 &&
                  'Deviasi ekstrem multi-parameter atau terjadi pada akun dengan status Anomali Kuat (MAD > 0,015). Pengurus diwajibkan melakukan konfirmasi dokumen fisik/slip tanpa pembekuan dana otomatis.'}
                {activeKpiInfo === 4 &&
                  'Menggunakan standar Nigrini Mean Absolute Deviation (MAD). Akun wajar (MAD ≤ 0,012) mematuhi kurva logaritmik digit pertama log10(1 + 1/d). Akun nominal tetap dapat dikecualikan.'}
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

      {/* 2. Top KPI 4-Card Bento Grid with Moving Animated Sparklines */}
      <section aria-label="Ringkasan Indikator Kunci" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Transaksi Hari Ini */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-[#F3D9CE] shadow-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all relative group">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-tabular text-[11px] text-[#6B5A55] uppercase tracking-wider font-semibold">
                Transaksi Hari Ini
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => { soundEngine.playClick(900); setActiveKpiInfo(activeKpiInfo === 1 ? null : 1); }}
                  className="w-6 h-6 rounded-md hover:bg-[#E0F4EE] text-[#6B5A55] hover:text-[#009770] flex items-center justify-center cursor-pointer"
                  title="Lihat penjelasan informatif"
                >
                  <span className="material-symbols-outlined text-sm">help</span>
                </button>
                <div className="w-8 h-8 rounded-lg bg-[#E0F4EE] flex items-center justify-center text-[#009770]">
                  <span className="material-symbols-outlined text-lg">receipt_long</span>
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-[#0A2A22]">
                <AnimatedCounter value={totalToday} />
              </span>
              <span className="font-mono-tabular text-xs text-[#6B5A55]">transaksi</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F3D9CE]/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono-tabular text-xs text-[#009770] font-semibold">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span>+14% vs kemarin</span>
            </div>
            {/* Moving Animated Sparkline SVG 1 */}
            <div className="w-24 h-7 relative">
              <svg className="w-full h-full fill-none" viewBox="0 0 100 30">
                <path
                  d="M 5 24 Q 25 22, 40 16 T 70 12 T 95 6"
                  stroke="#009770"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-spark-flow"
                />
                <circle cx="95" cy="6" r="4" fill="#009770" className="animate-ping opacity-75 origin-center" />
                <circle cx="95" cy="6" r="3" fill="#009770" stroke="#FFFFFF" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: Perlu Ditinjau */}
        <div
          onClick={() => { soundEngine.playClick(750); onNavigateToQueue(); }}
          className="bg-gradient-to-br from-white via-white to-[#FFFDE6] backdrop-blur-md rounded-2xl p-5 border border-[#FFF637] shadow-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer relative group"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-tabular text-[11px] text-[#6B5F00] uppercase tracking-wider font-semibold">
                Perlu Ditinjau
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); soundEngine.playClick(900); setActiveKpiInfo(activeKpiInfo === 2 ? null : 2); }}
                  className="w-6 h-6 rounded-md hover:bg-[#FFF637]/60 text-[#6B5F00] flex items-center justify-center cursor-pointer"
                  title="Lihat penjelasan informatif"
                >
                  <span className="material-symbols-outlined text-sm">help</span>
                </button>
                <div className="w-8 h-8 rounded-lg bg-[#FFF637] flex items-center justify-center text-[#6B5F00] shadow-xs">
                  <span className="material-symbols-outlined text-lg font-bold">visibility</span>
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-[#6B5F00]">
                <AnimatedCounter value={reviewCount} />
              </span>
              <span className="font-mono-tabular text-xs text-[#6B5F00]/80">pola sedang</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#FFF637]/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono-tabular text-xs text-[#6B5F00] font-semibold">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>Antrean tinjauan</span>
            </div>
            {/* Moving Animated Sparkline SVG 2 */}
            <div className="w-24 h-7 relative">
              <svg className="w-full h-full fill-none" viewBox="0 0 100 30">
                <path
                  d="M 5 18 Q 20 6, 35 19 T 65 14 T 95 18"
                  stroke="#8C7D00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-spark-flow"
                />
                <circle cx="95" cy="18" r="4" fill="#8C7D00" className="animate-ping opacity-75 origin-center" />
                <circle cx="95" cy="18" r="3" fill="#8C7D00" stroke="#FFFFFF" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3: Segera Verifikasi */}
        <div
          onClick={() => { soundEngine.playClick(600); onNavigateToQueue(); }}
          className="bg-gradient-to-br from-white via-white to-[#FFF0F0] backdrop-blur-md rounded-2xl p-5 border border-[#CE2F2E]/40 shadow-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer relative group"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-tabular text-[11px] text-[#CE2F2E] uppercase tracking-wider font-bold">
                Segera Verifikasi
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); soundEngine.playClick(900); setActiveKpiInfo(activeKpiInfo === 3 ? null : 3); }}
                  className="w-6 h-6 rounded-md hover:bg-[#FDE8E8] text-[#CE2F2E] flex items-center justify-center cursor-pointer"
                  title="Lihat penjelasan informatif"
                >
                  <span className="material-symbols-outlined text-sm">help</span>
                </button>
                <div className="w-8 h-8 rounded-lg bg-[#FDE8E8] flex items-center justify-center text-[#CE2F2E]">
                  <span className="material-symbols-outlined text-lg font-bold">priority_high</span>
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-[#CE2F2E]">
                <AnimatedCounter value={criticalCount} />
              </span>
              <span className="font-mono-tabular text-xs text-[#CE2F2E]/80">ancaman tinggi</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#CE2F2E]/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono-tabular text-xs text-[#CE2F2E] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#CE2F2E] radar-pulse-red" />
              <span>Tindakan segera</span>
            </div>
            {/* Moving Animated Sparkline SVG 3 */}
            <div className="w-24 h-7 relative">
              <svg className="w-full h-full fill-none" viewBox="0 0 100 30">
                <path
                  d="M 5 22 L 30 20 L 50 24 L 70 6 L 85 18 L 95 9"
                  stroke="#CE2F2E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-spark-flow"
                />
                <circle cx="95" cy="9" r="4" fill="#CE2F2E" className="animate-ping opacity-75 origin-center" />
                <circle cx="95" cy="9" r="3" fill="#CE2F2E" stroke="#FFFFFF" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 4: Akun Sehat */}
        <div
          onClick={() => { soundEngine.playClick(850); onNavigateToAccounts(); }}
          className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-[#F3D9CE] shadow-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer relative group"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-tabular text-[11px] text-[#6B5A55] uppercase tracking-wider font-semibold">
                Akun Sehat
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); soundEngine.playClick(900); setActiveKpiInfo(activeKpiInfo === 4 ? null : 4); }}
                  className="w-6 h-6 rounded-md hover:bg-[#E0F4EE] text-[#6B5A55] hover:text-[#009770] flex items-center justify-center cursor-pointer"
                  title="Lihat penjelasan informatif"
                >
                  <span className="material-symbols-outlined text-sm">help</span>
                </button>
                <div className="w-8 h-8 rounded-lg bg-[#E0F4EE] flex items-center justify-center text-[#009770]">
                  <span className="material-symbols-outlined text-lg">verified_user</span>
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-[#0A2A22]">
                <AnimatedCounter value={healthyAccountsCount} />
              </span>
              <span className="font-display text-lg text-[#6B5A55] font-medium">/ {totalAccounts} akun</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F3D9CE]/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono-tabular text-xs text-[#009770] font-semibold">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>
                <AnimatedCounter value={parseFloat(healthyPercent)} decimals={1} suffix="% aman terkendali" />
              </span>
            </div>
            {/* Moving Animated Sparkline SVG 4 */}
            <div className="w-24 h-7 relative">
              <svg className="w-full h-full fill-none" viewBox="0 0 100 30">
                <path
                  d="M 5 18 Q 30 15, 55 16 T 95 12"
                  stroke="#009770"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-spark-flow"
                />
                <circle cx="95" cy="12" r="4" fill="#009770" className="animate-ping opacity-75 origin-center" />
                <circle cx="95" cy="12" r="3" fill="#009770" stroke="#FFFFFF" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Middle Section: Live Stream Table (2/3) + Instant Alerts (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2/3): Live Transaction Feed */}
        <section className="lg:col-span-2 bg-white/95 backdrop-blur-md rounded-2xl border border-[#F3D9CE] shadow-xs flex flex-col overflow-hidden">
          {/* Header Umpan */}
          <div className="p-5 border-b border-[#F3D9CE] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-bold text-[#0A2A22]">
                  Umpan Transaksi Langsung
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-[11px] font-bold">
                  <span className={`w-2 h-2 rounded-full ${streamingActive ? 'bg-[#009770] radar-pulse-green' : 'bg-gray-400'}`} />
                  {streamingActive ? 'LIVE' : 'PAUSED'}
                </span>
              </div>
              <span className="font-body text-xs text-[#6B5A55] hidden sm:inline">
                | Telemetri Real-Time
              </span>
            </div>

            {/* Filter buttons & Pause/Play */}
            <div className="flex items-center gap-2">
              <div className="inline-flex p-1 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] text-xs font-mono-tabular">
                {(['Semua', 'Perlu Ditinjau', 'Segera Verifikasi'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterType(tab)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      filterType === tab
                        ? 'bg-white font-semibold text-[#009770] shadow-xs'
                        : 'text-[#6B5A55] hover:text-[#0A2A22]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStreamingActive(!streamingActive)}
                className="w-8 h-8 rounded-lg border border-[#F3D9CE] flex items-center justify-center text-[#6B5A55] hover:text-[#009770] hover:bg-[#E0F4EE] cursor-pointer"
                title={streamingActive ? 'Jeda Stream' : 'Lanjutkan Stream'}
              >
                <span className="material-symbols-outlined text-base">
                  {streamingActive ? 'pause' : 'play_arrow'}
                </span>
              </button>
            </div>
          </div>

          {/* Interactive Transactions Table */}
          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#FFF8F4] z-10 shadow-xs">
                <tr className="border-b border-[#F3D9CE] text-[11px] font-mono-tabular font-semibold uppercase text-[#6B5A55] tracking-wider">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Akun &amp; Anggota</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Skor Risiko</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3D9CE]/60 text-xs">
                {displayedTransactions.slice(0, 10).map((trx) => {
                  const isCritical = trx.status === 'Segera verifikasi';
                  const isReview = trx.status === 'Perlu ditinjau';

                  return (
                    <tr
                      key={trx.id}
                      className={`transition-colors hover:bg-[#F3FAF7] ${
                        isCritical ? 'bg-[#FFEAEA]/60 border-l-4 border-[#CE2F2E]' : isReview ? 'bg-[#FFFDE8]/30 border-l-4 border-[#6B5F00]' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono-tabular text-[#0A2A22] whitespace-nowrap">
                        {trx.timestamp}
                        {isCritical && (
                          <span className="block text-[10px] text-[#CE2F2E] font-medium">Tengah Malam</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0A2A22]">
                          {maskName(trx.memberName, isMasked)}
                        </div>
                        <div className="text-[11px] font-mono-tabular text-[#6B5A55]">
                          {trx.accountId} · {trx.memberId}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-[200px]">
                        <span className="font-medium text-[#0A2A22] block truncate">
                          {trx.description}
                        </span>
                        <span className={`block text-[10px] truncate ${isCritical ? 'text-[#CE2F2E]' : isReview ? 'text-[#6B5F00]' : 'text-[#6B5A55]'}`}>
                          {trx.flagReasons[0] || trx.channel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono-tabular font-bold text-[#0A2A22] whitespace-nowrap">
                        Rp {new Intl.NumberFormat('id-ID').format(trx.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1 w-16">
                          <span
                            className={`font-mono-tabular font-bold text-[11px] ${
                              isCritical ? 'text-[#CE2F2E]' : isReview ? 'text-[#6B5F00]' : 'text-[#009770]'
                            }`}
                          >
                            {trx.finalScore}/100
                          </span>
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isCritical ? 'bg-[#CE2F2E]' : isReview ? 'bg-[#6B5F00]' : 'bg-[#009770]'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, trx.finalScore))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FDE8E8] text-[#CE2F2E] font-mono-tabular font-bold text-[10px] border border-[#CE2F2E]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#CE2F2E] radar-pulse-red" />
                            Segera Verifikasi
                          </span>
                        ) : isReview ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF637] text-[#6B5F00] font-mono-tabular font-bold text-[10px] border border-[#6B5F00]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6B5F00]" />
                            Perlu Ditinjau
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular font-bold text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#009770]" />
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isCritical || isReview ? (
                          <button
                            onClick={() => {
                              onSelectTransaction(trx);
                              onNavigateToQueue();
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono-tabular font-semibold shadow-xs cursor-pointer ${
                              isCritical
                                ? 'bg-[#CE2F2E] text-white hover:bg-[#b51b1f]'
                                : 'bg-[#FFF637] text-[#6B5F00] hover:bg-[#FFE920] border border-[#6B5F00]/40'
                            }`}
                          >
                            Tinjau
                          </button>
                        ) : (
                          <span className="text-[#6B5A55] text-xs font-mono-tabular">Wajar</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Tabel */}
          <div className="p-3 px-5 bg-[#FFF8F4]/70 border-t border-[#F3D9CE] flex items-center justify-between font-mono-tabular text-xs text-[#6B5A55]">
            <span>Menampilkan {Math.min(10, displayedTransactions.length)} dari {transactions.length} transaksi hari ini</span>
            <button
              onClick={onNavigateToQueue}
              className="text-[#009770] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              Buka Semua Antrean Tinjauan
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* Right (1/3): Notifikasi Instan */}
        <aside className="space-y-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#F3D9CE] p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3D9CE]">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-[#0A2A22]">
                  Notifikasi Instan
                </span>
                <span className="w-2 h-2 rounded-full bg-[#CE2F2E] radar-pulse-red" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#FDE8E8] text-[#CE2F2E] font-mono-tabular text-xs font-bold">
                {instantAlerts.length} Kasus
              </span>
            </div>

            {/* Alert items */}
            <div className="mt-4 space-y-3.5">
              {instantAlerts.map((alert, idx) => {
                const isCrit = alert.status === 'Segera verifikasi';
                return (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border-l-4 shadow-xs transition-all ${
                      isCrit
                        ? 'bg-[#FFF2F2] border-l-[#CE2F2E] border-t border-r border-b border-[#F8D2D2]'
                        : 'bg-[#FFFDE8] border-l-[#6B5F00] border-t border-r border-b border-[#EEDC9A]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-mono-tabular font-bold ${
                          isCrit ? 'text-[#CE2F2E]' : 'text-[#6B5F00]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isCrit ? 'emergency' : 'sync_problem'}
                        </span>
                        {isCrit ? 'KRITIS · SEGERA TINDAK' : 'POLA ANOMALI SEDANG'}
                      </span>
                      <span className="text-[10px] font-mono-tabular text-[#6B5A55]">
                        {alert.timestamp}
                      </span>
                    </div>

                    <h4 className="font-display text-sm font-bold text-[#0A2A22] leading-snug">
                      Transaksi Rp {new Intl.NumberFormat('id-ID').format(alert.amount)} ({alert.id})
                    </h4>

                    <p className="text-xs text-[#6B5A55] mt-1 leading-snug">
                      Akun: <span className="font-semibold text-[#0A2A22]">{maskName(alert.memberName, isMasked)}</span> ({alert.accountId}). {alert.flagReasons[0] || 'Perlu evaluasi pengurus.'}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSelectTransaction(alert);
                          onNavigateToQueue();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-white font-mono-tabular text-xs font-semibold shadow-xs flex-1 transition-all cursor-pointer ${
                          isCrit ? 'bg-[#CE2F2E] hover:bg-[#b51b1f]' : 'bg-[#009770] hover:bg-[#008562]'
                        }`}
                      >
                        Tinjau Sekarang
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-[#F3D9CE] text-center">
              <button
                onClick={onNavigateToQueue}
                className="text-[#009770] hover:underline font-mono-tabular font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                Buka Semua Antrean Tinjauan
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* 4. Bottom Section: 7-Day Cooperative Risk Score Trend (Area Chart SVG) */}
      <section className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#F3D9CE] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#F3D9CE]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold text-[#0A2A22]">
                Tren Skor Risiko 7 Hari Koperasi
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-xs font-bold">
                Model Hybrid Isolation Forest + Benford
              </span>
            </div>
            <p className="text-xs text-[#6B5A55] mt-0.5">
              Agregasi anomali transaksi harian terhadap ambang batas kepatuhan KSP Mitra Sejahtera.
            </p>
          </div>

          {/* Compliant telemetry indicators (NO false detection accuracy claims!) */}
          <div className="flex items-center gap-5">
            <div className="text-right">
              <span className="font-mono-tabular text-[#6B5A55] block text-[11px] uppercase">
                Cakupan Surveilans
              </span>
              <span className="font-mono-tabular text-base font-bold text-[#009770]">
                100% Transaksi
              </span>
            </div>
            <div className="h-8 w-px bg-[#F3D9CE]" />
            <div className="text-right">
              <span className="font-mono-tabular text-[#6B5A55] block text-[11px] uppercase">
                Respon Rata-Rata
              </span>
              <span className="font-mono-tabular text-base font-bold text-[#0A2A22]">
                4.2 menit
              </span>
            </div>
          </div>
        </div>

        {/* SVG Area Chart Canvas */}
        <div className="mt-6 relative">
          {/* Floating Tooltip */}
          <div className="absolute right-12 top-6 bg-white border border-[#009770] rounded-xl p-2.5 shadow-lg z-10 pointer-events-none hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#009770]" />
              <span className="font-mono-tabular font-bold text-xs text-[#0A2A22]">
                Hari Ini (Puncak Terkendali)
              </span>
            </div>
            <div className="text-[11px] text-[#6B5A55] mt-1 font-mono-tabular">
              Skor Risiko Koperasi: <strong className="text-[#009770]">28 / 100</strong> (Terkendali)
            </div>
          </div>

          <div className="w-full h-56">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 240">
              <defs>
                <linearGradient id="jadeGradientLive" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#009770" stopOpacity="0.32" />
                  <stop offset="60%" stopColor="#00B386" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#00B386" stopOpacity="0.00" />
                </linearGradient>
                <linearGradient id="thresholdLineLive" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#CE2F2E" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#CE2F2E" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line stroke="#F3D9CE" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="30" y2="30" />
              <line stroke="#F3D9CE" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="90" y2="90" />
              <line stroke="#F3D9CE" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="150" y2="150" />
              <line stroke="#F3D9CE" strokeWidth="1" x1="0" x2="1000" y1="210" y2="210" />

              {/* Threshold line at Score 60 (y=90) */}
              <line stroke="url(#thresholdLineLive)" strokeWidth="1.5" x1="0" x2="1000" y1="90" y2="90" />
              <text className="text-[10px] font-mono-tabular font-semibold" fill="#CE2F2E" x="10" y="84">
                Garis Batas Intervensi Pengurus (Skor 60)
              </text>

              {/* Filled Area Under Curve */}
              <path
                d="M 50 185 C 110 183, 140 178, 200 178 C 260 178, 290 188, 350 188 C 410 188, 440 170, 500 170 C 560 170, 590 176, 650 176 C 710 176, 740 183, 800 183 C 860 183, 900 159, 950 159 L 950 210 L 50 210 Z"
                fill="url(#jadeGradientLive)"
              />

              {/* Moving Real-time Scanning Radar Laser Beam */}
              <line
                x1="0"
                y1="30"
                x2="0"
                y2="210"
                stroke="#00B386"
                strokeWidth="2"
                strokeDasharray="4 2"
                className="animate-[graphScan_5s_ease-in-out_infinite] pointer-events-none"
              />

              {/* Curve Stroke with flowing moving pulse */}
              <path
                d="M 50 185 C 110 183, 140 178, 200 178 C 260 178, 290 188, 350 188 C 410 188, 440 170, 500 170 C 560 170, 590 176, 650 176 C 710 176, 740 183, 800 183 C 860 183, 900 159, 950 159"
                fill="none"
                stroke="#009770"
                strokeLinecap="round"
                strokeWidth="3.5"
                className="animate-spark-flow"
              />

              {/* Point Markers with Live Animated Radar Waves */}
              <circle cx="50" cy="185" fill="#009770" r="4" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="200" cy="178" fill="#009770" r="4" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="350" cy="188" fill="#009770" r="4" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="500" cy="170" fill="#009770" r="4" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="650" cy="176" fill="#009770" r="4" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="800" cy="183" fill="#009770" r="4" stroke="#FFFFFF" strokeWidth="2" />
              
              {/* Today's Peak with Animated Pulsing Waves */}
              <circle cx="950" cy="159" r="14" fill="#009770" className="animate-ping opacity-40 origin-center" />
              <circle cx="950" cy="159" fill="#009770" fillOpacity="0.3" r="9" />
              <circle cx="950" cy="159" fill="#009770" r="5" stroke="#FFFFFF" strokeWidth="2.5" />
            </svg>
          </div>

          {/* Horizontal X Axis */}
          <div className="grid grid-cols-7 text-center pt-2 font-mono-tabular text-xs text-[#6B5A55] font-medium">
            <span>Senin (14)</span>
            <span>Selasa (18)</span>
            <span>Rabu (12)</span>
            <span>Kamis (22)</span>
            <span>Jumat (19)</span>
            <span>Sabtu (15)</span>
            <span className="text-[#009770] font-bold">Hari Ini (28)</span>
          </div>
        </div>
      </section>
    </div>
  );
};
