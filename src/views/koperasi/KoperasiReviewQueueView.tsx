/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { KoperasiTransaction, DecisionStatus, SystemWeights } from '../../types';

interface KoperasiReviewQueueViewProps {
  transactions: KoperasiTransaction[];
  selectedTransaction: KoperasiTransaction | null;
  onSelectTransaction: (trx: KoperasiTransaction) => void;
  onMakeDecision: (trxId: string, decision: DecisionStatus, note: string, tanggapan?: string) => void;
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
  const [tanggapanPihakTerkait, setTanggapanPihakTerkait] = useState<string>('');

  const supervisors = ['Semua', 'Pengawas · Sari W.', 'Pengawas · Budi H.'];

  // Helper to calculate 48-hour deadline info
  // Seed transactions have timestamps like '2026-10-25 10:14' or '2026-10-24 ...'
  const getDeadlineInfo = (trx: KoperasiTransaction) => {
    // Determine age in hours from transaction timestamp (simulate relative to 2026-10-26 14:00)
    let elapsedHours = 12; // default
    if (trx.tanggal) {
      if (trx.tanggal.includes('2026-10-24')) {
        elapsedHours = 52; // Overdue
      } else if (trx.tanggal.includes('2026-10-25')) {
        elapsedHours = 28;
      } else {
        elapsedHours = 8;
      }
    }
    // Also simulate specific overdue transactions if marked or based on ID
    if (trx.id.includes('405') || trx.id.includes('804') || trx.id.includes('242')) {
      elapsedHours = 54;
    }

    const isOverdue = elapsedHours >= 48;
    const remainingHours = Math.max(0, 48 - elapsedHours);

    return {
      elapsedHours,
      remainingHours,
      isOverdue,
    };
  };

  // Filter transactions that need review
  const reviewQueue = useMemo(() => {
    return transactions.filter((t) => {
      if (filterDecision === 'Semua') return true;
      return t.decisionStatus === filterDecision;
    });
  }, [transactions, filterDecision]);

  const filteredQueue = useMemo(() => {
    const list = reviewQueue.filter((t) => {
      if (supervisorFilter === 'Semua') return true;
      return t.assignedSupervisor === supervisorFilter;
    });

    // Sort: items that exceeded 48h deadline are placed AT THE TOP
    return [...list].sort((a, b) => {
      const aInfo = getDeadlineInfo(a);
      const bInfo = getDeadlineInfo(b);

      const aIsHighRisk = a.status.includes('Merah') || a.status.includes('Kuning') || a.status === 'Prioritas tinggi';
      const bIsHighRisk = b.status.includes('Merah') || b.status.includes('Kuning') || b.status === 'Prioritas tinggi';

      const aOverdueScore = (aIsHighRisk && aInfo.isOverdue) ? 100 : 0;
      const bOverdueScore = (bIsHighRisk && bInfo.isOverdue) ? 100 : 0;

      if (aOverdueScore !== bOverdueScore) {
        return bOverdueScore - aOverdueScore; // Overdue items sorted to the top
      }
      return b.finalScore - a.finalScore;
    });
  }, [reviewQueue, supervisorFilter]);

  const activeTrx = selectedTransaction || filteredQueue[0] || transactions[0];
  const activeDeadline = activeTrx ? getDeadlineInfo(activeTrx) : null;

  const handleSelect = (trx: KoperasiTransaction) => {
    onSelectTransaction(trx);
    setReviewNote(trx.catatan || '');
    setTanggapanPihakTerkait(trx.tanggapanPihakTerkait || '');
  };

  const handleSubmitDecision = (decision: DecisionStatus) => {
    if (!activeTrx) return;
    onMakeDecision(activeTrx.id, decision, reviewNote, tanggapanPihakTerkait);
  };

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
                <h1 className="font-ui font-semibold text-base text-white">
                  Antrean Pengawas &amp; Verifikasi Indikator Risiko
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#009770]/40 text-[#84F8CA] border border-[#84F8CA]/30 text-[10px] font-mono font-medium tracking-[0.08em] uppercase">
                  Batas Waktu 48 Jam &bull; Hak Klarifikasi
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed font-ui">
                Penugasan tinjauan bukti fisik transaksi berkategori risiko sedang (Kuning) dan tinggi (Merah). Peringatan yang melewati batas 48 jam otomatis diurutkan ke atas. Status Merah memicu pemeriksaan lanjut oleh Pengawas Senior; sanksi hanya berlaku di luar sistem melalui AD/ART dan forum RAT.
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-gray-300">
            Penugasan Aktif: <strong className="text-[#84F8CA]">Pengawas · Sari W.</strong>
          </div>
        </div>
      </section>

      {/* 2. Review Queue Layout */}
      <div className="grid grid-cols-12 gap-6 items-start font-ui">
        {/* Left Column: Queue List */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-[#F3D9CE] shadow-xs overflow-hidden">
          {/* Controls */}
          <div className="p-4 px-5 border-b border-gray-100 bg-[#FFF8F4] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-ui font-semibold text-sm text-[#0A2A22]">
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
          <div className="divide-y divide-gray-100 max-h-[660px] overflow-y-auto">
            {filteredQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 font-mono-tabular">
                Tidak ada transaksi dengan filter status ini.
              </div>
            ) : (
              filteredQueue.map((trx, index) => {
                const isSelected = activeTrx?.id === trx.id;
                const deadline = getDeadlineInfo(trx);
                const isHighRisk = trx.status.includes('Merah') || trx.status === 'Prioritas tinggi';

                return (
                  <div
                    key={`${trx.id}-${index}`}
                    onClick={() => handleSelect(trx)}
                    className={`p-4 hover:bg-[#FFF8F4] cursor-pointer transition-all ${
                      isSelected ? 'bg-emerald-50/60 border-l-4 border-l-[#009770]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono-tabular">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#0A2A22]">{trx.id}</span>
                        <span className="text-gray-400">&bull; {trx.jam} WIB</span>
                        {trx.isPihakTerkait && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                            Pihak Terkait ({trx.pihakTerkaitLabel})
                          </span>
                        )}

                        {/* 48-Hour Deadline Process Badge (Separate from risk status) */}
                        {deadline.isOverdue ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white flex items-center gap-1 shadow-xs animate-pulse">
                            <span className="material-symbols-outlined text-xs">timer_off</span>
                            <span>Melewati 48 jam</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            <span>Sisa {deadline.remainingHours}j</span>
                          </span>
                        )}
                      </div>

                      {/* Risk Badge with Icon + Text */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                          isHighRisk
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {isHighRisk ? 'error' : 'warning'}
                        </span>
                        <span>
                          {isHighRisk ? 'Merah · Risiko tinggi (≥ P98)' : 'Kuning · Risiko sedang (≥ P90)'}
                        </span>
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between">
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
                  <div className="flex items-center gap-1.5">
                    {activeDeadline?.isOverdue && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                        Melewati 48 jam
                      </span>
                    )}
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
                </div>
                <h3 className="font-ui font-semibold text-base text-[#0A2A22] mt-1">
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

              {/* REQUIRED: Hak Klarifikasi (Tanggapan Pihak Terkait) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-gray-800 flex items-center justify-between font-mono-tabular">
                  <span>Tanggapan Pihak Terkait (Hak Klarifikasi):</span>
                  <span className="text-[10px] text-gray-500 font-normal">Sesuai Prinsip Keadilan &amp; UU PDP</span>
                </label>
                <textarea
                  rows={2}
                  value={tanggapanPihakTerkait}
                  onChange={(e) => setTanggapanPihakTerkait(e.target.value)}
                  placeholder="Keterangan lisan/tertulis dari kasir, anggota, atau pengelola yang diklarifikasi..."
                  className="w-full text-xs font-mono-tabular p-2.5 rounded-xl border border-gray-300 bg-white focus:ring-1 focus:ring-[#009770] focus:outline-none"
                />
              </div>

              {/* Supervisor Notes Input */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-700 block font-mono-tabular">
                  Catatan Klarifikasi &amp; Berita Acara Pengawas:
                </label>
                <textarea
                  rows={2}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Contoh: Bukti fisik kwitansi telah dicocokkan dengan kasir unit..."
                  className="w-full text-xs font-mono-tabular p-2.5 rounded-xl border border-[#F3D9CE] focus:ring-1 focus:ring-[#009770] focus:outline-none"
                />

                {/* The 3 Required Human Decisions (Red Status Triggers ONLY Senior Review) */}
                <span className="text-[11px] font-bold text-gray-500 font-mono-tabular block mt-1">
                  Pilih Keputusan Pengawas:
                </span>
                <div className="grid grid-cols-3 gap-2 font-mono-tabular">
                  <button
                    onClick={() => handleSubmitDecision('Wajar')}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Wajar
                  </button>
                  <button
                    onClick={() => handleSubmitDecision('Perlu dokumen pendukung')}
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Perlu Dokumen
                  </button>
                  <button
                    onClick={() => handleSubmitDecision('Perlu pemeriksaan lanjut')}
                    title="Memicu pemeriksaan lanjut oleh Pengawas Senior"
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Pemeriksaan Lanjut
                  </button>
                </div>
              </div>

              {/* MANDATORY PERMANENT SANCTION NOTE */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-300/70 text-xs text-amber-900 space-y-1 font-ui">
                <div className="font-bold flex items-center gap-1 text-[11px] text-amber-950">
                  <span className="material-symbols-outlined text-sm text-amber-800">gavel</span>
                  <span>Batas Kewenangan Pengendalian Internal:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900 font-medium">
                  Sanksi hanya setelah temuan terkonfirmasi di luar sistem melalui AD/ART dan RAT.
                </p>
                <p className="text-[10px] text-amber-800 leading-normal">
                  Sistem SADAR tidak memiliki kewenangan menonaktifkan akun pengurus atau meneruskan data ke aparat. Status Merah hanya memicu penugasan pemeriksaan fisik lanjutan oleh Pengawas Senior.
                </p>
              </div>

              {/* Dynamic feedback calibration explanation */}
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-500 font-mono-tabular">
                Keputusan dicatat pada log audit berantai hash (append-only, tamper-evident) dan mengalibrasi bobot sinyal ({systemWeights.ruleWeight}% Aturan / {systemWeights.anomalyWeight}% Anomali).
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
