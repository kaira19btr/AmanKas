/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Account, Transaction } from '../types';
import { BENFORD_THEORETICAL_PERCENT, BENFORD_THEORETICAL, calculateBenford } from '../utils/benford';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { soundEngine } from '../utils/soundEffects';

interface AccountHealthViewProps {
  accounts: Account[];
  transactions: Transaction[];
  onToggleAccountExclusion: (accountId: string) => void;
  onNavigateToQueueWithAccount: (accountId: string) => void;
}

export const AccountHealthView: React.FC<AccountHealthViewProps> = ({
  accounts,
  transactions,
  onToggleAccountExclusion,
  onNavigateToQueueWithAccount,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('#K-104');
  const [accountFilter, setAccountFilter] = useState<'Semua' | 'Anomali' | 'Tinjauan' | 'Sehat'>('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  // Transactions for selected account
  const accountTransactions = transactions.filter((t) => t.accountId === selectedAccount.id);
  const accountAmounts = accountTransactions.map((t) => t.amount);
  const benfordData = calculateBenford(accountAmounts, selectedAccount.isFixedAmount);

  // Actual frequencies in percent
  const actualFrequenciesPercent = benfordData.digitFrequencies.map((f) => Number((f * 100).toFixed(1)));

  // Filter accounts list
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (accountFilter === 'Anomali') return acc.status === 'Anomali Kuat';
    if (accountFilter === 'Tinjauan') return acc.status === 'Mencurigakan';
    if (accountFilter === 'Sehat') return acc.status === 'Wajar' || acc.status === 'Dikecualikan (Nominal Tetap)';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Compliance Banner */}
      <section className="glass-panel rounded-2xl p-4 px-6 flex items-center justify-between border-l-4 border-l-[#CE2F2E] bg-gradient-to-r from-white via-white to-[#FFF6F3]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#FDE8E8] text-[#CE2F2E] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">gavel</span>
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-[#0A2A22]">
              Pedoman Kepatuhan &amp; Ambang Intervensi Otomatis
            </h2>
            <p className="text-xs text-[#6B5A55] mt-0.5 leading-relaxed">
              Jika akun berstatus <span className="font-semibold text-[#CE2F2E]">Anomali Kuat</span>, ambang batas Skor Transaksi pada akun ini otomatis diperketat (diturunkan ke level sensitif). Keputusan pembekuan tetap wewenang penuh pengurus koperasi.
            </p>
          </div>
        </div>
        <div className="hidden xl:flex items-center gap-2">
          <span className="font-mono-tabular text-xs text-[#009770] bg-[#E0F4EE] px-3 py-1.5 rounded-lg border border-[#009770]/30 flex items-center gap-1.5 font-semibold">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            Protokol ISO 27001 Terpantau
          </span>
        </div>
      </section>

      {/* 2. Main 12-Column Grid: Left (4 cols) & Right (8 cols) */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: LIST OF ACCOUNTS (4 COLS)                   */}
        {/* ======================================================== */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Header Card */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-sm font-bold text-[#0A2A22]">Daftar Akun Koperasi</h2>
                <p className="text-xs text-[#6B5A55]">{accounts.length} akun terpantau radar Benford</p>
              </div>
              <span className="font-mono-tabular text-[11px] text-[#6B5A55] bg-[#FFF8F4] px-2.5 py-1 rounded-lg border border-[#F3D9CE]">
                Auto-Sync 5m
              </span>
            </div>

            {/* Quick Search & Filter Chips */}
            <div className="flex flex-col gap-2.5">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[16px] text-[#6B5A55]">
                  filter_list
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari kode atau nama buku kas..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs font-mono-tabular rounded-xl bg-white border border-[#F3D9CE] text-[#0A2A22] placeholder-[#6B5A55] focus:outline-none focus:border-[#009770]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-mono-tabular flex-wrap">
                {(['Semua', 'Anomali', 'Tinjauan', 'Sehat'] as const).map((filter) => {
                  const isActive = accountFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setAccountFilter(filter)}
                      className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#009770] text-white font-semibold'
                          : 'bg-white border border-[#F3D9CE] text-[#6B5A55] hover:text-[#0A2A22]'
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Accounts Cards Stack */}
          <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredAccounts.map((account) => {
              const isSelected = account.id === selectedAccountId;
              const isCritical = account.status === 'Anomali Kuat';
              const isReview = account.status === 'Mencurigakan';
              const isExcluded = account.status === 'Dikecualikan (Nominal Tetap)';

              return (
                <div
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className={`rounded-2xl p-4 transition-all duration-150 cursor-pointer relative ${
                    isSelected
                      ? isCritical
                        ? 'border-2 border-[#CE2F2E] bg-white shadow-md'
                        : 'border-2 border-[#009770] bg-white shadow-md'
                      : 'glass-panel hover:bg-[#F3FAF7]'
                  }`}
                >
                  {/* Top indicator tag if selected */}
                  {isSelected && (
                    <div
                      className={`absolute -top-2.5 right-4 text-white font-mono-tabular text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs ${
                        isCritical ? 'bg-[#CE2F2E]' : 'bg-[#009770]'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      Sedang Ditinjau
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono-tabular text-xs font-bold px-2 py-0.5 rounded ${
                            isCritical
                              ? 'text-[#CE2F2E] bg-[#FDE8E8]'
                              : isReview
                              ? 'text-[#6B5F00] bg-[#FFF637]/40'
                              : 'text-[#6B5A55] bg-[#FFF8F4] border border-[#F3D9CE]'
                          }`}
                        >
                          {account.id}
                        </span>
                        <h3 className="font-display font-semibold text-xs text-[#0A2A22]">
                          {account.name}
                        </h3>
                      </div>
                      <p className="text-[11px] text-[#6B5A55] mt-0.5 leading-tight">
                        {account.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-[#F3D9CE]/50 mt-2">
                    {/* Status Pill */}
                    {isCritical ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FDE8E8] text-[#CE2F2E] font-mono-tabular text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CE2F2E] radar-pulse-red" />
                        Anomali Kuat
                      </div>
                    ) : isReview ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF637] text-[#6B5F00] font-mono-tabular text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6B5F00]" />
                        Mencurigakan
                      </div>
                    ) : isExcluded ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono-tabular text-[10px] font-medium">
                        Dikecualikan
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#009770]" />
                        Wajar / Sehat
                      </div>
                    )}

                    <div className="text-right">
                      <span className="font-mono-tabular text-xs font-bold text-[#0A2A22]">
                        MAD: {account.mad.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: DETAIL BENFORD FOR SELECTED ACCOUNT (8 COLS)*/}
        {/* ======================================================== */}
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* 1. Benford Chart Card */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-[#F3D9CE]">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    selectedAccount.status === 'Anomali Kuat'
                      ? 'bg-[#FDE8E8] text-[#CE2F2E]'
                      : 'bg-[#E0F4EE] text-[#009770]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">analytics</span>
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-[#0A2A22]">
                    Uji Distribusi Digit Pertama (Benford's Law) - {selectedAccount.name}
                  </h2>
                  <p className="text-xs text-[#6B5A55] mt-0.5">
                    Membandingkan frekuensi kemunculan digit pertama pada{' '}
                    <strong className="text-[#0A2A22]">{benfordData.totalValid} transaksi valid</strong> terhadap distribusi logaritmik alami{' '}
                    <code className="font-mono-tabular text-[#009770] bg-[#E0F4EE] px-1 py-0.5 rounded text-[11px]">
                      log10(1 + 1/d)
                    </code>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedAccount.status === 'Anomali Kuat' ? (
                  <span className="px-3 py-1.5 rounded-xl bg-[#FDE8E8] text-[#CE2F2E] font-mono-tabular text-xs font-bold border border-[#CE2F2E]/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#CE2F2E] radar-pulse-red" />
                    Deviasi Kritis Terdeteksi
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-[#E0F4EE] text-[#009770] font-mono-tabular text-xs font-bold border border-[#009770]/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#009770]" />
                    Distribusi Selaras
                  </span>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-3 text-xs">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-[#009770]" />
                  <span className="text-[#0A2A22] font-medium">Distribusi Aktual Normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-[#CE2F2E]" />
                  <span className="text-[#CE2F2E] font-bold">Digit Menyimpang Kritis (Fraud Trigger)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-0.5 bg-[#0A2A22] border-t-2 border-dashed border-[#0A2A22] relative flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[#009770] absolute" />
                  </div>
                  <span className="text-[#0A2A22] font-semibold">Kurva Teoretis Benford Ideal</span>
                </div>
              </div>
              <div className="font-mono-tabular text-[#6B5A55] text-[11px]">
                Toleransi Deviasi: ±2.5%
              </div>
            </div>

            {/* High-Precision Bar Chart Container with Overlay SVG Curve */}
            <div className="relative mt-2 pt-6 pb-2 bg-gradient-to-b from-[#FFF8F4]/60 to-white rounded-xl border border-[#F3D9CE]/60 p-4">
              {/* Background Reference Lines */}
              <div className="absolute inset-x-8 top-6 bottom-14 flex flex-col justify-between pointer-events-none opacity-30">
                <div className="border-b border-[#6B5A55]/30 w-full flex justify-end pr-1">
                  <span className="font-mono-tabular text-[9px] -mt-3">35%</span>
                </div>
                <div className="border-b border-[#6B5A55]/30 w-full flex justify-end pr-1">
                  <span className="font-mono-tabular text-[9px] -mt-3">25%</span>
                </div>
                <div className="border-b border-[#6B5A55]/30 w-full flex justify-end pr-1">
                  <span className="font-mono-tabular text-[9px] -mt-3">15%</span>
                </div>
                <div className="border-b border-[#6B5A55]/50 w-full flex justify-end pr-1">
                  <span className="font-mono-tabular text-[9px] -mt-3">0%</span>
                </div>
              </div>

              {/* Benford Ideal Theoretical Curve SVG Overlay with Moving Laser Scan */}
              <svg
                className="absolute inset-x-4 top-6 w-[calc(100%-2rem)] h-64 pointer-events-none z-10"
                preserveAspectRatio="none"
                viewBox="0 0 900 240"
              >
                {/* Moving Real-time Radar Scan Line */}
                <line
                  x1="0"
                  y1="20"
                  x2="0"
                  y2="220"
                  stroke="#009770"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  className="animate-[graphScan_5s_ease-in-out_infinite]"
                />

                {/* Scaled coordinates for 9 points across width 900, max height 240 (35% scale) */}
                <path
                  d="M 50,33.6 C 100,80 120,105 150,119.3 C 180,135 220,147 250,154.2 C 280,163 320,170 350,173.5 C 380,179 420,183 450,185.8 C 480,190 520,192 550,194.0 C 580,197 620,199 650,200.2 C 680,202 720,204 750,205.0 C 780,206 820,207 850,208.4"
                  fill="none"
                  stroke="#0A2A22"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  strokeWidth="3"
                  className="animate-spark-flow"
                />
                <circle cx="50" cy="33.6" fill="#009770" r="4.5" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="150" cy="119.3" fill="#009770" r="4.5" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="250" cy="154.2" fill="#009770" r="4.5" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="350" cy="173.5" fill="#009770" r="4.5" stroke="#FFFFFF" strokeWidth="2" />
                
                {/* Digit 5 point with anomaly ping */}
                {selectedAccount.id === '#K-104' && (
                  <circle cx="450" cy="185.8" r="10" fill="#CE2F2E" className="animate-ping opacity-45 origin-center" />
                )}
                <circle cx="450" cy="185.8" fill={selectedAccount.id === '#K-104' ? '#CE2F2E' : '#009770'} r="5" stroke="#FFFFFF" strokeWidth="2" />

                <circle cx="550" cy="194.0" fill="#009770" r="4.5" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="650" cy="200.2" fill="#009770" r="4.5" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="750" cy="205.0" fill="#009770" r="4.5" stroke="#FFFFFF" strokeWidth="2" />

                {/* Digit 9 point with anomaly ping */}
                {selectedAccount.id === '#K-104' && (
                  <circle cx="850" cy="208.4" r="10" fill="#CE2F2E" className="animate-ping opacity-45 origin-center" />
                )}
                <circle cx="850" cy="208.4" fill={selectedAccount.id === '#K-104' ? '#CE2F2E' : '#009770'} r="5" stroke="#FFFFFF" strokeWidth="2" />
              </svg>

              {/* 9 Columns Bar Grid */}
              <div className="h-64 grid grid-cols-9 gap-3 items-end px-2 relative z-0">
                {Array.from({ length: 9 }, (_, i) => {
                  const digit = i + 1;
                  const actualPct = actualFrequenciesPercent[i] || 0;
                  const benfordPct = BENFORD_THEORETICAL_PERCENT[i];
                  const diff = actualPct - benfordPct;
                  const isSevereAnomaly = selectedAccount.id === '#K-104' && (digit === 5 || digit === 9);
                  const isElevated = Math.abs(diff) > 3.0;

                  // Height percentage mapped relative to 35% max
                  const heightPercent = Math.min(100, Math.max(4, (actualPct / 35) * 100));

                  return (
                    <div key={digit} className="flex flex-col items-center h-full justify-end group relative">
                      {/* Floating callout for Digit 5 on #K-104 */}
                      {selectedAccount.id === '#K-104' && digit === 5 && (
                        <div className="absolute -top-14 z-30 w-52 -left-16 bg-[#CE2F2E] text-white p-2 rounded-xl text-left shadow-lg border border-white/40 pointer-events-auto">
                          <div className="flex items-center gap-1 font-display text-[10px] font-bold">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            Lonjakan Kritis Digit 5 (+{diff.toFixed(1)}%)
                          </div>
                          <p className="text-[9px] text-white/90 leading-tight mt-0.5">
                            Terindikasi pemecahan berulang Rp500.000 &amp; Rp5.000.000 untuk hindari audit!
                          </p>
                          <div className="absolute -bottom-1.5 left-20 w-3 h-3 bg-[#CE2F2E] rotate-45" />
                        </div>
                      )}

                      {/* Floating callout for Digit 9 on #K-104 */}
                      {selectedAccount.id === '#K-104' && digit === 9 && (
                        <div className="absolute -top-12 z-30 w-48 -left-24 bg-[#0A2A22] text-white p-2 rounded-xl text-left shadow-lg border border-[#CE2F2E] pointer-events-auto">
                          <div className="flex items-center gap-1 font-display text-[10px] font-bold text-[#FFB89F]">
                            <span className="material-symbols-outlined text-[13px] text-[#CE2F2E]">error</span>
                            Ambang Batas Pelaporan
                          </div>
                          <p className="text-[9px] text-white/90 leading-tight mt-0.5">
                            Dominasi transfer nominal Rp9.900.000 tepat di bawah batas lapor.
                          </p>
                          <div className="absolute -bottom-1.5 left-28 w-3 h-3 bg-[#0A2A22] rotate-45 border-r border-b border-[#CE2F2E]" />
                        </div>
                      )}

                      <span
                        className={`font-mono-tabular text-[10px] mb-1 font-semibold ${
                          isSevereAnomaly ? 'text-[#CE2F2E] font-bold' : isElevated ? 'text-[#6B5F00]' : 'text-[#6B5A55]'
                        }`}
                      >
                        <AnimatedCounter value={actualPct} decimals={1} suffix="%" />
                      </span>

                      <div
                        className={`w-full max-w-[42px] rounded-t-lg transition-all duration-200 group-hover:brightness-110 shadow-xs ${
                          isSevereAnomaly ? 'bg-[#CE2F2E]' : isElevated ? 'bg-[#B59C00]' : 'bg-[#009770]'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels & Benford Theoretical Percentages */}
              <div className="grid grid-cols-9 gap-3 pt-3 border-t border-[#F3D9CE] mt-2 text-center">
                {Array.from({ length: 9 }, (_, i) => {
                  const digit = i + 1;
                  const isSevere = selectedAccount.id === '#K-104' && (digit === 5 || digit === 9);
                  return (
                    <div key={digit}>
                      <span
                        className={`font-display text-xs font-bold block ${
                          isSevere ? 'text-[#CE2F2E]' : 'text-[#0A2A22]'
                        }`}
                      >
                        Digit {digit}
                      </span>
                      <span
                        className={`font-mono-tabular text-[10px] ${
                          isSevere ? 'text-[#CE2F2E] font-bold' : 'text-[#6B5A55]'
                        }`}
                      >
                        Benf: {BENFORD_THEORETICAL_PERCENT[i]}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note under chart */}
            <div className="mt-4 p-3 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#6B5A55]">
                <span className="material-symbols-outlined text-[18px] text-[#CE2F2E]">info</span>
                <span>
                  {selectedAccount.status === 'Anomali Kuat'
                    ? 'Deviasi tertinggi terletak pada Digit 5 dan Digit 9 yang menunjukkan indikasi rekayasa manual non-alami.'
                    : 'Pola frekuensi digit pertama mengikuti hukum distribusi Benford secara wajar.'}
                </span>
              </div>
              <button
                onClick={() => onNavigateToQueueWithAccount(selectedAccount.id)}
                className="font-bold text-[#009770] hover:underline flex items-center gap-1 shrink-0 cursor-pointer text-xs"
              >
                Lihat Transaksi Terkait
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* 2. 3 Bento Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Volume Audit */}
            <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#6B5A55] mb-2">
                  <span className="text-[11px] font-semibold tracking-wider uppercase font-mono-tabular">
                    Volume Audit
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-[#E0F4EE] text-[#009770] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">receipt</span>
                  </span>
                </div>
                <span className="text-xs text-[#6B5A55]">Jumlah Transaksi Dianalisis</span>
                <div className="font-display text-2xl font-bold text-[#0A2A22] mt-1 tracking-tight">
                  <AnimatedCounter value={accountAmounts.length} />{' '}
                  <span className="text-xs text-[#6B5A55] font-normal font-mono-tabular">trx</span>
                </div>
              </div>
              <div className="pt-3 border-t border-[#F3D9CE] mt-3 flex items-center justify-between">
                <span className="font-mono-tabular text-[11px] text-[#009770] bg-[#E0F4EE] px-2 py-0.5 rounded font-semibold">
                  ✓ Sampel Valid ({accountAmounts.length >= 30 ? '>30' : '<30'})
                </span>
                <span className="text-[11px] text-[#6B5A55]">Periode Berjalan</span>
              </div>
            </div>

            {/* Card 2: MAD Metric */}
            <div
              className={`glass-panel rounded-2xl p-5 flex flex-col justify-between ${
                selectedAccount.status === 'Anomali Kuat'
                  ? 'border-t-4 border-t-[#CE2F2E]'
                  : 'border-t-4 border-t-[#009770]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[#6B5A55] mb-2">
                  <span
                    className={`text-[11px] font-semibold tracking-wider uppercase font-mono-tabular ${
                      selectedAccount.status === 'Anomali Kuat' ? 'text-[#CE2F2E]' : 'text-[#009770]'
                    }`}
                  >
                    Deviasi Statistik (MAD)
                  </span>
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      selectedAccount.status === 'Anomali Kuat'
                        ? 'bg-[#FDE8E8] text-[#CE2F2E]'
                        : 'bg-[#E0F4EE] text-[#009770]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">stacked_line_chart</span>
                  </span>
                </div>
                <span className="text-xs text-[#6B5A55]">Nilai Mean Absolute Dev.</span>
                <div
                  className={`font-mono-tabular text-2xl font-bold mt-1 tracking-tight ${
                    selectedAccount.status === 'Anomali Kuat' ? 'text-[#CE2F2E]' : 'text-[#009770]'
                  }`}
                >
                  <AnimatedCounter value={selectedAccount.mad} decimals={4} />
                </div>
              </div>
              <div className="pt-3 border-t border-[#F3D9CE] mt-3 flex items-center justify-between">
                <span
                  className={`font-mono-tabular text-[11px] px-2 py-0.5 rounded font-bold ${
                    selectedAccount.status === 'Anomali Kuat'
                      ? 'bg-[#FDE8E8] text-[#CE2F2E]'
                      : 'bg-[#E0F4EE] text-[#009770]'
                  }`}
                >
                  {selectedAccount.status}
                </span>
                <span className="font-mono-tabular text-[11px] text-[#6B5A55]">
                  Ambang &le; 0.0120
                </span>
              </div>
            </div>

            {/* Card 3: Rekomendasi Mitigasi */}
            <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#6B5A55] mb-2">
                  <span className="text-[11px] font-semibold tracking-wider uppercase font-mono-tabular">
                    Tindakan Mitigasi
                  </span>
                  <span className="w-7 h-7 rounded-lg bg-[#FFF8F4] text-[#86513D] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">priority_high</span>
                  </span>
                </div>
                <span className="text-xs text-[#6B5A55]">Rekomendasi Kepatuhan</span>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono-tabular text-xs font-bold ${
                      selectedAccount.status === 'Anomali Kuat'
                        ? 'bg-[#FDE8E8] text-[#CE2F2E]'
                        : 'bg-[#E0F4EE] text-[#009770]'
                    }`}
                  >
                    {selectedAccount.status === 'Anomali Kuat' && (
                      <span className="w-2 h-2 rounded-full bg-[#CE2F2E] radar-pulse-red" />
                    )}
                    {selectedAccount.status}
                  </span>
                </div>
              </div>
              <div className="pt-3 border-t border-[#F3D9CE] mt-3">
                <p className="text-xs text-[#0A2A22] leading-tight font-medium">
                  {selectedAccount.status === 'Anomali Kuat'
                    ? 'Audit fisik buku kas & konfirmasi kwitansi transaksi digit 5 & 9.'
                    : 'Pemeriksaan rutin berkala sesuai jadwal audit internal koperasi.'}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Exclusion Policy Settings Card */}
          <div className="glass-panel rounded-2xl p-6 bg-gradient-to-br from-[#FFF8F4] to-white border border-[#F3D9CE]">
            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-md bg-[#FFDBCF]/50 text-[#86513D] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                  </span>
                  <h3 className="font-display font-bold text-sm text-[#0A2A22]">
                    Pengaturan Pengecualian Audit (Exclusion Policy)
                  </h3>
                </div>

                {/* Working Toggle UI */}
                <div className="flex items-start gap-3 mt-3 p-3.5 bg-white rounded-xl border border-[#F3D9CE] shadow-xs">
                  <div className="pt-0.5">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAccount.isFixedAmount}
                        onChange={() => onToggleAccountExclusion(selectedAccount.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#bccac1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#009770]" />
                    </label>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#0A2A22] block">
                      Kecualikan dari uji Benford's Law (Akun bernominal tetap: angsuran, iuran berkala, atau harga baku operasional)
                    </span>
                    <span className="text-[11px] text-[#6B5A55]">
                      Akun ini saat ini{' '}
                      <strong>
                        {selectedAccount.isFixedAmount
                          ? 'DIKECUALIKAN DARI ALARM (NOMINAL TETAP)'
                          : 'TIDAK DIKECUALIKAN'}
                      </strong>.
                    </span>
                  </div>
                </div>

                {/* Educational Note for Treasurers */}
                <div className="mt-3.5 p-3 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE]/80 text-[#6B5A55] text-xs leading-relaxed">
                  <p>
                    <strong className="text-[#0A2A22]">ℹ️ Mengapa ini penting?</strong> Akun dengan nilai transaksi yang terstandarisasi secara reguler (seperti simpanan wajib bulanan Rp50.000 atau cicilan paket tetap Rp250.000) secara alami tidak mengikuti pola distribusi Benford. Mengaktifkan pengecualian mencegah alarm palsu (<em>false positive</em>) tanpa menurunkan kewaspadaan pada kas bebas.
                  </p>
                </div>
              </div>

              {/* Action Save Buttons */}
              <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto self-end md:self-center">
                <button
                  onClick={() => onToggleAccountExclusion(selectedAccount.id)}
                  className="px-5 py-2.5 rounded-xl border-2 border-[#009770] text-[#009770] font-display text-xs font-bold hover:bg-[#E0F4EE] transition-all cursor-pointer shadow-xs text-center"
                >
                  {selectedAccount.isFixedAmount ? 'Batal Kecualikan Akun' : 'Kecualikan Akun Ini'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
