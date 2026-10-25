/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KoperasiTransaction, DecisionStatus, SystemWeights } from '../../types';

interface KoperasiReviewQueueViewProps {
  transactions: KoperasiTransaction[];
  selectedTransaction: KoperasiTransaction | null;
  onSelectTransaction: (trx: KoperasiTransaction) => void;
  onMakeDecision: (trxId: string, decision: DecisionStatus, note: string) => void;
  systemWeights: SystemWeights;
  isMasked: boolean;
}

export const KoperasiReviewQueueView: React.FC<KoperasiReviewQueueViewProps> = ({
  transactions,
  selectedTransaction,
  onSelectTransaction,
  onMakeDecision,
  systemWeights,
  isMasked,
}) => {
  const [filterDecision, setFilterDecision] = useState<string>('Menunggu Keputusan');
  const [supervisorFilter, setSupervisorFilter] = useState<string>('Semua');
  const [reviewNote, setReviewNote] = useState<string>('');

  const supervisors = ['Semua', 'Pengawas · Sari W.', 'Pengawas · Budi H.'];

  // Filter transactions that have risk indicators or need review
  const reviewQueue = transactions.filter((t) => {
    if (filterDecision === 'Semua') return true;
    return t.decisionStatus === filterDecision;
  });

  const filteredQueue = reviewQueue.filter((t) => {
    if (supervisorFilter === 'Semua') return true;
    return t.assignedSupervisor === supervisorFilter;
  });

  const activeTrx = selectedTransaction || filteredQueue[0] || transactions[0];

  return (
    <div className="space-y-6">
      {/* 1. Contextual Help Header for Koperasi Supervisor */}
      <section className="bg-gradient-to-r from-[#031B15] to-[#0A2A22] text-white rounded-2xl p-4 px-6 border-l-4 border-l-[#009770] border border-[#00B386]/30 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#009770]/30 border border-[#84F8CA]/40 flex items-center justify-center text-[#84F8CA]">
              <span className="material-symbols-outlined text-2xl">fact_check</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base text-white">
                  Antrean Pengawas &amp; Verifikasi Indikator Risiko
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#009770]/40 text-[#84F8CA] border border-[#84F8CA]/30 text-[10px] font-mono font-bold">
                  Human-in-the-Loop KSP
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                Penugasan tinjauan bukti fisik dan dokumen pendukung ke Pengawas. Keputusan yang diambil (Wajar, Perlu dokumen pendukung, Perlu pemeriksaan lanjut) mengalibrasi sensitivitas mesin pendeteksi secara transparan.
              </p>
            </div>
          </div>
          <div className="text-xs font-mono-tabular text-gray-300">
            Penugasan Aktif: <strong className="text-[#84F8CA]">Pengawas · Sari W.</strong>
          </div>
        </div>
      </section>

      {/* 2. Review Queue Layout */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column: Queue List */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-[#F3D9CE] shadow-xs overflow-hidden">
          {/* Controls */}
          <div className="p-4 px-5 border-b border-gray-100 bg-[#FFF8F4] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-[#0A2A22]">
                Antrean Tugas Pengawas
              </span>
              <span className="text-xs font-mono-tabular px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                {filteredQueue.length} kasus
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono-tabular">
              <select
                value={filterDecision}
                onChange={(e) => setFilterDecision(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700"
              >
                <option value="Menunggu Keputusan">Menunggu Keputusan</option>
                <option value="Wajar">Dinyatakan Wajar</option>
                <option value="Perlu dokumen pendukung">Perlu Dokumen</option>
                <option value="Perlu pemeriksaan lanjut">Pemeriksaan Lanjut</option>
                <option value="Semua">Semua Riwayat</option>
              </select>

              <select
                value={supervisorFilter}
                onChange={(e) => setSupervisorFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700"
              >
                {supervisors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List items */}
          <div className="divide-y divide-gray-100 max-h-[640px] overflow-y-auto">
            {filteredQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 font-mono-tabular">
                Tidak ada transaksi dengan filter status ini.
              </div>
            ) : (
              filteredQueue.map((trx) => {
                const isSelected = activeTrx?.id === trx.id;
                const isUrgent = trx.status === 'Prioritas tinggi';

                return (
                  <div
                    key={trx.id}
                    onClick={() => {
                      onSelectTransaction(trx);
                      setReviewNote(trx.catatan || '');
                    }}
                    className={`p-4 hover:bg-[#FFF8F4] cursor-pointer transition-all ${
                      isSelected ? 'bg-emerald-50/60 border-l-4 border-l-[#009770]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono-tabular">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0A2A22]">{trx.id}</span>
                        <span className="text-gray-400">&bull; {trx.jam} WIB</span>
                        {trx.isPihakTerkait && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                            Pihak Terkait ({trx.pihakTerkaitLabel})
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isUrgent ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Skor {trx.finalScore}/100
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-800">
                        {trx.akun} &bull; <span className="text-[#009770]">{trx.idAnggotaPseudonim}</span>
                      </div>
                      <div className="font-bold text-sm text-[#0A2A22] font-mono-tabular">
                        Rp {new Intl.NumberFormat('id-ID').format(trx.nominal)}
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500 font-mono-tabular">
                      <span>Unit: {trx.unit} &bull; Petugas: {trx.petugas}</span>
                      <span className="text-purple-700 font-medium">
                        Penugasan: {trx.assignedSupervisor || 'Pengawas · Sari W.'}
                      </span>
                    </div>

                    {/* Flags */}
                    {trx.flagReasons.length > 0 && (
                      <div className="mt-2 text-[11px] text-rose-700 bg-rose-50/70 p-1.5 rounded-lg border border-rose-100 font-mono-tabular truncate">
                        &bull; {trx.flagReasons[0]}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Decision Panel */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-4">
          {activeTrx ? (
            <>
              <div className="pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#009770]">{activeTrx.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTrx.decisionStatus === 'Wajar'
                        ? 'bg-emerald-100 text-emerald-800'
                        : activeTrx.decisionStatus === 'Perlu pemeriksaan lanjut'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {activeTrx.decisionStatus}
                  </span>
                </div>
                <h3 className="font-display font-bold text-base text-[#0A2A22] mt-1">
                  Lembar Kerja Keputusan Pengawas
                </h3>
              </div>

              {/* Transaction Profile */}
              <div className="bg-gray-50 rounded-xl p-3.5 space-y-2 text-xs font-mono-tabular">
                <div className="flex justify-between text-gray-600">
                  <span>Nominal Transaksi:</span>
                  <span className="font-bold text-gray-900 text-sm">
                    Rp {new Intl.NumberFormat('id-ID').format(activeTrx.nominal)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Akun Neraca:</span>
                  <span className="font-semibold text-gray-800">{activeTrx.akun}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Anggota (Pseudonim):</span>
                  <span className="font-bold text-[#009770]">{activeTrx.idAnggotaPseudonim}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Kelengkapan Dokumen:</span>
                  <span className="font-semibold text-gray-800">{activeTrx.statusDokumen}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Unit Kerja:</span>
                  <span>{activeTrx.unit}</span>
                </div>
              </div>

              {/* Red Flag reasons */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-gray-700 font-mono-tabular">
                  Alasan Indikator Terdeteksi:
                </span>
                <div className="space-y-1">
                  {activeTrx.flagReasons.map((reason, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 text-xs font-mono-tabular"
                    >
                      &bull; {reason}
                    </div>
                  ))}
                </div>
              </div>

              {/* Supervisor Notes Input */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-700 block font-mono-tabular">
                  Catatan Klarifikasi &amp; Berita Acara:
                </label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Contoh: Bukti fisik kwitansi telah dicocokkan dengan teller..."
                  className="w-full text-xs font-mono-tabular p-2.5 rounded-xl border border-[#F3D9CE] focus:ring-1 focus:ring-[#009770] focus:outline-none"
                />

                {/* The 3 Required Human Decisions */}
                <span className="text-[11px] font-bold text-gray-500 font-mono-tabular block mt-1">
                  Pilih Keputusan Pengawas:
                </span>
                <div className="grid grid-cols-3 gap-2 font-mono-tabular">
                  <button
                    onClick={() => onMakeDecision(activeTrx.id, 'Wajar', reviewNote)}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Wajar
                  </button>
                  <button
                    onClick={() => onMakeDecision(activeTrx.id, 'Perlu dokumen pendukung', reviewNote)}
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Perlu Dokumen
                  </button>
                  <button
                    onClick={() => onMakeDecision(activeTrx.id, 'Perlu pemeriksaan lanjut', reviewNote)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Periksa Lanjut
                  </button>
                </div>
              </div>

              {/* Dynamic feedback calibration explanation */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-500 font-mono-tabular">
                Keputusan Anda secara otomatis tercatat di log audit terverifikasi dan mengalibrasi bobot sinyal ({systemWeights.ruleWeight}% Aturan / {systemWeights.anomalyWeight}% Anomali).
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400 text-center py-12">
              Pilih transaksi dari antrean sebelah kiri untuk meninjau.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
