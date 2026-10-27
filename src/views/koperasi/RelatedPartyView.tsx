/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KoperasiTransaction } from '../../types';

interface RelatedPartyViewProps {
  transactions: KoperasiTransaction[];
  onSelectTransaction: (trx: KoperasiTransaction) => void;
  onMakeDecision: (trxId: string, decision: any, note: string) => void;
  isMasked: boolean;
}

export const RelatedPartyView: React.FC<RelatedPartyViewProps> = ({
  transactions,
  onSelectTransaction,
  onMakeDecision,
  isMasked,
}) => {
  const [filterRole, setFilterRole] = useState<'Semua' | 'Pengurus' | 'Pengawas' | 'Afiliasi Keluarga'>('Semua');
  const [selectedTrx, setSelectedTrx] = useState<KoperasiTransaction | null>(null);
  const [workHypothesisNote, setWorkHypothesisNote] = useState<string>('');

  // Filter only related party transactions
  const relatedTransactions = transactions.filter((t) => t.isPihakTerkait);
  const filteredList = relatedTransactions.filter((t) => {
    if (filterRole === 'Semua') return true;
    return t.pihakTerkaitLabel === filterRole;
  });

  const totalRelatedVolume = relatedTransactions.reduce((acc, t) => acc + t.nominal, 0);
  const pengurusVolume = relatedTransactions
    .filter((t) => t.pihakTerkaitLabel === 'Pengurus')
    .reduce((acc, t) => acc + t.nominal, 0);
  const pengawasVolume = relatedTransactions
    .filter((t) => t.pihakTerkaitLabel === 'Pengawas')
    .reduce((acc, t) => acc + t.nominal, 0);
  const familyVolume = relatedTransactions
    .filter((t) => t.pihakTerkaitLabel === 'Afiliasi Keluarga')
    .reduce((acc, t) => acc + t.nominal, 0);

  const activeTrx = selectedTrx || filteredList[0];

  return (
    <div className="space-y-6">
      {/* 1. Contextual Help Header with Mandatory "Hipotesis Kerja" Label */}
      <section className="bg-gradient-to-r from-[#031B15] to-[#0A2A22] text-white rounded-2xl p-4 px-6 border-l-4 border-l-[#84F8CA] border border-[#00B386]/30 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <span className="material-symbols-outlined text-2xl">supervised_user_circle</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-ui font-semibold text-base text-white">
                  Pemantauan Transaksi Pihak Terkait
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px] font-mono font-medium tracking-[0.08em] uppercase">
                  Hipotesis Kerja
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed font-ui">
                Pengawasan transaksi yang melibatkan Pengurus, Pengawas, atau pihak terafiliasi. Label <strong>"Hipotesis Kerja"</strong> menegaskan bahwa temuan awal adalah bahan verifikasi dokumen dan bukan penetapan kesalahan.
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-purple-900/40 border border-purple-400/30 text-[11px] font-mono text-purple-200 shrink-0">
            Asas Praduga Tak Bersalah &bull; UU 25/1992
          </div>
        </div>
      </section>

      {/* 2. Comparative Exposure Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-ui">
        <div className="bg-white rounded-2xl p-4 border border-[#F3D9CE] shadow-xs">
          <div className="flex justify-between text-xs text-gray-500 font-mono">
            <span>Total Portofolio Terkait</span>
            <span className="material-symbols-outlined text-purple-600">pie_chart</span>
          </div>
          <div className="text-xl font-semibold font-mono tabular-nums text-[#0A2A22] mt-1">
            Rp {new Intl.NumberFormat('id-ID').format(totalRelatedVolume)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {relatedTransactions.length} transaksi tercatat
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#F3D9CE] shadow-xs">
          <div className="flex justify-between text-xs text-gray-500 font-mono">
            <span>Pihak Pengurus</span>
            <span className="px-2 py-0.2 rounded text-[10px] bg-blue-100 text-blue-800 font-medium">
              Pengurus
            </span>
          </div>
          <div className="text-xl font-semibold font-mono tabular-nums text-blue-900 mt-1">
            Rp {new Intl.NumberFormat('id-ID').format(pengurusVolume)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Plafon pinjaman modal &amp; operasional
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#F3D9CE] shadow-xs">
          <div className="flex justify-between text-xs text-gray-500 font-mono">
            <span>Pihak Pengawas</span>
            <span className="px-2 py-0.2 rounded text-[10px] bg-purple-100 text-purple-800 font-medium">
              Pengawas
            </span>
          </div>
          <div className="text-xl font-semibold font-mono tabular-nums text-purple-900 mt-1">
            Rp {new Intl.NumberFormat('id-ID').format(pengawasVolume)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Klarifikasi komite audit independen
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#F3D9CE] shadow-xs">
          <div className="flex justify-between text-xs text-gray-500 font-mono">
            <span>Afiliasi Keluarga</span>
            <span className="px-2 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-medium">
              Afiliasi
            </span>
          </div>
          <div className="text-xl font-semibold font-mono tabular-nums text-amber-900 mt-1">
            Rp {new Intl.NumberFormat('id-ID').format(familyVolume)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Pemeriksaan dokumen hubungan keluarga
          </div>
        </div>
      </div>

      {/* 3. Filter and Details Grid */}
      <div className="grid grid-cols-12 gap-6 items-start font-ui">
        {/* Table of Related Party Transactions */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-[#F3D9CE] shadow-xs overflow-hidden">
          <div className="p-4 px-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 bg-[#FFF8F4]">
            <div className="flex items-center gap-2">
              <span className="font-ui font-semibold text-sm text-[#0A2A22]">
                Daftar Transaksi Pihak Terkait
              </span>
              <span className="text-xs font-mono-tabular text-gray-500">
                ({filteredList.length} transaksi)
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono-tabular">
              {(['Semua', 'Pengurus', 'Pengawas', 'Afiliasi Keluarga'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRole(r)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    filterRole === r
                      ? 'bg-[#0A2A22] text-white font-bold'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-tabular">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[10px]">
                  <th className="py-2.5 px-3">ID &amp; Waktu</th>
                  <th className="py-2.5 px-3">Pihak &amp; Peran</th>
                  <th className="py-2.5 px-3">Akun</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredList.map((trx, index) => {
                  const isSelected = activeTrx?.id === trx.id;
                  return (
                    <tr
                      key={`${trx.id}-${index}`}
                      onClick={() => setSelectedTrx(trx)}
                      className={`hover:bg-purple-50/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-purple-100/60 font-bold' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#0A2A22]">{trx.id}</div>
                        <div className="text-[10px] text-gray-400">{trx.jam} WIB</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#009770]">{trx.idAnggotaPseudonim}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                            {trx.pihakTerkaitLabel}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {isMasked ? trx.namaAnggotaMasked : 'Bpk. Hendro Prayogo'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div>{trx.akun}</div>
                        <div className="text-[10px] text-gray-400">{trx.unit}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#0A2A22]">
                        Rp {new Intl.NumberFormat('id-ID').format(trx.nominal)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            trx.decisionStatus === 'Wajar'
                              ? 'bg-emerald-100 text-emerald-800'
                              : trx.decisionStatus === 'Perlu pemeriksaan lanjut'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {trx.decisionStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Transaction Deep-Dive & Working Hypothesis Worksheet */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-4">
          {activeTrx ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-purple-700">{activeTrx.id}</span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                      {activeTrx.pihakTerkaitLabel}
                    </span>
                  </div>
                  <h3 className="font-ui font-semibold text-sm text-[#0A2A22] mt-1">
                    Analisis Selisih terhadap Pola Anggota Lain
                  </h3>
                </div>
                <span className="px-2 py-1 rounded bg-[#CE2F2E]/10 text-[#CE2F2E] font-mono text-xs font-bold">
                  Skor {activeTrx.finalScore}/100
                </span>
              </div>

              {/* Working Hypothesis Comparison Callout */}
              <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 text-xs space-y-2">
                <div className="font-bold text-purple-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">hypothesis</span>
                  <span>Hipotesis Kerja &amp; Deviasi Pola:</span>
                </div>
                <p className="text-gray-700 leading-relaxed font-mono-tabular">
                  {activeTrx.selisihPolaAnggota ||
                    '+380% terhadap rata-rata pinjaman anggota umum di kantor cabang ini.'}
                </p>
                <div className="text-[11px] text-purple-800 pt-1 border-t border-purple-200/60">
                  Unit: <strong>{activeTrx.unit}</strong> &bull; Petugas Pencatat: <strong>{activeTrx.petugas}</strong>
                </div>
              </div>

              {/* Indicator reasons list */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-gray-700 font-mono-tabular">
                  Indikator Risiko Teridentifikasi:
                </span>
                <ul className="space-y-1 text-xs text-gray-600 font-mono-tabular">
                  {activeTrx.flagReasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#CE2F2E]">&bull;</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Supervisor action note */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-700 block font-mono-tabular">
                  Catatan Pengawas (Telaah Komite Audit):
                </label>
                <textarea
                  rows={2}
                  value={workHypothesisNote || activeTrx.catatan || ''}
                  onChange={(e) => setWorkHypothesisNote(e.target.value)}
                  placeholder="Tuliskan telaah berkas fisik atau notulensi rapat..."
                  className="w-full text-xs font-mono-tabular p-2.5 rounded-xl border border-[#F3D9CE] focus:ring-1 focus:ring-[#009770] focus:outline-none"
                />

                {/* 3 Decision buttons */}
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono-tabular">
                  <button
                    onClick={() => {
                      onMakeDecision(activeTrx.id, 'Wajar', workHypothesisNote || 'Disetujui komite');
                      setSelectedTrx({ ...activeTrx, decisionStatus: 'Wajar' });
                    }}
                    className="py-1.5 px-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 cursor-pointer"
                  >
                    Wajar
                  </button>
                  <button
                    onClick={() => {
                      onMakeDecision(activeTrx.id, 'Perlu dokumen pendukung', workHypothesisNote || 'Minta nota');
                      setSelectedTrx({ ...activeTrx, decisionStatus: 'Perlu dokumen pendukung' });
                    }}
                    className="py-1.5 px-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold hover:bg-amber-100 cursor-pointer"
                  >
                    Perlu Dokumen
                  </button>
                  <button
                    onClick={() => {
                      onMakeDecision(activeTrx.id, 'Perlu pemeriksaan lanjut', workHypothesisNote || 'Audit khusus');
                      setSelectedTrx({ ...activeTrx, decisionStatus: 'Perlu pemeriksaan lanjut' });
                    }}
                    className="py-1.5 px-2 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold hover:bg-rose-100 cursor-pointer"
                  >
                    Periksa Lanjut
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400 text-center py-8">
              Pilih salah satu transaksi pihak terkait di tabel sebelah kiri.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
