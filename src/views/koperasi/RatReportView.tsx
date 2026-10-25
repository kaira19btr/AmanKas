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
}

export const RatReportView: React.FC<RatReportViewProps> = ({ transactions, accounts }) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2026');

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
                <h1 className="font-display font-bold text-base text-white">
                  Bahan Laporan Pengawas untuk Rapat Anggota Tahunan (RAT)
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#009770]/40 text-[#84F8CA] border border-[#84F8CA]/30 text-[10px] font-mono font-bold">
                  Agregat Privasi Terjaga
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                Dokumen kompilasi berkala pengendalian internal dan kesehatan kas buku kas KSP. Seluruh statistik disajikan secara agregat tanpa membocorkan NIK, nomor rekening, atau identitas pribadi anggota (UU PDP 27/2022).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white/10 text-white text-xs font-mono-tabular px-3 py-1.5 rounded-xl border border-[#00B386]/40 cursor-pointer"
            >
              <option value="2026" className="bg-[#031B15]">Tahun Buku 2026</option>
              <option value="2025" className="bg-[#031B15]">Tahun Buku 2025</option>
            </select>

            <button
              onClick={handleDownloadPdf}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#009770] to-[#84F8CA] text-[#0A2A22] font-display font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              <span>Unduh PDF Bahan RAT</span>
            </button>
          </div>
        </div>
      </section>

      {/* Printable RAT Document Card */}
      <div className="bg-white rounded-2xl border border-[#F3D9CE] shadow-sm p-8 print:p-0 print:border-none space-y-8 font-sans">
        {/* Document Header */}
        <div className="border-b-2 border-[#0A2A22] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#009770] font-mono-tabular">
                KOPERASI SIMPAN PINJAM MITRA SEJAHTERA
              </span>
            </div>
            <h2 className="font-display font-extrabold text-2xl text-[#0A2A22]">
              LAPORAN PENGAWAS ATAS SISTEM PENGENDALIAN INTERNAL
            </h2>
            <p className="text-xs text-gray-500 font-mono-tabular mt-1">
              Bahan Sidang Pleno Rapat Anggota Tahunan (RAT) &bull; Periode Buku {selectedYear}
            </p>
          </div>

          <div className="text-right text-xs font-mono-tabular text-gray-600">
            <div>Disusun oleh: <strong>Dewan Pengawas KSP</strong></div>
            <div>Sistem Pengendalian: <SadarText variant="light" className="text-xs font-bold inline-flex" /></div>
            <div>Status Perlindungan Data: <strong>Pseudonim Terpatuhi</strong></div>
          </div>
        </div>

        {/* 1. Ringkasan Eksekutif Finansial */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-base text-[#0A2A22] flex items-center gap-2">
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

        {/* 2. Kesehatan Statistik Akun & Kepatuhan Benford */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-base text-[#0A2A22] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#009770]" />
            <span>II. Uji Kepatuhan Angka Finansial (Nigrini MAD &amp; Hukum Benford)</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-tabular border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="py-2.5 px-3">Kode Akun</th>
                  <th className="py-2.5 px-3">Nama Akun Buku Kas</th>
                  <th className="py-2.5 px-3 text-center">Nigrini MAD</th>
                  <th className="py-2.5 px-3 text-center">Chi-Square (&chi;&sup2;)</th>
                  <th className="py-2.5 px-3">Status Evaluasi Pengawas</th>
                  <th className="py-2.5 px-3">Keterangan untuk Anggota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-bold text-gray-800">{acc.id}</td>
                    <td className="py-2 px-3 font-semibold">{acc.name}</td>
                    <td className="py-2 px-3 text-center">{acc.mad.toFixed(4)}</td>
                    <td className="py-2 px-3 text-center">{acc.chiSquare.toFixed(2)}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          acc.isFixedAmount
                            ? 'bg-blue-100 text-blue-800'
                            : acc.status === 'Merah'
                            ? 'bg-rose-100 text-rose-800'
                            : acc.status === 'Kuning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {acc.isFixedAmount ? 'Dikecualikan (Nominal Tetap)' : acc.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-600 text-[11px]">
                      {acc.isFixedAmount
                        ? 'Nominal seragam per anggota sesuai AD/ART.'
                        : acc.status === 'Hijau'
                        ? 'Distribusi alami memenuhi kaidah statistik audit.'
                        : 'Dalam proses pengujian sampling berkas fisik oleh komite.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Laporan Kepatuhan Dokumen & Keputusan Pengawas */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-base text-[#0A2A22] flex items-center gap-2">
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
    </div>
  );
};
