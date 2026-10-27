/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { soundEngine } from '../../utils/soundEffects';

interface DinasKoperasiViewProps {
  onAppendAuditLog?: (action: string, entityId: string, details: string) => void;
}

interface PilotKsp {
  id: string;
  name: string;
  kabupaten: string;
  totalAnggota: number;
  totalAset: number;
  healthStatus: 'Sehat (Hijau)' | 'Cukup Sehat (Kuning)' | 'Dalam Pengawasan (Merah)';
  benfordMadD1: number;
  benfordMadD2: number;
  reconciliationRate: number;
  activeRedAlerts: number;
}

interface CrossKspRedAlert {
  id: string;
  kspId: string;
  kspName: string;
  nominal: number;
  indikator: string;
  tanggal: string;
  isVerifiedByDinas: boolean;
  verifiedAt?: string;
}

export const DinasKoperasiView: React.FC<DinasKoperasiViewProps> = ({
  onAppendAuditLog,
}) => {
  // 5 Synthetic Pilot KSPs
  const [kspList, setKspList] = useState<PilotKsp[]>([
    {
      id: 'KSP-01',
      name: 'KSP Merah Putih Makmur Sejahtera',
      kabupaten: 'Kab. Banyumas',
      totalAnggota: 1420,
      totalAset: 8500000000,
      healthStatus: 'Sehat (Hijau)',
      benfordMadD1: 0.0054,
      benfordMadD2: 0.0068,
      reconciliationRate: 98.2,
      activeRedAlerts: 0,
    },
    {
      id: 'KSP-02',
      name: 'KSP Bina Mandiri Gotong Royong',
      kabupaten: 'Kab. Sleman',
      totalAnggota: 980,
      totalAset: 4200000000,
      healthStatus: 'Cukup Sehat (Kuning)',
      benfordMadD1: 0.0108,
      benfordMadD2: 0.0095,
      reconciliationRate: 93.5,
      activeRedAlerts: 1,
    },
    {
      id: 'KSP-03',
      name: 'KSP Desa Maju Bersama',
      kabupaten: 'Kab. Kulon Progo',
      totalAnggota: 640,
      totalAset: 2800000000,
      healthStatus: 'Sehat (Hijau)',
      benfordMadD1: 0.0048,
      benfordMadD2: 0.0072,
      reconciliationRate: 96.8,
      activeRedAlerts: 0,
    },
    {
      id: 'KSP-04',
      name: 'KSP Rukun Santoso Unit Pasar',
      kabupaten: 'Kota Surakarta',
      totalAnggota: 2150,
      totalAset: 12400000000,
      healthStatus: 'Dalam Pengawasan (Merah)',
      benfordMadD1: 0.0182,
      benfordMadD2: 0.0145,
      reconciliationRate: 84.1,
      activeRedAlerts: 3,
    },
    {
      id: 'KSP-05',
      name: 'KSP Tani Makmur Berkah',
      kabupaten: 'Kab. Klaten',
      totalAnggota: 1120,
      totalAset: 6100000000,
      healthStatus: 'Sehat (Hijau)',
      benfordMadD1: 0.0059,
      benfordMadD2: 0.0078,
      reconciliationRate: 95.4,
      activeRedAlerts: 0,
    },
  ]);

  // Cross-KSP Red Alerts (Privacy-Preserving without PII)
  const [crossAlerts, setCrossAlerts] = useState<CrossKspRedAlert[]>([
    {
      id: 'ALT-KSP04-01',
      kspId: 'KSP-04',
      kspName: 'KSP Rukun Santoso Unit Pasar',
      nominal: 48500000,
      indikator: 'Deviasi nominal 5,4x di atas median kas + deviasi jam malam (22:45 WIB)',
      tanggal: '2026-10-25',
      isVerifiedByDinas: false,
    },
    {
      id: 'ALT-KSP04-02',
      kspId: 'KSP-04',
      kspName: 'KSP Rukun Santoso Unit Pasar',
      nominal: 35000000,
      indikator: 'Kerapatan transaksi pemecahan nominal (smurfing) beruntun 8 menit',
      tanggal: '2026-10-24',
      isVerifiedByDinas: false,
    },
    {
      id: 'ALT-KSP02-01',
      kspId: 'KSP-02',
      kspName: 'KSP Bina Mandiri Gotong Royong',
      nominal: 19800000,
      indikator: 'Lonjakan penarikan kas operasional teller melebihi P98 historis cabang',
      tanggal: '2026-10-25',
      isVerifiedByDinas: true,
      verifiedAt: '2026-10-25 14:10 WIB',
    },
  ]);

  const handleVerifyAlert = (alertId: string) => {
    soundEngine.playSuccess();
    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    setCrossAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, isVerifiedByDinas: true, verifiedAt: nowStr }
          : a
      )
    );

    const alertItem = crossAlerts.find((a) => a.id === alertId);
    if (onAppendAuditLog && alertItem) {
      onAppendAuditLog(
        'Verifikasi Peringatan Dinas',
        alertItem.kspId,
        `Dinas Koperasi memverifikasi indikator risiko ${alertItem.id} pada ${alertItem.kspName} tanpa membuka PII anggota.`
      );
    }
  };

  return (
    <div className="space-y-6 font-ui">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-[#031B15] to-[#0A2A22] rounded-3xl text-white border border-[#00B386]/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#84F8CA] text-2xl">assured_workload</span>
            <h2 className="font-ui text-xl font-bold text-white">
              Dasbor Pembina: Dinas Koperasi &amp; UMKM
            </h2>
          </div>
          <p className="text-xs text-gray-300">
            Pemantauan kesehatan kas agregat lintas 5 KSP binaan percontohan tanpa membuka data privasi anggota (UU 27/2022).
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-xs font-bold self-start sm:self-center">
          5 KSP Binaan Aktif
        </span>
      </div>

      {/* Aggregate KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#F3D9CE]">
          <span className="text-[11px] text-[#6B5A55] font-semibold block">Total KSP Terdaftar</span>
          <div className="text-2xl font-bold font-mono text-[#0A2A22] mt-1">5 KSP</div>
          <span className="text-[10px] text-[#009770] font-mono">3 Hijau &bull; 1 Kuning &bull; 1 Merah</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#F3D9CE]">
          <span className="text-[11px] text-[#6B5A55] font-semibold block">Total Anggota Terlindungi</span>
          <div className="text-2xl font-bold font-mono text-[#0A2A22] mt-1">6.310 Orang</div>
          <span className="text-[10px] text-[#6B5A55] font-mono">Anggota aktif terdata</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#F3D9CE]">
          <span className="text-[11px] text-[#6B5A55] font-semibold block">Total Aset Kas Terpantau</span>
          <div className="text-2xl font-bold font-mono text-[#009770] mt-1">Rp 34,0 Miliar</div>
          <span className="text-[10px] text-[#6B5A55] font-mono">Simpanan &amp; cadangan likuiditas</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#F3D9CE]">
          <span className="text-[11px] text-[#6B5A55] font-semibold block">Peringatan Merah Terbuka</span>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1">2 Menunggu</div>
          <span className="text-[10px] text-rose-600 font-mono">Perlu atensi verifikasi dinas</span>
        </div>
      </div>

      {/* 5 Synthetic Pilot KSPs Table */}
      <div className="p-6 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-ui font-bold text-base text-[#0A2A22]">
            Daftar Portofolio 5 KSP Percontohan Binaan
          </h3>
          <span className="text-xs font-mono text-[#6B5A55]">
            Standar Uji Nigrini (2012) &amp; POJK 9/2025
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#F3D9CE]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF8F4] border-b border-[#F3D9CE] font-semibold text-[#0A2A22]">
              <tr>
                <th className="py-3 px-4">Nama KSP &amp; Wilayah</th>
                <th className="py-3 px-3">Anggota</th>
                <th className="py-3 px-3">Total Aset</th>
                <th className="py-3 px-3">Benford MAD d1 / d2</th>
                <th className="py-3 px-3">Rekonsiliasi</th>
                <th className="py-3 px-3">Status Kesehatan</th>
                <th className="py-3 px-3 text-center">Alert Merah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3D9CE]/60 font-ui text-[#6B5A55]">
              {kspList.map((ksp) => (
                <tr key={ksp.id} className="hover:bg-gray-50/80">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#0A2A22]">{ksp.name}</div>
                    <div className="text-[10px] font-mono text-[#6B5A55]">{ksp.id} &bull; {ksp.kabupaten}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[#0A2A22]">{ksp.totalAnggota.toLocaleString('id-ID')} org</td>
                  <td className="py-3 px-3 font-mono font-bold text-[#0A2A22]">
                    Rp {new Intl.NumberFormat('id-ID').format(ksp.totalAset)}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className={ksp.benfordMadD1 > 0.015 ? 'text-rose-600 font-bold' : 'text-[#009770]'}>
                      d1: {ksp.benfordMadD1.toFixed(4)}
                    </span>
                    <br />
                    <span className={ksp.benfordMadD2 > 0.012 ? 'text-rose-600 font-bold' : 'text-[#009770]'}>
                      d2: {ksp.benfordMadD2.toFixed(4)}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#0A2A22]">
                    {ksp.reconciliationRate}%
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        ksp.healthStatus.startsWith('Sehat')
                          ? 'bg-emerald-100 text-emerald-800'
                          : ksp.healthStatus.startsWith('Cukup')
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {ksp.healthStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {ksp.activeRedAlerts > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono font-bold text-[10px]">
                        {ksp.activeRedAlerts} Merah
                      </span>
                    ) : (
                      <span className="text-gray-400 font-mono text-xs">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-KSP Red Alert Verification Queue */}
      <div className="p-6 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-ui font-bold text-base text-[#0A2A22] flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-600">error</span>
              Antrean Peringatan Merah Lintas-Koperasi (Tanpa Pembukaan NIK Anggota)
            </h3>
            <p className="text-xs text-[#6B5A55]">
              Dinas melakukan pembinaan dan konfirmasi tindak lanjut tanpa memegang atau mengekspos data pribadi anggota secara langsung.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            {crossAlerts.filter((a) => !a.isVerifiedByDinas).length} Menunggu Verifikasi
          </span>
        </div>

        <div className="space-y-3 font-ui">
          {crossAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 rounded-2xl border border-[#F3D9CE] bg-white hover:border-[#009770] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-rose-700">{alert.id}</span>
                  <span className="text-xs font-bold text-[#0A2A22]">&bull; {alert.kspName}</span>
                  <span className="text-[11px] font-mono text-[#6B5A55]">({alert.tanggal})</span>
                </div>
                <div className="text-xs font-bold text-[#0A2A22]">
                  Nominal: Rp {new Intl.NumberFormat('id-ID').format(alert.nominal)}
                </div>
                <p className="text-[11px] text-[#6B5A55]">
                  Indikator Terpicu: {alert.indikator}
                </p>
              </div>

              <div>
                {!alert.isVerifiedByDinas ? (
                  <button
                    onClick={() => handleVerifyAlert(alert.id)}
                    className="px-4 py-2 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-sm">verified</span>
                    Tandai Terverifikasi oleh Dinas
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Terverifikasi Dinas ({alert.verifiedAt || 'Selesai'})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
