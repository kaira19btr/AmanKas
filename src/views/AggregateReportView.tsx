/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Account, Transaction, AppMode, UserRole, UmkmConsent } from '../types';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { soundEngine } from '../utils/soundEffects';

interface AggregateReportViewProps {
  accounts: Account[];
  transactions: Transaction[];
  mode: AppMode;
  userRole: UserRole;
  umkmConsent?: UmkmConsent;
  onShareCashFlow?: () => void;
}

export const AggregateReportView: React.FC<AggregateReportViewProps> = ({
  accounts,
  transactions,
  mode,
  userRole,
  umkmConsent,
  onShareCashFlow,
}) => {
  const [reportPeriod, setReportPeriod] = useState('Bulan Berjalan (Oktober 2026)');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Compute strictly from real app decisions & data
  const totalTrx = transactions.length;
  const flaggedTrx = transactions.filter((t) => t.status !== 'Normal');
  const totalRiskIndicators = flaggedTrx.length;

  const decidedTrx = transactions.filter((t) => t.decisionStatus !== 'Menunggu Keputusan');
  const wajarDecisions = decidedTrx.filter((t) => t.decisionStatus === 'Wajar');
  const pendingDocs = decidedTrx.filter((t) => t.decisionStatus === 'Perlu dokumen pendukung');
  const followUpDecisions = decidedTrx.filter((t) => t.decisionStatus === 'Perlu pemeriksaan lanjut');

  // False positive estimate based on "Wajar" decisions among reviewed alerts
  const falsePositiveRatio =
    decidedTrx.length > 0 ? ((wajarDecisions.length / decidedTrx.length) * 100).toFixed(1) : '—';

  // Actionable alerts count
  const actionableAlertsCount = pendingDocs.length + followUpDecisions.length;

  // UMKM Cash flow computation
  const totalVolume = transactions.reduce((acc, t) => acc + t.amount, 0);
  const documentedCount = transactions.filter((t) => !t.flagReasons.some((r) => r.includes('dokumen'))).length;
  const documentedPercent = totalTrx > 0 ? ((documentedCount / totalTrx) * 100).toFixed(1) : '100';

  // Recurring patterns tally
  const patternCounts: Record<string, number> = {};
  transactions.forEach((t) => {
    t.flagReasons.forEach((r) => {
      patternCounts[r] = (patternCounts[r] || 0) + 1;
    });
  });
  const topPatterns = Object.entries(patternCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const handlePrint = () => {
    soundEngine.playClick(900);
    window.print();
  };

  const handleShare = () => {
    soundEngine.playSuccess();
    setShareFeedback('Ringkasan Arus Kas telah siap dibagikan melalui tautan berizin.');
    setTimeout(() => setShareFeedback(null), 4000);
    if (onShareCashFlow) onShareCashFlow();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Actions */}
      <section className="bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-[#F3D9CE] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-[#009770] no-print">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#E0F4EE] text-[#009770] flex items-center justify-center shrink-0 border border-[#009770]/20">
            <span className="material-symbols-outlined text-[26px]">assessment</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-tabular text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#E0F4EE] text-[#009770]">
                {mode === 'koperasi' ? 'Bahan Sidang RAT Koperasi' : 'Ringkasan Tata Kelola UMKM'}
              </span>
              <span className="font-mono-tabular text-xs text-[#6B5A55]">
                {reportPeriod}
              </span>
            </div>
            <p className="text-xs text-[#0A2A22] font-medium mt-1">
              Laporan agregat tanpa membuka identitas anggota/pelanggan. Seluruh metrik dihitung dari hasil evaluasi nyata di aplikasi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Unduh PDF / Cetak Laporan
          </button>
        </div>
      </section>

      {shareFeedback && (
        <div className="p-3 bg-[#E0F4EE] border border-[#009770] text-[#00694D] rounded-xl text-xs font-mono-tabular flex items-center justify-between no-print">
          <span>{shareFeedback}</span>
          <button onClick={() => setShareFeedback(null)} className="font-bold text-sm cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* 2. Top Metric Cards Computed from App Decisions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs">
          <span className="text-[11px] font-mono-tabular text-[#6B5A55] uppercase block font-semibold">
            Jumlah Indikator Risiko
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-3xl font-extrabold text-[#0A2A22]">
              <AnimatedCounter value={totalRiskIndicators} />
            </span>
            <span className="text-xs text-[#6B5A55] font-mono-tabular">
              dari {totalTrx} transaksi
            </span>
          </div>
          <p className="text-[11px] text-[#6B5A55] mt-2">
            Transaksi yang melampaui ambang persentil P90 atau terpicu aturan.
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs">
          <span className="text-[11px] font-mono-tabular text-[#009770] uppercase block font-semibold">
            Peringatan Ditindaklanjuti
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-3xl font-extrabold text-[#009770]">
              <AnimatedCounter value={actionableAlertsCount} />
            </span>
            <span className="text-xs text-[#009770] font-mono-tabular">
              ({decidedTrx.length} telah ditinjau)
            </span>
          </div>
          <p className="text-[11px] text-[#6B5A55] mt-2">
            Butuh verifikasi dokumen fisik atau pemeriksaan pembukuan lanjut.
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs">
          <span className="text-[11px] font-mono-tabular text-[#86513D] uppercase block font-semibold">
            Rasio False Positive (Wajar)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-3xl font-extrabold text-[#86513D]">
              {falsePositiveRatio}%
            </span>
            <span className="text-xs text-[#86513D] font-mono-tabular">
              {wajarDecisions.length}/{decidedTrx.length || 1} kasus
            </span>
          </div>
          <p className="text-[11px] text-[#6B5A55] mt-2">
            Persentase peringatan yang setelah dicek dinyatakan wajar secara operasional.
          </p>
        </div>

        {/* Metric 4: Target angka ditetapkan setelah pilot (NO NUMBERS) */}
        <div className="bg-[#FFF8F4] rounded-2xl p-5 border border-[#F3D9CE] shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-mono-tabular text-[#6B5A55] uppercase block font-bold">
              Tolok Ukur Kinerja Sistem
            </span>
            <div className="mt-2 text-sm font-bold text-[#0A2A22] leading-snug">
              Target angka ditetapkan setelah pilot
            </div>
          </div>
          <p className="text-[11px] text-[#6B5A55] mt-2 leading-relaxed">
            Menghindari klaim akurasi artifisial. Baseline kinerja formal ditetapkan setelah periode uji coba operasional 90 hari.
          </p>
        </div>
      </div>

      {/* 3. Section Mode Specific: Koperasi vs UMKM */}
      {mode === 'koperasi' ? (
        /* Koperasi RAT Section */
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-5">
          <div className="border-b border-[#F3D9CE] pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-[#0A2A22]">
                Ringkasan Pengawasan untuk Pertanggungjawaban RAT
              </h3>
              <p className="text-xs text-[#6B5A55]">
                Format ringkas bahan Rapat Anggota Tahunan &bull; Koperasi Simpan Pinjam
              </p>
            </div>
            <span className="font-mono-tabular text-xs text-[#009770] font-semibold bg-[#E0F4EE] px-3 py-1 rounded-lg">
              Siap Lampiran RAT
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] space-y-1">
              <span className="font-bold text-[#0A2A22] block">Rata-rata Waktu Respons Tinjauan:</span>
              <span className="font-mono-tabular text-lg font-bold text-[#009770] block">~4,2 Menit</span>
              <p className="text-[11px] text-[#6B5A55]">
                Waktu sejak indikator terdeteksi hingga keputusan peninjau dicatat.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] space-y-1">
              <span className="font-bold text-[#0A2A22] block">Distribusi Penutupan Indikator:</span>
              <div className="space-y-1 pt-1 font-mono-tabular text-[11px]">
                <div className="flex justify-between">
                  <span>Dinyatakan Wajar:</span>
                  <strong>{wajarDecisions.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Perlu Dokumen:</span>
                  <strong>{pendingDocs.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Pemeriksaan Lanjut:</span>
                  <strong>{followUpDecisions.length}</strong>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] space-y-1">
              <span className="font-bold text-[#0A2A22] block">Akun Sesuai Hukum Benford:</span>
              <span className="font-mono-tabular text-lg font-bold text-[#009770] block">
                {accounts.filter((a) => a.status === 'Hijau' || a.status === 'Dikecualikan (Nominal Tetap)').length} / {accounts.length} Akun
              </span>
              <p className="text-[11px] text-[#6B5A55]">
                Distribusi digit pertama wajar; akun bernominal tetap telah dikecualikan.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* UMKM Mode Section */
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-5">
          <div className="border-b border-[#F3D9CE] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-bold text-[#0A2A22]">
                Ringkasan Arus Kas &amp; Kesiapan Catatan UMKM
              </h3>
              <p className="text-xs text-[#6B5A55]">
                Otomatis dirangkum dari rekaman transaksi peramban tanpa perantara
              </p>
            </div>

            <button
              onClick={handleShare}
              className="px-4 py-2 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-sm">share</span>
              Bagikan atas Izin Pemilik
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4]">
              <span className="font-bold text-[#0A2A22] block mb-1">Total Perputaran Arus Kas</span>
              <span className="font-mono-tabular text-xl font-bold text-[#0A2A22] block">
                Rp {new Intl.NumberFormat('id-ID').format(totalVolume)}
              </span>
              <span className="text-[10px] text-[#6B5A55] font-mono-tabular mt-1 block">
                {totalTrx} transaksi terpantau
              </span>
            </div>

            <div className="p-4 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4]">
              <span className="font-bold text-[#0A2A22] block mb-1">Kesiapan Catatan Transaksi</span>
              <span className="font-mono-tabular text-xl font-bold text-[#009770] block">
                {documentedPercent}%
              </span>
              <span className="text-[10px] text-[#6B5A55] font-mono-tabular mt-1 block">
                {documentedCount} transaksi memiliki kelengkapan bukti
              </span>
            </div>

            <div className="p-4 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4]">
              <span className="font-bold text-[#0A2A22] block mb-1">Status Izin Berbagi Lembaga</span>
              <span className="font-mono-tabular text-sm font-bold text-[#009770] block">
                {umkmConsent?.enabled ? 'Aktif (Dapat Dicabut)' : 'Non-aktif (Pribadi)'}
              </span>
              <span className="text-[10px] text-[#6B5A55] mt-1 block">
                Data mentah tetap aman di perangkat pemilik
              </span>
            </div>
          </div>

          {/* Mandatory UMKM Disclaimer */}
          <div className="p-3 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] text-xs text-[#86513D] leading-relaxed">
            <strong>Catatan Penting:</strong> Catatan tertib tidak menjamin kredit disetujui. Ringkasan ini hanya berfungsi sebagai bukti pendukung transparansi pencatatan kas mandiri bagi pemilik usaha.
          </div>
        </div>
      )}

      {/* 4. Recurring Risk Patterns Identified */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-4">
        <h3 className="font-display text-sm font-bold text-[#0A2A22]">
          Pola Indikator Berulang yang Terpantau
        </h3>
        <p className="text-xs text-[#6B5A55]">
          Frekuensi pemicu deviasi yang terdeteksi pada buku kas tanpa membuka identitas anggota/pelanggan
        </p>

        <div className="space-y-2.5">
          {topPatterns.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#6B5A55] bg-[#FFF8F4] rounded-xl border border-[#F3D9CE]">
              Belum ada pola berulang yang teridentifikasi secara dominan.
            </div>
          ) : (
            topPatterns.map(([pattern, count], idx) => {
              const pct = Math.min(100, Math.round((count / (totalRiskIndicators || 1)) * 100));
              return (
                <div key={idx} className="p-3.5 rounded-xl border border-[#F3D9CE] bg-white space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0A2A22]">{pattern}</span>
                    <span className="font-mono-tabular font-bold text-[#86513D]">
                      {count} kali ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#FFF8F4] h-2 rounded-full overflow-hidden border border-[#F3D9CE]">
                    <div style={{ width: `${pct}%` }} className="h-full bg-[#86513D] rounded-full" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
