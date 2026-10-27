/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KoperasiTransaction, Account } from '../../types';
import { SadarText } from '../../components/SadarText';

interface RatReportViewProps {
  transactions: KoperasiTransaction[];
  accounts: Account[];
  onLogAuditAction?: (action: string, target: string, reason: string) => void;
}

export const RatReportView: React.FC<RatReportViewProps> = ({
  transactions,
  accounts,
  onLogAuditAction,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [isApprovedForSharing, setIsApprovedForSharing] = useState<boolean>(false);
  const [approvedTimestamp, setApprovedTimestamp] = useState<string | null>(null);

  // Aggregates
  const totalSimpanan = transactions
    .filter((t) => t.akun.includes('Simpanan'))
    .reduce((acc, t) => acc + t.nominal, 0);

  const totalPinjaman = transactions
    .filter((t) => t.akun.includes('Pinjaman'))
    .reduce((acc, t) => acc + t.nominal, 0);

  const totalAngsuran = transactions
    .filter((t) => t.akun.includes('Angsuran'))
    .reduce((acc, t) => acc + t.nominal, 0);

  const totalBiaya = transactions
    .filter((t) => t.akun.includes('Biaya'))
    .reduce((acc, t) => acc + t.nominal, 0);

  const documentedCount = transactions.filter((t) => t.statusDokumen === 'Lengkap').length;
  const docCompliancePct = transactions.length > 0 ? Math.round((documentedCount / transactions.length) * 100) : 100;

  const wajarCount = transactions.filter((t) => t.decisionStatus === 'Wajar').length;
  const followUpCount = transactions.filter((t) => t.decisionStatus === 'Perlu pemeriksaan lanjut').length;
  const docNeedCount = transactions.filter((t) => t.decisionStatus === 'Perlu dokumen pendukung').length;

  const handleApproveShare = () => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setIsApprovedForSharing(true);
    setApprovedTimestamp(timeStr);

    if (onLogAuditAction) {
      onLogAuditAction(
        'Persetujuan Bahan RAT',
        `Bahan Sidang Pleno Periode ${selectedYear}`,
        'Pengawas meninjau dan menyetujui ringkasan agregat untuk dibagikan kepada anggota RAT'
      );
    }
  };

  const handleDownloadPdf = () => {
    setDownloadSuccess(true);
    setTimeout(() => {
      window.print();
      setDownloadSuccess(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* 1. Contextual Help Header for Koperasi Supervisor / Management */}
      <section className="bg-gradient-to-r from-[#031B15] to-[#0A2A22] text-white rounded-2xl p-4 px-6 border-l-4 border-l-[#009770] border border-[#00B386]/30 shadow-md no-print">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#009770]/30 border border-[#84F8CA]/40 flex items-center justify-center text-[#84F8CA]">
              <span className="material-symbols-outlined text-2xl">menu_book</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-ui font-semibold text-base text-white">
                  Bahan Laporan Pengawas untuk Rapat Anggota Tahunan (RAT)
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#009770]/40 text-[#84F8CA] border border-[#84F8CA]/30 text-[10px] font-mono font-medium tracking-[0.08em] uppercase">
                  Gerbang Persetujuan Pengawas
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed font-ui">
                Kompilasi berkala kesehatan pembukuan kas KSP khusus disajikan dalam bentuk agregat tanpa memuat data pribadi anggota. Laporan terkunci hingga Dewan Pengawas memberikan persetujuan resmi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white/10 text-white text-xs font-mono px-3 py-1.5 rounded-xl border border-[#00B386]/40 cursor-pointer"
            >
              <option value="2026" className="bg-[#031B15]">Tahun Buku 2026</option>
              <option value="2025" className="bg-[#031B15]">Tahun Buku 2025</option>
            </select>

            {isApprovedForSharing && (
              <button
                onClick={handleDownloadPdf}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#009770] to-[#84F8CA] text-[#0A2A22] font-ui font-semibold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                <span>Unduh PDF Bahan RAT</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* GERBANG PERSETUJUAN (MANDATORY REQUIREMENT) */}
      {!isApprovedForSharing ? (
        <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-md p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5 font-ui">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>

          <div className="space-y-2">
            <h2 className="font-ui font-bold text-xl text-[#0A2A22]">
              Gerbang Tinjauan &amp; Persetujuan Pengawas
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed max-w-lg mx-auto">
              Sesuai tata kelola pengendalian internal, laporan agregat untuk anggota tidak dapat diakses atau dibagikan sebelum Dewan Pengawas melakukan penelaahan data dan memberikan persetujuan formal.
            </p>
          </div>

          {/* Context Paragraph required */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <span className="material-symbols-outlined text-sm text-amber-800">info</span>
              <span>Paragraf Konteks Otomatis Bahan RAT:</span>
            </div>
            <p className="italic text-[11px] leading-relaxed text-amber-900">
              "Indikator risiko bukan bukti pelanggaran; hasil ini belum atau sudah diperiksa pengawas."
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleApproveShare}
              className="px-6 py-3 rounded-2xl bg-[#009770] hover:bg-[#008260] text-white font-ui font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 mx-auto"
            >
              <span className="material-symbols-outlined text-base">verified</span>
              <span>Tinjau dan setujui untuk dibagikan</span>
            </button>
            <p className="text-[10px] text-gray-400 font-mono mt-2">
              Persetujuan ini akan dicatat ke dalam log audit berantai hash (append-only, tamper-evident).
            </p>
          </div>
        </div>
      ) : (
        /* Printable RAT Document Card - Rendered ONLY after approval */
        <div className="bg-white rounded-2xl border border-[#F3D9CE] shadow-sm p-8 print:p-0 print:border-none space-y-8 font-ui">
          {/* Approval Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-700 text-base">check_circle</span>
              <span>
                Laporan telah disetujui untuk dibagikan oleh <strong>Dewan Pengawas</strong> pada <strong>{approvedTimestamp}</strong>.
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase px-2 py-0.5 rounded bg-emerald-100">
              Tercatat di Log Audit
            </span>
          </div>

          {/* Document Header */}
          <div className="border-b-2 border-[#0A2A22] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#009770] font-mono">
                  KOPERASI SIMPAN PINJAM MITRA SEJAHTERA
                </span>
              </div>
              <h2 className="font-display font-medium text-2xl text-[#0A2A22] lining-nums">
                LAPORAN PENGAWAS ATAS SISTEM PENGENDALIAN INTERNAL
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-1">
                Bahan Sidang Pleno Rapat Anggota Tahunan (RAT) &bull; Periode Buku {selectedYear}
              </p>
            </div>

            <div className="text-right text-xs font-mono text-gray-600">
              <div>Disusun oleh: <strong>Dewan Pengawas KSP</strong></div>
              <div>Sistem Pengendalian: <SadarText variant="light" className="text-xs font-semibold inline-flex" /></div>
              <div>Status Perlindungan Data: <strong>Pseudonim Terkelola</strong></div>
            </div>
          </div>

          {/* MANDATORY CONTEXT PARAGRAPH (ESAI REQUIREMENT) */}
          <div className="p-4 rounded-xl bg-gray-50 border-l-4 border-l-[#009770] border border-gray-200 text-xs text-gray-700 leading-relaxed font-ui">
            <strong className="text-gray-900 font-semibold block mb-0.5">Keterangan Pengantar Dewan Pengawas kepada Anggota:</strong>
            <p className="text-gray-800 font-medium">
              "Indikator risiko bukan bukti pelanggaran; hasil ini belum atau sudah diperiksa pengawas."
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Data yang disajikan dalam lampiran ini merupakan kompilasi statistik agregat untuk mendukung transparansi tata kelola RAT, bukan daftar putusan sanksi hukum.
            </p>
          </div>

          {/* 1. Ringkasan Eksekutif Finansial */}
          <div className="space-y-3 font-ui">
            <h3 className="font-ui font-semibold text-base text-[#0A2A22] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#009770]" />
              <span>I. Ringkasan Agregat Peredaran Buku Kas KSP</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono-tabular">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-xs text-gray-500">Total Simpanan Anggota</div>
                <div className="text-lg font-bold text-[#0A2A22] mt-1">
                  Rp {new Intl.NumberFormat('id-ID').format(totalSimpanan)}
                </div>
                <div className="text-[11px] text-[#009770] mt-0.5">Pokok, Wajib &amp; Sukarela</div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-xs text-gray-500">Penyaluran Pinjaman</div>
                <div className="text-lg font-bold text-[#0A2A22] mt-1">
                  Rp {new Intl.NumberFormat('id-ID').format(totalPinjaman)}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Kredit Produktif &amp; Konsumtif</div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-xs text-gray-500">Pengembalian Angsuran</div>
                <div className="text-lg font-bold text-[#0A2A22] mt-1">
                  Rp {new Intl.NumberFormat('id-ID').format(totalAngsuran)}
                </div>
                <div className="text-[11px] text-emerald-600 mt-0.5">Lancar &amp; Tertib</div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="text-xs text-gray-500">Beban Biaya Operasional</div>
                <div className="text-lg font-bold text-[#0A2A22] mt-1">
                  Rp {new Intl.NumberFormat('id-ID').format(totalBiaya)}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Kantor Pusat &amp; Cabang</div>
              </div>
            </div>
          </div>

          {/* 2. Kesehatan Statistik Akun & Kepatuhan Benford Dual Digit */}
          <div className="space-y-3 font-ui">
            <h3 className="font-ui font-semibold text-base text-[#0A2A22] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#009770]" />
              <span>II. Uji Kepatuhan Angka Finansial (Nigrini 2012 MAD &amp; Benford Dual-Digit)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono tabular-nums border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="py-2.5 px-3">Kode Akun</th>
                    <th className="py-2.5 px-3">Nama Akun Buku Kas</th>
                    <th className="py-2.5 px-3 text-center">Nigrini MAD</th>
                    <th className="py-2.5 px-3 text-center">Chi-Square (&chi;&sup2;)</th>
                    <th className="py-2.5 px-3">Status Risiko Akun</th>
                    <th className="py-2.5 px-3">Keterangan untuk Anggota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accounts.map((acc) => {
                    const isRed = acc.status.includes('Merah');
                    const isYellow = acc.status.includes('Kuning');
                    const isEx = acc.isFixedAmount;

                    return (
                      <tr key={acc.id} className="hover:bg-gray-50">
                        <td className="py-2 px-3 font-bold text-gray-800">{acc.id}</td>
                        <td className="py-2 px-3 font-semibold font-ui">{acc.name}</td>
                        <td className="py-2 px-3 text-center">{acc.mad.toFixed(4)}</td>
                        <td className="py-2 px-3 text-center">{acc.chiSquare.toFixed(2)}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold font-ui inline-flex items-center gap-1 ${
                              isEx
                                ? 'bg-blue-100 text-blue-800'
                                : isRed
                                ? 'bg-rose-100 text-rose-800'
                                : isYellow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[11px]">
                              {isEx ? 'block' : isRed ? 'error' : isYellow ? 'warning' : 'check_circle'}
                            </span>
                            <span>{isEx ? 'Dikecualikan (Nominal Tetap)' : acc.status}</span>
                          </span>
                        </td>
                        <td className="py-2 px-3 text-gray-600 text-[11px] font-ui">
                          {isEx
                            ? 'Nominal seragam per anggota sesuai ketentuan AD/ART.'
                            : !isRed && !isYellow
                            ? 'Distribusi alami memenuhi kaidah statistik audit.'
                            : 'Dalam proses klarifikasi sampling berkas fisik oleh komite pengawas.'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Laporan Kepatuhan Dokumen & Keputusan Pengawas */}
          <div className="space-y-3 font-ui">
            <h3 className="font-ui font-semibold text-base text-[#0A2A22] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#009770]" />
              <span>III. Hasil Uji Sampling &amp; Tindak Lanjut Pengawas</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-tabular text-xs">
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1">
                <span className="text-gray-500">Tingkat Kelengkapan Dokumen:</span>
                <div className="text-2xl font-bold text-[#009770]">{docCompliancePct}%</div>
                <p className="text-[11px] text-gray-500">
                  {documentedCount} dari {transactions.length} transaksi uji memiliki kuitansi/agunan lengkap.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1">
                <span className="text-gray-500">Dinyatakan Wajar oleh Pengawas:</span>
                <div className="text-2xl font-bold text-emerald-700">{wajarCount} Kasus</div>
                <p className="text-[11px] text-gray-500">
                  Telah ditelaah dan diverifikasi kesesuaian operasionalnya.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-1">
                <span className="text-gray-500">Rekomendasi RAT / Pemeriksaan Lanjut:</span>
                <div className="text-2xl font-bold text-amber-700">
                  {followUpCount + docNeedCount} Kasus
                </div>
                <p className="text-[11px] text-gray-500">
                  Diagendakan untuk pemenuhan berkas fisik dan audit internal cabang.
                </p>
              </div>
            </div>
          </div>

          {/* Signatures block for RAT document */}
          <div className="pt-8 border-t border-gray-300 grid grid-cols-2 md:grid-cols-3 gap-6 text-center text-xs font-mono-tabular">
            <div>
              <div className="text-gray-500 mb-16">Ketua Dewan Pengawas</div>
              <div className="font-bold text-gray-900 border-t border-gray-400 pt-1">
                ( Sari Wahyuni, S.E. )
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-16">Anggota Pengawas</div>
              <div className="font-bold text-gray-900 border-t border-gray-400 pt-1">
                ( Budi Hartono, M.Ak. )
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="text-gray-500 mb-16">Mengetahui, Ketua Pengurus</div>
              <div className="font-bold text-gray-900 border-t border-gray-400 pt-1">
                ( Hendro Prayogo )
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
