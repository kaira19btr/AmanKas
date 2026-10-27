/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppMode, ActiveTab } from '../types';

interface IndicatorItem {
  id: string;
  name: string;
  description: string;
  pillar: 'Data & Pencatatan' | 'SDM & Literasi' | 'Pengendalian Internal' | 'Analitik & Tata Kelola';
  status: 'terpenuhi' | 'perlu_perhatian' | 'belum_ada_data';
  actualValue: string;
  targetMinimum: string;
  evaluationMethod: 'otomatis' | 'manual_sop';
  targetTab: ActiveTab;
}

interface IndicatorCenterViewProps {
  mode: AppMode;
  onNavigateToTab: (tab: ActiveTab) => void;
}

export const IndicatorCenterView: React.FC<IndicatorCenterViewProps> = ({
  mode,
  onNavigateToTab,
}) => {
  const indicators: IndicatorItem[] = [
    // Pilar 1: Data & Pencatatan
    {
      id: 'IND-101',
      name: 'Kelengkapan Pencatatan Harian',
      description: 'Seluruh transaksi kas dan bank tercatat berurutan tanpa jeda tanggal yang terputus.',
      pillar: 'Data & Pencatatan',
      status: 'terpenuhi',
      actualValue: '98.5% hari aktif tercatat',
      targetMinimum: '≥ 95.0%',
      evaluationMethod: 'otomatis',
      targetTab: 'persiapan_data',
    },
    {
      id: 'IND-102',
      name: 'Proporsi Transaksi Nontunai (Digitalisasi)',
      description: 'Penerimaan melalui QRIS dan transfer perbankan untuk meminimalkan risiko selisih kas fisik.',
      pillar: 'Data & Pencatatan',
      status: 'terpenuhi',
      actualValue: mode === 'koperasi' ? '72.4% nontunai' : '66.0% nontunai',
      targetMinimum: '≥ 40.0%',
      evaluationMethod: 'otomatis',
      targetTab: mode === 'koperasi' ? 'pemantauan_langsung' : 'rapor_kas',
    },
    {
      id: 'IND-103',
      name: 'Ketiadaan Selisih Rekonsiliasi Kas',
      description: 'Kecocokan silang buku kas harian terhadap rekening koran bank atau laporan settlement QRIS.',
      pillar: 'Data & Pencatatan',
      status: 'terpenuhi',
      actualValue: '94.2% cocok (tanpa selisih material)',
      targetMinimum: '≥ 90.0%',
      evaluationMethod: 'otomatis',
      targetTab: 'persiapan_data',
    },

    // Pilar 2: SDM & Literasi
    {
      id: 'IND-201',
      name: 'Rotasi Petugas Kasir / Pemegang Kas',
      description: 'Rotasi berkala tanggung jawab kasir teller untuk mencegah dominasi kewenangan tanpa pengawasan.',
      pillar: 'SDM & Literasi',
      status: 'terpenuhi',
      actualValue: 'Rotasi tiap 3 bulan berjalan',
      targetMinimum: 'Maksimal 6 bulan berturut',
      evaluationMethod: 'manual_sop',
      targetTab: mode === 'koperasi' ? 'kontrol_internal' : 'kasir_selisih_kas',
    },
    {
      id: 'IND-202',
      name: 'Rasio Transaksi Ganjil per Petugas',
      description: 'Konsentrasi frekuensi transaksi berisiko tinggi pada petugas teller atau admin tertentu.',
      pillar: 'SDM & Literasi',
      status: 'perlu_perhatian',
      actualValue: '1 kasir melayani 42% peringatan',
      targetMinimum: 'Maksimal 30% per petugas',
      evaluationMethod: 'otomatis',
      targetTab: mode === 'koperasi' ? 'pemantauan_langsung' : 'kasir_selisih_kas',
    },
    {
      id: 'IND-203',
      name: 'Indeks Pemisahan Keuangan Pribadi–Usaha',
      description: 'Derajat kedisiplinan tidak menarik kas usaha untuk kebutuhan rumah tangga di luar gaji/prive resmi.',
      pillar: 'SDM & Literasi',
      status: 'terpenuhi',
      actualValue: '0.88 (88% terpisah rapi)',
      targetMinimum: '≥ 0.80 (80%)',
      evaluationMethod: 'otomatis',
      targetTab: mode === 'koperasi' ? 'pihak_terkait' : 'pencampuran_uang',
    },

    // Pilar 3: Pengendalian Internal
    {
      id: 'IND-301',
      name: 'Otorisasi Ganda Transaksi Besar',
      description: 'Kewajiban dua tanda tangan persetujuan untuk pengeluaran di atas ambang batas (Rp 10 juta).',
      pillar: 'Pengendalian Internal',
      status: 'terpenuhi',
      actualValue: '100% transaksi > Rp10jt berotorisasi ganda',
      targetMinimum: '100%',
      evaluationMethod: 'otomatis',
      targetTab: mode === 'koperasi' ? 'kontrol_internal' : 'beranda_usaha',
    },
    {
      id: 'IND-302',
      name: 'Pemenuhan Checklist Tinjauan Pengawas',
      description: 'Verifikasi lengkap 4 butir (bukti fisik, saldo brankas, klarifikasi pihak terkait, rekonsiliasi).',
      pillar: 'Pengendalian Internal',
      status: 'terpenuhi',
      actualValue: '4 dari 4 butir terpenuhi pada tiap kasus',
      targetMinimum: '4 dari 4 butir (100%)',
      evaluationMethod: 'otomatis',
      targetTab: mode === 'koperasi' ? 'kontrol_internal' : 'peringatan_saya',
    },
    {
      id: 'IND-303',
      name: 'Integritas Rantai Hash Audit Append-Only',
      description: 'Pemeriksaan berantai SHA-256 untuk mendeteksi rekayasa atau penyuntingan catatan tanpa izin.',
      pillar: 'Pengendalian Internal',
      status: 'terpenuhi',
      actualValue: 'Rantai Hash Utuh (100% lolos verifikasi)',
      targetMinimum: '100% Utuh (Tanpa putus rantai)',
      evaluationMethod: 'otomatis',
      targetTab: mode === 'koperasi' ? 'sumber_data_privasi' : 'izin_data_saya',
    },

    // Pilar 4: Analitik & Tata Kelola
    {
      id: 'IND-401',
      name: 'Keselarasan Benford Digit Pertama & Kedua',
      description: 'Tingkat kesesuaian distribusi digit angka wajar menurut ambang Nigrini (2012) MAD d1 dan d2.',
      pillar: 'Analitik & Tata Kelola',
      status: 'terpenuhi',
      actualValue: 'MAD d1: 0.0052 &bull; MAD d2: 0.0071 (Sangat Selaras)',
      targetMinimum: 'd1 ≤ 0.012 &bull; d2 ≤ 0.010',
      evaluationMethod: 'otomatis',
      targetTab: mode === 'koperasi' ? 'kesehatan_akun' : 'beranda_usaha',
    },
    {
      id: 'IND-402',
      name: 'Toleransi Anomali Isolation Forest (P90 & P98)',
      description: 'Pengendalian persentase transaksi yang jatuh pada kuantil risiko tinggi dan tindak lanjut 48 jam.',
      pillar: 'Analitik & Tata Kelola',
      status: 'perlu_perhatian',
      actualValue: '2 transaksi Kuning mendekati 48 jam',
      targetMinimum: '0 transaksi melewati 48 jam',
      evaluationMethod: 'otomatis',
      targetTab: mode === 'koperasi' ? 'antrean_pengawas' : 'peringatan_saya',
    },
    {
      id: 'IND-403',
      name: 'Rilis Bahan RAT Berkala & Transparansi Anggota',
      description: 'Penerbitan laporan agregat tahunan yang disetujui pengawas tanpa membuka data sensitif pribadi.',
      pillar: 'Analitik & Tata Kelola',
      status: 'terpenuhi',
      actualValue: 'Bahan RAT 2026 Siap Rilis',
      targetMinimum: 'Tepat waktu sebelum agenda RAT',
      evaluationMethod: 'manual_sop',
      targetTab: mode === 'koperasi' ? 'bahan_rat' : 'rapor_kas',
    },
  ];

  const pillars = [
    'Data & Pencatatan',
    'SDM & Literasi',
    'Pengendalian Internal',
    'Analitik & Tata Kelola',
  ] as const;

  const totalMet = indicators.filter((i) => i.status === 'terpenuhi').length;
  const totalAttention = indicators.filter((i) => i.status === 'perlu_perhatian').length;

  return (
    <div className="space-y-6 font-ui">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-[#031B15] to-[#0A2A22] rounded-3xl text-white border border-[#00B386]/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#84F8CA] text-2xl">grid_view</span>
            <h2 className="font-ui text-xl font-bold text-white">
              Pusat Indikator Tata Kelola (4 Pilar)
            </h2>
          </div>
          <p className="text-xs text-gray-300">
            Pemetaan komprehensif 12 indikator pengendalian internal, kesehatan data, SDM, dan analitik berbasis esai SADAR.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{totalMet} Terpenuhi</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{totalAttention} Perlu Perhatian</span>
          </div>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="space-y-6">
        {pillars.map((pillarName, pIdx) => {
          const pillarIndicators = indicators.filter((i) => i.pillar === pillarName);
          return (
            <div key={pillarName} className="p-6 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#F3D9CE] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-[#E0F4EE] text-[#009770] font-mono font-bold flex items-center justify-center text-xs">
                    P{pIdx + 1}
                  </span>
                  <h3 className="font-ui font-bold text-base text-[#0A2A22]">
                    Pilar {pIdx + 1}: {pillarName}
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#6B5A55]">
                  {pillarIndicators.filter((i) => i.status === 'terpenuhi').length}/{pillarIndicators.length} Terpenuhi
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pillarIndicators.map((ind) => (
                  <div
                    key={ind.id}
                    className="p-4 rounded-2xl border border-[#F3D9CE] bg-[#FFF8F4]/40 hover:bg-white hover:border-[#009770] transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-[#6B5A55]">
                          {ind.id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-mono font-bold px-2 py-0.2 rounded ${
                              ind.evaluationMethod === 'otomatis'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {ind.evaluationMethod === 'otomatis' ? 'Otomatis via SADAR' : 'Manual / SOP'}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              ind.status === 'terpenuhi'
                                ? 'bg-emerald-500'
                                : ind.status === 'perlu_perhatian'
                                ? 'bg-amber-500'
                                : 'bg-gray-400'
                            }`}
                          />
                        </div>
                      </div>

                      <h4 className="font-bold text-xs text-[#0A2A22]">
                        {ind.name}
                      </h4>
                      <p className="text-[11px] text-[#6B5A55] leading-relaxed">
                        {ind.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#F3D9CE]/60">
                      <div className="text-[11px] font-mono">
                        <span className="text-[#6B5A55] block">Nilai Aktual:</span>
                        <strong
                          className={
                            ind.status === 'terpenuhi'
                              ? 'text-[#009770]'
                              : ind.status === 'perlu_perhatian'
                              ? 'text-amber-800'
                              : 'text-gray-700'
                          }
                          dangerouslySetInnerHTML={{ __html: ind.actualValue }}
                        />
                      </div>
                      <div className="text-[10px] font-mono text-[#6B5A55]">
                        Target Min: {ind.targetMinimum}
                      </div>

                      <button
                        onClick={() => onNavigateToTab(ind.targetTab)}
                        className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-[#E0F4EE] border border-[#F3D9CE] text-[11px] font-bold text-[#0A2A22] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Lihat Modul Terkait</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
