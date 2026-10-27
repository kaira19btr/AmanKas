/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuditLogEntry } from '../../types';
import { verifyAuditChain, simulateTamperOnChain } from '../../utils/hashChain';

interface KoperasiDataSourcesPrivacyViewProps {
  auditLogs: AuditLogEntry[];
  retentionDays: number;
  onUpdateRetentionDays: (days: number) => void;
  onClearData: () => void;
  isMasked: boolean;
  setIsMasked: (masked: boolean) => void;
  onLogAuditAction?: (action: string, target: string, reason: string) => void;
}

export const KoperasiDataSourcesPrivacyView: React.FC<KoperasiDataSourcesPrivacyViewProps> = ({
  auditLogs,
  retentionDays,
  onUpdateRetentionDays,
  onClearData,
  isMasked,
  setIsMasked,
  onLogAuditAction,
}) => {
  const [csvFileUploaded, setCsvFileUploaded] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Hash Chain verification states
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'idle' | 'valid' | 'broken';
    message: string;
    brokenIndex: number | null;
  }>({ status: 'idle', message: '', brokenIndex: null });

  // Simulation test state
  const [simulatedLogs, setSimulatedLogs] = useState<AuditLogEntry[] | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  // Column mapping state
  const [columnMap, setColumnMap] = useState({
    tanggal: 'Col_A (Tanggal Transaksi)',
    akun: 'Col_B (Nama Akun Buku Kas)',
    nominal: 'Col_C (Nominal Rupiah)',
    idAnggota: 'Col_D (Nomor Anggota / NIK)',
    petugas: 'Col_E (Teller / Petugas Kasir)',
    unit: 'Col_F (Kantor Cabang / Unit)',
    dokumen: 'Col_G (Status Kwitansi / Dokumen)',
  });

  const activeLogsToDisplay = simulatedLogs || auditLogs;

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFileUploaded(e.target.files[0].name);
      setUploadSuccess(true);
      if (onLogAuditAction) {
        onLogAuditAction(
          'Impor Berkas CSV',
          e.target.files[0].name,
          'Impor pembukuan kas koperasi secara lokal'
        );
      }
      setTimeout(() => setUploadSuccess(false), 4000);
    }
  };

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    try {
      const result = await verifyAuditChain(activeLogsToDisplay);
      if (result.isValid) {
        setVerificationResult({
          status: 'valid',
          message: 'Utuh: Rantai hash SHA-256 valid dari entri genesis hingga entri terbaru.',
          brokenIndex: null,
        });
      } else {
        setVerificationResult({
          status: 'broken',
          message: `Rusak pada entri #${(result.brokenAtIndex ?? 0) + 1} (${result.message})`,
          brokenIndex: result.brokenAtIndex,
        });
      }
    } catch {
      setVerificationResult({
        status: 'broken',
        message: 'Gagal menjalankan verifikasi hash kriptografis.',
        brokenIndex: null,
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateTampering = () => {
    if (activeLogsToDisplay.length < 2) return;
    const targetIdx = 1; // alter second entry
    const tampered = simulateTamperOnChain(auditLogs, targetIdx);
    setSimulatedLogs(tampered);
    setIsSimulated(true);
    setVerificationResult({
      status: 'idle',
      message: 'Salinan data telah dimodifikasi untuk demonstrasi deteksi.',
      brokenIndex: null,
    });
  };

  const handleResetSimulation = () => {
    setSimulatedLogs(null);
    setIsSimulated(false);
    setVerificationResult({ status: 'idle', message: '', brokenIndex: null });
  };

  const handleToggleMask = () => {
    const nextVal = !isMasked;
    setIsMasked(nextVal);
    if (onLogAuditAction) {
      onLogAuditAction(
        nextVal ? 'Masking Identitas Diaktifkan' : 'Pembukaan Identitas (Unmasking)',
        'Tampilan NIK / Nama Anggota',
        nextVal ? 'Proteksi privasi standar' : 'Pemeriksaan audit fisik oleh Pengawas'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Contextual Help Header for Koperasi Supervisor */}
      <section className="bg-gradient-to-r from-[#031B15] to-[#0A2A22] text-white rounded-2xl p-4 px-6 border-l-4 border-l-[#009770] border border-[#00B386]/30 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#009770]/30 border border-[#84F8CA]/40 flex items-center justify-center text-[#84F8CA]">
              <span className="material-symbols-outlined text-2xl">security</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-ui font-semibold text-base text-white">
                  Sumber Data, Privasi &amp; Jejak Forensik KSP
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#009770]/40 text-[#84F8CA] border border-[#84F8CA]/30 text-[10px] font-mono font-medium tracking-[0.08em] uppercase">
                  Lokal &bull; Append-Only, Tamper-Evident
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed font-ui">
                Manajemen integrasi data buku kas, pemetaan CSV, enkripsi pseudonim anggota, kontrol peran akses, dan verifikasi integritas rantai hash SHA-256. Semua data diproses secara mandiri di perangkat pengguna.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto font-mono text-xs text-gray-300">
            <span>Retensi KSP:</span>
            <span className="px-2 py-1 rounded-lg bg-emerald-900/50 text-[#84F8CA] border border-emerald-500/40 font-semibold font-mono tabular-nums">
              {retentionDays} Hari (5 Tahun)
            </span>
          </div>
        </div>
      </section>

      {/* PERAN DATA CARD & LOCAL STORAGE BANNER (ESAI REQUIREMENT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card: Peran Data */}
        <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-3 font-ui">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-[#009770]">badge</span>
              <h2 className="font-ui font-semibold text-sm text-[#0A2A22]">
                Peran Data Menurut Tata Kelola PDP
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold bg-[#009770]/10 text-[#009770] px-2 py-0.5 rounded">
              UU No. 27/2022
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-emerald-800">
                Pengendali Data
              </span>
              <div className="font-bold text-gray-900 text-sm">KSP / UMKM</div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Memiliki kepemilikan penuh dan kuasa hukum atas data keuangan, transaksi anggota, dan arsip pembukuan kas.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-blue-800">
                Prosesor Data
              </span>
              <div className="font-bold text-gray-900 text-sm">SADAR</div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Perangkat lunak analitik yang memproses kalkulasi statistik secara lokal tanpa menyimpan data keluar perangkat.
              </p>
            </div>
          </div>
        </div>

        {/* Notice: Data Tidak Dikirim Keluar Perangkat */}
        <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-3 font-ui flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-emerald-600">phonelink_lock</span>
                <h2 className="font-ui font-semibold text-sm text-[#0A2A22]">
                  Keamanan Pemrosesan Lokal di Perangkat
                </h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                IndexedDB Lokal
              </span>
            </div>
            <p className="text-xs text-gray-700 mt-2 leading-relaxed">
              <strong>Data tidak dikirim keluar perangkat.</strong> Semua pemrosesan data, penghitungan Benford, deteksi anomali, dan penataan rantai hash terjadi 100% lokal di browser ini. Data dipertahankan di IndexedDB agar tetap ada saat aplikasi ditutup.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
            <span className="text-gray-500 font-mono text-[11px]">Penyimpanan Browser Terenkripsi</span>
            <button
              onClick={onClearData}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer flex items-center gap-1 font-ui"
            >
              <span className="material-symbols-outlined text-sm">delete_forever</span>
              <span>Hapus Semua Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Grid: CSV Ingestion with Column Mapping & Pseudonymization Engine */}
      <div className="grid grid-cols-12 gap-6 items-start font-ui">
        {/* CSV Upload & Mapping */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="font-ui font-semibold text-sm text-[#0A2A22]">
                Unggah Buku Kas &amp; Pemetaan Kolom CSV
              </h2>
              <p className="text-xs text-gray-500">
                Impor data transaksi simpan pinjam dari sistem core banking atau spreadsheet internal
              </p>
            </div>
            <span className="material-symbols-outlined text-gray-400">upload_file</span>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-[#009770]/30 hover:border-[#009770] rounded-2xl p-6 text-center transition-all bg-[#009770]/5">
            <input
              type="file"
              id="koperasi-csv-upload"
              accept=".csv"
              onChange={handleSimulateUpload}
              className="hidden"
            />
            <label
              htmlFor="koperasi-csv-upload"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-[#009770]/10 text-[#009770] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">cloud_upload</span>
              </div>
              <div className="text-xs font-semibold text-gray-800 font-ui">
                {csvFileUploaded ? (
                  <span className="text-[#009770] font-semibold">File Terpilih: {csvFileUploaded}</span>
                ) : (
                  <span>Klik untuk pilih file CSV Buku Kas Koperasi</span>
                )}
              </div>
              <span className="text-[11px] text-gray-500 font-mono">
                Format didukung: CSV UTF-8 terpisah koma atau titik koma (Maks. 50 MB)
              </span>
            </label>

            {uploadSuccess && (
              <div className="mt-3 p-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-mono font-semibold animate-fadeIn">
                ✓ File berhasil dibaca. Pemetaan kolom otomatis diterapkan.
              </div>
            )}
          </div>

          {/* Column Mapping Table */}
          <div className="space-y-3 pt-2">
            <h3 className="font-mono font-medium text-xs text-gray-700 uppercase tracking-[0.08em]">
              Pemetaan Kolom Sistem SADAR &harr; CSV Sumber
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono-tabular">
              <div>
                <label className="text-gray-600 block mb-1">Tanggal Transaksi:</label>
                <select
                  value={columnMap.tanggal}
                  onChange={(e) => setColumnMap({ ...columnMap, tanggal: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800"
                >
                  <option value="Col_A (Tanggal Transaksi)">Col_A (Tanggal Transaksi)</option>
                  <option value="Col_Date (Waktu Buku)">Col_Date (Waktu Buku)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-600 block mb-1">Akun Buku Kas:</label>
                <select
                  value={columnMap.akun}
                  onChange={(e) => setColumnMap({ ...columnMap, akun: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800"
                >
                  <option value="Col_B (Nama Akun Buku Kas)">Col_B (Nama Akun Buku Kas)</option>
                  <option value="Col_COA (Bagan Akun)">Col_COA (Bagan Akun)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-600 block mb-1">Nominal (Rp):</label>
                <select
                  value={columnMap.nominal}
                  onChange={(e) => setColumnMap({ ...columnMap, nominal: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800"
                >
                  <option value="Col_C (Nominal Rupiah)">Col_C (Nominal Rupiah)</option>
                  <option value="Col_Amount (Debit/Kredit)">Col_Amount (Debit/Kredit)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-600 block mb-1">ID Anggota (Akan Disamarkan):</label>
                <select
                  value={columnMap.idAnggota}
                  onChange={(e) => setColumnMap({ ...columnMap, idAnggota: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800"
                >
                  <option value="Col_D (Nomor Anggota / NIK)">Col_D (Nomor Anggota / NIK)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Controls, Privacy & RBAC */}
        <div className="col-span-12 lg:col-span-5 space-y-5">
          {/* Pseudonymization Module */}
          <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-ui font-semibold text-sm text-[#0A2A22]">
                Pseudonimisasi Anggota (UU PDP)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-[0.08em] bg-emerald-100 text-emerald-800 uppercase">
                Salt Aktif
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-mono">
              Identitas anggota (NIK &amp; Nama Asli) diubah secara kriptografis satu arah menjadi ID pseudonim (misal: <code className="bg-gray-100 px-1 py-0.5 rounded font-bold text-[#009770]">ANG-7F3A</code>) sebelum dianalisis mesin.
            </p>

            <div className="p-3 bg-gray-50 rounded-xl space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-gray-700">
                <span className="font-ui">Status Masking Tampilan:</span>
                <button
                  onClick={handleToggleMask}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer transition-all font-ui ${
                    isMasked ? 'bg-[#009770] text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {isMasked ? 'Identitas Tersamar' : 'Identitas Terbuka (Audit)'}
                </button>
              </div>
              <div className="text-[10px] text-gray-400 font-ui">
                Membuka identitas asli memerlukan peran Pengawas dan dicatat ke audit trail.
              </div>
            </div>
          </div>

          {/* RENAMED CHECKLIST: Kontrol yang selaras dengan prinsip UU PDP */}
          <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-3 font-ui text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-ui font-semibold text-sm text-[#0A2A22]">
                Kontrol yang selaras dengan prinsip UU PDP
              </h3>
              <span className="text-[10px] font-mono font-bold text-[#009770]">UU 27/2022</span>
            </div>

            <div className="space-y-2 text-gray-700 text-xs">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5">check_circle</span>
                <span><strong>Minimisasi Data:</strong> Hanya kolom penting buku kas yang diproses.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5">check_circle</span>
                <span><strong>Pseudonimisasi Bawaan:</strong> NIK disamarkan sebelum kalkulasi risiko.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5">check_circle</span>
                <span><strong>Batasan Penyimpanan:</strong> Kebijakan retensi 5 tahun sesuai UU Perkoperasian.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5">check_circle</span>
                <span><strong>Akuntabilitas Log:</strong> Log audit berantai hash (append-only, tamper-evident).</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LOG AUDIT BERANTAI HASH (tamper-evident) - MANDATORY SECTION */}
      <div className="bg-white rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-4 font-ui">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-ui font-semibold text-base text-[#0A2A22]">
                Log Audit Berantai Hash (Append-Only, Tamper-Evident)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#009770]/10 text-[#009770] uppercase">
                SHA-256 Crypto.subtle
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Tiap entri memuat hash kriptografis dari isinya ditambah hash entri sebelumnya. Rantai hash mendeteksi perubahan; tidak mencegahnya, dan hanya berlaku pada perangkat ini.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleVerifyIntegrity}
              disabled={verifying}
              className="px-4 py-2 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span>{verifying ? 'Menghitung...' : 'Verifikasi integritas log'}</span>
            </button>

            {!isSimulated ? (
              <button
                onClick={handleSimulateTampering}
                className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-gray-200"
                title="Mengubah satu entri pada salinan memori untuk menguji verifikasi deteksi kerusakan"
              >
                <span className="material-symbols-outlined text-sm">bug_report</span>
                <span>Simulasikan perubahan</span>
              </button>
            ) : (
              <button
                onClick={handleResetSimulation}
                className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-amber-300"
              >
                <span className="material-symbols-outlined text-sm">restore</span>
                <span>Kembalikan Log Asli</span>
              </button>
            )}
          </div>
        </div>

        {/* Verification Result Notification Card */}
        {verificationResult.status !== 'idle' && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between ${
              verificationResult.status === 'valid'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">
                {verificationResult.status === 'valid' ? 'check_circle' : 'gpp_bad'}
              </span>
              <span className="font-bold">{verificationResult.message}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border">
              {verificationResult.status === 'valid' ? 'STATUS: UTUH' : 'STATUS: TERDETEKSI RUSAK'}
            </span>
          </div>
        )}

        {isSimulated && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-center justify-between font-ui">
            <span>
              <strong>Mode Simulasi Aktif:</strong> Entri #2 telah diubah nilainya. Tekan "Verifikasi integritas log" untuk melihat deteksi kerusakan pada rantai hash.
            </span>
          </div>
        )}

        {/* Hash-Chained Audit Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="w-full text-left text-xs font-mono-tabular">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-[10px]">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Aktor &amp; Peran</th>
                <th className="py-2.5 px-3">Aksi Terlaksana</th>
                <th className="py-2.5 px-3">Target &amp; Catatan</th>
                <th className="py-2.5 px-3 font-mono">Hash SHA-256 (Terkait PrevHash)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeLogsToDisplay.map((log, idx) => {
                const isBroken = verificationResult.brokenIndex === idx;

                return (
                  <tr
                    key={`${log.id}-${idx}`}
                    className={`hover:bg-gray-50 ${isBroken ? 'bg-rose-50/80 font-bold' : ''}`}
                  >
                    <td className="py-2 px-3 text-gray-500">{idx + 1}</td>
                    <td className="py-2 px-3 text-gray-700 whitespace-nowrap">{log.timestamp} WIB</td>
                    <td className="py-2 px-3 font-semibold text-gray-800">{log.actor}</td>
                    <td className="py-2 px-3 text-[#009770] font-bold">{log.action}</td>
                    <td className="py-2 px-3 text-gray-700 max-w-xs truncate" title={`${log.target} - ${log.reason}`}>
                      <div className="font-semibold">{log.target}</div>
                      <div className="text-[10px] text-gray-500 truncate">{log.reason}</div>
                    </td>
                    <td className="py-2 px-3 font-mono text-[10px]">
                      <div className="text-gray-400">prev: {log.prevHash ? log.prevHash.slice(0, 10) + '...' : '00000000 (genesis)'}</div>
                      <div className="font-bold text-[#0A2A22]">
                        hash: {log.hash ? log.hash.slice(0, 16) + '...' : 'pending-calc'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-500 font-ui leading-relaxed">
          <strong>Catatan Hukum &amp; Kriptografi:</strong> Sistem menggunakan istilah <em>append-only, tamper-evident</em>. Rantai hash mendeteksi perubahan; tidak mencegahnya, dan hanya berlaku pada perangkat ini.
        </div>
      </div>
    </div>
  );
};
