/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CashReconciliationRecord, UmkmTransaction } from '../../types';

interface CashierVarianceViewProps {
  transactions: UmkmTransaction[];
  reconciliations: CashReconciliationRecord[];
  onAddReconciliation: (rec: CashReconciliationRecord) => void;
}

export const CashierVarianceView: React.FC<CashierVarianceViewProps> = ({
  transactions,
  reconciliations,
  onAddReconciliation,
}) => {
  // Input state for physical cash count
  const [selectedShift, setSelectedShift] = useState('Shift 1 (08:00 - 15:00)');
  const [selectedKasir, setSelectedKasir] = useState('Kasir-01 (Dina)');
  const [systemCash] = useState(4850000);
  const [physicalCashInput, setPhysicalCashInput] = useState<number>(4780000);
  const [reconciliationNote, setReconciliationNote] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const diff = physicalCashInput - systemCash;
  const status: 'Sesuai' | 'Kurang' | 'Lebih' = diff === 0 ? 'Sesuai' : diff < 0 ? 'Kurang' : 'Lebih';

  const handleSaveReconciliation = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: CashReconciliationRecord = {
      id: `REK-${Date.now().toString().slice(-4)}`,
      tanggal: '2026-10-25',
      shift: selectedShift,
      kasir: selectedKasir,
      kasSistem: systemCash,
      kasFisikInput: physicalCashInput,
      selisih: diff,
      status: status,
      catatan: reconciliationNote || (diff === 0 ? 'Kas fisik cocok dengan sistem POS' : 'Tercatat selisih fisik kas'),
      waktuInput: new Date().toTimeString().slice(0, 5),
    };
    onAddReconciliation(newRecord);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Voids, returns, discounts breakdown per cashier & shift
  const voidTrx = transactions.filter((t) => t.jenis === 'void');
  const returTrx = transactions.filter((t) => t.jenis === 'retur');
  const diskonTrx = transactions.filter((t) => t.jenis === 'diskon');

  const cashierStats = [
    {
      kasir: 'KASIR-01 (Shift 1 Pagi)',
      petugas: 'Kasir-01 (Dina)',
      voidCount: voidTrx.filter((t) => t.kasirShift.includes('Shift 1')).length + 3,
      voidNominal: 465000,
      diskonCount: diskonTrx.filter((t) => t.kasirShift.includes('Shift 1')).length + 2,
      diskonNominal: 95000,
      returCount: 1,
      returNominal: 45000,
      statusPola: 'Perlu Dicek (3x void jam sibuk)',
    },
    {
      kasir: 'KASIR-02 (Shift 2 Malam)',
      petugas: 'Kasir-02 (Rian)',
      voidCount: voidTrx.filter((t) => t.kasirShift.includes('Shift 2')).length + 1,
      voidNominal: 120000,
      diskonCount: diskonTrx.filter((t) => t.kasirShift.includes('Shift 2')).length + 4,
      diskonNominal: 310000,
      returCount: 0,
      returNominal: 0,
      statusPola: 'Perlu Dicek (diskon 22:50 malam)',
    },
  ];

  // Heatmap Data: Days (Sen, Sel, Rab, Kam, Jum, Sab, Min) × Time slots (08-11, 11-14, 14-17, 17-20, 20-23)
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const timeSlots = ['08:00 - 11:00', '11:00 - 14:00', '14:00 - 17:00', '17:00 - 20:00', '20:00 - 23:00'];

  // Intensity matrix (0 = none, 1 = low, 2 = medium, 3 = high)
  const heatMatrix = [
    [0, 1, 0, 1, 0], // Sen
    [0, 0, 1, 0, 0], // Sel
    [1, 2, 0, 1, 0], // Rab
    [0, 1, 1, 0, 1], // Kam
    [1, 3, 2, 2, 1], // Jum (peak)
    [2, 3, 3, 2, 3], // Sab (high weekend voids & late discounts)
    [1, 2, 2, 1, 2], // Min
  ];

  return (
    <div className="space-y-6">
      {/* 1. Contextual Help Header for Owner */}
      <section className="bg-gradient-to-r from-[#031B15] to-[#0A2A22] text-white rounded-2xl p-4 px-6 border-l-4 border-l-[#FFF637] border border-[#FFF637]/30 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF637]/20 border border-[#FFF637]/40 flex items-center justify-center text-[#FFF637]">
              <span className="material-symbols-outlined text-2xl">point_of_sale</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base text-white">
                  Kasir, Selisih Laci Kas &amp; Pembatalan (Void)
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#FFF637]/30 text-[#FFF637] border border-[#FFF637]/40 text-[10px] font-mono font-bold">
                  Rekonsiliasi Harian Pemilik
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                Ketikkan jumlah uang fisik yang Anda hitung di laci kasir untuk mencocokkannya dengan rekap sistem. Anda juga dapat memantau kasir mana yang paling sering membatalkan transaksi atau memberi diskon di luar jam operasional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Cash Drawer Reconciliation Form */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Form Input Box */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-4 font-mono-tabular">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="font-display font-bold text-sm text-[#0A2A22]">
                Hitung Kas Fisik Laci Hari Ini
              </h2>
              <p className="text-xs text-gray-500 font-sans">
                Cocokkan uang tunai hasil penjualan dengan catatan sistem POS
              </p>
            </div>
            <span className="material-symbols-outlined text-amber-600">inventory_2</span>
          </div>

          <form onSubmit={handleSaveReconciliation} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-600 block mb-1">Shift Kasir:</label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800"
                >
                  <option value="Shift 1 (08:00 - 15:00)">Shift 1 (08:00 - 15:00)</option>
                  <option value="Shift 2 (15:00 - 22:00)">Shift 2 (15:00 - 22:00)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-600 block mb-1">Petugas Kasir:</label>
                <select
                  value={selectedKasir}
                  onChange={(e) => setSelectedKasir(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800"
                >
                  <option value="Kasir-01 (Dina)">Kasir-01 (Dina)</option>
                  <option value="Kasir-02 (Rian)">Kasir-02 (Rian)</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
              <span className="text-gray-500 text-[11px]">Uang Kas Menurut Sistem POS:</span>
              <div className="text-xl font-bold text-gray-900">
                Rp {new Intl.NumberFormat('id-ID').format(systemCash)}
              </div>
            </div>

            <div>
              <label className="text-gray-700 font-bold block mb-1">
                Uang Fisik Hasil Hitung di Laci (Rp):
              </label>
              <input
                type="number"
                step="1000"
                value={physicalCashInput}
                onChange={(e) => setPhysicalCashInput(Number(e.target.value) || 0)}
                className="w-full p-3 rounded-xl border-2 border-[#009770]/40 focus:border-[#009770] font-bold text-base text-[#0A2A22] focus:outline-none"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Hitung seluruh uang kertas dan koin yang ada di laci kasir saat tutup shift.
              </span>
            </div>

            {/* Calculated Variance Status Banner */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between ${
                status === 'Sesuai'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : status === 'Kurang'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider">
                  Status Rekonsiliasi:
                </div>
                <div className="text-base font-bold">
                  {status === 'Sesuai' ? '✓ Pas / Sesuai' : status === 'Kurang' ? 'Selisih Kurang' : 'Selisih Lebih'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-500">Nominal Selisih:</div>
                <div className="text-base font-extrabold font-mono">
                  {diff >= 0 ? '+' : ''}Rp {new Intl.NumberFormat('id-ID').format(diff)}
                </div>
              </div>
            </div>

            <div>
              <label className="text-gray-600 block mb-1">Catatan Pemilik:</label>
              <input
                type="text"
                placeholder="Contoh: Uang kembalian receh kurang Rp 70rb..."
                value={reconciliationNote}
                onChange={(e) => setReconciliationNote(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 text-gray-800"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#0A2A22] text-[#FFF637] font-bold hover:bg-[#009770] hover:text-white transition-all cursor-pointer font-sans"
            >
              Simpan Rekonsiliasi Kas Laci
            </button>

            {savedSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-center font-bold text-xs animate-fadeIn">
                ✓ Catatan rekonsiliasi kas berhasil disimpan ke buku toko!
              </div>
            )}
          </form>
        </div>

        {/* Right: History Log of Cash Reconciliation */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-4 font-mono-tabular">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-display font-bold text-sm text-[#0A2A22]">
                Riwayat Rekonsiliasi Laci Kas
              </h3>
              <p className="text-xs text-gray-500 font-sans">
                Catatan pengecekan fisik hari ini dan hari sebelumnya
              </p>
            </div>
            <span className="text-xs text-gray-400">{reconciliations.length} rekap</span>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
            {reconciliations.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-white transition-all space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-gray-900">{rec.shift}</div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rec.status === 'Sesuai'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.status === 'Kurang'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {rec.status === 'Sesuai' ? 'Pas (0)' : `${rec.status} Rp ${Math.abs(rec.selisih).toLocaleString('id-ID')}`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-1 border-t border-gray-200/50">
                  <div>Kas Sistem: Rp {rec.kasSistem.toLocaleString('id-ID')}</div>
                  <div>Kas Fisik: Rp {rec.kasFisikInput.toLocaleString('id-ID')}</div>
                  <div className="col-span-2 text-gray-500 italic">
                    &ldquo;{rec.catatan}&rdquo;
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 flex justify-between">
                  <span>Petugas: {rec.kasir}</span>
                  <span>Diinput: {rec.tanggal} ({rec.waktuInput} WIB)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Breakdown of Void, Retur, Diskon per Kasir & Shift */}
      <div className="bg-white rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-4">
        <div>
          <h3 className="font-display font-bold text-sm text-[#0A2A22]">
            Rangkuman Pembatalan (Void), Retur &amp; Diskon per Kasir
          </h3>
          <p className="text-xs text-gray-500">
            Kasir dengan pola pembatalan atau diskon tidak wajar ditandai untuk pemeriksaan rekaman CCTV
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-tabular">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-[10px] border-b border-gray-200">
                <th className="py-2.5 px-3">Kasir &amp; Shift</th>
                <th className="py-2.5 px-3">Nama Petugas</th>
                <th className="py-2.5 px-3 text-center">Jumlah Void</th>
                <th className="py-2.5 px-3 text-right">Total Uang Void</th>
                <th className="py-2.5 px-3 text-center">Diskon Manual</th>
                <th className="py-2.5 px-3 text-right">Total Diskon</th>
                <th className="py-2.5 px-3">Catatan Deteksi SADAR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cashierStats.map((cs, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3 px-3 font-bold text-gray-900">{cs.kasir}</td>
                  <td className="py-3 px-3 font-semibold text-gray-700">{cs.petugas}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800">
                      {cs.voidCount} kali
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-rose-700">
                    Rp {cs.voidNominal.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                      {cs.diskonCount} kali
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-amber-700">
                    Rp {cs.diskonNominal.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      &bull; {cs.statusPola}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Heatmap Jam × Hari untuk Void & Diskon */}
      <div className="bg-white rounded-2xl p-6 border border-[#F3D9CE] shadow-xs space-y-4 font-mono-tabular">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-display font-bold text-sm text-[#0A2A22]">
              Peta Panas (Heatmap) Jam &times; Hari: Frekuensi Void &amp; Diskon
            </h3>
            <p className="text-xs text-gray-500 font-sans">
              Semakin gelap warna merah/kuning, semakin sering terjadi pembatalan nota atau diskon di waktu tersebut
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-gray-100" />
              <span>Nol</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-amber-200" />
              <span>Rendah</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-amber-400" />
              <span>Sedang</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-rose-500" />
              <span>Tinggi (Waspada)</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="py-2 px-3 text-left w-20">Hari</th>
                {timeSlots.map((ts, i) => (
                  <th key={i} className="py-2 px-3 font-semibold text-gray-700">
                    {ts}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, dayIdx) => (
                <tr key={day} className="border-t border-gray-100">
                  <td className="py-2.5 px-3 text-left font-bold text-gray-800">{day}</td>
                  {timeSlots.map((_, slotIdx) => {
                    const intensity = heatMatrix[dayIdx][slotIdx];
                    const bgClass =
                      intensity === 3
                        ? 'bg-rose-500 text-white font-bold'
                        : intensity === 2
                        ? 'bg-amber-400 text-amber-950 font-bold'
                        : intensity === 1
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-400';

                    return (
                      <td key={slotIdx} className="py-2 px-3">
                        <div
                          className={`w-full py-2 rounded-lg text-xs transition-all ${bgClass}`}
                          title={`${day} jam ${timeSlots[slotIdx]}: Intensitas level ${intensity}`}
                        >
                          {intensity > 0 ? `${intensity * 2} kejadian` : '-'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
