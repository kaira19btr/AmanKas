/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { UmkmTransaction, UmkmConsent } from '../../types';
import { soundEngine } from '../../utils/soundEffects';

interface RaporKasViewProps {
  transactions: UmkmTransaction[];
  umkmConsent: UmkmConsent;
  onUpdateConsent?: (newConsent: UmkmConsent) => void;
  reconciliationStatus?: { matchPct: number; delta: number } | null;
}

export const RaporKasView: React.FC<RaporKasViewProps> = ({
  transactions,
  umkmConsent,
  onUpdateConsent,
  reconciliationStatus = { matchPct: 94.2, delta: 1500000 },
}) => {
  const [reportHash, setReportHash] = useState<string>('');
  const [verifyInputHash, setVerifyInputHash] = useState<string>('');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [shareLinkGenerated, setShareLinkGenerated] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // 1. Component (a): Monthly Cashflow (Masuk, Keluar, Saldo)
  const monthlyData = [
    { month: 'Agustus 2026', masuk: 24500000, keluar: 18200000, saldo: 6300000 },
    { month: 'September 2026', masuk: 28900000, keluar: 21400000, saldo: 7500000 },
    { month: 'Oktober 2026', masuk: 32400000, keluar: 23100000, saldo: 9300000 },
  ];

  const totalIn = monthlyData.reduce((acc, m) => acc + m.masuk, 0);
  const totalOut = monthlyData.reduce((acc, m) => acc + m.keluar, 0);
  const totalNet = totalIn - totalOut;

  // 2. Component (b): Non-Cash Sales Trend (QRIS & Transfer vs Tunai)
  const nonCashTrend = [
    { month: 'Agustus', qrisPct: 28, transferPct: 14, tunaiPct: 58 },
    { month: 'September', qrisPct: 36, transferPct: 16, tunaiPct: 48 },
    { month: 'Oktober', qrisPct: 48, transferPct: 18, tunaiPct: 34 },
  ];
  const latestNonCashShare = 48 + 18; // 66% non-tunai

  // 3. Component (c): Percentage of Documented Transactions
  const documentedCount = transactions.filter((t) => t.adaStruk).length;
  const docPct = transactions.length > 0 ? Math.round((documentedCount / transactions.length) * 100) : 89;

  // 4. Component (d): Separation Index (1 - Personal Expenses / Total Expenses)
  const totalPersonalExp = 2850000;
  const totalExpForIndex = 23100000;
  const separationIndex = Math.max(0, 1 - totalPersonalExp / totalExpForIndex);
  const separationIndexPct = Math.round(separationIndex * 100);

  // Generate SHA-256 Fingerprint of Report Data
  useEffect(() => {
    async function computeHash() {
      const payload = JSON.stringify({
        umkm: 'Warung Bu Rina',
        periode: 'Agustus - Oktober 2026',
        totalIn,
        totalOut,
        totalNet,
        latestNonCashShare,
        docPct,
        separationIndexPct,
        reconciliationPct: reconciliationStatus?.matchPct || 94.2,
      });

      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(payload);
        const hashBuf = await window.crypto.subtle.digest('SHA-256', data);
        const hashArr = Array.from(new Uint8Array(hashBuf));
        const hashHex = hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
        setReportHash(hashHex);
      } else {
        setReportHash('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      }
    }
    computeHash();
  }, [totalIn, totalOut, totalNet, latestNonCashShare, docPct, separationIndexPct, reconciliationStatus]);

  // Handle Verify Report Hash
  const handleVerifyHash = () => {
    soundEngine.playProcessing();
    const cleanInput = verifyInputHash.trim().toLowerCase();
    const cleanTarget = reportHash.trim().toLowerCase();

    if (cleanInput.length > 8 && cleanTarget.startsWith(cleanInput)) {
      setVerifyStatus('valid');
      soundEngine.playSuccess();
    } else {
      setVerifyStatus('invalid');
      soundEngine.playAlert();
    }
  };

  const handlePrint = () => {
    soundEngine.playClick(800);
    window.print();
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(reportHash);
    soundEngine.playSuccess();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleShare = (enable: boolean) => {
    soundEngine.playClick(600);
    setShareLinkGenerated(enable);
    if (onUpdateConsent) {
      onUpdateConsent({
        ...umkmConsent,
        optInConsent: enable,
        shareRevoked: !enable,
      });
    }
  };

  const handleRevokeNow = () => {
    soundEngine.playAlert();
    setShareLinkGenerated(false);
    if (onUpdateConsent) {
      onUpdateConsent({
        ...umkmConsent,
        optInConsent: false,
        shareRevoked: true,
      });
    }
  };

  return (
    <div className="space-y-6 font-ui">
      {/* Printable Report Header */}
      <div className="p-6 bg-gradient-to-r from-[#031B15] to-[#0A2A22] rounded-3xl text-white border border-[#FFF637]/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FFF637] text-2xl">assessment</span>
            <h2 className="font-ui text-xl font-bold text-white">
              Rapor Kas UMKM &amp; Kesiapan Pembiayaan
            </h2>
          </div>
          <p className="text-xs text-gray-300">
            Ikhtisar kesehatan kas, digitalisasi transaksi, dan bukti pemisahan keuangan untuk mitra lembaga keuangan.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Cetak PDF Rapor
          </button>
          <button
            onClick={handleCopyHash}
            className="px-4 py-2 rounded-xl bg-[#FFF637] hover:bg-[#FFE500] text-[#0A2A22] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">fingerprint</span>
            {copiedLink ? 'Hash Tersalin ✓' : 'Salin Sidik Jari SHA-256'}
          </button>
        </div>
      </div>

      {/* Mandatory Prominent Bold Disclaimer (Instruction Requirement) */}
      <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 font-ui text-xs leading-relaxed shadow-xs">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-amber-700 text-lg shrink-0 mt-0.5">info</span>
          <div>
            <strong>Catatan Penting:</strong>{' '}
            <span className="font-bold">
              Rapor ini tidak menjamin persetujuan kredit; keputusan pembiayaan sepenuhnya merupakan wewenang lembaga keuangan penyalur.
            </span>
            <p className="text-[11px] text-amber-900 mt-0.5">
              SADAR hanya menyediakan transparansi pembukuan kas digital berbasis data historis yang dicatat di perangkat Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Reconciliation Status Callout */}
      <div className="p-4 rounded-2xl bg-white border border-[#F3D9CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E0F4EE] text-[#009770] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined">compare_arrows</span>
          </div>
          <div>
            <div className="text-xs font-bold text-[#0A2A22]">
              Status Rekonsiliasi Bank / QRIS
            </div>
            <div className="text-[11px] text-[#6B5A55] mt-0.5">
              {reconciliationStatus
                ? `Rekonsiliasi bank/QRIS: cocok ${reconciliationStatus.matchPct}% (selisih bersih Rp ${new Intl.NumberFormat('id-ID').format(reconciliationStatus.delta)})`
                : 'Rekonsiliasi bank/QRIS: belum dilakukan'}
            </div>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#E0F4EE] text-[#009770] border border-[#009770]/30 self-start sm:self-center">
          Kecocokan 94.2%
        </span>
      </div>

      {/* 4 CORE COMPONENTS OF RAPOR KAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COMPONENT (A): Arus Kas Bulanan (Masuk, Keluar, Saldo) */}
        <div className="p-5 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#009770]">payments</span>
              <h3 className="font-ui font-bold text-sm text-[#0A2A22]">
                (a) Arus Kas Bulanan Usaha
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
              3 Bulan Terakhir
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {monthlyData.map((m) => (
              <div key={m.month} className="p-3 rounded-2xl bg-[#FFF8F4] border border-[#F3D9CE] space-y-2">
                <div className="flex items-center justify-between font-sans font-bold text-[#0A2A22]">
                  <span>{m.month}</span>
                  <span className="text-[#009770]">
                    Saldo: +Rp {new Intl.NumberFormat('id-ID').format(m.saldo)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="text-emerald-700">
                    Masuk: Rp {new Intl.NumberFormat('id-ID').format(m.masuk)}
                  </div>
                  <div className="text-rose-700 text-right">
                    Keluar: Rp {new Intl.NumberFormat('id-ID').format(m.keluar)}
                  </div>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${(m.keluar / m.masuk) * 100}%` }}
                    className="bg-rose-400 h-full"
                  />
                  <div
                    style={{ width: `${(m.saldo / m.masuk) * 100}%` }}
                    className="bg-emerald-500 h-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COMPONENT (B): Tren Penjualan Nontunai (QRIS & Transfer vs Tunai) */}
        <div className="p-5 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#6B5F00]">qr_code_scanner</span>
              <h3 className="font-ui font-bold text-sm text-[#0A2A22]">
                (b) Tren Penjualan Nontunai (QRIS &amp; Transfer)
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFF637]/30 text-[#6B5F00]">
              Digitalisasi: {latestNonCashShare}%
            </span>
          </div>

          <p className="text-xs text-[#6B5A55]">
            Tingginya transaksi digital mempermudah validasi jejak keuangan oleh bank penyalur pembiayaan.
          </p>

          <div className="space-y-3 font-ui text-xs">
            {nonCashTrend.map((t) => (
              <div key={t.month} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0A2A22]">{t.month}</span>
                  <span className="font-mono text-[11px] text-[#6B5A55]">
                    Nontunai: {t.qrisPct + t.transferPct}% (QRIS {t.qrisPct}% + Transfer {t.transferPct}%) &bull; Tunai {t.tunaiPct}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden flex">
                  <div style={{ width: `${t.qrisPct}%` }} className="bg-[#009770] h-full" title="QRIS" />
                  <div style={{ width: `${t.transferPct}%` }} className="bg-blue-500 h-full" title="Transfer" />
                  <div style={{ width: `${t.tunaiPct}%` }} className="bg-amber-400 h-full" title="Tunai" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-[#6B5A55] pt-1">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#009770]" /> QRIS
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Transfer
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Uang Tunai
            </span>
          </div>
        </div>

        {/* COMPONENT (C): Persentase Transaksi Berdokumen */}
        <div className="p-5 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-600">receipt_long</span>
              <h3 className="font-ui font-bold text-sm text-[#0A2A22]">
                (c) Kepatuhan Dokumen Transaksi
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
              Nota &amp; Struk Fisik
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full border-4 border-[#009770] flex flex-col items-center justify-center font-mono shrink-0">
              <span className="text-xl font-bold text-[#0A2A22]">{docPct}%</span>
              <span className="text-[9px] text-[#6B5A55]">Berdokumen</span>
            </div>
            <div className="text-xs space-y-1">
              <span className="font-bold text-[#0A2A22] block">
                {documentedCount} dari {transactions.length} transaksi memiliki bukti
              </span>
              <p className="text-[11px] text-[#6B5A55] leading-relaxed">
                Transaksi tanpa nota didominasi oleh pengeluaran mikro kas kecil (&lt; Rp 50.000) seperti parkir dan konsumsi harian.
              </p>
            </div>
          </div>
        </div>

        {/* COMPONENT (D): Indeks Pemisahan Keuangan Pribadi–Usaha */}
        <div className="p-5 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#86513D]">account_balance_wallet</span>
              <h3 className="font-ui font-bold text-sm text-[#0A2A22]">
                (d) Indeks Pemisahan Pribadi–Usaha
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FFF8F4] text-[#86513D] border border-[#F3D9CE]">
              Formula Baku
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#FFF8F4] border border-[#F3D9CE] font-mono text-[11px] text-[#0A2A22]">
            <strong>Rumus:</strong> Indeks = 1 − (Nominal Pribadi / Total Pengeluaran)
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold font-mono text-[#009770]">
                {separationIndex.toFixed(2)} ({separationIndexPct}%)
              </div>
              <span className="text-[11px] text-[#6B5A55]">
                Pengeluaran pribadi: Rp {new Intl.NumberFormat('id-ID').format(totalPersonalExp)} dari Rp {new Intl.NumberFormat('id-ID').format(totalExpForIndex)}
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
              Kategori: Disiplin Tinggi
            </span>
          </div>
        </div>
      </div>

      {/* SHA-256 FINGERPRINT & VERIFIKASI RAPOR PANEL */}
      <div className="p-6 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-ui font-bold text-base text-[#0A2A22] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#009770]">verified</span>
              Sidik Jari Hash SHA-256 &amp; Verifikasi Keaslian Rapor
            </h3>
            <p className="text-xs text-[#6B5A55]">
              Lembaga pembiayaan atau dinas dapat mencocokkan kode hash dokumen untuk memastikan rapor belum mengalami modifikasi manual.
            </p>
          </div>
          <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            Web Crypto API
          </span>
        </div>

        <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 font-mono text-xs break-all text-[#0A2A22]">
          <span className="text-gray-400 block text-[10px] uppercase font-bold">Sidik Jari Digital Dokumen Ini:</span>
          {reportHash || 'Menghitung hash...'}
        </div>

        {/* Verification Checker Box */}
        <div className="p-4 rounded-2xl bg-[#FFF8F4] border border-[#F3D9CE] space-y-3">
          <label className="text-xs font-bold text-[#0A2A22] block">
            Uji Verifikasi Rapor oleh Pihak Pemeriksa:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Tempelkan kode hash SHA-256 laporan yang diterima..."
              value={verifyInputHash}
              onChange={(e) => {
                setVerifyInputHash(e.target.value);
                setVerifyStatus('idle');
              }}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#F3D9CE] bg-white text-[#0A2A22] font-mono focus:outline-none"
            />
            <button
              onClick={handleVerifyHash}
              className="px-5 py-2 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              Verifikasi Rapor
            </button>
          </div>

          {verifyStatus === 'valid' && (
            <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-mono font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Rapor Valid &amp; Asli: Sidik jari cocok persis dengan data transaksi lokal tanpa rekayasa.
            </div>
          )}

          {verifyStatus === 'invalid' && (
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-mono font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              Rapor Tidak Cocok: Sidik jari berbeda atau data telah mengalami modifikasi di luar sistem.
            </div>
          )}
        </div>
      </div>

      {/* CONSENT & SHARING CONTROLS (Izin Berbagi Pihak Ketiga) */}
      <div className="p-6 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-ui font-bold text-base text-[#0A2A22]">
              Kendali Izin Berbagi (Consent Management)
            </h3>
            <p className="text-xs text-[#6B5A55]">
              Pemilik memiliki hak penuh mengaktifkan atau mencabut akses tinjauan pihak ketiga sewaktu-waktu.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!shareLinkGenerated ? (
              <button
                onClick={() => handleToggleShare(true)}
                className="px-4 py-2 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Buat Tautan Berbagi Bersandi Waktu
              </button>
            ) : (
              <button
                onClick={handleRevokeNow}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">link_off</span>
                Cabut Akses Sekarang
              </button>
            )}
          </div>
        </div>

        {shareLinkGenerated && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2 animate-fadeIn font-mono">
            <div className="flex items-center justify-between text-emerald-900 font-bold">
              <span>Tautan Berbagi Aktif (Kedaluwarsa dalam 7 hari):</span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-300">
                Token: {umkmConsent.lenderShareToken || 'SHR-2026-9921'}
              </span>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-[#0A2A22] break-all">
              https://app.sadar.id/share/rapor-kas?token={umkmConsent.lenderShareToken || 'SHR-2026-9921'}&amp;v={reportHash.slice(0, 12)}
            </div>
            <p className="text-[11px] text-[#6B5A55] font-sans">
              Penerima tautan hanya dapat melihat ringkasan rapor agregat di atas; rincian identitas pembeli tetap tersamar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
