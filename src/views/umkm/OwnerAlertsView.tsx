/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UmkmTransaction, DecisionStatus } from '../../types';

interface OwnerAlertsViewProps {
  transactions: UmkmTransaction[];
  onMakeDecision: (trxId: string, decision: DecisionStatus, note: string) => void;
}

export const OwnerAlertsView: React.FC<OwnerAlertsViewProps> = ({
  transactions,
  onMakeDecision,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('Perlu Perhatian');
  const [selectedTrx, setSelectedTrx] = useState<UmkmTransaction | null>(null);
  const [ownerNote, setOwnerNote] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Filter alerts
  const alertsList = transactions.filter((t) => {
    if (filterStatus === 'Perlu Perhatian') {
      return t.status !== 'Normal' && t.decisionStatus === 'Menunggu Keputusan';
    }
    if (filterStatus === 'Sudah Selesai') {
      return t.decisionStatus !== 'Menunggu Keputusan';
    }
    return true;
  });

  const active = selectedTrx || alertsList[0] || transactions[0];

  const handleDecision = (decision: DecisionStatus) => {
    if (!active) return;
    onMakeDecision(active.id, decision, ownerNote);
    setSelectedTrx({ ...active, decisionStatus: decision });
    setSavedNotice(`Keputusan "${decision}" telah dicatat di buku harian toko Anda.`);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Contextual Help Header for Owner */}
      <section className="bg-gradient-to-r from-[#031B15] to-[#0A2A22] text-white rounded-2xl p-4 px-6 border-l-4 border-l-[#FFF637] border border-[#FFF637]/30 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
              <span className="material-symbols-outlined text-2xl">notifications_active</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-ui font-semibold text-base text-white">
                  Peringatan Saya &bull; Hal Tidak Wajar di Toko
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40 text-[10px] font-mono font-medium tracking-[0.08em] uppercase">
                  Khusus Pemilik Usaha
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed font-ui font-normal">
                Daftar kejadian tidak lazim yang ditemukan sistem (seperti nota dibatalkan berkali-kali, diskon malam hari, atau penjualan tunai besar tanpa nota). Anda dapat memeriksa dan memutuskan tindakannya sendiri tanpa pihak luar.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono font-medium tracking-[0.04em] text-[#FFF637] bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
            Keputusan Langsung Pemilik (Mandiri)
          </div>
        </div>
      </section>

      {savedNotice && (
        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-mono font-medium animate-fadeIn flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{savedNotice}</span>
        </div>
      )}

      {/* 2. Owner Alerts Layout */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left: Alerts List */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-[#F3D9CE] shadow-xs overflow-hidden">
          <div className="p-4 px-5 border-b border-gray-100 bg-[#FFF8F4] flex items-center justify-between">
            <div className="flex items-center gap-2 font-ui">
              <span className="font-ui font-semibold text-sm text-[#0A2A22]">
                Daftar Peringatan Hari Ini
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono tabular-nums font-bold bg-rose-100 text-rose-800">
                {alertsList.length} hal
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-ui">
              {(['Perlu Perhatian', 'Sudah Selesai', 'Semua'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-ui ${
                    filterStatus === tab
                      ? 'bg-[#0A2A22] text-[#FFF637] font-semibold'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 font-medium'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-[580px] overflow-y-auto">
            {alertsList.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Tidak ada peringatan baru. Semua transaksi tercatat wajar.
              </div>
            ) : (
              alertsList.map((trx, index) => {
                const isSelected = active?.id === trx.id;
                return (
                  <div
                    key={`${trx.id}-${index}`}
                    onClick={() => {
                      setSelectedTrx(trx);
                      setOwnerNote(trx.catatan || '');
                    }}
                    className={`p-4 hover:bg-[#FFF8F4] cursor-pointer transition-all ${
                      isSelected ? 'bg-amber-50/70 border-l-4 border-l-amber-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{trx.id}</span>
                        <span className="text-gray-400">&bull; {trx.jam} WIB</span>
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-gray-100 uppercase text-gray-700">
                          {trx.jenis}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        Skor Risiko {trx.finalScore}/100
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-800">{trx.deskripsi}</div>
                      <div className="font-bold text-sm text-[#0A2A22]">
                        Rp {new Intl.NumberFormat('id-ID').format(trx.nominal)}
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                      <span>{trx.kasirShift} &bull; Metode: {trx.metode.toUpperCase()}</span>
                      <span className="font-bold text-gray-700">
                        Status Struk: {trx.adaStruk ? 'Ada Struk' : 'Tanpa Struk'}
                      </span>
                    </div>

                    {/* Flag explanation in simple words */}
                    {trx.flagReasons.length > 0 && (
                      <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 text-xs">
                        &bull; {trx.flagReasons[0]}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Owner Resolution Worksheet */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-4">
          {active ? (
            <>
              <div className="pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-amber-700">{active.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      active.decisionStatus === 'Wajar'
                        ? 'bg-emerald-100 text-emerald-800'
                        : active.decisionStatus === 'Perlu pemeriksaan lanjut'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {active.decisionStatus}
                  </span>
                </div>
                <h2 className="font-ui font-semibold text-base text-[#0A2A22] mt-1">
                  Keputusan Tindakan Pemilik Usaha
                </h2>
              </div>

              {/* Transaction details card */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-2">
                <div className="flex justify-between text-gray-600 font-ui">
                  <span>Nominal Transaksi:</span>
                  <span className="font-mono tabular-nums font-bold text-gray-900 text-base">
                    Rp {new Intl.NumberFormat('id-ID').format(active.nominal)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Kasir &amp; Shift:</span>
                  <span className="font-semibold text-gray-800">{active.kasirShift}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Metode Pembayaran:</span>
                  <span className="uppercase font-bold text-gray-800">{active.metode}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Struk Penjualan:</span>
                  <span className="font-bold text-gray-800">
                    {active.adaStruk ? 'Tercetak di Mesin POS' : 'Tidak Ada Struk Fisik'}
                  </span>
                </div>
              </div>

              {/* Reasons */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-gray-800">Mengapa Hal Ini Diperingatkan?</span>
                <div className="space-y-1">
                  {active.flagReasons.map((r, i) => (
                    <div key={i} className="p-2 rounded-lg bg-rose-50 text-rose-800 text-[11px] leading-tight">
                      &bull; {r}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hak Klarifikasi Kasir */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                  <span>Tanggapan Pihak Terkait (Klarifikasi Kasir):</span>
                  <span className="text-[10px] text-gray-500 font-normal">Hak Konfirmasi</span>
                </label>
                <input
                  type="text"
                  placeholder="Penjelasan lisan kasir atau staf toko yang bersangkutan..."
                  value={active.tanggapanPihakTerkait || ''}
                  readOnly
                  className="w-full text-xs p-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700"
                />
              </div>

              {/* Owner note */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-700 block">
                  Catatan Anda (Pengingat Pribadi Pemilik):
                </label>
                <textarea
                  rows={2}
                  value={ownerNote}
                  onChange={(e) => setOwnerNote(e.target.value)}
                  placeholder="Contoh: Sudah telepon kasir Dina, nota dibatalkan karena pembeli salah ambil barang..."
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#009770]"
                />

                {/* Mandatory Permanent Sanction Note */}
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed font-ui">
                  <strong>Batas Kewenangan:</strong> Sanksi hanya setelah temuan terkonfirmasi di luar sistem melalui AD/ART dan musyawarah. Sistem SADAR tidak melakukan penindakan atau pemblokiran akses.
                </div>

                {/* 3 Decisions in Plain Owner Terms */}
                <span className="text-[11px] font-bold text-gray-500 block mt-1">
                  Pilih Tindakan Anda:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <button
                    onClick={() => handleDecision('Wajar')}
                    className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    Wajar (Sesuai)
                  </button>
                  <button
                    onClick={() => handleDecision('Perlu dokumen pendukung')}
                    className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    Minta Struk
                  </button>
                  <button
                    onClick={() => handleDecision('Perlu pemeriksaan lanjut')}
                    title="Pemeriksaan fisik langsung oleh pemilik"
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    Periksa Fisik
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400 text-center py-12">
              Pilih salah satu peringatan dari daftar di sebelah kiri.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
