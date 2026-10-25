/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Account, KoperasiTransaction, KoperasiUnit } from '../../types';
import { BENFORD_THEORETICAL_PERCENT, BENFORD_THEORETICAL, calculateBenford } from '../../utils/benford';
import { AnimatedCounter } from '../../components/AnimatedCounter';

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
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  // Transactions for selected account
  const accountTransactions = transactions.filter((t) => t.accountId === selectedAccount?.id || t.akun === selectedAccount?.name);
  const accountAmounts = accountTransactions.map((t) => t.nominal);
  const benfordData = calculateBenford(
    accountAmounts,
    selectedAccount?.isFixedAmount,
    20
  );

  const actualFrequenciesPercent = benfordData.digitFrequencies.map((f) => Number((f * 100).toFixed(1)));

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
                <h1 className="font-display font-bold text-base text-white">
                  Kesehatan Akun Buku Kas &amp; Neraca Koperasi
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#009770]/40 text-[#84F8CA] border border-[#84F8CA]/30 text-[10px] font-mono font-bold">
                  Hukum Benford + Chi-Square + MAD
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                Uji matematis distribusi digit pertama (1 sampai 9) untuk mendeteksi pembulatan disengaja, duplikasi faktur, atau manipulasi buku kas. Akun simpanan nominal tetap (pokok/wajib) dapat dikecualikan dari uji ini.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Visual Heatmap of Koperasi Accounts (Peta Panas Akun Hijau / Kuning / Merah) */}
      <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-sm text-[#0A2A22]">
              Peta Panas Kepatuhan Akun Koperasi
            </h2>
            <p className="text-xs text-gray-500">
              Klasifikasi kepatuhan berdasarkan Nigrini Mean Absolute Deviation (MAD) dan Chi-Square
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono-tabular">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Hijau (Patuh)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Kuning (Deviasi Sedang)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Merah (Perlu Audit)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
          {accounts.map((acc) => {
            const isSelected = acc.id === selectedAccountId;
            const isExcluded = acc.isFixedAmount;
            const badgeBg = isExcluded
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : acc.status === 'Merah'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : acc.status === 'Kuning'
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-emerald-50 border-emerald-300 text-emerald-800';

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
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isExcluded ? 'bg-blue-500' : acc.status === 'Merah' ? 'bg-rose-500' : acc.status === 'Kuning' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                </div>
                <div className="text-xs font-bold text-[#0A2A22] mt-1.5 truncate" title={acc.name}>
                  {acc.name}
                </div>
                <div className="mt-2 text-[10px] font-mono-tabular">
                  {isExcluded ? (
                    <span className="text-blue-700 font-semibold">Nominal Tetap</span>
                  ) : (
                    <div className="flex justify-between text-gray-500">
                      <span>MAD:</span>
                      <span className="font-bold text-gray-800">{acc.mad.toFixed(3)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Deep-Dive Benford Digit Distribution Chart per Selected Account */}
      {selectedAccount && (
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Benford Digit Histogram */}
          <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#009770]">{selectedAccount.id}</span>
                  <h3 className="font-display font-bold text-base text-[#0A2A22]">
                    {selectedAccount.name}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{selectedAccount.description}</p>
              </div>

              {/* Exclusion toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleAccountExclusion(selectedAccount.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono-tabular font-semibold border transition-all cursor-pointer ${
                    selectedAccount.isFixedAmount
                      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {selectedAccount.isFixedAmount ? '✓ Pengecualian Aktif' : 'Terapkan Pengecualian'}
                </button>
              </div>
            </div>

            {/* Digit Frequency Bars */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-mono-tabular text-gray-500 mb-2">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-[#009770]" />
                  <span>Frekuensi Aktual Transaksi</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-amber-400" />
                  <span>Teoretis Hukum Benford (Log(1 + 1/d))</span>
                </span>
              </div>

              <div className="grid grid-cols-9 gap-2 items-end h-64 pt-6 border-b border-gray-200 px-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => {
                  const actualPct = actualFrequenciesPercent[digit - 1] || 0;
                  const theoreticalPct = BENFORD_THEORETICAL_PERCENT[digit - 1] || 0;
                  const maxVal = 40; // max percent scale

                  const actualHeight = Math.min(100, (actualPct / maxVal) * 100);
                  const theoHeight = Math.min(100, (theoreticalPct / maxVal) * 100);

                  return (
                    <div key={digit} className="flex flex-col items-center h-full justify-end group">
                      <div className="text-[10px] font-mono font-bold text-gray-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {actualPct}%
                      </div>
                      <div className="w-full flex items-end justify-center gap-1 h-48">
                        {/* Actual Bar */}
                        <div
                          style={{ height: `${actualHeight}%` }}
                          className={`w-3/5 rounded-t transition-all ${
                            selectedAccount.isFixedAmount
                              ? 'bg-blue-400'
                              : Math.abs(actualPct - theoreticalPct) > 8
                              ? 'bg-rose-500'
                              : 'bg-[#009770]'
                          }`}
                          title={`Digit ${digit}: Aktual ${actualPct}%`}
                        />
                        {/* Theoretical Line/Bar */}
                        <div
                          style={{ height: `${theoHeight}%` }}
                          className="w-1.5 rounded-t bg-amber-400 opacity-80"
                          title={`Digit ${digit}: Teoretis ${theoreticalPct}%`}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-gray-800 mt-2">
                        {digit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Account Audit Notes */}
            <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 leading-relaxed font-mono-tabular">
              <strong className="text-gray-800">Catatan Pengawas:</strong> {selectedAccount.notes || 'Pemeriksaan rutin kepatuhan angka buku kas.'}
            </div>
          </div>

          {/* Account Metrics Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-4">
              <h4 className="font-display font-bold text-sm text-[#0A2A22]">
                Statistik Uji Nigrini
              </h4>

              <div className="space-y-3 font-mono-tabular text-xs">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">Mean Absolute Deviation (MAD):</span>
                  <span className="font-bold text-gray-900">{selectedAccount.mad.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">Nilai Uji Chi-Square (&chi;&sup2;):</span>
                  <span className="font-bold text-gray-900">{selectedAccount.chiSquare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">Total Sampel Transaksi:</span>
                  <span className="font-bold text-[#009770]">{selectedAccount.totalTrx} trx</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">Status Kepatuhan:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      selectedAccount.status === 'Merah'
                        ? 'bg-rose-100 text-rose-800'
                        : selectedAccount.status === 'Kuning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {selectedAccount.status}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigateToQueueWithAccount(selectedAccount.name)}
                className="w-full py-2 px-3 rounded-xl bg-[#0A2A22] text-white text-xs font-bold font-mono-tabular hover:bg-[#009770] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Lihat Transaksi Akun Ini</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {/* Quick guideline box */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span>
                <span>Pedoman Interpretasi Pengawas:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Deviasi MAD &gt; 0.015 menunjukkan angka buatan atau adanya limitasi nominal plafon (misal pinjaman selalu dipecah Rp 9.900.000 untuk menghindari persetujuan pengurus).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tren Indikator Risiko per Unit / Kantor Cabang */}
      <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-4">
        <div>
          <h3 className="font-display font-bold text-sm text-[#0A2A22]">
            Tren Indikator Risiko per Unit / Kantor Cabang KSP
          </h3>
          <p className="text-xs text-gray-500">
            Perbandingan tingkat temuan indikator risiko dan transaksi pihak terkait antar kantor cabang
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {unitStats.map((stat) => (
            <div key={stat.unit} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-[#0A2A22]">{stat.unit}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#009770]/10 text-[#009770]">
                  {stat.totalCount} Transaksi
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono-tabular">
                <div className="flex justify-between text-gray-600">
                  <span>Perputaran Kas:</span>
                  <span className="font-bold text-gray-900">
                    Rp {new Intl.NumberFormat('id-ID').format(stat.totalVolume)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Temuan Indikator:</span>
                  <span className="font-bold text-rose-600">{stat.flaggedCount} indikator</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Pihak Terkait:</span>
                  <span className="font-bold text-purple-700">{stat.relatedCount} transaksi</span>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                  <span>Rasio Risiko Unit:</span>
                  <span className="font-bold">{stat.riskRatio}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    style={{ width: `${stat.riskRatio}%` }}
                    className={`h-full ${
                      stat.riskRatio > 25 ? 'bg-rose-500' : stat.riskRatio > 10 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
