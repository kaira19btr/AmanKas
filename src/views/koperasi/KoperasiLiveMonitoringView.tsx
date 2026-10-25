/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KoperasiTransaction, KoperasiAccountType, KoperasiUnit } from '../../types';
import { AnimatedCounter } from '../../components/AnimatedCounter';
import { SadarText } from '../../components/SadarText';

interface KoperasiLiveMonitoringViewProps {
  transactions: KoperasiTransaction[];
  onSelectTransaction: (trx: KoperasiTransaction) => void;
  onNavigateToQueue: () => void;
  onNavigateToHealth: () => void;
  isMasked: boolean;
  streamingActive: boolean;
  setStreamingActive: (active: boolean) => void;
}

export const KoperasiLiveMonitoringView: React.FC<KoperasiLiveMonitoringViewProps> = ({
  transactions,
  onSelectTransaction,
  onNavigateToQueue,
  onNavigateToHealth,
  isMasked,
  streamingActive,
  setStreamingActive,
}) => {
  const [accountFilter, setAccountFilter] = useState<string>('Semua');
  const [unitFilter, setUnitFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const accountsList: KoperasiAccountType[] = [
    'Simpanan Pokok',
    'Simpanan Wajib',
    'Simpanan Sukarela',
    'Pinjaman Anggota',
    'Angsuran Pinjaman',
    'Kas Operasional',
    'Biaya Operasional',
  ];

  const unitsList: KoperasiUnit[] = ['Cabang Utama', 'Cabang Barat', 'Cabang Timur'];

  const filteredTransactions = transactions.filter((t) => {
    if (accountFilter !== 'Semua' && t.akun !== accountFilter) return false;
    if (unitFilter !== 'Semua' && t.unit !== unitFilter) return false;
    if (statusFilter !== 'Semua' && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        t.id.toLowerCase().includes(q) ||
        t.idAnggotaPseudonim.toLowerCase().includes(q) ||
        t.petugas.toLowerCase().includes(q) ||
        t.akun.toLowerCase().includes(q) ||
        t.nominal.toString().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalVol = transactions.reduce((acc, t) => acc + t.nominal, 0);
  const urgentCount = transactions.filter((t) => t.status === 'Prioritas tinggi').length;
  const reviewCount = transactions.filter((t) => t.status === 'Perlu ditinjau').length;
  const relatedCount = transactions.filter((t) => t.isPihakTerkait).length;

  return (
    <div className="space-y-6">
      {/* 1. Contextual Help Header for Koperasi Supervisor */}
      <section className="bg-gradient-to-r from-[#031B15] to-[#0A2A22] text-white rounded-2xl p-4 px-6 border-l-4 border-l-[#009770] border border-[#00B386]/30 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#009770]/30 border border-[#84F8CA]/40 flex items-center justify-center text-[#84F8CA]">
              <span className="material-symbols-outlined text-2xl">account_balance</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base text-white">
                  Pemantauan Langsung Buku Kas &amp; Simpan Pinjam
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#009770]/40 text-[#84F8CA] border border-[#84F8CA]/30 text-[10px] font-mono font-bold">
                  Mode Koperasi
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                Umpan data transaksi real-time seluruh kantor unit. Membantu Pengawas dan Pengurus memantau kepatuhan buku kas, simpanan, dan penyaluran pinjaman anggota sebelum bahan RAT disusun.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={() => setStreamingActive(!streamingActive)}
              className={`px-3 py-1.5 rounded-xl font-mono-tabular text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                streamingActive
                  ? 'bg-[#009770]/30 text-[#84F8CA] border-[#84F8CA]/40 hover:bg-[#009770]/50'
                  : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/15'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${streamingActive ? 'bg-[#84F8CA] radar-pulse-green' : 'bg-gray-400'}`} />
              <span>{streamingActive ? 'Streaming Aktif' : 'Streaming Dijeda'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Top Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-4 border border-[#F3D9CE] shadow-xs hover:border-[#009770] transition-all">
          <div className="flex items-center justify-between text-xs text-[#6B5A55] font-mono-tabular">
            <span>Volume Buku Kas Hari Ini</span>
            <span className="material-symbols-outlined text-[#009770] text-lg">receipt_long</span>
          </div>
          <div className="text-xl font-bold font-display text-[#0A2A22] mt-1">
            Rp <AnimatedCounter value={totalVol} />
          </div>
          <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-[#009770]">{transactions.length} transaksi</span>
            <span>tercatat di semua unit</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-4 border border-[#F3D9CE] shadow-xs hover:border-[#CE2F2E] transition-all">
          <div className="flex items-center justify-between text-xs text-[#6B5A55] font-mono-tabular">
            <span>Prioritas Tinggi</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#CE2F2E] radar-pulse-red" />
          </div>
          <div className="text-xl font-bold font-display text-[#CE2F2E] mt-1">
            {urgentCount} Kasus
          </div>
          <div className="text-[11px] text-gray-500 mt-1 flex items-center justify-between">
            <span>Perlu dokumen pendukung</span>
            <button
              onClick={onNavigateToQueue}
              className="text-[#009770] font-semibold hover:underline cursor-pointer"
            >
              Buka Antrean &rarr;
            </button>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-4 border border-[#F3D9CE] shadow-xs hover:border-[#B38300] transition-all">
          <div className="flex items-center justify-between text-xs text-[#6B5A55] font-mono-tabular">
            <span>Perlu Ditinjau</span>
            <span className="material-symbols-outlined text-[#B38300] text-lg">rule</span>
          </div>
          <div className="text-xl font-bold font-display text-[#B38300] mt-1">
            {reviewCount} Transaksi
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Deviasi wajar dalam verifikasi berkas
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-4 border border-[#F3D9CE] shadow-xs hover:border-[#6C47FF] transition-all">
          <div className="flex items-center justify-between text-xs text-[#6B5A55] font-mono-tabular">
            <span>Pihak Terkait (Hipotesis)</span>
            <span className="material-symbols-outlined text-[#6C47FF] text-lg">supervised_user_circle</span>
          </div>
          <div className="text-xl font-bold font-display text-[#6C47FF] mt-1">
            {relatedCount} Transaksi
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Pengurus, pengawas, atau afiliasi
          </div>
        </div>
      </div>

      {/* 3. Filter Controls: Akun, Unit/Kantor, Status, Search */}
      <div className="bg-white rounded-2xl p-4 border border-[#F3D9CE] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Akun Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#0A2A22] font-mono-tabular mr-1">Filter Akun:</span>
            <button
              onClick={() => setAccountFilter('Semua')}
              className={`px-3 py-1 rounded-full text-xs font-mono-tabular transition-all cursor-pointer ${
                accountFilter === 'Semua'
                  ? 'bg-[#009770] text-white font-bold shadow-xs'
                  : 'bg-gray-100 text-[#0A2A22] hover:bg-gray-200'
              }`}
            >
              Semua Akun
            </button>
            {accountsList.map((acc) => (
              <button
                key={acc}
                onClick={() => setAccountFilter(acc)}
                className={`px-2.5 py-1 rounded-full text-xs font-mono-tabular transition-all cursor-pointer ${
                  accountFilter === acc
                    ? 'bg-[#009770] text-white font-bold shadow-xs'
                    : 'bg-gray-100 text-[#6B5A55] hover:bg-gray-200'
                }`}
              >
                {acc}
              </button>
            ))}
          </div>

          {/* Quick Health Link */}
          <button
            onClick={onNavigateToHealth}
            className="text-xs font-semibold text-[#009770] hover:text-[#0A2A22] flex items-center gap-1 cursor-pointer font-mono-tabular"
          >
            <span>Kesehatan Benford Akun</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          {/* Unit / Kantor Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0A2A22] font-mono-tabular">Unit/Kantor:</span>
            <button
              onClick={() => setUnitFilter('Semua')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono-tabular cursor-pointer ${
                unitFilter === 'Semua' ? 'bg-[#0A2A22] text-white font-bold' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Semua Unit
            </button>
            {unitsList.map((u) => (
              <button
                key={u}
                onClick={() => setUnitFilter(u)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono-tabular cursor-pointer ${
                  unitFilter === u ? 'bg-[#0A2A22] text-white font-bold' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Status Filter & Search */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-mono-tabular px-2.5 py-1 rounded-lg border border-[#F3D9CE] bg-white text-gray-700"
            >
              <option value="Semua">Semua Status</option>
              <option value="Prioritas tinggi">Prioritas Tinggi</option>
              <option value="Perlu ditinjau">Perlu Ditinjau</option>
              <option value="Normal">Normal</option>
            </select>
            <input
              type="text"
              placeholder="Cari ID, anggota, petugas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs font-mono-tabular px-3 py-1 rounded-lg border border-[#F3D9CE] bg-white text-gray-800 placeholder-gray-400 w-44"
            >
            </input>
          </div>
        </div>
      </div>

      {/* 4. Transactions Feed Table */}
      <div className="bg-white rounded-2xl border border-[#F3D9CE] shadow-xs overflow-hidden">
        <div className="p-4 px-6 border-b border-[#F3D9CE] flex items-center justify-between bg-gradient-to-r from-[#FFF8F4] to-white">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm text-[#0A2A22]">
              Umpan Transaksi Buku Kas Koperasi
            </span>
            <span className="text-xs font-mono-tabular text-gray-500">
              ({filteredTransactions.length} baris ditampilkan)
            </span>
          </div>
          <div className="text-xs text-gray-500 font-mono-tabular flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#009770]" />
            <span>Format Data: Buku Kas &amp; Simpan Pinjam KSP</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-[#F3D9CE] text-[#6B5A55] font-mono-tabular uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Waktu &amp; ID</th>
                <th className="py-3 px-4">Akun Koperasi</th>
                <th className="py-3 px-4">ID Anggota</th>
                <th className="py-3 px-4">Unit / Kantor</th>
                <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3 px-4">Dokumen</th>
                <th className="py-3 px-4 text-center">Skor Risiko</th>
                <th className="py-3 px-4">Status &amp; Indikator</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono-tabular">
              {filteredTransactions.map((trx) => {
                const isHighRisk = trx.status === 'Prioritas tinggi';
                const isMediumRisk = trx.status === 'Perlu ditinjau';

                return (
                  <tr
                    key={trx.id}
                    className={`hover:bg-[#FFF8F4] transition-colors cursor-pointer ${
                      trx.isPihakTerkait ? 'bg-purple-50/40' : ''
                    }`}
                    onClick={() => onSelectTransaction(trx)}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-[#0A2A22]">{trx.id}</div>
                      <div className="text-[11px] text-gray-400">{trx.jam} WIB</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">{trx.akun}</div>
                      <div className="text-[10px] text-gray-400">Petugas: {trx.petugas}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#009770] flex items-center gap-1.5">
                        <span>{trx.idAnggotaPseudonim}</span>
                        {trx.isPihakTerkait && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200"
                            title="Hipotesis Kerja: Melibatkan Pihak Terkait Pengurus/Pengawas"
                          >
                            {trx.pihakTerkaitLabel || 'Terkait'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {isMasked ? trx.namaAnggotaMasked : 'Bpk. Hendro Prayogo'}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px]">
                        {trx.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#0A2A22] whitespace-nowrap">
                      Rp {new Intl.NumberFormat('id-ID').format(trx.nominal)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          trx.statusDokumen === 'Lengkap'
                            ? 'bg-emerald-100 text-emerald-800'
                            : trx.statusDokumen === 'Menunggu Verifikasi'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {trx.statusDokumen}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          isHighRisk
                            ? 'bg-[#CE2F2E] text-white shadow-xs'
                            : isMediumRisk
                            ? 'bg-[#B38300] text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {trx.finalScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      {trx.flagReasons.length > 0 ? (
                        <div className="space-y-0.5">
                          {trx.flagReasons.slice(0, 1).map((r, i) => (
                            <div key={i} className="text-[11px] text-gray-700 leading-tight truncate" title={r}>
                              &bull; {r}
                            </div>
                          ))}
                          {trx.flagReasons.length > 1 && (
                            <span className="text-[10px] text-gray-400">
                              +{trx.flagReasons.length - 1} indikator lain
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Pola transaksi normal</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(trx);
                        }}
                        className="px-2.5 py-1 rounded bg-[#0A2A22] text-white text-[11px] font-bold hover:bg-[#009770] transition-colors cursor-pointer"
                      >
                        Tinjau
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
