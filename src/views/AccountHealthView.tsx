/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Account, Transaction, AppMode } from '../types';
import { BENFORD_THEORETICAL_PERCENT, BENFORD_THEORETICAL, calculateBenford } from '../utils/benford';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { soundEngine } from '../utils/soundEffects';
import { GradientButton } from '@/components/ui/gradient-button';

interface AccountHealthViewProps {
  accounts: Account[];
  transactions: Transaction[];
  mode: AppMode;
  onToggleAccountExclusion: (accountId: string) => void;
  onNavigateToQueueWithAccount: (accountId: string) => void;
}

export const AccountHealthView: React.FC<AccountHealthViewProps> = ({
  accounts,
  transactions,
  mode,
  onToggleAccountExclusion,
  onNavigateToQueueWithAccount,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '#K-104');
  const [accountFilter, setAccountFilter] = useState<'Semua' | 'Merah' | 'Kuning' | 'Hijau' | 'Volume Kurang'>('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [minVolumeThreshold, setMinVolumeThreshold] = useState<number>(300);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  // Transactions for selected account
  const accountTransactions = transactions.filter((t) => t.accountId === selectedAccount?.id);
  const accountAmounts = accountTransactions.map((t) => t.amount);
  const benfordData = calculateBenford(
    accountAmounts,
    selectedAccount?.isFixedAmount,
    minVolumeThreshold
  );

  // Actual frequencies in percent
  const actualFrequenciesPercent = benfordData.digitFrequencies.map((f) => Number((f * 100).toFixed(1)));

  // Filter accounts list
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (accountFilter === 'Merah') return acc.status === 'Merah';
    if (accountFilter === 'Kuning') return acc.status === 'Kuning';
    if (accountFilter === 'Hijau') return acc.status === 'Hijau' || acc.status === 'Dikecualikan (Nominal Tetap)';
    if (accountFilter === 'Volume Kurang') return acc.status === 'Volume belum cukup';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Compliance Banner */}
      <section className="bg-white/95 backdrop-blur-md rounded-2xl p-4 px-6 flex flex-col md:flex-row items-start md:items-center justify-between border-l-4 border-l-[#009770] border border-[#F3D9CE] shadow-xs gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#E0F4EE] text-[#009770] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">analytics</span>
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-[#0A2A22]">
              Uji Distribusi Digit Pertama (Hukum Benford &amp; Chi-Square)
            </h2>
            <p className="text-xs text-[#6B5A55] mt-0.5 leading-relaxed">
              Mengukur kesesuaian digit pertama angka keuangan alami (1 sampai 9). Akun bernominal tetap seperti angsuran rutin dapat dikecualikan untuk menghindari distorsi statistik.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-[#6B5A55] block">Batas Minimum Volume:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <input
                type="number"
                min="50"
                max="1000"
                step="50"
                value={minVolumeThreshold}
                onChange={(e) => setMinVolumeThreshold(Number(e.target.value) || 300)}
                className="w-16 px-2 py-0.5 rounded border border-[#F3D9CE] font-mono-tabular text-xs font-bold text-[#0A2A22] text-center"
              />
              <span className="text-[10px] font-mono-tabular text-[#86513D] bg-[#FFE9DF] px-2 py-0.5 rounded font-medium">
                asumsi, perlu diverifikasi pada literatur
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main 12-Column Grid */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column: Account Directory (4 cols) */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-[#F3D9CE] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-bold text-[#0A2A22]">
                  {mode === 'koperasi' ? 'Daftar Buku Kas & Akun' : 'Daftar Pos Keuangan UMKM'}
                </h3>
                <p className="text-xs text-[#6B5A55]">{accounts.length} akun terpantau radar Benford</p>
              </div>
              <span className="font-mono-tabular text-[11px] text-[#6B5A55] bg-[#FFF8F4] px-2.5 py-1 rounded-lg border border-[#F3D9CE]">
                Auto-Sync
              </span>
            </div>

            {/* Quick Search & Filter Chips */}
            <div className="flex flex-col gap-2.5">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[16px] text-[#6B5A55]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Cari ID akun atau nama pos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] focus:outline-none focus:border-[#009770] font-sans text-[#0A2A22]"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {(['Semua', 'Merah', 'Kuning', 'Hijau', 'Volume Kurang'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      soundEngine.playClick(600);
                      setAccountFilter(filter);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                      accountFilter === filter
                        ? 'bg-[#009770] text-white shadow-xs'
                        : 'bg-[#FFF8F4] border border-[#F3D9CE] text-[#6B5A55] hover:text-[#0A2A22]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Accounts Scrollable List */}
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
              {filteredAccounts.map((acc) => {
                const isSelected = acc.id === selectedAccountId;
                const isRed = acc.status === 'Merah';
                const isYellow = acc.status === 'Kuning';
                const isLowVol = acc.status === 'Volume belum cukup';
                const isExcluded = acc.isFixedAmount;

                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      soundEngine.playClick(800);
                      setSelectedAccountId(acc.id);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-[#E0F4EE]/50 border-[#009770] shadow-sm'
                        : 'bg-white border-[#F3D9CE] hover:border-[#009770]/40 hover:bg-[#FFF8F4]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-[#0A2A22]">{acc.name}</div>
                        <div className="text-[11px] font-mono-tabular text-[#6B5A55]">{acc.id}</div>
                      </div>
                      <span
                        className={`text-[10px] font-mono-tabular px-2 py-0.5 rounded font-bold ${
                          isExcluded
                            ? 'bg-[#FFF8F4] text-[#6B5A55] border border-[#F3D9CE]'
                            : isLowVol
                            ? 'bg-[#FFE9DF] text-[#86513D]'
                            : isRed
                            ? 'bg-[#FDE8E8] text-[#CE2F2E]'
                            : isYellow
                            ? 'bg-[#FFF637]/40 text-[#86513D]'
                            : 'bg-[#E0F4EE] text-[#009770]'
                        }`}
                      >
                        {acc.status}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#F3D9CE]/50 flex items-center justify-between text-[11px] text-[#6B5A55]">
                      <span>{acc.totalTrx} transaksi</span>
                      <span className="font-mono-tabular">MAD: {acc.mad ? acc.mad.toFixed(4) : '—'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Column: Benford Detail & Chi-Square Analysis (8 cols) */}
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-5">
          {selectedAccount ? (
            <>
              {/* Account Overview Header Card */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-[#F3D9CE] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tabular text-xs font-bold text-[#009770] bg-[#E0F4EE] px-2.5 py-0.5 rounded border border-[#009770]/20">
                      {selectedAccount.id}
                    </span>
                    <h2 className="font-display text-lg font-extrabold text-[#0A2A22]">
                      {selectedAccount.name}
                    </h2>
                  </div>
                  <p className="text-xs text-[#6B5A55] mt-1">
                    Kategori: <strong className="text-[#0A2A22]">{selectedAccount.type}</strong> &bull; Total Transaksi:{' '}
                    <strong className="text-[#0A2A22] font-mono-tabular">{accountTransactions.length} baris</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Fixed Amount Toggle */}
                  <label className="flex items-center gap-2 text-xs text-[#0A2A22] cursor-pointer bg-[#FFF8F4] px-3 py-2 rounded-xl border border-[#F3D9CE] hover:border-[#009770]/40">
                    <input
                      type="checkbox"
                      checked={selectedAccount.isFixedAmount}
                      onChange={() => onToggleAccountExclusion(selectedAccount.id)}
                      className="accent-[#009770] cursor-pointer"
                    />
                    <span className="font-medium">Kecualikan (Nominal Tetap)</span>
                  </label>

                  <button
                    onClick={() => onNavigateToQueueWithAccount(selectedAccount.id)}
                    className="px-3 py-2 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    Tinjau Antrean
                  </button>
                </div>
              </div>

              {/* Status & Diagnostic Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Status Box */}
                <div className="bg-white rounded-2xl p-4 border border-[#F3D9CE] shadow-xs">
                  <span className="text-[11px] font-mono-tabular text-[#6B5A55] uppercase block">
                    Status Uji Benford
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      className={`text-xl font-extrabold font-display ${
                        benfordData.status === 'Merah'
                          ? 'text-[#CE2F2E]'
                          : benfordData.status === 'Kuning'
                          ? 'text-[#86513D]'
                          : benfordData.status === 'Volume belum cukup'
                          ? 'text-[#86513D]'
                          : 'text-[#009770]'
                      }`}
                    >
                      {benfordData.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B5A55] mt-1">{benfordData.conformityLevel}</p>
                </div>

                {/* MAD Box */}
                <div className="bg-white rounded-2xl p-4 border border-[#F3D9CE] shadow-xs">
                  <span className="text-[11px] font-mono-tabular text-[#6B5A55] uppercase block">
                    Nigrini MAD
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono-tabular text-2xl font-extrabold text-[#0A2A22]">
                      {benfordData.mad.toFixed(4)}
                    </span>
                    <span className="text-[10px] text-[#6B5A55]">Ambang: &le;0.012 wajar</span>
                  </div>
                  <p className="text-[11px] text-[#6B5A55] mt-1">Mean Absolute Deviation digit 1-9</p>
                </div>

                {/* Chi-Square Box */}
                <div className="bg-white rounded-2xl p-4 border border-[#F3D9CE] shadow-xs">
                  <span className="text-[11px] font-mono-tabular text-[#6B5A55] uppercase block">
                    Uji Chi-Square (&chi;&sup2;)
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-mono-tabular text-2xl font-extrabold text-[#0A2A22]">
                      {benfordData.chiSquare.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#6B5A55]">df=8 (p: {benfordData.pValue.toFixed(3)})</span>
                  </div>
                  <p className="text-[11px] text-[#6B5A55] mt-1">
                    {benfordData.pValue < 0.05 ? 'Tolak H0 (ada deviasi)' : 'Gagal tolak H0 (konsisten)'}
                  </p>
                </div>
              </div>

              {/* Benford Law Frequency Bar Chart Comparison */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#0A2A22]">
                      Distribusi Digit Pertama: Aktual vs Teoretis Benford
                    </h3>
                    <p className="text-xs text-[#6B5A55]">
                      Membandingkan kemunculan digit pertama angka dengan kurva log10(1 + 1/d)
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-[#009770]"></span>
                      <span className="text-[#0A2A22] font-medium">Aktual</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-[#CE2F2E]/60 border border-dashed border-[#CE2F2E]"></span>
                      <span className="text-[#6B5A55]">Teoretis</span>
                    </div>
                  </div>
                </div>

                {/* Bars Grid */}
                <div className="grid grid-cols-9 gap-3 pt-6 pb-2 items-end min-h-[220px]">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit, idx) => {
                    const actualPct = actualFrequenciesPercent[idx] || 0;
                    const theoPct = BENFORD_THEORETICAL_PERCENT[idx];
                    const deviation = actualPct - theoPct;
                    const maxScale = 40; // Max height reference
                    const actualHeightPct = Math.min(100, (actualPct / maxScale) * 100);
                    const theoHeightPct = Math.min(100, (theoPct / maxScale) * 100);

                    return (
                      <div key={digit} className="flex flex-col items-center gap-2 group">
                        <div className="w-full flex items-end justify-center gap-1 h-44 relative">
                          {/* Theoretical Reference Bar */}
                          <div
                            style={{ height: `${theoHeightPct}%` }}
                            className="w-1/2 bg-[#FDE8E8] border border-dashed border-[#CE2F2E]/40 rounded-t transition-all"
                            title={`Teoretis: ${theoPct}%`}
                          />
                          {/* Actual Bar */}
                          <div
                            style={{ height: `${actualHeightPct}%` }}
                            className={`w-1/2 rounded-t transition-all ${
                              Math.abs(deviation) > 6
                                ? 'bg-[#CE2F2E]'
                                : Math.abs(deviation) > 3
                                ? 'bg-[#86513D]'
                                : 'bg-[#009770]'
                            }`}
                            title={`Aktual: ${actualPct}% (Deviasi: ${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}%)`}
                          />
                        </div>

                        {/* Labels */}
                        <div className="text-center">
                          <span className="font-display font-bold text-xs text-[#0A2A22] block">
                            {digit}
                          </span>
                          <span className="font-mono-tabular text-[10px] text-[#6B5A55] block">
                            {actualPct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] text-xs text-[#6B5A55] flex items-center justify-between">
                  <span>
                    Digit pertama teoretis: <strong>1 (30.1%)</strong>, <strong>2 (17.6%)</strong>, <strong>3 (12.5%)</strong>, hingga <strong>9 (4.6%)</strong>.
                  </span>
                  <span className="font-mono-tabular text-[11px] text-[#009770] font-semibold">
                    {accountTransactions.length < minVolumeThreshold ? (
                      <span className="text-[#86513D]">Diperlukan &ge;{minVolumeThreshold} transaksi untuk kesimpulan stabil</span>
                    ) : (
                      <span>Sampel data memadai ({accountTransactions.length} baris)</span>
                    )}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-[#6B5A55] border border-[#F3D9CE]">
              Pilih akun di sebelah kiri untuk melihat analisis kesehatan Benford.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
