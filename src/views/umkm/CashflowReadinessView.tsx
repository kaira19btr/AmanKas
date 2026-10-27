/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UmkmTransaction, UmkmConsent } from '../../types';

interface CashflowReadinessViewProps {
  transactions: UmkmTransaction[];
  umkmConsent: UmkmConsent;
  onNavigateToConsent: () => void;
}

export const CashflowReadinessView: React.FC<CashflowReadinessViewProps> = ({
  transactions,
  umkmConsent,
  onNavigateToConsent,
}) => {
  const [shareSuccessNotice, setShareSuccessNotice] = useState<string | null>(null);

  // Financial calculations
  const totalSales = transactions
    .filter((t) => t.jenis === 'penjualan')
    .reduce((acc, t) => acc + t.nominal, 0);

  const totalExpenses = transactions
    .filter((t) => t.jenis === 'pengeluaran')
    .reduce((acc, t) => acc + t.nominal, 0);

  const totalSeparatedPersonal = transactions
    .filter((t) => t.tagPribadi && t.dipisahkanDariUsaha)
    .reduce((acc, t) => acc + t.nominal, 0);

  const netCashFlow = totalSales - totalExpenses;

  // Readiness Metrics
  const documentedCount = transactions.filter((t) => t.adaStruk).length;
  const docPct = transactions.length > 0 ? Math.round((documentedCount / transactions.length) * 100) : 0;
  const monthlyCompleteness = 95; // 3 months continuous records

  const isShareAllowed = umkmConsent.optInConsent && !umkmConsent.shareRevoked;

  const handleShareToLender = () => {
    if (!isShareAllowed) return;
    setShareSuccessNotice(
      `Tautan ringkasan arus kas berhasil disalin: https://app.sadar.id/share/lender?token=${umkmConsent.lenderShareToken}`
    );
    setTimeout(() => setShareSuccessNotice(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Contextual Help Header for Owner */}
      <section className="bg-gradient-to-r from-[#031B15] to-[#0A2A22] text-white rounded-2xl p-4 px-6 border-l-4 border-l-[#FFF637] border border-[#FFF637]/30 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#009770]/30 border border-[#84F8CA]/40 flex items-center justify-center text-[#84F8CA]">
              <span className="material-symbols-outlined text-2xl">trending_up</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-ui font-semibold text-base text-white">
                  Arus Kas Toko &amp; Kesiapan Catatan Keuangan
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#009770]/40 text-[#84F8CA] border border-[#84F8CA]/30 text-[10px] font-mono font-medium tracking-[0.08em] uppercase">
                  Bahan Pengajuan Pembiayaan
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed font-ui font-normal">
                Rekap arus kas otomatis dari struk penjualan dan belanja toko. Membantu Anda mengukur kesiapan buku kas sebelum mengajukan penambahan modal ke bank atau koperasi simpan pinjam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Share notification */}
      {shareSuccessNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs font-mono font-medium flex items-center justify-between animate-fadeIn">
          <span>✓ {shareSuccessNotice}</span>
          <button
            onClick={() => setShareSuccessNotice(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Automated Cash Flow Summary (Arus Kas Otomatis) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-ui">
        <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs">
          <div className="text-xs text-gray-500 font-ui font-medium">Total Arus Kas Masuk (Penjualan)</div>
          <div className="text-xl font-bold font-ui tabular-nums text-emerald-700 mt-1">
            +Rp {new Intl.NumberFormat('id-ID').format(totalSales)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1 font-ui font-normal">
            Penjualan retail tunai, QRIS, transfer
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs">
          <div className="text-xs text-gray-500 font-ui font-medium">Total Arus Kas Keluar (Beban Toko)</div>
          <div className="text-xl font-bold font-ui tabular-nums text-rose-700 mt-1">
            -Rp {new Intl.NumberFormat('id-ID').format(totalExpenses)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1 font-ui font-normal">
            Kulakan grosir &amp; operasional warung
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs">
          <div className="text-xs text-gray-500 font-ui font-medium">Arus Kas Bersih Toko (Netto)</div>
          <div className="text-xl font-bold font-ui tabular-nums text-[#0A2A22] mt-1">
            Rp {new Intl.NumberFormat('id-ID').format(netCashFlow)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 font-ui">
            Surplus operasional toko
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs">
          <div className="text-xs text-gray-500 font-ui font-medium">Pemisahan Prive Rumah Tangga</div>
          <div className="text-xl font-bold font-ui tabular-nums text-purple-800 mt-1">
            Rp {new Intl.NumberFormat('id-ID').format(totalSeparatedPersonal)}
          </div>
          <div className="text-[11px] text-purple-700 mt-1 font-ui font-normal">
            Berhasil disterilkan dari beban toko
          </div>
        </div>
      </div>

      {/* 3. Indikator Kesiapan Catatan Keuangan (Readiness Indicators) */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left: Readiness Scorecards */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="font-ui font-semibold text-sm text-[#0A2A22]">
                Indikator Kesiapan Catatan Buku Usaha
              </h2>
              <p className="text-xs text-gray-500 font-ui font-normal">
                Tingkat keteraturan pencatatan yang dinilai oleh lembaga pembiayaan kredit mikro
              </p>
            </div>
            <span className="material-symbols-outlined text-[#009770]">verified</span>
          </div>

          <div className="space-y-4 text-xs font-ui">
            {/* Metric 1 */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Persentase Transaksi Berstruk/Berdokumen:</span>
                <span className="text-sm font-extrabold text-[#009770] font-mono tabular-nums">{docPct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  style={{ width: `${docPct}%` }}
                  className="h-full bg-gradient-to-r from-[#009770] to-[#84F8CA] rounded-full"
                />
              </div>
              <p className="text-[11px] text-gray-500 font-ui font-normal">
                {documentedCount} dari {transactions.length} transaksi toko memiliki struk POS atau bukti mutasi resmi.
              </p>
            </div>

            {/* Metric 2 */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Kelengkapan Rekap Arus Kas Bulanan:</span>
                <span className="text-sm font-extrabold text-blue-700 font-mono tabular-nums">{monthlyCompleteness}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  style={{ width: `${monthlyCompleteness}%` }}
                  className="h-full bg-blue-600 rounded-full"
                />
              </div>
              <p className="text-[11px] text-gray-500 font-ui font-normal">
                Pencatatan kasir dan setoran bank berjalan konsisten selama 3 bulan terakhir tanpa jeda kosong.
              </p>
            </div>

            {/* Metric 3 */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Pemisahan Rekening Usaha vs Rumah Tangga:</span>
                <span className="text-sm font-extrabold text-purple-700 font-mono tabular-nums">Tertib (85%)</span>
              </div>
              <p className="text-[11px] text-gray-500 font-ui font-normal">
                Pengeluaran pribadi teridentifikasi sudah dipisahkan ke pos pengeluaran pribadi (prive) pemilik.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Bagikan ke Pemberi Pinjaman & Disclaimer */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-5">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="font-ui font-semibold text-sm text-[#0A2A22]">
              Bagikan ke Pemberi Pinjaman (Bank / Koperasi)
            </h3>
            <p className="text-xs text-gray-500 font-ui font-normal">
              Kirimkan ringkasan arus kas resmi yang telah diverifikasi sistem SADAR
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3 text-xs font-ui">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Izin Berbagi Data:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isShareAllowed
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isShareAllowed ? 'Aktif (Diizinkan)' : 'Belum Diizinkan / Dicabut'}
              </span>
            </div>

            <div className="text-[11px] text-gray-500 font-ui font-normal leading-relaxed">
              {isShareAllowed ? (
                <span>
                  Anda telah memberikan izin opt-in untuk membagikan rekap agregat kas kepada pemberi pinjaman mitra.
                </span>
              ) : (
                <span className="text-rose-700">
                  Tombol berbagi dinonaktifkan karena Anda belum menyalakan izin berbagi data di menu &ldquo;Izin dan Data Saya&rdquo;.
                </span>
              )}
            </div>

            {/* Share button */}
            <button
              onClick={handleShareToLender}
              disabled={!isShareAllowed}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all font-ui cursor-pointer ${
                isShareAllowed
                  ? 'bg-[#0A2A22] text-[#FFF637] hover:bg-[#009770] hover:text-white shadow-md'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-base">share</span>
              <span>Bagikan ke Pemberi Pinjaman</span>
            </button>

            {!isShareAllowed && (
              <button
                onClick={onNavigateToConsent}
                className="w-full text-center text-xs text-[#009770] hover:underline font-semibold font-ui cursor-pointer"
              >
                Atur Izin Berbagi Data Sekarang &rarr;
              </button>
            )}
          </div>

          {/* CRITICAL MANDATORY DISCLAIMER AS REQUESTED */}
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-700 text-lg">gavel</span>
              <span className="font-mono font-medium text-xs uppercase tracking-[0.08em]">
                Pernyataan Kepatuhan Lembaga
              </span>
            </div>
            <p className="text-xs font-bold leading-relaxed font-ui">
              &ldquo;Catatan tertib tidak menjamin kredit disetujui.&rdquo;
            </p>
            <p className="text-[11px] text-amber-900 leading-relaxed font-ui font-normal">
              Keputusan pemberian pembiayaan, suku bunga, dan plafon kredit sepenuhnya merupakan hak prerogatif analis kredit pada bank atau koperasi pemberi pinjaman sesuai standar analisis 5C mereka.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
