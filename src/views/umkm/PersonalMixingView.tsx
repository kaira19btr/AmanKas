/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UmkmTransaction } from '../../types';

interface PersonalMixingViewProps {
  transactions: UmkmTransaction[];
  onTogglePersonalTag: (trxId: string) => void;
  onSeparateFromBusiness: (trxId: string) => void;
}

export const PersonalMixingView: React.FC<PersonalMixingViewProps> = ({
  transactions,
  onTogglePersonalTag,
  onSeparateFromBusiness,
}) => {
  const [filterState, setFilterState] = useState<'Semua' | 'Belum Dipisah' | 'Sudah Dipisah'>('Belum Dipisah');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filter transactions that have personal tags or household descriptions
  const personalTransactions = transactions.filter((t) => t.tagPribadi || t.jenis === 'pribadi');

  const filtered = personalTransactions.filter((t) => {
    if (filterState === 'Belum Dipisah') return !t.dipisahkanDariUsaha;
    if (filterState === 'Sudah Dipisah') return t.dipisahkanDariUsaha;
    return true;
  });

  const totalTercampurBulanIni = personalTransactions.reduce((acc, t) => acc + t.nominal, 0);
  const totalBelumDipisah = personalTransactions
    .filter((t) => !t.dipisahkanDariUsaha)
    .reduce((acc, t) => acc + t.nominal, 0);
  const totalSudahDipisah = personalTransactions
    .filter((t) => t.dipisahkanDariUsaha)
    .reduce((acc, t) => acc + t.nominal, 0);

  const handleSeparate = (trxId: string, desc: string) => {
    onSeparateFromBusiness(trxId);
    setActionNotice(`Transaksi "${desc}" berhasil dipisahkan dari rekap laporan laba rugi toko.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleToggle = (trxId: string) => {
    onTogglePersonalTag(trxId);
    setActionNotice(`Tag status pengeluaran pribadi berhasil diperbarui.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Contextual Help Header for Owner */}
      <section className="bg-gradient-to-r from-[#031B15] to-[#0A2A22] text-white rounded-2xl p-4 px-6 border-l-4 border-l-[#FFF637] border border-[#FFF637]/30 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <span className="material-symbols-outlined text-2xl">call_split</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base text-white">
                  Pencampuran Uang Pribadi vs Rekening Toko
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px] font-mono font-bold">
                  Pemisahan Kas Otomatis
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                Deteksi otomatis pengeluaran rumah tangga (seperti belanja dapur, SPP anak, atau servis motor) yang terbayar memakai QRIS atau rekening bank toko. Anda dapat menandai dan memisahkannya dalam satu klik agar catatan laba toko Anda tidak terdistorsi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-purple-100 text-purple-900 border border-purple-300 text-xs font-mono-tabular font-bold flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 2. Monthly Mixed Funds Counter & Education Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Terdeteksi */}
        <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs">
          <div className="flex justify-between items-center text-xs text-gray-500 font-mono-tabular">
            <span>Total Uang Tercampur Bulan Ini</span>
            <span className="material-symbols-outlined text-purple-600">receipt</span>
          </div>
          <div className="text-2xl font-bold font-display text-purple-950 mt-2">
            Rp {new Intl.NumberFormat('id-ID').format(totalTercampurBulanIni)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            {personalTransactions.length} transaksi pribadi terdeteksi
          </div>
        </div>

        {/* Belum Dipisah */}
        <div className="bg-white rounded-2xl p-5 border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex justify-between items-center text-xs text-rose-700 font-mono-tabular">
            <span>Masih Membebani Rekap Toko</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#CE2F2E]" />
          </div>
          <div className="text-2xl font-bold font-display text-rose-700 mt-2">
            Rp {new Intl.NumberFormat('id-ID').format(totalBelumDipisah)}
          </div>
          <div className="text-[11px] text-rose-600 mt-1 font-semibold">
            Perlu diklik &ldquo;Pisahkan&rdquo; agar laba bersih akurat
          </div>
        </div>

        {/* Sudah Berhasil Dipisah */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex justify-between items-center text-xs text-emerald-800 font-mono-tabular">
            <span>Berhasil Dipisahkan (Bersih)</span>
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
          </div>
          <div className="text-2xl font-bold font-display text-emerald-800 mt-2">
            Rp {new Intl.NumberFormat('id-ID').format(totalSudahDipisah)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">
            Dialihkan ke akun prive / pribadi pemilik
          </div>
        </div>
      </div>

      {/* 3. Education Box: Why Separate? */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5 font-sans">
        <div className="font-bold flex items-center gap-1.5 text-amber-950">
          <span className="material-symbols-outlined text-base">info</span>
          <span>Mengapa Pemisahan Uang Pribadi Sangat Penting Bagi UMKM?</span>
        </div>
        <p className="text-[11px] leading-relaxed text-amber-800">
          Bila belanja rumah tangga bercampur dengan uang toko, laba usaha Anda terlihat jauh lebih sedikit dari yang sebenarnya. Akibatnya, Anda sulit menabung modal kulakan dan catatan arus kas tampak tidak sehat saat diperiksa bank atau koperasi.
        </p>
      </div>

      {/* 4. Table of Mixed Transactions with "Tandai pribadi" and "Pisahkan" Actions */}
      <div className="bg-white rounded-2xl border border-[#F3D9CE] shadow-xs overflow-hidden">
        <div className="p-4 px-6 border-b border-gray-100 bg-[#FFF8F4] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-sm text-[#0A2A22]">
              Daftar Transaksi Pribadi yang Terdeteksi di Rekening Toko
            </h2>
            <p className="text-xs text-gray-500 font-mono-tabular">
              Klik &ldquo;Pisahkan&rdquo; untuk mengeluarkan transaksi dari beban toko
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono-tabular">
            {(['Belum Dipisah', 'Sudah Dipisah', 'Semua'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterState(st)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterState === st
                    ? 'bg-[#0A2A22] text-[#FFF637] font-bold shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-tabular">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-[10px] border-b border-gray-200">
                <th className="py-3 px-4">Waktu &amp; ID</th>
                <th className="py-3 px-4">Deskripsi Transaksi</th>
                <th className="py-3 px-4">Kategori Rumah Tangga</th>
                <th className="py-3 px-4">Kanal Bayar</th>
                <th className="py-3 px-4 text-right">Nominal Uang</th>
                <th className="py-3 px-4 text-center">Status Pemisahan</th>
                <th className="py-3 px-4 text-center">Aksi Pemilik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Tidak ada transaksi dengan filter ini.
                  </td>
                </tr>
              ) : (
                filtered.map((trx) => (
                  <tr key={trx.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900">{trx.id}</div>
                      <div className="text-[10px] text-gray-400">{trx.jam} WIB</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-gray-800">{trx.deskripsi}</div>
                      <div className="text-[10px] text-purple-700">Petugas: {trx.kasirPseudonim}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px]">
                        {trx.kategoriPribadi || 'Pengeluaran Rumah Tangga'}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-[11px] font-bold text-gray-600">
                      {trx.metode}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900 whitespace-nowrap">
                      Rp {new Intl.NumberFormat('id-ID').format(trx.nominal)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {trx.dipisahkanDariUsaha ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ✓ Sudah Dipisah
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Tercampur di Toko
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {!trx.dipisahkanDariUsaha ? (
                          <button
                            onClick={() => handleSeparate(trx.id, trx.deskripsi)}
                            className="px-3 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs"
                          >
                            Pisahkan
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSeparate(trx.id, trx.deskripsi)}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-medium transition-all cursor-pointer"
                          >
                            Batal Pisah
                          </button>
                        )}

                        <button
                          onClick={() => handleToggle(trx.id)}
                          className="px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 text-[10px] cursor-pointer"
                        >
                          Tandai Pribadi
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
