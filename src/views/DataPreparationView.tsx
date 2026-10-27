/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppMode } from '../types';
import { soundEngine } from '../utils/soundEffects';

interface DataPreparationViewProps {
  mode: AppMode;
  onUpdateReconciliationScore?: (matchPct: number, delta: number) => void;
}

interface ValidationRowResult {
  rowNumber: number;
  data: Record<string, string>;
  isValid: boolean;
  errors: string[];
}

interface ReconcileItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  source: 'buku_kas' | 'mutasi_bank_qris';
}

export const DataPreparationView: React.FC<DataPreparationViewProps> = ({
  mode,
  onUpdateReconciliationScore,
}) => {
  const [activeTab, setActiveTab] = useState<'templat' | 'kamus' | 'validasi' | 'rekonsiliasi'>('templat');

  // Validation Engine State
  const [validationRun, setValidationRun] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [passedRows, setPassedRows] = useState(0);
  const [rejectedRows, setRejectedRows] = useState<ValidationRowResult[]>([]);

  // Reconciliation Engine State
  const [reconciliationRun, setReconciliationRun] = useState(false);
  const [matchPercentage, setMatchPercentage] = useState(94.2);
  const [totalDifference, setTotalDifference] = useState(1500000);
  const [unmatchedCash, setUnmatchedCash] = useState<ReconcileItem[]>([]);
  const [unmatchedBank, setUnmatchedBank] = useState<ReconcileItem[]>([]);
  const [isSavedIndicator, setIsSavedIndicator] = useState(false);

  // CSV Template Generators
  const handleDownloadTemplate = (targetMode: AppMode) => {
    soundEngine.playSuccess();
    let csvContent = '';
    let fileName = '';

    if (targetMode === 'koperasi') {
      fileName = 'templat_buku_kas_koperasi_sadar.csv';
      csvContent = `tanggal,nomor_bukti,kode_akun,nama_akun,uraian,debet,kredit,saldo,id_petugas,nama_anggota\n` +
        `2026-10-24,BKM-001,#K-101,Kas Operasional Teller,Penerimaan angsuran pinjaman anggota,1500000,0,1500000,KSR-01,Ahmad Subarjo\n` +
        `2026-10-24,BKK-002,#K-102,Kas Bank Utama,Pencairan kredit modal usaha mikro,0,12000000,245000000,ADM-02,Siti Aminah\n` +
        `2026-10-25,BKM-003,#K-103,Kas Simpanan Wajib,Setoran simpanan wajib bulanan,250000,0,250000,KSR-01,Budi Santoso\n` +
        `2026-10-25,BKM-004,#K-104,Kas Cadangan Likuiditas,Penempatan dana antar koperasi,50000000,0,185000000,MGR-01,KSP Mitra Bersama`;
    } else {
      fileName = 'templat_catatan_kas_umkm_sadar.csv';
      csvContent = `tanggal,waktu,no_struk,kategori,keterangan,metode_bayar,masuk,keluar,nama_kasir,dokumen_ada\n` +
        `2026-10-24,08:30,STR-1001,Penjualan,Pembelian sembako grosir,QRIS,450000,0,Rina Kasir,Ya\n` +
        `2026-10-24,10:15,STR-1002,Penjualan,Bahan pokok & minyak goreng,Tunai,125000,0,Rina Kasir,Ya\n` +
        `2026-10-24,14:20,BKK-101,Operasional,Belanja stok mie instan supplier,Transfer,0,1850000,Budi Gudang,Ya\n` +
        `2026-10-25,11:45,BKK-102,Pribadi,Tarik tunai keperluan rumah tangga,Tunai,0,300000,Owner,Tidak`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Run File Validation Engine
  const runFileValidation = () => {
    soundEngine.playProcessing();

    // Simulated parsing of 120 imported rows with intentional edge cases
    const dummyTotal = 125;
    const errors: ValidationRowResult[] = [
      {
        rowNumber: 14,
        data: { tanggal: '2026-13-45', uraian: 'Penerimaan simpanan sukarela', nominal: '2.500.000' },
        isValid: false,
        errors: ['Format tanggal tidak valid (harus YYYY-MM-DD)', 'Nominal mengandung titik pemisah ribuan bukan murni angka'],
      },
      {
        rowNumber: 42,
        data: { tanggal: '2026-10-24', uraian: '', nominal: '15000000' },
        isValid: false,
        errors: ['Kolom wajib "uraian/keterangan" kosong'],
      },
      {
        rowNumber: 78,
        data: { tanggal: '2026-10-25', uraian: 'Setoran kasir', nominal: '-450000' },
        isValid: false,
        errors: ['Nilai nominal negatif tidak diperkenankan pada kolom debet/kredit terpisah'],
      },
      {
        rowNumber: 103,
        data: { tanggal: '2026-10-25', nomor_bukti: 'BKM-001', uraian: 'Duplikasi transaksi identik', nominal: '1500000' },
        isValid: false,
        errors: ['Terdeteksi duplikasi nomor bukti dan nominal pada hari yang sama (BKM-001)'],
      },
    ];

    setTotalRows(dummyTotal);
    setRejectedRows(errors);
    setPassedRows(dummyTotal - errors.length);
    setValidationRun(true);
  };

  // Run Dual-File Cash vs Bank/QRIS Reconciliation Engine
  const runReconciliation = () => {
    soundEngine.playProcessing();

    const unmatchedInCash: ReconcileItem[] = [
      {
        id: 'CSH-901',
        date: '2026-10-23',
        description: 'Penjualan QRIS kasir malam (tertunda settlement bank)',
        amount: 850000,
        source: 'buku_kas',
      },
      {
        id: 'CSH-908',
        date: '2026-10-25',
        description: 'Pengeluaran kas kecil operasional tanpa nota bank',
        amount: 650000,
        source: 'buku_kas',
      },
    ];

    const unmatchedInBank: ReconcileItem[] = [
      {
        id: 'BNK-702',
        date: '2026-10-24',
        description: 'Biaya administrasi bulanan bank & MDR QRIS',
        amount: 45000,
        source: 'mutasi_bank_qris',
      },
      {
        id: 'BNK-710',
        date: '2026-10-25',
        description: 'Bunga tabungan giro akhir periode',
        amount: 125000,
        source: 'mutasi_bank_qris',
      },
    ];

    setUnmatchedCash(unmatchedInCash);
    setUnmatchedBank(unmatchedInBank);
    setMatchPercentage(94.2);
    setTotalDifference(1500000);
    setReconciliationRun(true);
    setIsSavedIndicator(false);
  };

  const handleSaveIndicator = () => {
    soundEngine.playSuccess();
    setIsSavedIndicator(true);
    if (onUpdateReconciliationScore) {
      onUpdateReconciliationScore(matchPercentage, totalDifference);
    }
  };

  return (
    <div className="space-y-6 font-ui">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-[#031B15] to-[#0A2A22] rounded-3xl text-white border border-[#00B386]/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#84F8CA] text-2xl">dataset</span>
            <h2 className="font-ui text-xl font-bold text-white">
              Persiapan Data, Kamus, Validasi &amp; Rekonsiliasi
            </h2>
          </div>
          <p className="text-xs text-gray-300">
            Jaminan kualitas input data kas sebelum pemrosesan statistik Benford &amp; deteksi anomali Isolation Forest.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center p-1 bg-white/10 rounded-2xl border border-white/10 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('templat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'templat' ? 'bg-[#009770] text-white shadow-sm' : 'text-gray-300 hover:text-white'
            }`}
          >
            Unduh Templat
          </button>
          <button
            onClick={() => setActiveTab('kamus')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'kamus' ? 'bg-[#009770] text-white shadow-sm' : 'text-gray-300 hover:text-white'
            }`}
          >
            Kamus Data
          </button>
          <button
            onClick={() => setActiveTab('validasi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'validasi' ? 'bg-[#009770] text-white shadow-sm' : 'text-gray-300 hover:text-white'
            }`}
          >
            Validasi Impor
          </button>
          <button
            onClick={() => setActiveTab('rekonsiliasi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'rekonsiliasi' ? 'bg-[#009770] text-white shadow-sm' : 'text-gray-300 hover:text-white'
            }`}
          >
            Rekonsiliasi Bank/QRIS
          </button>
        </div>
      </div>

      {/* TAB 1: UNDUH TEMPLAT CSV */}
      {activeTab === 'templat' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Koperasi Template */}
          <div className="p-6 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-2xl bg-[#E0F4EE] text-[#009770] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">account_balance</span>
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#E0F4EE] text-[#009770] border border-[#009770]/30 uppercase">
                  Format Koperasi (KSP)
                </span>
              </div>
              <div>
                <h3 className="font-ui font-bold text-base text-[#0A2A22]">
                  Templat CSV Buku Kas &amp; Jurnal Koperasi
                </h3>
                <p className="text-xs text-[#6B5A55] mt-1 leading-relaxed">
                  Struktur baku untuk koperasi simpan pinjam: memuat tanggal transaksi, nomor bukti kuitansi (BKM/BKK), kode akun, debet, kredit, saldo berjalan, ID petugas kasir, dan nama anggota.
                </p>
              </div>

              <div className="p-3 bg-[#FFF8F4] rounded-2xl border border-[#F3D9CE] text-[11px] font-mono text-[#6B5A55] space-y-1">
                <div className="font-bold text-[#0A2A22]">Header Kolom Baku:</div>
                <div className="break-all text-[#009770]">
                  tanggal, nomor_bukti, kode_akun, nama_akun, uraian, debet, kredit, saldo, id_petugas, nama_anggota
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDownloadTemplate('koperasi')}
              className="w-full py-2.5 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Unduh Templat CSV Koperasi (.csv)
            </button>
          </div>

          {/* Card UMKM Template */}
          <div className="p-6 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-2xl bg-[#FFF637]/40 text-[#6B5F00] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">storefront</span>
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#FFF637]/30 text-[#6B5F00] border border-[#6B5F00]/30 uppercase">
                  Format UMKM / Toko
                </span>
              </div>
              <div>
                <h3 className="font-ui font-bold text-base text-[#0A2A22]">
                  Templat CSV Kasir POS &amp; Arus Kas UMKM
                </h3>
                <p className="text-xs text-[#6B5A55] mt-1 leading-relaxed">
                  Struktur sederhana untuk warung dan toko mikro: tanggal, waktu, nomor struk penjualan, kategori kas (Penjualan/Operasional/Pribadi), metode bayar (Tunai/QRIS/Transfer), uang masuk, keluar, dan kelengkapan nota.
                </p>
              </div>

              <div className="p-3 bg-[#FFF8F4] rounded-2xl border border-[#F3D9CE] text-[11px] font-mono text-[#6B5A55] space-y-1">
                <div className="font-bold text-[#0A2A22]">Header Kolom Baku:</div>
                <div className="break-all text-[#6B5F00]">
                  tanggal, waktu, no_struk, kategori, keterangan, metode_bayar, masuk, keluar, nama_kasir, dokumen_ada
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDownloadTemplate('umkm')}
              className="w-full py-2.5 rounded-xl bg-[#86513D] hover:bg-[#724433] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Unduh Templat CSV UMKM (.csv)
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: KAMUS DATA LENGKAP */}
      {activeTab === 'kamus' && (
        <div className="p-6 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-ui font-bold text-base text-[#0A2A22]">
                Kamus Data Standar (Data Dictionary)
              </h3>
              <p className="text-xs text-[#6B5A55]">
                Spesifikasi teknis kolom, tipe data, keharusan, contoh nilai, dan aturan validasi integritas SADAR.
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 bg-gray-100 rounded-full text-gray-700">
              Standar ISO-8601 &amp; Akuntansi Indonesia
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#F3D9CE]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8F4] border-b border-[#F3D9CE] font-semibold text-[#0A2A22]">
                <tr>
                  <th className="py-3 px-4">Nama Kolom</th>
                  <th className="py-3 px-3">Tipe Data</th>
                  <th className="py-3 px-3">Sifat</th>
                  <th className="py-3 px-4">Contoh Nilai</th>
                  <th className="py-3 px-4">Aturan Validasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3D9CE]/60 font-ui text-[#6B5A55]">
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-bold text-[#0A2A22]">tanggal</td>
                  <td className="py-3 px-3 font-mono">Date (ISO)</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">Wajib</span></td>
                  <td className="py-3 px-4 font-mono">2026-10-24</td>
                  <td className="py-3 px-4">Format YYYY-MM-DD valid; tidak boleh di masa depan; tidak boleh lebih dari 5 tahun lampau.</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-bold text-[#0A2A22]">nomor_bukti / no_struk</td>
                  <td className="py-3 px-3 font-mono">String</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">Wajib</span></td>
                  <td className="py-3 px-4 font-mono">BKM-2026-0041</td>
                  <td className="py-3 px-4">Identifier unik per transaksi; dicek untuk deteksi kuitansi ganda (double-entry).</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-bold text-[#0A2A22]">kode_akun</td>
                  <td className="py-3 px-3 font-mono">String</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">Wajib</span></td>
                  <td className="py-3 px-4 font-mono">#K-104</td>
                  <td className="py-3 px-4">Kode akun buku besar KSP; digunakan untuk agregasi distribusi digit Benford d1 dan d2.</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-bold text-[#0A2A22]">uraian / keterangan</td>
                  <td className="py-3 px-3 font-mono">String</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">Wajib</span></td>
                  <td className="py-3 px-4">Setoran angsuran pinjaman ke-4</td>
                  <td className="py-3 px-4">Minimal 3 karakter; tidak boleh kosong atau hanya spasi; diperiksa untuk red-flag teks "rekayasa/koreksi".</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-bold text-[#0A2A22]">debet / masuk</td>
                  <td className="py-3 px-3 font-mono">Numeric</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">Wajib*</span></td>
                  <td className="py-3 px-4 font-mono">1500000</td>
                  <td className="py-3 px-4">Angka murni tanpa simbol Rp atau titik ribuan; harus $\ge$ 0; salah satu dari debet/kredit harus $\gt$ 0.</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-bold text-[#0A2A22]">kredit / keluar</td>
                  <td className="py-3 px-3 font-mono">Numeric</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">Wajib*</span></td>
                  <td className="py-3 px-4 font-mono">0</td>
                  <td className="py-3 px-4">Angka murni tanpa simbol mata uang; harus $\ge$ 0.</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-bold text-[#0A2A22]">id_petugas / nama_kasir</td>
                  <td className="py-3 px-3 font-mono">String</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">Opsional</span></td>
                  <td className="py-3 px-4 font-mono">KSR-01</td>
                  <td className="py-3 px-4">Dipakai untuk mengevaluasi fitur Shapley F5 (frekuensi harian per petugas).</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-bold text-[#0A2A22]">metode_bayar</td>
                  <td className="py-3 px-3 font-mono">Enum</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">Opsional</span></td>
                  <td className="py-3 px-4 font-mono">QRIS, Tunai, Transfer</td>
                  <td className="py-3 px-4">Pilihan nilai terbatas: [Tunai, QRIS, Transfer, EDC]; digunakan pada Rapor Kas UMKM.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VALIDASI BERKAS SAAT IMPOR */}
      {activeTab === 'validasi' && (
        <div className="p-6 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-ui font-bold text-base text-[#0A2A22]">
                Uji Validasi Integritas Berkas Impor
              </h3>
              <p className="text-xs text-[#6B5A55]">
                Pengecekan otomatis kolom wajib, format tanggal ISO, nilai nominal numerik, baris kosong, dan duplikasi.
              </p>
            </div>

            <button
              onClick={runFileValidation}
              className="px-5 py-2.5 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">play_circle</span>
              Jalankan Validasi Sampel (125 Baris)
            </button>
          </div>

          {validationRun ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#FFF8F4] border border-[#F3D9CE]">
                  <span className="text-[11px] text-[#6B5A55] font-semibold block">Tingkat Kelolosan Validasi</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold font-mono text-[#009770]">
                      {((passedRows / totalRows) * 100).toFixed(1)}%
                    </span>
                    <span className="text-xs text-[#6B5A55]">lolos audit format</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      style={{ width: `${(passedRows / totalRows) * 100}%` }}
                      className="bg-[#009770] h-full rounded-full"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-semibold block">Baris Lolos &amp; Siap Diolah</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold font-mono text-emerald-700">{passedRows}</span>
                    <span className="text-xs text-emerald-600">dari {totalRows} baris</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 mt-2 block font-mono">
                    Struktur &amp; tipe data sesuai standar
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                  <span className="text-[11px] text-rose-800 font-semibold block">Baris Ditolak (Perlu Perbaikan)</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold font-mono text-rose-700">{rejectedRows.length}</span>
                    <span className="text-xs text-rose-600">baris diisolasi</span>
                  </div>
                  <span className="text-[10px] text-rose-700 mt-2 block font-mono">
                    Dicegah mencemari baseline statistik
                  </span>
                </div>
              </div>

              {/* Rejected Rows Detail Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-ui font-semibold text-sm text-[#0A2A22] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-rose-600 text-sm">warning</span>
                    Daftar Baris Ditolak Beserta Alasan Spesifik
                  </h4>
                  <span className="text-xs text-[#6B5A55]">
                    {rejectedRows.length} kesalahan terdeteksi
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-rose-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-rose-50 border-b border-rose-200 font-semibold text-rose-900">
                      <tr>
                        <th className="py-2.5 px-4 w-20">Baris #</th>
                        <th className="py-2.5 px-4">Cuplikan Isi Baris</th>
                        <th className="py-2.5 px-4">Penyebab Penolakan / Error</th>
                        <th className="py-2.5 px-4 text-right">Rekomendasi Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                      {rejectedRows.map((r) => (
                        <tr key={r.rowNumber} className="hover:bg-rose-50/50">
                          <td className="py-3 px-4 font-mono font-bold text-rose-800">
                            #{r.rowNumber}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#0A2A22] max-w-xs truncate">
                            {JSON.stringify(r.data)}
                          </td>
                          <td className="py-3 px-4 space-y-1">
                            {r.errors.map((err, i) => (
                              <div key={i} className="text-rose-700 text-[11px] flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">close</span>
                                <span>{err}</span>
                              </div>
                            ))}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="px-2.5 py-1 rounded bg-white border border-rose-300 text-rose-700 font-semibold text-[10px]">
                              Koreksi di CSV Asal
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#FFF8F4] rounded-2xl border border-dashed border-[#F3D9CE] space-y-2">
              <span className="material-symbols-outlined text-3xl text-[#009770]">upload_file</span>
              <p className="text-xs text-[#6B5A55]">
                Klik tombol <strong>"Jalankan Validasi Sampel"</strong> di atas untuk menguji mesin validasi berkas impor terhadap 125 catatan transaksi.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REKONSILIASI KAS VS REKENING BANK / QRIS */}
      {activeTab === 'rekonsiliasi' && (
        <div className="p-6 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-ui font-bold text-base text-[#0A2A22]">
                Rekonsiliasi Kas: Buku Kas vs Mutasi Bank / QRIS
              </h3>
              <p className="text-xs text-[#6B5A55]">
                Pencocokan silang dua sumber: tanggal &plusmn;1 hari kalender dan nominal sama persis untuk memverifikasi ketiadaan selisih riil.
              </p>
            </div>

            <button
              onClick={runReconciliation}
              className="px-5 py-2.5 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">compare_arrows</span>
              Jalankan Rekonsiliasi Otomatis
            </button>
          </div>

          {reconciliationRun ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Reconciliation Scorecards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#E0F4EE] to-white border border-[#009770]/30">
                  <span className="text-[11px] text-[#009770] font-bold uppercase tracking-wider block">
                    Persentase Kecocokan Kas
                  </span>
                  <div className="text-3xl font-bold font-mono text-[#009770] mt-1">
                    {matchPercentage.toFixed(1)}%
                  </div>
                  <p className="text-[10px] text-[#6B5A55] mt-1">
                    Cocok berdasarkan aturan: Tanggal &plusmn;1 hari dan nominal identik.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFF8F4] border border-[#F3D9CE]">
                  <span className="text-[11px] text-[#86513D] font-bold uppercase tracking-wider block">
                    Total Selisih Bersih
                  </span>
                  <div className="text-3xl font-bold font-mono text-[#0A2A22] mt-1">
                    Rp {new Intl.NumberFormat('id-ID').format(totalDifference)}
                  </div>
                  <p className="text-[10px] text-[#6B5A55] mt-1">
                    {unmatchedCash.length} item buku kas + {unmatchedBank.length} item rekening belum cocok.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#F3D9CE] flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] text-[#6B5A55] font-bold uppercase tracking-wider block">
                      Status Indikator Tata Kelola
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mt-2 bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="material-symbols-outlined text-xs">verified</span>
                      Ketiadaan Selisih Material
                    </span>
                  </div>
                  <button
                    onClick={handleSaveIndicator}
                    disabled={isSavedIndicator}
                    className={`mt-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSavedIndicator
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-[#009770] hover:bg-[#008260] text-white shadow-xs'
                    }`}
                  >
                    {isSavedIndicator ? 'Tersimpan ke Pusat Indikator ✓' : 'Simpan Indikator Rekonsiliasi'}
                  </button>
                </div>
              </div>

              {/* Unmatched Items Tables (Two Sides) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Side A: Unmatched in Cashbook */}
                <div className="p-4 rounded-2xl bg-white border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">receipt</span>
                      Item di Buku Kas (Belum Ada di Mutasi Bank)
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-800">
                      {unmatchedCash.length} item
                    </span>
                  </div>

                  <div className="divide-y divide-amber-100 border border-amber-100 rounded-xl overflow-hidden">
                    {unmatchedCash.map((item) => (
                      <div key={item.id} className="p-3 bg-amber-50/40 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#0A2A22]">{item.description}</div>
                          <div className="text-[10px] font-mono text-[#6B5A55]">
                            {item.id} &bull; {item.date}
                          </div>
                        </div>
                        <div className="text-right font-mono font-bold text-amber-900">
                          Rp {new Intl.NumberFormat('id-ID').format(item.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Side B: Unmatched in Bank / QRIS Statement */}
                <div className="p-4 rounded-2xl bg-white border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">account_balance</span>
                      Item di Mutasi Bank/QRIS (Belum Tercatat di Kas)
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-800">
                      {unmatchedBank.length} item
                    </span>
                  </div>

                  <div className="divide-y divide-blue-100 border border-blue-100 rounded-xl overflow-hidden">
                    {unmatchedBank.map((item) => (
                      <div key={item.id} className="p-3 bg-blue-50/40 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-[#0A2A22]">{item.description}</div>
                          <div className="text-[10px] font-mono text-[#6B5A55]">
                            {item.id} &bull; {item.date}
                          </div>
                        </div>
                        <div className="text-right font-mono font-bold text-blue-900">
                          Rp {new Intl.NumberFormat('id-ID').format(item.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#FFF8F4] rounded-2xl border border-dashed border-[#F3D9CE] space-y-2">
              <span className="material-symbols-outlined text-3xl text-[#009770]">rule</span>
              <p className="text-xs text-[#6B5A55]">
                Klik tombol <strong>"Jalankan Rekonsiliasi Otomatis"</strong> untuk membandingkan mutasi fisik/buku kas dengan mutasi rekening bank dan ekspor settlement QRIS.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
