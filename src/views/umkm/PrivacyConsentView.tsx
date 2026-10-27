/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UmkmConsent, AuditLogEntry } from '../../types';

interface PrivacyConsentViewProps {
  umkmConsent: UmkmConsent;
  onUpdateConsent: (updated: Partial<UmkmConsent>) => void;
  retentionDays: number;
  onUpdateRetentionDays: (days: number) => void;
  onClearData: () => void;
  auditLogs: AuditLogEntry[];
  onAddAuditLog: (entry: Omit<AuditLogEntry, 'id'>) => void;
}

export const PrivacyConsentView: React.FC<PrivacyConsentViewProps> = ({
  umkmConsent,
  onUpdateConsent,
  retentionDays,
  onUpdateRetentionDays,
  onClearData,
  auditLogs,
  onAddAuditLog,
}) => {
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Toggle Opt-In Consent
  const handleToggleOptIn = () => {
    const nextVal = !umkmConsent.optInConsent;
    const nowTime = new Date().toTimeString().slice(0, 8);

    if (!nextVal) {
      // Revocation: immediately invalidate sharing token and record audit log
      onUpdateConsent({
        optInConsent: false,
        shareRevoked: true,
        revocationTimestamp: nowTime,
        lenderShareToken: null,
      });

      onAddAuditLog({
        timestamp: nowTime,
        actor: 'Pemilik · Warung Fiktif Bu Rina',
        role: 'Pemilik UMKM',
        action: 'Pencabutan Izin Berbagi Data (Opt-In Revocation)',
        target: 'Tautan Berbagi Pemberi Pinjaman',
        reason: 'Pemilik mencabut izin akses data pihak ketiga sesuai UU 27/2022',
        verificationStatus: 'Tautan Dimatikan',
        verified: true,
      });
    } else {
      // Granting opt-in
      const newToken = `TOKEN-SADAR-UMKM-${Math.floor(100 + Math.random() * 900)}`;
      onUpdateConsent({
        optInConsent: true,
        shareRevoked: false,
        revocationTimestamp: null,
        lenderShareToken: newToken,
        consentDate: '2026-10-25',
      });

      onAddAuditLog({
        timestamp: nowTime,
        actor: 'Pemilik · Warung Fiktif Bu Rina',
        role: 'Pemilik UMKM',
        action: 'Pemberian Izin Berbagi Data (Opt-In Granted)',
        target: `Tautan Berbagi Token ${newToken}`,
        reason: 'Persetujuan berbagi ringkasan arus kas ke pemberi pinjaman',
        verificationStatus: 'Tautan Aktif',
        verified: true,
      });
    }
  };

  const handleDownloadTemplate = (type: string) => {
    let csvHeader = '';
    let fileName = '';

    if (type === 'pos') {
      csvHeader = 'tanggal_jam,kasir_shift,jenis,nominal,metode,ada_struk,deskripsi\n2026-10-25 10:15,Kasir-01 (Shift 1),penjualan,75000,tunai,true,Penjualan retail sembako\n';
      fileName = 'templat_csv_kasir_pos.csv';
    } else if (type === 'bank') {
      csvHeader = 'tanggal,rekening,jenis_mutasi,nominal,saldo,keterangan\n2026-10-25,BRI-01991,KREDIT,1250000,18500000,Setoran kasir POS toko\n';
      fileName = 'templat_mutasi_rekening.csv';
    } else {
      csvHeader = 'settlement_date,merchant_id,nominal_bruto,biaya_mdr,nominal_netto,rrn_qris\n2026-10-25,MERCHANT-WARUNG-RINA,850000,6000,844000,QRIS-88219011\n';
      fileName = 'templat_ekspor_qris.csv';
    }

    const blob = new Blob([csvHeader], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadNotice(`Templat file "${fileName}" berhasil diunduh ke komputer Anda.`);
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Contextual Help Header for Owner */}
      <section className="bg-gradient-to-r from-[#031B15] to-[#0A2A22] text-white rounded-2xl p-4 px-6 border-l-4 border-l-[#FFF637] border border-[#FFF637]/30 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF637]/20 border border-[#FFF637]/40 flex items-center justify-center text-[#FFF637]">
              <span className="material-symbols-outlined text-2xl">lock_person</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-ui font-semibold text-base text-white">
                  Izin &amp; Kedaulatan Data Usaha Saya
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#FFF637]/30 text-[#FFF637] border border-[#FFF637]/40 text-[10px] font-mono font-medium tracking-[0.08em] uppercase">
                  Data Mentah Tetap di Pemilik
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed font-ui font-normal">
                Kendali penuh privasi warung Anda (UU PDP 27/2022). Data mentah transaksi tersimpan lokal di peramban Anda. Anda bebas mengunduh templat data, mengatur izin berbagi ke bank, atau menghapus seluruh catatan seketika.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Download Alert Notice */}
      {downloadNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs font-mono font-medium flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-base">download_done</span>
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* 2. Main Grid: Opt-In Consent Manager & Data Source Templates */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left: Revocable Opt-In Consent */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="font-ui font-semibold text-sm text-[#0A2A22]">
                Persetujuan Berbagi Data (Opt-In Revocable)
              </h2>
              <p className="text-xs text-gray-500 font-ui font-normal">
                Kapan pun Anda mencabut izin, tautan ke pihak bank langsung mati otomatis
              </p>
            </div>
            <span className="material-symbols-outlined text-purple-600">verified_user</span>
          </div>

          {/* Big Toggle Banner */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-3 text-xs font-ui">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-900 text-sm font-ui">
                  Izinkan Tautan Ringkasan Arus Kas untuk Bank
                </div>
                <div className="text-gray-500 text-[11px] font-sans">
                  Pemberi pinjaman hanya melihat agregat bulanan tanpa daftar belanja pelanggan
                </div>
              </div>
              <button
                onClick={handleToggleOptIn}
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors cursor-pointer ${
                  umkmConsent.optInConsent ? 'bg-[#009770]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    umkmConsent.optInConsent ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Token status */}
            <div className="pt-2 border-t border-gray-200 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Status Token Berbagi:</span>
                <span className="font-bold text-gray-800">
                  {umkmConsent.optInConsent ? (
                    <span className="text-emerald-700">Aktif ({umkmConsent.lenderShareToken})</span>
                  ) : (
                    <span className="text-rose-700">Tidak Aktif / Dicabut</span>
                  )}
                </span>
              </div>
              {umkmConsent.revocationTimestamp && (
                <div className="text-rose-600">
                  Dicabut pada: {umkmConsent.revocationTimestamp} WIB (Semua akses eksternal dimatikan)
                </div>
              )}
            </div>
          </div>

          {/* Retention Duration Selector */}
          <div className="space-y-2 font-mono-tabular text-xs pt-2">
            <label className="text-gray-700 font-bold block">
              Masa Retensi Data Transaksi Warung:
            </label>
            <p className="text-[11px] text-gray-500 font-sans">
              Standar rekomendasi UMKM adalah 90 hari untuk menjaga kecepatan dan privasi perangkat Anda.
            </p>
            <select
              value={retentionDays}
              onChange={(e) => onUpdateRetentionDays(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-gray-200 bg-white font-bold text-gray-800"
            >
              <option value={30}>30 Hari (1 Bulan Terakhir)</option>
              <option value={90}>90 Hari (3 Bulan - Standar Rekomendasi UMKM)</option>
              <option value={180}>180 Hari (6 Bulan)</option>
            </select>
          </div>

          {/* Right to be Forgotten Wipe Button */}
          <div className="pt-4 border-t border-gray-200">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
              <div className="text-xs font-bold text-rose-900 font-mono-tabular flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                <span>Hak untuk Dihapus (Right to be Forgotten)</span>
              </div>
              <p className="text-[11px] text-rose-800 font-sans">
                Menghapus seketika seluruh transaksi, rekap laci kas, dan log audit dari penyimpanan lokal komputer/ponsel ini.
              </p>
              <button
                onClick={onClearData}
                className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all cursor-pointer font-sans"
              >
                Hapus Data Saya Sekarang
              </button>
            </div>
          </div>
        </div>

        {/* Right: Data Sources & Downloadable Templates */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-5">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="font-ui font-semibold text-sm text-[#0A2A22]">
              Pilihan Sumber Data &amp; Templat Unduhan
            </h3>
            <p className="text-xs text-gray-500 font-ui font-normal">
              Unduh templat format CSV untuk menyalin catatan kasir, bank, atau settlement QRIS Anda
            </p>
          </div>

          <div className="space-y-3 text-xs font-ui">
            {/* Source 1: Kasir POS */}
            <div className="p-4 rounded-xl border border-gray-200 hover:border-[#009770] bg-gray-50/70 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700">point_of_sale</span>
                  <span className="font-bold text-gray-900 text-sm font-ui">1. Ekspor CSV Kasir POS</span>
                </div>
                <button
                  onClick={() => handleDownloadTemplate('pos')}
                  className="px-3 py-1 rounded-lg bg-[#009770] hover:bg-[#009770]/90 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer font-ui"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Unduh Templat</span>
                </button>
              </div>
              <p className="text-[11px] text-gray-500 font-mono">
                Kolom: tanggal_jam, kasir_shift, jenis, nominal, metode, ada_struk, deskripsi
              </p>
            </div>

            {/* Source 2: Mutasi Rekening Bank */}
            <div className="p-4 rounded-xl border border-gray-200 hover:border-blue-400 bg-gray-50/70 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-700">account_balance</span>
                  <span className="font-bold text-gray-900 text-sm font-ui">2. Mutasi Rekening Bank (BRI/BCA)</span>
                </div>
                <button
                  onClick={() => handleDownloadTemplate('bank')}
                  className="px-3 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer font-ui"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Unduh Templat</span>
                </button>
              </div>
              <p className="text-[11px] text-gray-500 font-mono">
                Kolom: tanggal, rekening, jenis_mutasi, nominal, saldo, keterangan
              </p>
            </div>

            {/* Source 3: Ekspor QRIS Merchant */}
            <div className="p-4 rounded-xl border border-gray-200 hover:border-purple-400 bg-gray-50/70 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-700">qr_code_scanner</span>
                  <span className="font-bold text-gray-900 text-sm font-ui">3. Ekspor QRIS Merchant</span>
                </div>
                <button
                  onClick={() => handleDownloadTemplate('qris')}
                  className="px-3 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer font-ui"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Unduh Templat</span>
                </button>
              </div>
              <p className="text-[11px] text-gray-500 font-mono">
                Kolom: settlement_date, merchant_id, nominal_bruto, biaya_mdr, nominal_netto, rrn_qris
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Audit Logs of Consent Actions */}
      <div className="bg-white rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-3 text-xs font-ui">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h3 className="font-ui font-semibold text-sm text-[#0A2A22]">
              Jejak Audit Izin &amp; Privasi Pemilik
            </h3>
            <p className="text-xs text-gray-500 font-ui font-normal">
              Rekaman legal kapan izin diberikan atau dicabut untuk kepatuhan UU PDP
            </p>
          </div>
          <span className="text-gray-400 font-mono tabular-nums">{auditLogs.length} peristiwa</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-[10px] font-mono tracking-[0.08em] border-b border-gray-200">
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Tindakan Pemilik</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3">Status Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {auditLogs.map((log, idx) => (
                <tr key={`${log.id}-${idx}`} className="hover:bg-gray-50">
                  <td className="py-2 px-3 text-gray-500 font-mono tabular-nums">{log.timestamp} WIB</td>
                  <td className="py-2 px-3 font-semibold text-gray-900 font-ui">{log.action}</td>
                  <td className="py-2 px-3 text-gray-700 font-mono">{log.target}</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 font-ui">
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
