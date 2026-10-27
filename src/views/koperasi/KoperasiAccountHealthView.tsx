/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Account, KoperasiTransaction, KoperasiUnit } from '../../types';
import {
  calculateBenford,
  BENFORD_FIRST_PERCENT,
  BENFORD_SECOND_PERCENT,
  NigriniConformityLevel,
} from '../../utils/benford';

interface KoperasiAccountHealthViewProps {
  accounts: Account[];
  transactions: KoperasiTransaction[];
  onToggleAccountExclusion: (accountId: string) => void;
  onNavigateToQueueWithAccount: (accountName: string) => void;
}

export const KoperasiAccountHealthView: React.FC<KoperasiAccountHealthViewProps> = ({
  accounts,
  transactions,
  onToggleAccountExclusion,
  onNavigateToQueueWithAccount,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[3]?.id || accounts[0]?.id);
  const [activeDigitTab, setActiveDigitTab] = useState<'first' | 'second'>('first');

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  // Transactions for selected account
  const accountTransactions = transactions.filter(
    (t) => t.accountId === selectedAccount?.id || t.akun === selectedAccount?.name
  );
  const accountAmounts = accountTransactions.map((t) => t.nominal);
  const benfordData = calculateBenford(
    accountAmounts,
    selectedAccount?.isFixedAmount,
    20 // threshold for prototype demo
  );

  const activeDigitData = activeDigitTab === 'first' ? benfordData.firstDigit : benfordData.secondDigit;

  // Risk indicators trend per unit
  const units: KoperasiUnit[] = ['Cabang Utama', 'Cabang Barat', 'Cabang Timur'];
  const unitStats = units.map((u) => {
    const unitTrx = transactions.filter((t) => t.unit === u);
    const flagged = unitTrx.filter((t) => t.status !== 'Normal');
    const related = unitTrx.filter((t) => t.isPihakTerkait);
    const volume = unitTrx.reduce((acc, t) => acc + t.nominal, 0);
    return {
      unit: u,
      totalCount: unitTrx.length,
      flaggedCount: flagged.length,
      relatedCount: related.length,
      totalVolume: volume,
      riskRatio: unitTrx.length > 0 ? Math.round((flagged.length / unitTrx.length) * 100) : 0,
    };
  });

  const getStatusBadge = (status: string) => {
    if (status.includes('Merah')) {
      return {
        bg: 'bg-rose-50 border-rose-300 text-rose-800',
        icon: 'error',
        dot: 'bg-rose-500',
        label: 'Merah · Risiko tinggi (≥ P98)',
      };
    }
    if (status.includes('Kuning')) {
      return {
        bg: 'bg-amber-50 border-amber-300 text-amber-800',
        icon: 'warning',
        dot: 'bg-amber-500',
        label: 'Kuning · Risiko sedang (≥ P90)',
      };
    }
    if (status.includes('Dikecualikan')) {
      return {
        bg: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: 'block',
        dot: 'bg-blue-500',
        label: 'Dikecualikan (Nominal Tetap)',
      };
    }
    return {
      bg: 'bg-emerald-50 border-emerald-300 text-emerald-800',
      icon: 'check_circle',
      dot: 'bg-emerald-500',
      label: 'Hijau · Risiko rendah',
    };
  };

  return (
    <div className="space-y-6">
      {/* 1. Contextual Help Header for Koperasi Supervisor */}
      <section className="bg-gradient-to-r from-[#031B15] to-[#0A2A22] text-white rounded-2xl p-4 px-6 border-l-4 border-l-[#009770] border border-[#00B386]/30 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#009770]/30 border border-[#84F8CA]/40 flex items-center justify-center text-[#84F8CA]">
              <span className="material-symbols-outlined text-2xl">bar_chart</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-ui font-semibold text-base text-white">
                  Kesehatan Akun Buku Kas &amp; Neraca Koperasi
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#009770]/40 text-[#84F8CA] border border-[#84F8CA]/30 text-[10px] font-mono font-medium uppercase tracking-[0.08em]">
                  Digit Pertama &amp; Kedua &bull; Nigrini (2012)
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed font-ui">
                Uji matematis distribusi digit pertama (1..9) dan digit kedua (0..9) untuk mendeteksi rekayasa pembukuan kas. Status akun diambil dari hasil terburuk di antara kedua digit. Akun nominal tetap (simpanan pokok/wajib) dan akun dengan volume di bawah ambang minimum dikecualikan secara transparan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Visual Heatmap of Koperasi Accounts */}
      <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-3 font-ui">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-ui font-semibold text-sm text-[#0A2A22]">
              Peta Panas Kepatuhan Distribusi Benford Akun Koperasi
            </h2>
            <p className="text-xs text-gray-500">
              Evaluasi ganda digit pertama &amp; kedua berdasarkan ambang Nigrini (2012) MAD &amp; Chi-Square
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono-tabular">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Hijau · Risiko rendah</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Kuning · Risiko sedang (≥ P90)</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-800">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Merah · Risiko tinggi (≥ P98)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
          {accounts.map((acc) => {
            const isSelected = acc.id === selectedAccountId;
            const badge = getStatusBadge(acc.status);

            return (
              <div
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#009770] ring-2 ring-[#009770]/30 shadow-md bg-white'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-tabular font-bold text-gray-500">{acc.id}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`} />
                </div>
                <div className="text-xs font-bold text-[#0A2A22] mt-1.5 truncate" title={acc.name}>
                  {acc.name}
                </div>
                <div className="mt-2 text-[10px] font-mono-tabular">
                  {acc.isFixedAmount ? (
                    <span className="text-blue-700 font-semibold">Nominal Tetap</span>
                  ) : (
                    <div className="flex justify-between text-gray-500">
                      <span>MAD d1/d2:</span>
                      <span className="font-bold text-gray-800">
                        {acc.mad.toFixed(3)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Deep-Dive Benford Dual-Digit Chart & Nigrini Thresholds */}
      {selectedAccount && (
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Benford Digit Histogram */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#009770]">{selectedAccount.id}</span>
                  <h3 className="font-ui font-semibold text-base text-[#0A2A22]">
                    {selectedAccount.name}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{selectedAccount.description}</p>
              </div>

              {/* Exclusion toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleAccountExclusion(selectedAccount.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-ui font-semibold border transition-all cursor-pointer ${
                    selectedAccount.isFixedAmount
                      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {selectedAccount.isFixedAmount ? '✓ Pengecualian Aktif' : 'Terapkan Pengecualian'}
                </button>
              </div>
            </div>

            {/* Dual Digit Tab Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <div className="flex items-center p-1 bg-gray-100 rounded-xl text-xs font-ui">
                <button
                  onClick={() => setActiveDigitTab('first')}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeDigitTab === 'first'
                      ? 'bg-white text-[#0A2A22] shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>Digit Pertama (1..9)</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-700">
                    MAD: {benfordData.firstDigit.mad.toFixed(4)}
                  </span>
                </button>
                <button
                  onClick={() => setActiveDigitTab('second')}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeDigitTab === 'second'
                      ? 'bg-white text-[#0A2A22] shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>Digit Kedua (0..9)</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-700">
                    MAD: {benfordData.secondDigit.mad.toFixed(4)}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#009770]" />
                  <span>Aktual</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-amber-400" />
                  <span>Teoretis Benford</span>
                </span>
              </div>
            </div>

            {/* Digit Frequency Bars */}
            <div className="pt-2">
              <div className={`grid ${activeDigitTab === 'first' ? 'grid-cols-9' : 'grid-cols-10'} gap-2 items-end h-64 pt-6 border-b border-gray-200 px-2`}>
                {activeDigitData.digits.map((digit, idx) => {
                  const actualPct = activeDigitData.observedFrequencies[idx]
                    ? Number((activeDigitData.observedFrequencies[idx] * 100).toFixed(1))
                    : 0;
                  const theoreticalPct = activeDigitData.theoreticalPercents[idx] || 0;
                  const maxVal = activeDigitTab === 'first' ? 38 : 16;

                  const actualHeight = Math.min(100, (actualPct / maxVal) * 100);
                  const theoHeight = Math.min(100, (theoreticalPct / maxVal) * 100);

                  return (
                    <div key={digit} className="flex flex-col items-center h-full justify-end group">
                      <div className="text-[10px] font-mono tabular-nums font-semibold text-gray-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {actualPct}%
                      </div>
                      <div className="w-full flex items-end justify-center gap-1 h-48">
                        {/* Actual Bar */}
                        <div
                          style={{ height: `${actualHeight}%` }}
                          className={`w-3/5 rounded-t transition-all ${
                            selectedAccount.isFixedAmount
                              ? 'bg-blue-400'
                              : Math.abs(actualPct - theoreticalPct) > 6
                              ? 'bg-rose-500'
                              : 'bg-[#009770]'
                          }`}
                          title={`Digit ${digit}: Aktual ${actualPct}% (Teoretis ${theoreticalPct}%)`}
                        />
                        {/* Theoretical Line/Bar */}
                        <div
                          style={{ height: `${theoHeight}%` }}
                          className="w-1.5 rounded-t bg-amber-400 opacity-80"
                          title={`Digit ${digit}: Teoretis ${theoreticalPct}%`}
                        />
                      </div>
                      <span className="text-xs font-mono tabular-nums font-semibold text-gray-800 mt-2">
                        {digit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Account Audit Notes */}
            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 leading-relaxed font-ui">
              <strong className="text-gray-800 font-semibold">Catatan Pengawas:</strong> {selectedAccount.notes || 'Pemeriksaan rutin kepatuhan angka buku kas.'}
            </div>
          </div>

          {/* Account Metrics & Nigrini Explanatory Card */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-4 font-ui">
              <h4 className="font-ui font-semibold text-sm text-[#0A2A22]">
                Statistik Uji Nigrini (2012)
              </h4>

              <div className="space-y-3 font-mono tabular-nums text-xs">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-ui">MAD Digit Pertama (1..9):</span>
                  <span className="font-semibold text-gray-900">{benfordData.firstDigit.mad.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-ui">MAD Digit Kedua (0..9):</span>
                  <span className="font-semibold text-gray-900">{benfordData.secondDigit.mad.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-ui">Chi-Square (&chi;&sup2;) Terpilih:</span>
                  <span className="font-semibold text-gray-900">{activeDigitData.chiSquare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-ui">Total Sampel Transaksi:</span>
                  <span className="font-semibold text-[#009770]">{benfordData.totalValid} trx</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-ui">Status Risiko Akun:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${
                      selectedAccount.status.includes('Merah')
                        ? 'bg-rose-100 text-rose-800'
                        : selectedAccount.status.includes('Kuning')
                        ? 'bg-amber-100 text-amber-800'
                        : selectedAccount.status.includes('Dikecualikan')
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {selectedAccount.status.includes('Merah')
                        ? 'error'
                        : selectedAccount.status.includes('Kuning')
                        ? 'warning'
                        : 'check_circle'}
                    </span>
                    <span>{selectedAccount.status}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigateToQueueWithAccount(selectedAccount.name)}
                className="w-full py-2 px-3 rounded-xl bg-[#0A2A22] text-white text-xs font-semibold hover:bg-[#009770] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Lihat Transaksi Akun Ini</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {/* Explicit Nigrini (2012) Thresholds Explanatory Card */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-2 font-ui">
              <div className="font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-amber-800">menu_book</span>
                <span>Ambang Batas MAD — Nigrini (2012)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Status akun ditentukan dari <strong>yang terburuk</strong> di antara uji Digit Pertama dan Digit Kedua:
              </p>

              <div className="space-y-1.5 text-[10px] font-mono tabular-nums bg-white/70 p-2.5 rounded-xl border border-amber-200/60">
                <div className="font-bold text-gray-700 font-ui text-[11px]">Digit Pertama (1..9):</div>
                <div className="flex justify-between text-gray-600">
                  <span>&le; 0,006: Sangat selaras</span>
                  <span>&le; 0,012: Dapat diterima</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>&le; 0,015: Batas (Kuning)</span>
                  <span className="text-rose-700 font-bold">&gt; 0,015: Tidak selaras (Merah)</span>
                </div>

                <div className="font-bold text-gray-700 font-ui text-[11px] pt-1 border-t border-amber-100">
                  Digit Kedua (0..9):
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>&le; 0,008: Sangat selaras</span>
                  <span>&le; 0,010: Dapat diterima</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>&le; 0,012: Batas (Kuning)</span>
                  <span className="text-rose-700 font-bold">&gt; 0,012: Tidak selaras (Merah)</span>
                </div>
              </div>

              <p className="text-[10px] text-amber-800 leading-normal italic font-ui">
                * Pengecualian akun bernominal tetap (misal simpanan pokok seragam) dan syarat volume minimum (&ge; 300 transaksi) tetap berlaku. Sumber: Nigrini, M. J. (2012). <em>Benford's Law: Applications for Forensic Accounting, Auditing, and Fraud Detection</em>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tren Indikator Risiko per Unit / Kantor Cabang */}
      <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-4 font-ui">
        <div>
          <h3 className="font-ui font-semibold text-sm text-[#0A2A22]">
            Tren Indikator Risiko per Unit / Kantor Cabang KSP
          </h3>
          <p className="text-xs text-gray-500">
            Perbandingan tingkat temuan indikator risiko dan transaksi pihak terkait antar kantor cabang
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {unitStats.map((stat) => (
            <div key={stat.unit} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#0A2A22]">{stat.unit}</span>
                <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                  Rasio Risiko: {stat.riskRatio}%
                </span>
              </div>
              <div className="space-y-1 text-xs text-gray-600 font-mono-tabular">
                <div className="flex justify-between">
                  <span>Total Transaksi:</span>
                  <span className="font-semibold text-gray-900">{stat.totalCount} trx</span>
                </div>
                <div className="flex justify-between">
                  <span>Dengan Indikator:</span>
                  <span className="font-semibold text-rose-700">{stat.flaggedCount} trx</span>
                </div>
                <div className="flex justify-between">
                  <span>Pihak Terkait:</span>
                  <span className="font-semibold text-purple-700">{stat.relatedCount} trx</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1">
                  <span>Total Peredaran:</span>
                  <span className="font-bold text-gray-900">
                    Rp {new Intl.NumberFormat('id-ID').format(stat.totalVolume)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
