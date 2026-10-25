/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UmkmTransaction } from '../../types';
import { AnimatedCounter } from '../../components/AnimatedCounter';
import { SadarText } from '../../components/SadarText';

interface BusinessHomeViewProps {
  transactions: UmkmTransaction[];
  onNavigateToVariance: () => void;
  onNavigateToMixing: () => void;
  onNavigateToAlerts: () => void;
  onNavigateToReadiness: () => void;
}

export const BusinessHomeView: React.FC<BusinessHomeViewProps> = ({
  transactions,
  onNavigateToVariance,
  onNavigateToMixing,
  onNavigateToAlerts,
  onNavigateToReadiness,
}) => {
  // Calculations for owner layman dashboard
  const salesTrx = transactions.filter((t) => t.jenis === 'penjualan');
  const totalSales = salesTrx.reduce((acc, t) => acc + t.nominal, 0);

  const expenseTrx = transactions.filter((t) => t.jenis === 'pengeluaran');
  const totalExpenses = expenseTrx.reduce((acc, t) => acc + t.nominal, 0);

  const personalTrx = transactions.filter((t) => t.tagPribadi && !t.dipisahkanDariUsaha);
  const totalPersonal = personalTrx.reduce((acc, t) => acc + t.nominal, 0);

  const alerts = transactions.filter((t) => t.status !== 'Normal' && t.decisionStatus === 'Menunggu Keputusan');
  const voidTrx = transactions.filter((t) => t.jenis === 'void');

  const documentedTrx = transactions.filter((t) => t.adaStruk);
  const readinessPct = transactions.length > 0 ? Math.round((documentedTrx.length / transactions.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Contextual Help Header for Business Owner */}
      <section className="bg-gradient-to-r from-[#031B15] to-[#0A2A22] text-white rounded-2xl p-4 px-6 border-l-4 border-l-[#FFF637] border border-[#FFF637]/30 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF637]/20 border border-[#FFF637]/40 flex items-center justify-center text-[#FFF637]">
              <span className="material-symbols-outlined text-2xl">storefront</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base text-white">
                  Beranda Usaha &bull; Warung Fiktif Bu Rina
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#FFF637]/30 text-[#FFF637] border border-[#FFF637]/40 text-[10px] font-mono font-bold">
                  Mode Pemilik UMKM
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                Ringkasan sederhana keuangan toko Anda hari ini dalam bahasa yang praktis. Membantu Anda memantau penjualan harian, memeriksa selisih laci kasir, dan memisahkan uang pribadi dari uang usaha toko.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono-tabular text-gray-300 shrink-0 self-end md:self-auto bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
            Kepemilikan Data: <strong className="text-[#84F8CA]">100% Milik Anda</strong>
          </div>
        </div>
      </section>

      {/* 2. Simple Non-Technical Overview Cards (4 Key Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Penjualan Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs hover:border-[#009770] transition-all">
          <div className="flex items-center justify-between text-xs text-gray-500 font-mono-tabular">
            <span>Total Penjualan (Omzet) Hari Ini</span>
            <span className="material-symbols-outlined text-[#009770] text-xl">payments</span>
          </div>
          <div className="text-2xl font-bold font-display text-[#0A2A22] mt-2">
            Rp <AnimatedCounter value={totalSales} />
          </div>
          <div className="text-[11px] text-gray-500 mt-1 flex items-center justify-between">
            <span>{salesTrx.length} pembeli dilayani</span>
            <span className="text-[#009770] font-bold">Tunai &amp; QRIS</span>
          </div>
        </div>

        {/* Card 2: Pengeluaran Toko */}
        <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs hover:border-[#B38300] transition-all">
          <div className="flex items-center justify-between text-xs text-gray-500 font-mono-tabular">
            <span>Pengeluaran Belanja Toko</span>
            <span className="material-symbols-outlined text-amber-600 text-xl">shopping_cart_checkout</span>
          </div>
          <div className="text-2xl font-bold font-display text-[#0A2A22] mt-2">
            Rp <AnimatedCounter value={totalExpenses} />
          </div>
          <div className="text-[11px] text-gray-500 mt-1">
            Kulakan grosir, kantong kresek, es batu
          </div>
        </div>

        {/* Card 3: Peringatan Indikator Risiko */}
        <div
          onClick={onNavigateToAlerts}
          className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs hover:border-[#CE2F2E] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-gray-500 font-mono-tabular">
            <span>Peringatan Butuh Perhatian</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#CE2F2E] radar-pulse-red" />
          </div>
          <div className="text-2xl font-bold font-display text-[#CE2F2E] mt-2 flex items-baseline gap-1.5">
            <span>{alerts.length} Hal</span>
            <span className="text-xs text-gray-500 font-normal">perlu dicek</span>
          </div>
          <div className="text-[11px] text-rose-600 mt-1 group-hover:underline flex items-center gap-1 font-semibold">
            <span>Buka Peringatan Saya &rarr;</span>
          </div>
        </div>

        {/* Card 4: Uang Pribadi Tercampur */}
        <div
          onClick={onNavigateToMixing}
          className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs hover:border-purple-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-gray-500 font-mono-tabular">
            <span>Uang Pribadi Tercampur</span>
            <span className="material-symbols-outlined text-purple-600 text-xl">account_balance_wallet</span>
          </div>
          <div className="text-2xl font-bold font-display text-purple-900 mt-2">
            Rp <AnimatedCounter value={totalPersonal} />
          </div>
          <div className="text-[11px] text-purple-700 mt-1 group-hover:underline flex items-center gap-1 font-semibold">
            <span>{personalTrx.length} transaksi belum dipisahkan &rarr;</span>
          </div>
        </div>
      </div>

      {/* 3. Operational Shortcuts & Daily Checklist for Owner */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Column: Quick Action Hub */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="font-display font-bold text-sm text-[#0A2A22]">
                Aksi Cepat Pengendalian Warung
              </h2>
              <p className="text-xs text-gray-500">
                Langkah praktis yang disarankan sebelum tutup toko malam ini
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#009770] bg-emerald-50 px-2.5 py-1 rounded-full">
              Selesai 3 dari 4
            </span>
          </div>

          <div className="space-y-3 font-mono-tabular text-xs">
            {/* Action 1 */}
            <div
              onClick={onNavigateToVariance}
              className="p-3.5 rounded-xl border border-gray-200 hover:border-[#009770] bg-gray-50/70 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg">point_of_sale</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Hitung Kas Laci Kasir Fisik</div>
                  <div className="text-gray-500 text-[11px]">
                    Cocokkan uang kertas &amp; koin di laci dengan rekap kasir POS Shift 1 &amp; Shift 2
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </div>

            {/* Action 2 */}
            <div
              onClick={onNavigateToMixing}
              className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 hover:bg-purple-50/80 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg">call_split</span>
                </div>
                <div>
                  <div className="font-bold text-purple-950">Pisahkan Belanja Dapur &amp; Uang Rumah Tangga</div>
                  <div className="text-gray-500 text-[11px]">
                    Ada 2 transaksi pribadi terdeteksi di rekening QRIS/BRI toko
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-900">
                Perlu Dipisah
              </span>
            </div>

            {/* Action 3 */}
            <div
              onClick={onNavigateToAlerts}
              className="p-3.5 rounded-xl border border-gray-200 hover:border-rose-300 bg-gray-50/70 hover:bg-rose-50/40 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg">warning</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Periksa {voidTrx.length} Transaksi Pembatalan (Void)</div>
                  <div className="text-gray-500 text-[11px]">
                    Kasir-01 membatalkan 3 nota di jam ramai; pastikan bukan uang kasir yang tercecer
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </div>

            {/* Action 4 */}
            <div
              onClick={onNavigateToReadiness}
              className="p-3.5 rounded-xl border border-gray-200 hover:border-blue-300 bg-gray-50/70 hover:bg-blue-50/40 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Lihat Kesiapan Catatan untuk Modal Usaha</div>
                  <div className="text-gray-500 text-[11px]">
                    Skor kerapian pencatatan Anda: <strong>{readinessPct}%</strong> berstruk lengkap
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </div>
          </div>
        </div>

        {/* Right Column: Tips & Layman Financial Advice */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-3 font-mono-tabular">
            <div className="flex items-center gap-2 text-[#0A2A22]">
              <span className="material-symbols-outlined text-[#FFF637] bg-[#0A2A22] p-1 rounded-lg text-lg">lightbulb</span>
              <h3 className="font-display font-bold text-sm">
                Tips Pengendalian Kas Warung Hari Ini
              </h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-sans">
              &ldquo;Jangan biarkan uang kembalian pribadi diambil dari laci kasir toko tanpa dicatat. Pisahkan dompet pribadi dan uang kasir sejak pagi agar selisih kas fisik di akhir shift selalu nol.&rdquo;
            </p>
            <div className="text-[11px] text-[#009770] font-bold pt-2 border-t border-gray-100">
              Prinsip SADAR: Tertib Kasir &bull; Transparan &bull; Untung Terjaga
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#031B15] to-[#0A2A22] text-white rounded-2xl p-5 border border-[#00B386]/30 shadow-xs space-y-3 font-mono-tabular text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-[11px]">Status Analisis SADAR:</span>
              <span className="px-2 py-0.5 rounded bg-[#FFF637]/20 text-[#FFF637] text-[10px] font-bold">
                Aturan Red Flag Aktif
              </span>
            </div>
            <div className="text-sm font-bold text-white">
              Lapisan Deteksi Utama: Aturan Logika Usaha
            </div>
            <p className="text-gray-300 text-[11px] leading-relaxed">
              Karena volume harian warung retail adalah 45 transaksi, algoritma Benford &amp; Isolasi belum diaktifkan (memerlukan minimal 300 transaksi). Deteksi mengandalkan aturan pembatalan, selisih kas, dan transaksi di luar jam buka.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
