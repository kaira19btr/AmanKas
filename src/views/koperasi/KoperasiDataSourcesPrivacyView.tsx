/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuditLogEntry } from '../../types';

interface KoperasiDataSourcesPrivacyViewProps {
  auditLogs: AuditLogEntry[];
  retentionDays: number;
  onUpdateRetentionDays: (days: number) => void;
  onClearData: () => void;
  isMasked: boolean;
  setIsMasked: (masked: boolean) => void;
}

export const KoperasiDataSourcesPrivacyView: React.FC<KoperasiDataSourcesPrivacyViewProps> = ({
  auditLogs,
  retentionDays,
  onUpdateRetentionDays,
  onClearData,
  isMasked,
  setIsMasked,
}) => {
  const [csvFileUploaded, setCsvFileUploaded] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

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

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFileUploaded(e.target.files[0].name);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
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
                <h1 className="font-display font-bold text-base text-white">
                  Sumber Data &amp; Privasi Koperasi Simpan Pinjam
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#009770]/40 text-[#84F8CA] border border-[#84F8CA]/30 text-[10px] font-mono font-bold">
                  UU PDP 27/2022 &bull; Retensi 5 Tahun
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                Manajemen integrasi data buku kas, pemetaan kolom CSV simpan pinjam, enkripsi pseudonim anggota, kontrol peran akses Pengawas/Pengurus, dan pencatatan audit log forensik.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto font-mono-tabular text-xs text-gray-300">
            <span>Retensi KSP:</span>
            <span className="px-2 py-1 rounded-lg bg-emerald-900/50 text-[#84F8CA] border border-emerald-500/40 font-bold">
              {retentionDays} Hari (5 Tahun)
            </span>
          </div>
        </div>
      </section>

      {/* 2. Grid: CSV Ingestion with Column Mapping & Pseudonymization Engine */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* CSV Upload & Mapping */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="font-display font-bold text-sm text-[#0A2A22]">
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
              <div className="text-xs font-semibold text-gray-800">
                {csvFileUploaded ? (
                  <span className="text-[#009770] font-bold">File Terpilih: {csvFileUploaded}</span>
                ) : (
                  <span>Klik untuk pilih file CSV Buku Kas Koperasi</span>
                )}
              </div>
              <span className="text-[11px] text-gray-500 font-mono-tabular">
                Format didukung: CSV UTF-8 terpisah koma atau titik koma (Maks. 50 MB)
              </span>
            </label>

            {uploadSuccess && (
              <div className="mt-3 p-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-mono font-bold animate-fadeIn">
                ✓ File berhasil dibaca. Pemetaan kolom otomatis diterapkan.
              </div>
            )}
          </div>

          {/* Column Mapping Table */}
          <div className="space-y-3 pt-2">
            <h3 className="font-display font-bold text-xs text-gray-700 uppercase tracking-wider font-mono-tabular">
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

              <div>
                <label className="text-gray-600 block mb-1">Petugas / Teller:</label>
                <select
                  value={columnMap.petugas}
                  onChange={(e) => setColumnMap({ ...columnMap, petugas: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800"
                >
                  <option value="Col_E (Teller / Petugas Kasir)">Col_E (Teller / Petugas Kasir)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-600 block mb-1">Kantor Unit / Cabang:</label>
                <select
                  value={columnMap.unit}
                  onChange={(e) => setColumnMap({ ...columnMap, unit: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800"
                >
                  <option value="Col_F (Kantor Cabang / Unit)">Col_F (Kantor Cabang / Unit)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Pseudonymization, RBAC, and Retention */}
        <div className="col-span-12 lg:col-span-5 space-y-5">
          {/* Pseudonymization Module */}
          <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#0A2A22]">
                Pseudonimisasi Anggota (UU PDP)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                Salt Aktif
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-mono-tabular">
              Identitas anggota (NIK &amp; Nama Asli) diubah secara kriptografis satu arah menjadi ID pseudonim (misal: <code className="bg-gray-100 px-1 py-0.5 rounded font-bold text-[#009770]">ANG-7F3A</code>) sebelum dianalisis mesin.
            </p>

            <div className="p-3 bg-gray-50 rounded-xl space-y-2 text-xs font-mono-tabular">
              <div className="flex justify-between items-center text-gray-700">
                <span>Status Masking Tampilan:</span>
                <button
                  onClick={() => setIsMasked(!isMasked)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
                    isMasked ? 'bg-[#009770] text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {isMasked ? 'Identitas Tersamar' : 'Identitas Terbuka (Audit)'}
                </button>
              </div>
              <div className="text-[10px] text-gray-400">
                Membuka identitas asli memerlukan peran Pengawas dan dicatat ke audit trail.
              </div>
            </div>
          </div>

          {/* Role-Based Access Control Matrix */}
          <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-3 font-mono-tabular text-xs">
            <h3 className="font-display font-bold text-sm text-[#0A2A22]">
              Matriks Peran &amp; Kewenangan KSP
            </h3>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900">Pengawas KSP</div>
                  <div className="text-[10px] text-gray-500">Melihat semua cabang, input putusan, buka unmask</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Akses Penuh
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900">Pengurus KSP</div>
                  <div className="text-[10px] text-gray-500">Melihat agregat buku kas &amp; bahan RAT</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                  Akses Terbatas
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900">Auditor Eksternal</div>
                  <div className="text-[10px] text-gray-500">Hanya baca sampel audit bersertifikasi</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-[10px] font-bold">
                  Read Only
                </span>
              </div>
            </div>
          </div>

          {/* Retention and Purge Policy */}
          <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-3 font-mono-tabular text-xs">
            <h3 className="font-display font-bold text-sm text-[#0A2A22]">
              Kebijakan Retensi Data Buku Kas
            </h3>
            <p className="text-gray-500 text-[11px]">
              Sesuai UU Perkoperasian No. 25/1992, pembukuan keuangan koperasi disimpan minimal 5 tahun (1825 hari).
            </p>

            <div className="flex items-center gap-3">
              <select
                value={retentionDays}
                onChange={(e) => onUpdateRetentionDays(Number(e.target.value))}
                className="p-2 rounded-lg border border-gray-200 bg-white font-bold text-gray-800"
              >
                <option value={1825}>1.825 Hari (5 Tahun - Standar KSP)</option>
                <option value={3650}>3.650 Hari (10 Tahun - Khusus Neraca)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={onClearData}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">delete_forever</span>
                <span>Kosongkan Seluruh Data Sesi Lokal</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Forensic Access & Audit Logs */}
      <div className="bg-white rounded-2xl p-5 border border-[#F3D9CE] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h3 className="font-display font-bold text-sm text-[#0A2A22]">
              Log Forensik &amp; Jejak Audit Pengawas
            </h3>
            <p className="text-xs text-gray-500">
              Setiap keputusan peninjauan, pembukaan identitas, atau perubahan data dicatat permanen
            </p>
          </div>
          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono-tabular text-xs">
            {auditLogs.length} Catatan Log
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-tabular">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-[10px]">
                <th className="py-2.5 px-3">ID &amp; Waktu</th>
                <th className="py-2.5 px-3">Aktor &amp; Peran</th>
                <th className="py-2.5 px-3">Aksi Terlaksana</th>
                <th className="py-2.5 px-3">Target Transaksi</th>
                <th className="py-2.5 px-3">Keterangan / Alasan</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-gray-900">{log.id}</div>
                    <div className="text-[10px] text-gray-400">{log.timestamp} WIB</div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-gray-800">{log.actor}</td>
                  <td className="py-2.5 px-3 text-[#009770] font-bold">{log.action}</td>
                  <td className="py-2.5 px-3 text-gray-700">{log.target}</td>
                  <td className="py-2.5 px-3 text-gray-600">{log.reason}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {log.verificationStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
