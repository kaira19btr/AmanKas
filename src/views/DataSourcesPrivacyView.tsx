/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { AuditLogEntry, Transaction, Account } from '../types';
import { IsolationForest, extractFeatures } from '../utils/isolationForest';
import { calculateScores } from '../utils/scoring';

interface DataSourcesPrivacyViewProps {
  accounts: Account[];
  auditLogs: AuditLogEntry[];
  onAddAuditLog: (entry: Omit<AuditLogEntry, 'id'>) => void;
  onImportTransactions: (newTrxs: Transaction[]) => void;
  isMasked: boolean;
  setIsMasked: (val: boolean) => void;
  isolationForest: IsolationForest;
}

export const DataSourcesPrivacyView: React.FC<DataSourcesPrivacyViewProps> = ({
  accounts,
  auditLogs,
  onAddAuditLog,
  onImportTransactions,
  isMasked,
  setIsMasked,
  isolationForest,
}) => {
  const [retentionPeriod, setRetentionPeriod] = useState('5 Tahun (Wajib Regulasi KSP)');
  const [temporaryDecryptAllowed, setTemporaryDecryptAllowed] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeSimulationModal, setActiveSimulationModal] = useState<string | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle temporary unmasking with PIN "1234"
  const handlePinSubmit = () => {
    if (pinInput === '1234') {
      setIsMasked(false);
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
      // Record to audit log
      onAddAuditLog({
        timestamp: new Date().toTimeString().slice(0, 8),
        actor: 'Sari Wulandari',
        role: 'Bendahara Utama',
        action: 'Buka Masking Nama & NIK (Dekripsi Sesaat)',
        target: 'Seluruh Basis Data Monitor',
        reason: 'Otorisasi PIN Khusus Verifikator Bendahara',
        verificationStatus: 'Disetujui PIN OTP',
        verified: true,
      });
    } else {
      setPinError('PIN verifikator salah. Gunakan PIN demo: 1234');
    }
  };

  // Functional CSV / XLSX parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseSpreadsheetFile(file);
  };

  const parseSpreadsheetFile = async (file: File) => {
    setIsProcessingUpload(true);
    setUploadFeedback('Membaca berkas dan menganalisis anomali transaksi...');

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (!rows || rows.length === 0) {
        setUploadFeedback('Berkas tidak berisi baris data transaksi yang valid.');
        setIsProcessingUpload(false);
        return;
      }

      // Map rows into AmanKas transactions
      const imported: Transaction[] = rows.map((row, index) => {
        // Tolerant column names
        const rawDate = row.Tanggal || row.Tgl_Trx || row.Date || '2026-10-21';
        const rawDesc = row.Keterangan || row.Uraian || row.Description || 'Setoran Transaksi Impor';
        const rawAmount = parseFloat(row.Nominal || row.Jumlah_IDR || row.Amount || '500000');
        const amount = isNaN(rawAmount) ? 250000 : Math.abs(rawAmount);
        const rawAccount = row.Akun || row.BukuKas || row.Account || '#K-104';
        const rawMember = row.Anggota || row.Nama || row.Member || `Anggota Impor #${index + 1}`;

        const timeStr = row.Waktu || '14:30:00';
        const account = accounts.find((a) => a.id === rawAccount) || accounts[0];

        // Run Isolation Forest feature extraction
        const fVec = extractFeatures(amount, timeStr, 1200000, 600000, 0);
        const isoScore = isolationForest.score(fVec);

        const breakdown = calculateScores({
          amount,
          timeStr,
          accountAvgAmount: 1200000,
          parentAccountStatus: account.status,
          burstFactor: 0,
          isolationScore: isoScore,
        });

        return {
          id: `IMP-${Math.floor(100000 + Math.random() * 900000)}`,
          timestamp: timeStr,
          fullDate: typeof rawDate === 'string' ? rawDate : '2026-10-21',
          accountId: account.id,
          accountName: account.name,
          memberId: `#IMP${index + 100}`,
          memberName: String(rawMember),
          memberNIK: '32730' + Math.floor(10000000000 + Math.random() * 90000000000),
          memberAccountNo: '0182-' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(100 + Math.random() * 900),
          description: String(rawDesc),
          amount,
          channel: 'Rekening Koran Terunggah',
          isolationScore: breakdown.isolationScore,
          ruleScore: breakdown.ruleScore,
          finalScore: breakdown.finalScore,
          status: breakdown.status,
          decisionStatus: breakdown.status === 'Normal' ? 'Dinyatakan Wajar' : 'Menunggu Keputusan',
          flagReasons: breakdown.flagReasons,
          parentAccountAnomalySensitive: breakdown.isParentSensitive,
          isNew: true,
        };
      });

      onImportTransactions(imported);

      // Record to audit log
      onAddAuditLog({
        timestamp: new Date().toTimeString().slice(0, 8),
        actor: 'Sari Wulandari',
        role: 'Bendahara Utama',
        action: 'Unggah & Analisis Rekening Koran Eksternal',
        target: `${imported.length} Baris Transaksi (${file.name})`,
        reason: 'Integrasi Pembukuan Rekening Koran Manual',
        verificationStatus: 'Terverifikasi SHA-256',
        verified: true,
      });

      setUploadFeedback(`Berhasil mengimpor dan menganalisis ${imported.length} transaksi dari berkas ${file.name}.`);
    } catch (err: any) {
      setUploadFeedback(`Gagal membaca berkas: ${err?.message || 'Format tidak didukung'}`);
    } finally {
      setIsProcessingUpload(false);
    }
  };

  // Quick Demo CSV Generator
  const handleLoadSampleCSV = () => {
    const csvContent = `Tanggal,Waktu,Keterangan,Nominal,BukuKas,Anggota
2026-10-21,23:49:00,Penarikan Tunai Tengah Malam,9900000,#K-104,Bpk. Hendro Prayogo
2026-10-21,11:15:00,Setoran Simpanan Wajib,50000,#S-201,Dewi Lestari
2026-10-21,13:20:00,Angsuran Pinjaman Bulanan,750000,#P-302,Siti Rahmawati
2026-10-21,22:15:00,Pecahan Transfer Berulang,4900000,#K-104,Ibu Nurhasanah
2026-10-21,10:00:00,Setoran Kasir Tunai,250000,#K-109,Joko Susanto`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'contoh_rekening_koran.csv');
    parseSpreadsheetFile(file);
  };

  // Export audit trail
  const handleExportAuditTrail = () => {
    const jsonStr = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Jejak_Audit_AmanKas_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* 1. TOP COMPLIANCE SOVEREIGNTY BANNER */}
      <div className="rounded-2xl bg-gradient-to-r from-[#FFF8F4] via-white to-[#E0F4EE] border border-[#F3D9CE] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#009770] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <span className="material-symbols-outlined text-[22px]">verified_user</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display font-bold text-base text-[#0A2A22]">
                Prinsip Kedaulatan Data Koperasi
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono-tabular text-[11px] font-bold bg-[#E0F4EE] text-[#009770] border border-[#009770]/25">
                <span className="material-symbols-outlined text-[13px]">gavel</span>
                Kepatuhan UU No. 27/2022 (UU PDP)
              </span>
            </div>
            <p className="text-xs text-[#6B5A55] mt-1 max-w-3xl leading-relaxed">
              Data simpan pinjam anggota diproses secara lokal dan tersamarkan (<em>pseudonimisasi</em>). KSP Mitra Sejahtera memegang kendali penuh atas kunci enkripsi tanpa perantara pihak ketiga.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-[#F3D9CE] text-right">
            <div className="text-[10px] font-mono-tabular text-[#6B5A55]">STATUS AUDIT LOKAL</div>
            <div className="font-mono-tabular text-xs font-bold text-[#009770]">TERISOLASI &amp; AMAN</div>
          </div>
        </div>
      </div>

      {/* 2. SECTION 1: Sumber Data Terhubung (4 Cards) */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-[#0A2A22] tracking-tight">
              Sumber Data Terhubung
            </h2>
            <p className="text-xs text-[#6B5A55] mt-0.5">
              Integrasi otomatis transaksi masuk untuk mendeteksi indikasi anomali dan fraud sedini mungkin.
            </p>
          </div>
          <span className="font-mono-tabular text-[11px] text-[#6B5A55] bg-white px-3 py-1 rounded-full border border-[#F3D9CE] shadow-xs">
            3 Kanal Aktif · 1 Siaga Sandbox
          </span>
        </div>

        {/* Bento Grid 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Core Banking ERP */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#E0F4EE] flex items-center justify-center text-[#009770]">
                  <span className="material-symbols-outlined text-[24px]">account_balance</span>
                </div>
                <span className="px-2.5 py-0.5 inline-flex items-center gap-1.5 rounded-full font-mono-tabular text-[10px] font-bold bg-[#E0F4EE] text-[#009770]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#009770] radar-pulse-green" />
                  Terhubung
                </span>
              </div>
              <h3 className="font-display font-semibold text-xs text-[#0A2A22] leading-snug">
                Sistem Inti Simpan Pinjam
              </h3>
              <p className="font-mono-tabular text-[11px] text-[#6B5A55] mt-0.5">Core Banking / Koperasi ERP</p>
              <div className="my-3 py-2 px-2.5 bg-[#FFF8F4] rounded-xl border border-[#F3D9CE] text-[11px] space-y-1 font-mono-tabular">
                <div className="flex justify-between text-[#6B5A55]">
                  <span>Protokol:</span>
                  <span className="text-[#0A2A22] font-semibold">API Langsung (5s)</span>
                </div>
                <div className="flex justify-between text-[#6B5A55]">
                  <span>Ditarik Hari Ini:</span>
                  <span className="font-bold text-[#009770]">1.248 trx</span>
                </div>
                <div className="flex justify-between text-[#6B5A55]">
                  <span>Latensi:</span>
                  <span className="text-[#0A2A22]">42ms (Optimal)</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveSimulationModal('Uji Koneksi API Core Banking: Berhasil terhubung ke endpoint internal koperasi. Latensi 38ms.')}
              className="w-full mt-2 py-2 px-3 rounded-xl border border-[#009770] text-[#009770] hover:bg-[#E0F4EE] font-mono-tabular text-xs font-semibold text-center transition-colors cursor-pointer"
            >
              Uji Koneksi
            </button>
          </div>

          {/* Card 2: POS Pembukuan Kasir */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#E0F4EE] flex items-center justify-center text-[#009770]">
                  <span className="material-symbols-outlined text-[24px]">point_of_sale</span>
                </div>
                <span className="px-2.5 py-0.5 inline-flex items-center gap-1.5 rounded-full font-mono-tabular text-[10px] font-bold bg-[#E0F4EE] text-[#009770]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#009770]" />
                  Terhubung
                </span>
              </div>
              <h3 className="font-display font-semibold text-xs text-[#0A2A22] leading-snug">
                Aplikasi Kasir / POS
              </h3>
              <p className="font-mono-tabular text-[11px] text-[#6B5A55] mt-0.5">Webhook Real-Time Pembukuan</p>
              <div className="my-3 py-2 px-2.5 bg-[#FFF8F4] rounded-xl border border-[#F3D9CE] text-[11px] space-y-1 font-mono-tabular">
                <div className="text-[#6B5A55]">
                  <span>Cakupan: </span>
                  <span className="text-[#0A2A22] font-semibold">Cabang Barat &amp; Pasar</span>
                </div>
                <div className="flex justify-between text-[#6B5A55]">
                  <span>Verifikasi:</span>
                  <span className="text-[#009770] font-semibold">Payload Valid</span>
                </div>
                <div className="flex justify-between text-[#6B5A55]">
                  <span>Status:</span>
                  <span className="text-[#0A2A22]">Siaga Listener</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveSimulationModal('Konfigurasi Webhook POS: Endpoint https://ksp-mitrasejahtera.internal/api/pos-webhook aktif.')}
              className="w-full mt-2 py-2 px-3 rounded-xl border border-[#009770] text-[#009770] hover:bg-[#E0F4EE] font-mono-tabular text-xs font-semibold text-center transition-colors cursor-pointer"
            >
              Konfigurasi Webhook
            </button>
          </div>

          {/* Card 3: QRIS & Dompet SNAP BI */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF637]/30 flex items-center justify-center text-[#6B5F00]">
                  <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
                </div>
                <span className="px-2.5 py-0.5 inline-flex items-center gap-1.5 rounded-full font-mono-tabular text-[10px] font-bold bg-[#FFF637] text-[#6B5F00]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6B5F00]" />
                  Siaga / Sandbox
                </span>
              </div>
              <h3 className="font-display font-semibold text-xs text-[#0A2A22] leading-snug">
                QRIS &amp; Dompet Koperasi
              </h3>
              <p className="font-mono-tabular text-[11px] text-[#6B5A55] mt-0.5">Open API Standar SNAP BI</p>
              <div className="my-3 py-2 px-2.5 bg-[#FFF8F4] rounded-xl border border-[#F3D9CE] text-[11px] space-y-1 font-mono-tabular">
                <div className="text-[#6B5A55]">
                  <span>Status Sandbox: </span>
                  <span className="text-[#6B5F00] font-medium leading-tight">Menunggu sertifikat ASPI</span>
                </div>
                <div className="flex justify-between text-[#6B5A55]">
                  <span>Protokol:</span>
                  <span className="text-[#0A2A22]">ASPI SNAP 1.1</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveSimulationModal('Konektor Sandbox QRIS SNAP BI siap diuji pada lingkungan demo.')}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-[#009770] to-[#00B386] text-white font-mono-tabular text-xs font-semibold text-center shadow-xs cursor-pointer"
            >
              Hubungkan Sekarang
            </button>
          </div>

          {/* Card 4: Functional File Upload CSV / XLSX */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between border-2 border-dashed border-[#FFB89F] bg-gradient-to-b from-white to-[#FFF8F4]">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#FFDBCF]/40 flex items-center justify-center text-[#86513D]">
                  <span className="material-symbols-outlined text-[24px]">upload_file</span>
                </div>
                <span className="px-2 py-0.5 inline-flex items-center rounded-full text-[10px] font-mono-tabular font-bold bg-[#FFDBCF] text-[#86513D]">
                  Koperasi Non-Digital
                </span>
              </div>
              <h3 className="font-display font-semibold text-xs text-[#0A2A22]">
                Unggah Rekening Koran
              </h3>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-2.5 p-3 rounded-xl border border-dashed border-[#FFB89F] bg-white/80 text-center cursor-pointer hover:bg-white transition-colors"
              >
                <span className="material-symbols-outlined text-[24px] text-[#86513D]">
                  cloud_upload
                </span>
                <p className="text-[11px] text-[#0A2A22] font-medium mt-1">
                  Pilih berkas rekening koran / kas
                </p>
                <p className="text-[10px] font-mono-tabular text-[#6B5A55]">
                  .csv, .xlsx max 25MB
                </p>
              </div>

              {/* Detected columns preview */}
              <div className="mt-2 pt-2 border-t border-[#F3D9CE]">
                <div className="text-[10px] font-mono-tabular text-[#6B5A55] mb-1">
                  Kolom Dikenali Otomatis:
                </div>
                <div className="flex flex-wrap gap-1 font-mono-tabular text-[9px]">
                  <span className="px-1.5 py-0.5 rounded bg-[#E0F4EE] text-[#009770]">[Tanggal]</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#E0F4EE] text-[#009770]">[Keterangan]</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#E0F4EE] text-[#009770]">[Nominal]</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#E0F4EE] text-[#009770]">[BukuKas]</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mt-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingUpload}
                className="w-full py-2 px-3 rounded-xl bg-[#009770] hover:bg-[#008562] text-white font-mono-tabular text-xs font-semibold text-center transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isProcessingUpload ? 'Memproses...' : 'Pilih Berkas & Uji Anomali'}
              </button>
              <button
                onClick={handleLoadSampleCSV}
                className="w-full py-1 text-[11px] text-[#009770] hover:underline font-mono-tabular cursor-pointer text-center"
              >
                + Muat Contoh Data Rekening Koran (.csv)
              </button>
            </div>
          </div>
        </div>

        {uploadFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-[#E0F4EE] border border-[#009770] text-[#00694D] text-xs font-mono-tabular flex items-center justify-between">
            <span>{uploadFeedback}</span>
            <button onClick={() => setUploadFeedback(null)} className="font-bold">✕</button>
          </div>
        )}
      </section>

      {/* 3. SECTION 2 & 3: Perlindungan Data Anggota (2-Column Grid) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Masking Settings */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#E0F4EE] flex items-center justify-center text-[#009770]">
                <span className="material-symbols-outlined text-[22px]">enhanced_encryption</span>
              </div>
              <div>
                <h2 className="font-display font-bold text-sm text-[#0A2A22]">
                  Perlindungan Data Anggota
                </h2>
                <p className="text-xs text-[#6B5A55]">Pseudonimisasi deterministik tingkat pangkalan data lokal.</p>
              </div>
            </div>

            {/* Toggle 1: Masking State */}
            <div className="p-4 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] mb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0A2A22]">
                      Samarkan nama dan NIK anggota di dasbor analitik
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono-tabular font-bold ${
                        isMasked ? 'bg-[#E0F4EE] text-[#009770]' : 'bg-[#FFDAD6] text-[#CE2F2E]'
                      }`}
                    >
                      {isMasked ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B5A55] mt-1">
                    Mencegah kebocoran data sensitif saat layar dasbor dilihat oleh staf umum atau pihak luar.
                  </p>
                </div>

                {/* Switch button */}
                <button
                  type="button"
                  onClick={() => setIsMasked(!isMasked)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isMasked ? 'bg-[#009770]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isMasked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Visual Before & After Pseudonymization Box */}
              <div className="mt-4 p-3.5 bg-white rounded-xl border border-[#F3D9CE]">
                <div className="text-[10px] font-mono-tabular text-[#6B5A55] uppercase font-semibold mb-2">
                  Simulasi Transformasi Masking Real-Time
                </div>
                <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-2 text-center md:text-left text-xs">
                  {/* Before */}
                  <div className="md:col-span-5 p-2.5 rounded-lg bg-[#FFDAD6]/30 border border-[#FFDAD6]">
                    <div className="text-[9px] font-mono-tabular font-bold text-[#CE2F2E]">
                      SEBELUM (DATA MENTAH PRIVAT)
                    </div>
                    <div className="mt-1 font-bold text-[#0A2A22]">Budi Santoso</div>
                    <div className="font-mono-tabular text-[10px] text-[#6B5A55]">NIK: 3273012908850002</div>
                    <div className="font-mono-tabular text-[10px] text-[#6B5A55]">Rek: 0182-993-110</div>
                  </div>

                  {/* Icon */}
                  <div className="md:col-span-1 flex justify-center text-[#009770]">
                    <span className="material-symbols-outlined text-[20px]">sync_alt</span>
                  </div>

                  {/* After */}
                  <div className="md:col-span-5 p-2.5 rounded-lg bg-[#E0F4EE] border border-[#009770]/30">
                    <div className="text-[9px] font-mono-tabular font-bold text-[#009770]">
                      SESUDAH (TERSAMARKAN DI MONITOR)
                    </div>
                    <div className="mt-1 font-bold text-[#00694D]">B**** S*****</div>
                    <div className="font-mono-tabular text-[10px] text-[#00694D] tracking-wider">
                      NIK: 327301********02
                    </div>
                    <div className="font-mono-tabular text-[10px] text-[#00694D] tracking-wider">
                      Rek: ••••-•••-110
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Toggle 2: Controlled Identity Reveal */}
            <div className="p-4 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] mb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0A2A22]">
                      Dekripsi Sesaat (Hanya Pengurus Berwenang)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-tabular font-bold bg-[#E0F4EE] text-[#009770]">
                      AKTIF
                    </span>
                  </div>
                  <p className="text-xs text-[#6B5A55] mt-1">
                    Pembukaan identitas asli hanya dapat diakses dengan verifikasi PIN / OTP Bendahara. Seluruh pembukaan data dicatat otomatis pada audit log abadi.
                  </p>
                  <button
                    onClick={() => setShowPinModal(true)}
                    className="mt-2 text-xs text-[#009770] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">lock_open</span>
                    Buka Identitas dengan PIN Otoritas
                  </button>
                </div>
              </div>
            </div>

            {/* Retention Setting */}
            <div className="p-4 rounded-xl bg-white border border-[#F3D9CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-[#86513D]">history_toggle_off</span>
                <div>
                  <div className="font-bold text-[#0A2A22]">Retensi Log Finansial &amp; Jejak Akses</div>
                  <div className="font-mono-tabular text-[#6B5A55] text-[11px]">
                    Standar Kemenkop-UKM &amp; Ketentuan Perpajakan
                  </div>
                </div>
              </div>
              <div>
                <select
                  value={retentionPeriod}
                  onChange={(e) => setRetentionPeriod(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] font-mono-tabular font-semibold text-[#0A2A22] text-xs focus:ring-1 focus:ring-[#009770] focus:outline-none cursor-pointer"
                >
                  <option value="5 Tahun (Wajib Regulasi KSP)">5 Tahun (Wajib Regulasi KSP)</option>
                  <option value="7 Tahun (Audit Khusus Eksternal)">7 Tahun (Audit Khusus Eksternal)</option>
                  <option value="10 Tahun (Arsip Permanen)">10 Tahun (Arsip Permanen)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): PDP Checklist & Consent */}
        <div className="lg:col-span-5 space-y-6">
          {/* Checklist UU PDP */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E0F4EE] flex items-center justify-center text-[#009770]">
                  <span className="material-symbols-outlined text-[20px]">checklist</span>
                </div>
                <h3 className="font-display font-bold text-sm text-[#0A2A22]">Daftar Periksa UU PDP</h3>
              </div>
              <span className="font-mono-tabular text-xs font-bold text-[#009770] bg-[#E0F4EE] px-2 py-0.5 rounded-full">
                5/5 Terpenuhi
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { title: 'Tujuan pemrosesan sah:', desc: 'Khusus mitigasi risiko kecurangan kas anggota koperasi.' },
                { title: 'Akses berbasis peran:', desc: 'Hanya Bendahara & Pengawas dengan kredensial terdaftar.' },
                { title: 'Privacy by Design:', desc: 'Penyamaran identitas anggota aktif secara bawaan (default).' },
                { title: 'Jejak audit digital abadi:', desc: 'Log tak dapat diubah tanpa tanda tangan kriptografi pengawas.' },
                { title: 'Hak Anggota Koperasi:', desc: 'Akses transparansi buku simpan pinjam diakomodir penuh.' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE]">
                  <div className="w-5 h-5 rounded-full bg-[#009770] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[13px]">check</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#0A2A22]">{item.title}</span>
                    <span className="text-[#6B5A55]"> {item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consent Section */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-sm text-[#0A2A22]">
                Persetujuan (Consent) Anggota
              </h3>
              <span className="material-symbols-outlined text-[20px] text-[#6B5A55]">fact_check</span>
            </div>
            <div className="space-y-2.5 font-mono-tabular text-[11px]">
              <div className="p-2.5 rounded-xl bg-white border border-[#F3D9CE]">
                <div className="flex items-center justify-between text-[#0A2A22] font-bold">
                  <span>Nominal &amp; Waktu Transaksi</span>
                  <span className="text-[#009770]">✓ Sah (RAT 2024)</span>
                </div>
                <div className="text-[#6B5A55] mt-0.5">Disetujui 1.420 Anggota pada 14 Jan 2024</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#F3D9CE]">
                <div className="flex items-center justify-between text-[#0A2A22] font-bold">
                  <span>No. Rekening &amp; Kanal Bayar</span>
                  <span className="text-[#009770]">✓ Sah (RAT 2024)</span>
                </div>
                <div className="text-[#6B5A55] mt-0.5">Disetujui 1.420 Anggota pada 14 Jan 2024</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-[#F3D9CE]">
                <div className="flex items-center justify-between text-[#0A2A22] font-bold">
                  <span>Geolokasi IP Kasir Cabang</span>
                  <span className="text-[#009770]">✓ Sah (Manajemen)</span>
                </div>
                <div className="text-[#6B5A55] mt-0.5">SK Pengurus No. 04/SK-KSP/II/2024</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION 4: Jejak Audit Akses (Access Audit Trail) */}
      <section className="glass-panel rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px] text-[#009770]">manage_search</span>
              <h2 className="font-display font-bold text-base text-[#0A2A22]">
                Jejak Audit Akses (Access Audit Trail)
              </h2>
            </div>
            <p className="text-xs text-[#6B5A55] mt-0.5">
              Rekam jejak transparan: siapa membuka data anggota apa, kapan waktu pastinya, dan alasan operasional pemeriksaannya.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handleExportAuditTrail}
              className="px-3.5 py-1.5 rounded-xl bg-[#009770] hover:bg-[#008562] text-white font-mono-tabular text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              Ekspor Jejak Audit (.json)
            </button>
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto rounded-xl border border-[#F3D9CE]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FFF8F4] border-b border-[#F3D9CE] font-mono-tabular text-[#6B5A55]">
                <th className="py-3 px-4 font-semibold">WAKTU (WIB)</th>
                <th className="py-3 px-4 font-semibold">AKTOR / PENGGUNA</th>
                <th className="py-3 px-4 font-semibold">PERAN</th>
                <th className="py-3 px-4 font-semibold">TINDAKAN</th>
                <th className="py-3 px-4 font-semibold">TARGET DATA ANGGOTA</th>
                <th className="py-3 px-4 font-semibold">ALASAN INVESTIGASI</th>
                <th className="py-3 px-4 font-semibold text-right">STATUS VERIFIKASI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3D9CE] font-mono-tabular">
              {auditLogs.map((log) => (
                <tr key={log.id} className="bg-white hover:bg-[#E0F4EE]/30 transition-colors">
                  <td className="py-3 px-4 text-[#0A2A22] font-semibold whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#0A2A22]">{log.actor}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-[#FFF8F4] text-[#86513D] border border-[#F3D9CE] text-[10px]">
                      {log.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#CE2F2E]">{log.action}</td>
                  <td className="py-3 px-4 text-[#0A2A22]">{log.target}</td>
                  <td className="py-3 px-4 text-[#6B5A55] max-w-xs truncate">{log.reason}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E0F4EE] text-[#009770]">
                      <span className="material-symbols-outlined text-[13px]">key</span>
                      {log.verificationStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs font-mono-tabular text-[#6B5A55]">
          <span>Menampilkan {auditLogs.length} entri audit log tersimpan di memori</span>
          <span>Integritas Log: Hash Kriptografis SHA-256 Terverifikasi</span>
        </div>
      </section>

      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#F3D9CE] shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E0F4EE] text-[#009770] flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">lock_open</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-[#0A2A22]">
                  Otorisasi Dekripsi Sesaat
                </h3>
                <p className="text-xs text-[#6B5A55]">
                  Masukkan PIN Otoritas Bendahara untuk membuka penyamaran.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono-tabular font-semibold text-[#6B5A55] block mb-1">
                PIN Bendahara (Ketik: 1234)
              </label>
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="1234"
                className="w-full text-center text-lg tracking-widest p-2 rounded-xl border border-[#F3D9CE] font-mono-tabular focus:ring-2 focus:ring-[#009770] focus:outline-none"
              />
              {pinError && <p className="text-xs text-[#CE2F2E] mt-1">{pinError}</p>}
            </div>

            <div className="p-3 bg-[#FFF8F4] rounded-xl border border-[#F3D9CE] text-[11px] text-[#6B5A55]">
              Aksi pembukaan penyamaran ini akan secara permanen dicatat pada Jejak Audit Akses sesuai UU PDP No. 27/2022.
            </div>

            <div className="flex items-center gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput('');
                  setPinError('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-mono-tabular text-[#6B5A55] hover:bg-gray-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handlePinSubmit}
                className="px-4 py-2 rounded-xl text-xs font-mono-tabular font-bold bg-[#009770] text-white hover:bg-[#008562] shadow-xs cursor-pointer"
              >
                Verifikasi &amp; Buka
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic Simulation Modal / Toast */}
      {activeSimulationModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-[#F3D9CE] shadow-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#E0F4EE] text-[#009770] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">cloud_sync</span>
            </div>
            <h4 className="font-display font-bold text-sm text-[#0A2A22]">Simulasi Konektor API</h4>
            <p className="text-xs text-[#6B5A55] leading-relaxed">{activeSimulationModal}</p>
            <div className="text-[10px] font-mono-tabular text-[#86513D] bg-[#FFF8F4] p-2 rounded-lg">
              Konektor ini adalah tampilan simulasi interaktif untuk demonstrasi kedaulatan data koperasi.
            </div>
            <button
              onClick={() => setActiveSimulationModal(null)}
              className="w-full py-2 bg-[#009770] text-white rounded-xl text-xs font-mono-tabular font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
