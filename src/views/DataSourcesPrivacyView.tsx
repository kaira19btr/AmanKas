/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { AuditLogEntry, Transaction, Account, AppMode, UserRole, UmkmConsent } from '../types';
import { IsolationForest, extractFeatures } from '../utils/isolationForest';
import { calculateScores } from '../utils/scoring';
import { soundEngine } from '../utils/soundEffects';

interface DataSourcesPrivacyViewProps {
  accounts: Account[];
  transactions: Transaction[];
  auditLogs: AuditLogEntry[];
  mode: AppMode;
  userRole: UserRole;
  onAddAuditLog: (entry: Omit<AuditLogEntry, 'id'>) => void;
  onImportTransactions: (newTrxs: Transaction[]) => void;
  onClearData: () => void;
  isMasked: boolean;
  setIsMasked: (val: boolean) => void;
  isolationForest: IsolationForest;
  umkmConsent: UmkmConsent;
  onUpdateUmkmConsent: (updated: Partial<UmkmConsent>) => void;
  retentionDays: number;
  onUpdateRetentionDays: (days: number) => void;
}

export const DataSourcesPrivacyView: React.FC<DataSourcesPrivacyViewProps> = ({
  accounts,
  transactions,
  auditLogs,
  mode,
  userRole,
  onAddAuditLog,
  onImportTransactions,
  onClearData,
  isMasked,
  setIsMasked,
  isolationForest,
  umkmConsent,
  onUpdateUmkmConsent,
  retentionDays,
  onUpdateRetentionDays,
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [confirmClearModal, setConfirmClearModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'tata_kelola' | 'sumber_data' | 'log_audit'>('tata_kelola');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authorized role check for unmasking
  const canUnmask =
    mode === 'koperasi'
      ? userRole === 'Pengawas' || userRole === 'Pengurus'
      : userRole === 'Pemilik UMKM';

  const handleRequestUnmask = () => {
    if (!canUnmask) {
      alert(`Peran "${userRole}" tidak memiliki hak akses otorisasi untuk membuka identitas asli.`);
      return;
    }
    setShowPinModal(true);
  };

  const handlePinSubmit = () => {
    if (pinInput === '1234') {
      setIsMasked(false);
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
      soundEngine.playSuccess();

      // Log the unmasking action
      onAddAuditLog({
        timestamp: new Date().toTimeString().slice(0, 8),
        actor: userRole,
        role: userRole,
        action: 'Buka Masking Identitas Asli (Dekripsi Sementara)',
        target: 'Basis Data Pengendalian SADAR',
        reason: 'Pemeriksaan Otoritas Terverifikasi PIN Demo 1234',
        verificationStatus: 'Disetujui Otoritas',
        verified: true,
      });
    } else {
      soundEngine.playAlert();
      setPinError('PIN salah. Gunakan PIN demo: 1234');
    }
  };

  const handleMaskAgain = () => {
    setIsMasked(true);
    soundEngine.playClick(600);
    onAddAuditLog({
      timestamp: new Date().toTimeString().slice(0, 8),
      actor: userRole,
      role: userRole,
      action: 'Tutup Kembali Masking Identitas (Pseudonimisasi Aktif)',
      target: 'Basis Data Pengendalian SADAR',
      reason: 'Selesai peninjauan manual',
      verificationStatus: 'Otomatis',
      verified: true,
    });
  };

  // Toggle UMKM Consent
  const handleToggleConsent = () => {
    const newEnabled = !umkmConsent.enabled;
    const now = new Date().toISOString().split('T')[0];

    onUpdateUmkmConsent({
      enabled: newEnabled,
      consentDate: newEnabled ? now : umkmConsent.consentDate,
      revokeDate: !newEnabled ? now : undefined,
      shareRevoked: !newEnabled,
    });

    onAddAuditLog({
      timestamp: new Date().toTimeString().slice(0, 8),
      actor: userRole,
      role: userRole,
      action: newEnabled ? 'Persetujuan Opt-in Arus Kas Diberikan' : 'Pencabutan Izin Berbagi Data UMKM',
      target: 'Tautan Ringkasan Arus Kas',
      reason: newEnabled ? 'Izin dibagikan kepada mitra pembiayaan' : 'Pencabutan sepihak oleh pemilik UMKM',
      verificationStatus: 'Dicatat di Blockchain/Audit Log',
      verified: true,
    });
  };

  // CSV/Spreadsheet parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseSpreadsheetFile(file);
  };

  const parseSpreadsheetFile = async (file: File) => {
    setIsProcessingUpload(true);
    setUploadFeedback('Membaca berkas dan menganalisis transaksi secara pseudonim...');

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

      // Map rows into SADAR transactions with pseudonyms
      const imported: Transaction[] = rows.map((row, index) => {
        const rawDate = row.Tanggal || row.Tgl_Trx || row.Date || '2026-10-24';
        const rawDesc = row.Keterangan || row.Uraian || row.Description || 'Transaksi Impor';
        const rawAmount = parseFloat(row.Nominal || row.Jumlah_IDR || row.Amount || '500000');
        const amount = isNaN(rawAmount) ? 250000 : Math.abs(rawAmount);
        const rawAccount = row.Akun || row.BukuKas || row.Account || '#K-104';
        const rawMember = row.Anggota || row.Nama || row.Member || `Entitas #${index + 1}`;
        const timeStr = row.Waktu || '14:30:00';

        // Pseudonym generation: ANG-xxxx for Koperasi, PLG-xxxx for UMKM
        const pseudoCode = (Math.random().toString(16) + '00000').slice(2, 6).toUpperCase();
        const pseudoId = mode === 'koperasi' ? `ANG-${pseudoCode}` : `PLG-${pseudoCode}`;

        return {
          id: `IMP-${Date.now().toString().slice(-4)}-${index + 1}`,
          timestamp: timeStr,
          fullDate: rawDate,
          accountId: rawAccount,
          accountName: 'Buku Kas Impor Terpilih',
          memberPseudonym: pseudoId,
          memberRealName: rawMember,
          memberId: pseudoId,
          memberName: rawMember,
          memberNIK: '3273********01',
          memberAccountNo: '••••-110',
          amount,
          description: rawDesc,
          ruleScore: 20,
          isolationScore: 25,
          anomalyScore: 25,
          finalScore: 22,
          status: 'Normal',
          flagReasons: [],
          notes: 'Diimpor via berkas lokal peramban',
          decisionStatus: 'Menunggu Keputusan',
          dataLimitation: 'Data impor baru; belum ada riwayat perbandingan jangka panjang',
        };
      });

      // Score with isolation forest
      const scored = imported.map((t) => {
        const feat = extractFeatures(t.amount, t.timestamp, 1500000, 750000, 0);
        const ifScore = isolationForest.score(feat);
        const calc = calculateScores(t, ifScore);
        return {
          ...t,
          isolationScore: calc.isolationScore,
          anomalyScore: calc.isolationScore,
          ruleScore: calc.ruleScore,
          finalScore: calc.finalScore,
          status: calc.status,
          flagReasons: calc.flagReasons,
          attribution: calc.attribution,
        };
      });

      onImportTransactions(scored);
      setUploadFeedback(`Berhasil mengimpor dan memproses ${scored.length} transaksi secara lokal.`);
      soundEngine.playSuccess();

      onAddAuditLog({
        timestamp: new Date().toTimeString().slice(0, 8),
        actor: userRole,
        role: userRole,
        action: `Impor Berkas (${file.name})`,
        target: `${scored.length} Transaksi Baru`,
        reason: 'Penambahan data transaksi ekspor sistem lokal',
        verificationStatus: 'Berhasil Diproses',
        verified: true,
      });
    } catch (err) {
      setUploadFeedback('Gagal membaca berkas. Pastikan format CSV atau Excel sesuai.');
      soundEngine.playAlert();
    } finally {
      setIsProcessingUpload(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <section className="bg-white/95 backdrop-blur-md rounded-2xl p-4 px-6 border border-[#F3D9CE] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-[#009770]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E0F4EE] text-[#009770] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">verified_user</span>
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-[#0A2A22]">
              Privasi, Tata Kelola &amp; Kepatuhan UU 27/2022
            </h2>
            <p className="text-xs text-[#6B5A55] mt-0.5">
              Prinsip perlindungan data pribadi: minimisasi data, pseudonimisasi default, hak koreksi, dan hak penghapusan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {isMasked ? (
            <button
              onClick={handleRequestUnmask}
              className="px-3.5 py-1.5 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] hover:border-[#009770] text-[#0A2A22] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-sm text-[#009770]">lock_open</span>
              Buka Identitas Asli (Perlu PIN)
            </button>
          ) : (
            <button
              onClick={handleMaskAgain}
              className="px-3.5 py-1.5 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-sm">lock</span>
              Aktifkan Kembali Masking
            </button>
          )}
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#F3D9CE] pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('tata_kelola')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'tata_kelola'
              ? 'bg-[#009770] text-white shadow-xs'
              : 'bg-white text-[#6B5A55] hover:text-[#0A2A22] border border-[#F3D9CE]'
          }`}
        >
          Tata Kelola &amp; Retensi Data
        </button>
        <button
          onClick={() => setActiveTab('sumber_data')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'sumber_data'
              ? 'bg-[#009770] text-white shadow-xs'
              : 'bg-white text-[#6B5A55] hover:text-[#0A2A22] border border-[#F3D9CE]'
          }`}
        >
          Sumber Data ({mode === 'koperasi' ? 'Ekspor CSV KSP' : 'POS / Mutasi UMKM'})
        </button>
        <button
          onClick={() => setActiveTab('log_audit')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'log_audit'
              ? 'bg-[#009770] text-white shadow-xs'
              : 'bg-white text-[#6B5A55] hover:text-[#0A2A22] border border-[#F3D9CE]'
          }`}
        >
          Log Audit Akses ({auditLogs.length})
        </button>
      </div>

      {activeTab === 'tata_kelola' && (
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Left Column: Retensi & Hapus Data (6 cols) */}
          <section className="col-span-12 lg:col-span-6 bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-5">
            <h3 className="font-display text-sm font-bold text-[#0A2A22] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#009770]">timer</span>
              Kebijakan Retensi &amp; Hak Penghapusan (Right to be Forgotten)
            </h3>

            {/* Retention Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#0A2A22]">Periode Retensi Data Transaksi</span>
                <span className="font-mono-tabular font-bold text-[#009770] bg-[#E0F4EE] px-2.5 py-0.5 rounded">
                  {retentionDays} Hari ({retentionDays >= 365 ? `${(retentionDays / 365).toFixed(1)} Tahun` : `${retentionDays} Hari`})
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="1825"
                step="30"
                value={retentionDays}
                onChange={(e) => onUpdateRetentionDays(Number(e.target.value))}
                className="w-full accent-[#009770] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#6B5A55] font-mono-tabular">
                <span>30 Hari (Minimasi)</span>
                <span>90 Hari</span>
                <span>1 Tahun</span>
                <span>5 Tahun (Wajib KSP)</span>
              </div>
            </div>

            {/* Clear Data Button */}
            <div className="p-4 rounded-xl bg-[#FDE8E8]/30 border border-[#CE2F2E]/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#CE2F2E]">
                <span className="material-symbols-outlined text-base">delete_forever</span>
                Hak Penghapusan Data (Pasal 39 UU 27/2022)
              </div>
              <p className="text-[11px] text-[#6B5A55] leading-relaxed">
                Menghapus seluruh rekaman transaksi lokal dari memori peramban secara permanen. Pengawas atau pemilik UMKM dapat memusnahkan data kapan saja jika audit tahun buku selesai.
              </p>
              <button
                onClick={() => setConfirmClearModal(true)}
                className="px-4 py-2 rounded-xl bg-[#CE2F2E] hover:bg-[#B32726] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Hapus Seluruh Data Transaksi
              </button>
            </div>

            {/* Mode UMKM Opt-In Consent Sharing Section */}
            {mode === 'umkm' && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#FFF8F4] to-white border border-[#F3D9CE] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0A2A22] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#009770]">share</span>
                    Persetujuan Berbagi Ringkasan Arus Kas (Opt-in)
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={umkmConsent.enabled}
                      onChange={handleToggleConsent}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#009770]"></div>
                  </label>
                </div>

                <p className="text-[11px] text-[#6B5A55] leading-relaxed">
                  Pemberian izin opsional kepada lembaga keuangan/pemberi pinjaman untuk membaca ringkasan arus kas agregat. Data mentah buku kas tetap milik pemilik UMKM. Izin dapat dicabut seketika.
                </p>

                {umkmConsent.enabled && (
                  <div className="p-3 bg-[#E0F4EE] rounded-xl border border-[#009770]/30 text-xs space-y-1">
                    <div className="text-[#00694D] font-semibold flex items-center justify-between">
                      <span>Tautan Berbagi Aktif</span>
                      <span className="font-mono-tabular text-[10px] bg-white px-2 py-0.5 rounded">
                        Token: {umkmConsent.lenderShareToken}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#6B5A55]">
                      Diberikan pada: {umkmConsent.consentDate} WIB
                    </div>
                  </div>
                )}

                {/* Mandatory Disclaimer */}
                <div className="p-2.5 rounded-lg bg-[#FFE9DF] border border-[#86513D]/20 text-[11px] text-[#86513D] font-medium leading-relaxed">
                  <strong>Peringatan:</strong> Ringkasan arus kas tidak boleh menjadi syarat tersembunyi atau dasar diskriminasi kredit.
                </div>
              </div>
            )}
          </section>

          {/* Right Column: UU 27/2022 Checklist (6 cols) */}
          <section className="col-span-12 lg:col-span-6 bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-4">
            <h3 className="font-display text-sm font-bold text-[#0A2A22] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#009770]">verified</span>
              Daftar Periksa Kontrol Kepatuhan UU 27/2022
            </h3>

            <div className="space-y-3 text-xs">
              {/* Item 1 */}
              <div className="p-3 rounded-xl border border-[#009770]/30 bg-[#E0F4EE]/30 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#009770] text-base shrink-0 mt-0.5">check_circle</span>
                <div>
                  <div className="font-bold text-[#0A2A22]">1. Minimisasi Data (Data Minimization)</div>
                  <p className="text-[#6B5A55] text-[11px] mt-0.5">
                    Hanya atribut transaksi yang diperlukan untuk deteksi anomali yang diproses. Tidak ada pengumpulan data geolokasi pribadi atau kontak non-esensial.
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-3 rounded-xl border border-[#009770]/30 bg-[#E0F4EE]/30 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#009770] text-base shrink-0 mt-0.5">check_circle</span>
                <div>
                  <div className="font-bold text-[#0A2A22]">2. Pseudonimisasi Default (Pseudonymization)</div>
                  <p className="text-[#6B5A55] text-[11px] mt-0.5">
                    Seluruh identitas anggota atau pelanggan diubah menjadi kode acak (mis. {mode === 'koperasi' ? 'ANG-7F3A' : 'PLG-882B'}) sebelum dianalisis oleh algoritma.
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="p-3 rounded-xl border border-[#009770]/30 bg-[#E0F4EE]/30 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#009770] text-base shrink-0 mt-0.5">check_circle</span>
                <div>
                  <div className="font-bold text-[#0A2A22]">3. Akses Berbasis Peran (RBAC)</div>
                  <p className="text-[#6B5A55] text-[11px] mt-0.5">
                    Hanya peran terotorisasi ({mode === 'koperasi' ? 'Pengawas & Pengurus' : 'Pemilik UMKM'}) yang memiliki hak membuka identitas asli atau menyetujui keputusan.
                  </p>
                </div>
              </div>

              {/* Item 4 */}
              <div className="p-3 rounded-xl border border-[#009770]/30 bg-[#E0F4EE]/30 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#009770] text-base shrink-0 mt-0.5">check_circle</span>
                <div>
                  <div className="font-bold text-[#0A2A22]">4. Jejak Audit Tak Terbantahkan (Audit Trails)</div>
                  <p className="text-[#6B5A55] text-[11px] mt-0.5">
                    Setiap tindakan membuka identitas, koreksi keputusan, dan ekspor data tercatat lengkap dengan stempel waktu, aktor, dan alasan legal.
                  </p>
                </div>
              </div>

              {/* Item 5 */}
              <div className="p-3 rounded-xl border border-[#009770]/30 bg-[#E0F4EE]/30 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#009770] text-base shrink-0 mt-0.5">check_circle</span>
                <div>
                  <div className="font-bold text-[#0A2A22]">5. Retensi &amp; Penghapusan Terkendali</div>
                  <p className="text-[#6B5A55] text-[11px] mt-0.5">
                    Data tidak disimpan tanpa batas. Pengaturan batas hari retensi dan tombol pemusnahan data tersedia langsung di peramban.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'sumber_data' && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-[#0A2A22]">
                {mode === 'koperasi' ? 'Integrasi Berkas Ekspor CSV KSP' : 'Integrasi CSV Kasir, QRIS & Mutasi Rekening'}
              </h3>
              <p className="text-xs text-[#6B5A55]">
                Unggah berkas pembukuan lokal tanpa pernah mengirimkan data mentah ke cloud.
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">upload_file</span>
              Pilih Berkas CSV / Excel
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {isProcessingUpload && (
            <div className="p-4 bg-[#FFF8F4] border border-[#F3D9CE] rounded-xl text-xs text-[#86513D] animate-pulse">
              {uploadFeedback}
            </div>
          )}

          {uploadFeedback && !isProcessingUpload && (
            <div className="p-4 bg-[#E0F4EE] border border-[#009770] rounded-xl text-xs text-[#00694D] font-mono-tabular">
              {uploadFeedback}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
            <div className="p-4 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4]">
              <span className="font-bold text-[#0A2A22] block mb-1">Format Kolom Terdukung:</span>
              <p className="text-[#6B5A55] text-[11px]">
                Tanggal, Keterangan, Nominal, Akun (Pos Buku Kas), Anggota / Entitas, Waktu.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4]">
              <span className="font-bold text-[#0A2A22] block mb-1">Pseudonimisasi Otomatis:</span>
              <p className="text-[#6B5A55] text-[11px]">
                Nama dan NIK/ID anggota langsung disamarkan menjadi kode acak sesaat setelah dibaca di memori RAM.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4]">
              <span className="font-bold text-[#0A2A22] block mb-1">Total Transaksi Aktif:</span>
              <span className="font-mono-tabular text-base font-bold text-[#009770] block">
                {transactions.length} baris dalam sesi
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'log_audit' && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-[#0A2A22]">
                Log Audit Akses &amp; Tindakan Peninjauan
              </h3>
              <p className="text-xs text-[#6B5A55]">
                Catatan kekal setiap de-pseudonimisasi, keputusan audit, dan izin berbagi
              </p>
            </div>
            <span className="font-mono-tabular text-xs text-[#009770] bg-[#FFF8F4] px-2.5 py-1 rounded-lg border border-[#F3D9CE] font-semibold">
              Append-Only, Tamper-Evident
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#F3D9CE]/70 max-h-[500px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FFF8F4] text-[#6B5A55] font-semibold sticky top-0 border-b border-[#F3D9CE]">
                <tr>
                  <th className="py-2 px-3">Waktu</th>
                  <th className="py-2 px-3">Aktor &amp; Peran</th>
                  <th className="py-2 px-3">Tindakan</th>
                  <th className="py-2 px-3">Target</th>
                  <th className="py-2 px-3">Alasan Legal</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3D9CE]/50">
                {auditLogs.map((log, idx) => (
                  <tr key={`${log.id}-${idx}`} className="hover:bg-[#FFF8F4]/50">
                    <td className="py-2.5 px-3 font-mono-tabular text-[#6B5A55] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#0A2A22]">{log.actor}</div>
                      <div className="text-[10px] text-[#6B5A55] font-mono-tabular">{log.role}</div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#0A2A22]">{log.action}</td>
                    <td className="py-2.5 px-3 text-[#6B5A55] font-mono-tabular text-[11px]">{log.target}</td>
                    <td className="py-2.5 px-3 text-[#6B5A55] text-[11px] italic max-w-xs truncate">{log.reason}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-mono-tabular bg-[#E0F4EE] text-[#00694D] px-2 py-0.5 rounded font-semibold">
                        {log.verificationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PIN Modal for Unmasking */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#F3D9CE] shadow-2xl p-6 w-full max-w-md space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFE9DF] text-[#86513D] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">key</span>
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#0A2A22]">
                  Otorisasi Buka Identitas Asli
                </h3>
                <p className="text-xs text-[#6B5A55]">
                  Masukkan PIN otorisasi verifikator ({userRole})
                </p>
              </div>
            </div>

            <p className="text-xs text-[#6B5A55] leading-relaxed">
              Membuka identitas asli akan dicatat di Log Audit. Gunakan PIN demo: <strong className="font-mono-tabular text-[#0A2A22]">1234</strong>
            </p>

            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Masukkan PIN..."
              className="w-full text-center text-lg tracking-widest py-2 rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] focus:outline-none focus:border-[#009770] font-mono-tabular"
            />

            {pinError && <p className="text-xs text-[#CE2F2E] font-medium text-center">{pinError}</p>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput('');
                  setPinError('');
                }}
                className="px-3.5 py-1.5 rounded-xl border border-[#F3D9CE] text-xs font-semibold text-[#6B5A55] hover:bg-[#FFF8F4] cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handlePinSubmit}
                className="px-4 py-1.5 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-semibold cursor-pointer"
              >
                Buka Masking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Data Clearing */}
      {confirmClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#CE2F2E] shadow-2xl p-6 w-full max-w-md space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDE8E8] text-[#CE2F2E] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#0A2A22]">
                  Konfirmasi Pemusnahan Data
                </h3>
                <p className="text-xs text-[#6B5A55]">
                  Hak Penghapusan Data (Pasal 39 UU 27/2022)
                </p>
              </div>
            </div>

            <p className="text-xs text-[#6B5A55] leading-relaxed">
              Apakah Anda yakin ingin memusnahkan seluruh {transactions.length} baris transaksi lokal dari sesi saat ini? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmClearModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[#F3D9CE] text-xs font-semibold text-[#6B5A55] hover:bg-[#FFF8F4] cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onClearData();
                  setConfirmClearModal(false);
                  soundEngine.playAlert();
                }}
                className="px-4 py-1.5 rounded-xl bg-[#CE2F2E] hover:bg-[#B32726] text-white text-xs font-bold cursor-pointer"
              >
                Ya, Musnahkan Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
