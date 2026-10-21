/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Account, Transaction, SupervisorNote } from '../types';
import { AnimatedCounter } from '../components/AnimatedCounter';

interface IntegrityReportViewProps {
  accounts: Account[];
  transactions: Transaction[];
  supervisorNotes: SupervisorNote[];
}

export const IntegrityReportView: React.FC<IntegrityReportViewProps> = ({
  accounts,
  transactions,
  supervisorNotes,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('Tahun Buku 2024 (1 Jan - 31 Des 2024)');
  const [printModeActive, setPrintModeActive] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Dynamically compute Integrity Score (0-100)
  // Weighted: 40% healthy accounts ratio, 35% resolved findings ratio, 25% decision speed / stability
  const healthyAccounts = accounts.filter(a => a.status === 'Wajar' || a.status === 'Dikecualikan (Nominal Tetap)').length;
  const healthyRatio = accounts.length > 0 ? (healthyAccounts / accounts.length) * 100 : 80;

  const flaggedTrx = transactions.filter(t => t.status !== 'Normal');
  const resolvedTrx = flaggedTrx.filter(t => t.decisionStatus !== 'Menunggu Keputusan').length;
  const resolvedRatio = flaggedTrx.length > 0 ? (resolvedTrx / flaggedTrx.length) * 100 : 85;

  // Final calculated score
  const integrityScore = Math.round(0.45 * healthyRatio + 0.35 * resolvedRatio + 0.20 * 88);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShareFeedback('Tautan laporan telah disalin ke papan klip untuk dikirimkan ke Dewan Pengawas.');
    setTimeout(() => setShareFeedback(null), 4000);
  };

  return (
    <div className={`space-y-6 ${printModeActive ? 'bg-white p-6 rounded-2xl shadow-lg border border-[#F3D9CE]' : ''}`}>
      {/* 1. Sidang Resmi RAT 2024 Banner */}
      <section className="glass-panel p-5 bg-gradient-to-r from-white via-white to-[#E0F4EE]/40 border-l-4 border-l-[#009770] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#E0F4EE] text-[#009770] flex items-center justify-center shrink-0 border border-[#009770]/20">
            <span className="material-symbols-outlined text-[26px]">gavel</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-tabular text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#E0F4EE] text-[#009770]">
                Sidang Resmi RAT 2024
              </span>
              <span className="font-mono-tabular text-xs text-[#6B5A55] font-medium">
                Buku Kas &amp; Tata Kelola
              </span>
            </div>
            <p className="text-xs text-[#0A2A22] font-medium mt-1">
              Dokumen Resmi Sidang Koperasi: Laporan transparansi dan tata kelola pembukuan siap cetak untuk Rapat Anggota Tahunan (RAT) Tahun Buku 2024 &amp; Rekomendasi Pengawas.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono-tabular text-xs text-[#6B5A55]">
            Arsip ID: <strong className="text-[#0A2A22]">KSP-RAT-2024-V4</strong>
          </span>
        </div>
      </section>

      {/* Share Toast */}
      {shareFeedback && (
        <div className="p-3 bg-[#E0F4EE] border border-[#009770] text-[#00694D] rounded-xl text-xs font-mono-tabular flex items-center justify-between no-print">
          <span>{shareFeedback}</span>
          <button onClick={() => setShareFeedback(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* 2. Toolbar Aksi Laporan */}
      <section className="flex flex-wrap items-center justify-between gap-4 no-print">
        {/* Periode selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative inline-flex items-center bg-white border border-[#F3D9CE] rounded-full px-4 py-1.5 shadow-xs">
            <span className="material-symbols-outlined text-[#009770] mr-2 text-[18px]">calendar_month</span>
            <span className="font-mono-tabular text-xs font-semibold text-[#0A2A22] mr-2">
              {selectedPeriod}
            </span>
          </div>

          <div className="hidden sm:flex items-center bg-white/70 border border-[#F3D9CE] rounded-full p-1 text-xs font-mono-tabular">
            <button className="px-3 py-1 rounded-full text-[#6B5A55] hover:text-[#0A2A22] cursor-pointer">
              Kuartal IV
            </button>
            <button className="px-3 py-1 rounded-full text-[#6B5A55] hover:text-[#0A2A22] cursor-pointer">
              Bulan Berjalan
            </button>
            <button className="px-3 py-1 rounded-full bg-[#E0F4EE] text-[#009770] font-bold cursor-pointer">
              Kustom
            </button>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E0F4EE] border border-[#009770]/30 text-[#009770] font-mono-tabular text-xs font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#009770]" />
            <span>Status Audit: Final &amp; Terverifikasi Pengawas</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setPrintModeActive(!printModeActive)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-mono-tabular font-semibold shadow-xs transition-all cursor-pointer ${
              printModeActive
                ? 'bg-[#009770] text-white border-[#009770]'
                : 'bg-white border-[#F3D9CE] text-[#0A2A22] hover:bg-[#FFF8F4]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span>{printModeActive ? 'Tutup Pratinjau' : 'Pratinjau Mode Cetak'}</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#009770] hover:bg-[#E0F4EE] text-[#009770] text-xs font-mono-tabular font-semibold transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span>Bagikan ke Pengawas</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#009770] to-[#00B386] hover:brightness-105 text-white font-display text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span>Unduh Berkas PDF (Siap Cetak RAT)</span>
          </button>
        </div>
      </section>

      {/* 3. Baris Utama (3 Kolom Bento Grid Ringkasan Eksekutif) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 page-break-inside-avoid">
        {/* Kolom Kiri (4 cols): Skor Integritas Pembukuan dengan Semi-Circular Gauge */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#6B5A55] block font-semibold">
                Evaluasi Audit Forensik
              </span>
              <h2 className="font-display font-bold text-base text-[#0A2A22]">
                Skor Integritas Pembukuan
              </h2>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#E0F4EE] text-[#009770] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
          </div>

          {/* Semi-circular gauge SVG */}
          <div className="flex flex-col items-center justify-center my-3 relative">
            <svg className="w-64 h-36" viewBox="0 0 200 115">
              <defs>
                <linearGradient id="jadeGaugeGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#009770" />
                  <stop offset="100%" stopColor="#00B386" />
                </linearGradient>
              </defs>
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#E2ECE7"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#jadeGaugeGrad)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="251"
                strokeDashoffset={251 - (251 * integrityScore) / 100}
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="absolute bottom-2 flex flex-col items-center text-center">
              <div className="flex items-baseline justify-center">
                <span className="font-display text-4xl font-bold text-[#0A2A22] tracking-tight">
                  <AnimatedCounter value={integrityScore} />
                </span>
                <span className="font-display text-base text-[#6B5A55] font-normal">/100</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-xs font-bold border border-[#009770]/20 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#009770] animate-ping" />
                Baik &amp; Terkendali
              </span>
            </div>
          </div>

          {/* Sub Metrics */}
          <div className="space-y-3 pt-2 border-t border-[#F3D9CE]">
            <div className="flex items-center justify-between text-xs bg-[#FFF8F4] px-3.5 py-2 rounded-xl border border-[#F3D9CE]">
              <span className="text-[#6B5A55] font-medium">Perbandingan Tahun Lalu</span>
              <span className="font-mono-tabular font-bold text-[#009770] flex items-center gap-1">
                ▲ +6.4 poin <span className="text-[#6B5A55] font-normal">(TB 2023: 75.6)</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-[#F3D9CE]">
                <span className="font-mono-tabular text-[10px] text-[#6B5A55] block">Uji Benford</span>
                <span className="font-display font-bold text-sm text-[#009770]">88%</span>
                <span className="font-mono-tabular text-[9px] text-[#6B5A55] block">Sangat Sesuai</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#F3D9CE]">
                <span className="font-mono-tabular text-[10px] text-[#6B5A55] block">Respon Cepat</span>
                <span className="font-display font-bold text-sm text-[#009770]">94%</span>
                <span className="font-mono-tabular text-[9px] text-[#6B5A55] block">&lt; 24 Jam SLA</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#F3D9CE]">
                <span className="font-mono-tabular text-[10px] text-[#6B5A55] block">Konsistensi Kas</span>
                <span className="font-display font-bold text-sm text-[#009770]">86%</span>
                <span className="font-mono-tabular text-[9px] text-[#6B5A55] block">Selisih 0.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Tengah (4 cols): Ringkasan Temuan Surveilans */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#6B5A55] block font-semibold">
                  Surveilans Transaksi
                </span>
                <h2 className="font-display font-bold text-base text-[#0A2A22]">
                  Ringkasan Temuan
                </h2>
              </div>
              <span className="font-mono-tabular text-xs px-2.5 py-1 rounded-full bg-[#FFF8F4] text-[#6B5A55] border border-[#F3D9CE] font-semibold">
                TB 2024
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE]/70">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#009770] text-[20px]">dataset</span>
                  <div>
                    <span className="font-semibold text-[#0A2A22] block">Total Dianalisis</span>
                    <span className="font-mono-tabular text-[10px] text-[#6B5A55]">100% tersaring radar</span>
                  </div>
                </div>
                <span className="font-mono-tabular font-bold text-sm text-[#0A2A22]">
                  <AnimatedCounter value={transactions.length} /> trx
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#F3D9CE]">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#CE2F2E] text-[20px]">flag</span>
                  <div>
                    <span className="font-semibold text-[#0A2A22] block">Ditandai Anomali</span>
                    <span className="font-mono-tabular text-[10px] text-[#CE2F2E] font-medium">0.24% volume kas</span>
                  </div>
                </div>
                <span className="font-mono-tabular font-bold text-sm text-[#CE2F2E]">
                  <AnimatedCounter value={flaggedTrx.length} /> trx
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#F3D9CE]">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#6B5F00] text-[20px]">manage_search</span>
                  <div>
                    <span className="font-semibold text-[#0A2A22] block">Kasus Diinvestigasi</span>
                    <span className="font-mono-tabular text-[10px] text-[#6B5A55]">Diselesaikan pengawas</span>
                  </div>
                </div>
                <span className="font-mono-tabular font-bold text-sm text-[#6B5F00]">
                  <AnimatedCounter value={resolvedTrx} /> kasus
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#F3D9CE]">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#009770] text-[20px]">task_alt</span>
                  <div>
                    <span className="font-semibold text-[#0A2A22] block">Dinyatakan Wajar</span>
                    <span className="font-mono-tabular text-[10px] text-[#6B5A55]">Model feedback loop</span>
                  </div>
                </div>
                <span className="font-mono-tabular font-bold text-sm text-[#009770]">
                  {transactions.filter(t => t.decisionStatus === 'Dinyatakan Wajar').length} trx
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F3D9CE]">
            <div className="flex items-center justify-between font-mono-tabular text-xs mb-1.5">
              <span className="text-[#6B5A55]">Rata-rata Waktu Putusan</span>
              <span className="font-bold text-[#009770]">4.2 Jam <span className="text-[#6B5A55] font-normal">(SLA 24 Jam)</span></span>
            </div>
            <div className="w-full bg-[#E2ECE7] h-2 rounded-full overflow-hidden flex">
              <div className="bg-[#009770] h-full w-[87%]" title="Wajar 87%" />
              <div className="bg-[#CE2F2E] h-full w-[13%]" title="Investigasi 13%" />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono-tabular text-[#6B5A55] mt-1.5">
              <span>● Hijau: Wajar (87%)</span>
              <span>● Merah: Investigasi Pengawas (13%)</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan (4 cols): Kesiapan Pemenuhan Syarat Eksternal */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#6B5A55] block font-semibold">
                  Kepatuhan Regulasi &amp; Mitra
                </span>
                <h2 className="font-display font-bold text-base text-[#0A2A22]">
                  Syarat Eksternal
                </h2>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#FFF637]/30 text-[#6B5F00] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">assured_workload</span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-white border border-[#F3D9CE] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#009770] text-[18px]">check_circle</span>
                    <span className="font-semibold text-[#0A2A22]">Transparansi ke Anggota (RAT)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-[10px] font-bold">
                    Terpenuhi
                  </span>
                </div>
                <p className="text-[11px] text-[#6B5A55] pl-6">
                  Dokumen siap lampiran buku laporan pertanggungjawaban pengurus dan pengawas.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#F3D9CE] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#009770] text-[18px]">check_circle</span>
                    <span className="font-semibold text-[#0A2A22]">Pengawasan Berbasis Risiko</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular text-[10px] font-bold">
                    Terpenuhi
                  </span>
                </div>
                <p className="text-[11px] text-[#6B5A55] pl-6">
                  Uji Benford's Law &amp; jejak audit digital terenkripsi aktif 24/7 tanpa celah manipulasi.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#F3D9CE] flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6B5F00] text-[18px]">pending</span>
                    <span className="font-semibold text-[#0A2A22]">Kelayakan LPDB / Bank</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFF637] text-[#6B5F00] font-mono-tabular text-[10px] font-bold">
                    Dalam Pemenuhan
                  </span>
                </div>
                <p className="text-[11px] text-[#6B5A55] pl-6">
                  Dokumen kepatuhan NPL &amp; rasio integritas kas memenuhi kriteria kemitraan pembiayaan.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F3D9CE]">
            <p className="text-[10px] text-[#6B5A55] italic">
              <strong>Catatan:</strong> Contoh simulasi; syarat sebenarnya ditetapkan oleh Kementerian Koperasi &amp; UKM, OJK, dan lembaga penyalur dana mitra.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Baris Bawah: Sampel Audit Forensik & Rekam Notulensi Pengawas */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 page-break-inside-avoid">
        {/* Tabel Kiri (8 cols): Akun Kas & Pos Buku dengan Perhatian Khusus */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#6B5A55] block font-semibold">
                  Sampel Audit Forensik
                </span>
                <h3 className="font-display font-bold text-base text-[#0A2A22]">
                  Akun Kas &amp; Pos Buku dengan Perhatian Khusus
                </h3>
              </div>
              <span className="font-mono-tabular text-xs text-[#6B5A55]">
                Tercatat 3 pos akun perlu evaluasi
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#F3D9CE]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF8F4] border-b border-[#F3D9CE] font-mono-tabular text-[#6B5A55]">
                    <th className="py-3 px-4 font-semibold">KODE &amp; NAMA AKUN</th>
                    <th className="py-3 px-4 font-semibold">JENIS DEVIASI</th>
                    <th className="py-3 px-4 font-semibold text-center">TGL INVESTIGASI</th>
                    <th className="py-3 px-4 font-semibold">PUTUSAN PENGURUS</th>
                    <th className="py-3 px-4 font-semibold text-right">STATUS AKHIR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3D9CE]">
                  <tr className="bg-white hover:bg-[#F3FAF7]">
                    <td className="py-3.5 px-4 font-mono-tabular">
                      <div className="font-bold text-[#0A2A22]">#K-104</div>
                      <div className="text-[11px] text-[#6B5A55]">Kas Operasional &amp; Cadangan</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 font-medium text-[#0A2A22]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6B5F00]" />
                        Deviasi Benford Digit 5 &amp; 9
                      </div>
                      <div className="text-[11px] text-[#6B5A55]">Varian transaksi ganjil berulang</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono-tabular text-[#6B5A55]">
                      12 Okt 2024
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#0A2A22]">Rekonsiliasi Bank &amp; Kas Fisik</span>
                      <p className="text-[11px] text-[#6B5A55]">Fisik kas klop, penyesuaian slip kasir.</p>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular font-bold text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#009770]" />
                        Terselesaikan
                      </span>
                    </td>
                  </tr>

                  <tr className="bg-[#FFF8F4]/30 hover:bg-[#F3FAF7]">
                    <td className="py-3.5 px-4 font-mono-tabular">
                      <div className="font-bold text-[#0A2A22]">#K-109</div>
                      <div className="text-[11px] text-[#6B5A55]">Kas Kasir Cabang Barat</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 font-medium text-[#CE2F2E]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#CE2F2E] radar-pulse-red" />
                        Lonjakan Trx Malam Hari
                      </div>
                      <div className="text-[11px] text-[#6B5A55]">Input di luar jam kerja operasional</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono-tabular text-[#6B5A55]">
                      04 Nov 2024
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#0A2A22]">BAP Kasir &amp; Teguran Tertulis</span>
                      <p className="text-[11px] text-[#6B5A55]">Klarifikasi antrean tutup buku harian.</p>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF637] text-[#6B5F00] font-mono-tabular font-bold text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6B5F00]" />
                        Pengawasan Lanjutan
                      </span>
                    </td>
                  </tr>

                  <tr className="bg-white hover:bg-[#F3FAF7]">
                    <td className="py-3.5 px-4 font-mono-tabular">
                      <td className="font-bold text-[#0A2A22]">#S-201</td>
                      <div className="text-[11px] text-[#6B5A55]">Simpanan Sukarela Anggota</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 font-medium text-[#0A2A22]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#009770]" />
                        Frekuensi Setoran Cepat
                      </div>
                      <div className="text-[11px] text-[#6B5A55]">5 trx berturut-turut dalam 30 menit</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono-tabular text-[#6B5A55]">
                      28 Nov 2024
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#0A2A22]">Konfirmasi Bukti Transfer VA</span>
                      <p className="text-[11px] text-[#6B5A55]">Pemecahan setoran modal terverifikasi.</p>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E0F4EE] text-[#009770] font-mono-tabular font-bold text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#009770]" />
                        Ditoleransi / Wajar
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-mono-tabular text-[#6B5A55] mt-4 pt-3 border-t border-[#F3D9CE]">
            <span>Seluruh data anomali tersimpan dalam log audit terenkripsi SHA-256</span>
            <span className="text-[#009770] font-bold">Arsip Terverifikasi</span>
          </div>
        </div>

        {/* Panel Kanan (4 cols): Notulensi Pengawas */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#6B5A55] block font-semibold">
                  Rekam Jejak Otoritas
                </span>
                <h3 className="font-display font-bold text-base text-[#0A2A22]">
                  Notulensi Pengawas
                </h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#E0F4EE] text-[#009770] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">history_edu</span>
              </div>
            </div>

            <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#F3D9CE]">
              {supervisorNotes.map((note) => (
                <div key={note.id} className="relative">
                  <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#009770] border-2 border-white" />
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono-tabular text-[11px] font-bold text-[#009770]">
                      {note.date} · {note.time}
                    </span>
                    {note.isFinal && (
                      <span className="font-mono-tabular text-[9px] px-1.5 py-0.5 rounded bg-[#E0F4EE] text-[#009770] font-bold">
                        FINAL
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-xs text-[#0A2A22]">{note.title}</h4>
                  <p className="text-[11px] text-[#6B5A55] mt-1 leading-snug">{note.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F3D9CE] flex items-center justify-between text-xs font-mono-tabular">
            <span className="text-[#6B5A55]">Tanda Tangan Elektronik:</span>
            <span className="font-bold text-[#009770]">BS-9942-VERIFIED</span>
          </div>
        </div>
      </section>

      {/* 5. PRATINJAU LEMBAR CETAK RAT (FORMAL KOP KOPERASI) */}
      <section className="glass-panel p-8 bg-white border border-[#F3D9CE] shadow-md relative overflow-hidden page-break-inside-avoid">
        {/* Watermark in background */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none select-none">
          <span className="material-symbols-outlined text-[280px] text-[#009770]">verified_user</span>
        </div>

        {/* Formal Header Kop Koperasi */}
        <div className="border-b-2 border-[#0A2A22] pb-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#009770] text-white flex items-center justify-center font-bold font-display text-2xl shadow-sm">
              MS
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-[#0A2A22] tracking-tight uppercase">
                Koperasi Simpan Pinjam Mitra Sejahtera
              </h4>
              <p className="font-mono-tabular text-xs text-[#6B5A55]">
                Badan Hukum No. AHU-0012/2018 · Izin Usaha Simpan Pinjam Kemenkop-UKM RI
              </p>
              <p className="text-xs text-[#6B5A55]">
                Jl. Pemuda No. 88, Kebayoran Baru, Jakarta Selatan · Telp: (021) 7289-0011 · www.mitrasejahtera.coop
              </p>
            </div>
          </div>

          {/* Stempel Digital Verifikasi */}
          <div className="border-2 border-[#009770] rounded-xl px-4 py-2 flex flex-col items-center justify-center bg-[#E0F4EE]/50 text-center">
            <span className="font-mono-tabular text-[9px] tracking-widest text-[#009770] uppercase font-bold">
              Stempel Digital Audit
            </span>
            <span className="font-mono-tabular text-xs font-bold text-[#009770] tracking-wider">
              VERIFIED AUDIT 2024
            </span>
            <span className="font-mono-tabular text-[9px] text-[#009770]/80">
              HASH: 8f4a-c019-9770-amankas
            </span>
          </div>
        </div>

        {/* Judul Lampiran Dokumen */}
        <div className="text-center my-6">
          <span className="font-mono-tabular text-xs text-[#009770] font-bold uppercase tracking-wider block">
            Lampiran Resmi Dokumen RAT Buku 2024
          </span>
          <h5 className="font-display text-xl font-bold text-[#0A2A22] mt-1">
            LEMBAR PENGESAHAN INTEGRITAS TATA KELOLA KAS
          </h5>
          <p className="text-xs text-[#6B5A55] max-w-2xl mx-auto mt-1 leading-relaxed">
            Berdasarkan pemeriksaan algoritma forensik AmanKas dan evaluasi dewan pengawas, pembukuan dinyatakan memiliki indeks keandalan <strong>{integrityScore}/100 (Baik &amp; Terkendali)</strong> tanpa temuan indikasi kecurangan material.
          </p>
        </div>

        {/* Tiga Tanda Tangan Formal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 mt-6 border-t border-dashed border-[#F3D9CE]">
          {/* Verifikator 1: Bendahara */}
          <div className="flex flex-col items-center text-center">
            <span className="text-xs text-[#6B5A55] mb-12">Disiapkan &amp; Diverifikasi oleh:</span>
            <div className="w-36 h-0.5 bg-[#0A2A22]/40 mb-2" />
            <span className="font-bold text-xs text-[#0A2A22]">Sari Wulandari, S.E.</span>
            <span className="font-mono-tabular text-[11px] text-[#009770] font-medium">Bendahara KSP Mitra Sejahtera</span>
            <span className="font-mono-tabular text-[10px] text-[#6B5A55]">NIK Bendahara: 3171-8840-02</span>
          </div>

          {/* Verifikator 2: Ketua Pengawas */}
          <div className="flex flex-col items-center text-center">
            <span className="text-xs text-[#6B5A55] mb-12">Disetujui &amp; Disahkan oleh:</span>
            <div className="w-36 h-0.5 bg-[#0A2A22]/40 mb-2" />
            <span className="font-bold text-xs text-[#0A2A22]">Bambang Irawan, Ak., CA</span>
            <span className="font-mono-tabular text-[11px] text-[#009770] font-medium">Ketua Dewan Pengawas</span>
            <span className="font-mono-tabular text-[10px] text-[#6B5A55]">Reg. Akuntan: K-99120-OJK</span>
          </div>

          {/* Verifikator 3: Ketua Umum */}
          <div className="flex flex-col items-center text-center">
            <span className="text-xs text-[#6B5A55] mb-12">Mengetahui:</span>
            <div className="w-36 h-0.5 bg-[#0A2A22]/40 mb-2" />
            <span className="font-bold text-xs text-[#0A2A22]">Drs. H. Hendro Kusumo</span>
            <span className="font-mono-tabular text-[11px] text-[#009770] font-medium">Ketua Umum Pengurus</span>
            <span className="font-mono-tabular text-[10px] text-[#6B5A55]">Masa Bakti: 2022 - 2025</span>
          </div>
        </div>
      </section>
    </div>
  );
};
