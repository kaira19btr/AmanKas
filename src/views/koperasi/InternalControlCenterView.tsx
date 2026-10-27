/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Account, Transaction, UserRole } from '../../types';
import { soundEngine } from '../../utils/soundEffects';

interface InternalControlCenterViewProps {
  accounts: Account[];
  transactions?: any[];
  currentRole: UserRole;
  onAppendAuditLog?: (action: string, entityId: string, details: string) => void;
  onOpenSampleAuditForAccount?: (accountId: string) => void;
}

type RoleType = 'Kasir' | 'Pengurus' | 'Pengawas' | 'Pengawas Senior' | 'Dinas Koperasi' | 'Anggota';
type ActionType = 'unggah_kas' | 'lihat_anomali' | 'putuskan_kasus' | 'buka_identitas' | 'rilis_bahan_rat';

interface MatrixRow {
  role: RoleType;
  label: string;
  permissions: Record<ActionType, boolean>;
}

interface DualAuthQueueItem {
  id: string;
  nominal: number;
  description: string;
  requester: string;
  firstApprovalRole?: RoleType;
  firstApprovedAt?: string;
  secondApprovalRole?: RoleType;
  secondApprovedAt?: string;
  status: 'Menunggu Persetujuan 1' | 'Menunggu Persetujuan 2 (Otorisasi Ganda)' | 'Otorisasi Lengkap';
}

interface SampleAuditRow {
  id: string;
  trxId: string;
  tanggal: string;
  nominal: number;
  strata: 'Tinggi (>Rp15jt)' | 'Sedang (Rp5-15jt)' | 'Rendah (<Rp5jt)';
  isDocChecked: boolean;
  result: 'Sesuai Bukti Fisik' | 'Selisih Fisik / Bukti Kurang' | 'Belum Diperiksa';
  notes: string;
}

export const InternalControlCenterView: React.FC<InternalControlCenterViewProps> = ({
  accounts,
  transactions,
  currentRole,
  onAppendAuditLog,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'matriks' | 'otorisasi_ganda' | 'checklist' | 'eskalasi' | 'audit_sampel'>('matriks');

  // 1. Role-Action Matrix State
  const [matrix, setMatrix] = useState<MatrixRow[]>([
    {
      role: 'Kasir',
      label: 'Kasir / Petugas Teller',
      permissions: {
        unggah_kas: true,
        lihat_anomali: false,
        putuskan_kasus: false,
        buka_identitas: false,
        rilis_bahan_rat: false,
      },
    },
    {
      role: 'Pengurus',
      label: 'Pengurus KSP',
      permissions: {
        unggah_kas: true,
        lihat_anomali: true,
        putuskan_kasus: false,
        buka_identitas: false,
        rilis_bahan_rat: false,
      },
    },
    {
      role: 'Pengawas',
      label: 'Pengawas Koperasi',
      permissions: {
        unggah_kas: false,
        lihat_anomali: true,
        putuskan_kasus: true,
        buka_identitas: true,
        rilis_bahan_rat: false,
      },
    },
    {
      role: 'Pengawas Senior',
      label: 'Pengawas Senior',
      permissions: {
        unggah_kas: false,
        lihat_anomali: true,
        putuskan_kasus: true,
        buka_identitas: true,
        rilis_bahan_rat: true,
      },
    },
    {
      role: 'Dinas Koperasi',
      label: 'Dinas Koperasi (Pembina)',
      permissions: {
        unggah_kas: false,
        lihat_anomali: true,
        putuskan_kasus: false,
        buka_identitas: false,
        rilis_bahan_rat: false,
      },
    },
    {
      role: 'Anggota',
      label: 'Anggota (RAT)',
      permissions: {
        unggah_kas: false,
        lihat_anomali: false,
        putuskan_kasus: false,
        buka_identitas: false,
        rilis_bahan_rat: false,
      },
    },
  ]);

  const handleTogglePermission = (role: RoleType, action: ActionType) => {
    soundEngine.playClick(800);
    setMatrix((prev) =>
      prev.map((row) =>
        row.role === role
          ? {
              ...row,
              permissions: {
                ...row.permissions,
                [action]: !row.permissions[action],
              },
            }
          : row
      )
    );
    if (onAppendAuditLog) {
      onAppendAuditLog(
        'Ubah Matriks Akses',
        role,
        `Mengubah hak akses "${action}" untuk peran ${role} oleh ${currentRole}`
      );
    }
  };

  // 2. Dual Authorization State
  const [dualAuthThreshold, setDualAuthThreshold] = useState<number>(10000000);
  const [simulatedActingRole, setSimulatedActingRole] = useState<RoleType>('Pengawas');
  const [dualAuthQueue, setDualAuthQueue] = useState<DualAuthQueueItem[]>([
    {
      id: 'TRX-DA-901',
      nominal: 25000000,
      description: 'Pencairan pinjaman modal kerja kelompok tani binaan',
      requester: 'Petugas Kredit (ADM-02)',
      firstApprovalRole: 'Pengurus',
      firstApprovedAt: '2026-10-25 09:30 WIB',
      status: 'Menunggu Persetujuan 2 (Otorisasi Ganda)',
    },
    {
      id: 'TRX-DA-902',
      nominal: 18500000,
      description: 'Pemindahan dana cadangan likuiditas antar rekening kas',
      requester: 'Kasir Utama (KSR-01)',
      status: 'Menunggu Persetujuan 1',
    },
    {
      id: 'TRX-DA-903',
      nominal: 45000000,
      description: 'Pembelian aset peralatan kantor cabang pembantu',
      requester: 'Bendahara KSP',
      firstApprovalRole: 'Pengurus',
      firstApprovedAt: '2026-10-24 16:15 WIB',
      secondApprovalRole: 'Pengawas Senior',
      secondApprovedAt: '2026-10-25 08:45 WIB',
      status: 'Otorisasi Lengkap',
    },
  ]);

  const handleApproveDualAuth = (item: DualAuthQueueItem) => {
    soundEngine.playSuccess();
    setDualAuthQueue((prev) =>
      prev.map((q) => {
        if (q.id !== item.id) return q;
        if (!q.firstApprovalRole) {
          const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
          return {
            ...q,
            firstApprovalRole: simulatedActingRole,
            firstApprovedAt: nowStr,
            status: 'Menunggu Persetujuan 2 (Otorisasi Ganda)',
          };
        } else {
          const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
          return {
            ...q,
            secondApprovalRole: simulatedActingRole,
            secondApprovedAt: nowStr,
            status: 'Otorisasi Lengkap',
          };
        }
      })
    );

    if (onAppendAuditLog) {
      onAppendAuditLog(
        'Otorisasi Ganda Transaksi',
        item.id,
        `Persetujuan transaksi nominal Rp ${new Intl.NumberFormat('id-ID').format(item.nominal)} oleh peran ${simulatedActingRole}`
      );
    }
  };

  // 3. Mandatory Review Checklist State
  const [checklistCaseId, setChecklistCaseId] = useState<string>('KASUS-2026-88');
  const [checklistItems, setChecklistItems] = useState<{
    docCheck: boolean;
    physicalCheck: boolean;
    clarificationRecorded: boolean;
    reconciliationVerified: boolean;
  }>({
    docCheck: false,
    physicalCheck: false,
    clarificationRecorded: false,
    reconciliationVerified: false,
  });
  const [checklistNote, setChecklistNote] = useState('');
  const [checklistLocked, setChecklistLocked] = useState(false);

  const isChecklistComplete =
    checklistItems.docCheck &&
    checklistItems.physicalCheck &&
    checklistItems.clarificationRecorded &&
    checklistItems.reconciliationVerified;

  const handleLockDecision = () => {
    if (!isChecklistComplete) return;
    soundEngine.playSuccess();
    setChecklistLocked(true);
    if (onAppendAuditLog) {
      onAppendAuditLog(
        'Kunci Keputusan Kasus',
        checklistCaseId,
        `Keputusan kasus dikunci setelah 4 checklist terpenuhi lengkap. Catatan: ${checklistNote || 'Semua bukti valid'}`
      );
    }
  };

  // 4. Intensive Sample Audit State
  const [selectedAuditAccount, setSelectedAuditAccount] = useState<string>(
    accounts.find((a) => a.status.includes('Merah'))?.id || accounts[0]?.id || '#K-104'
  );
  const [sampleCount, setSampleCount] = useState<number>(10);
  const [randomSeed, setRandomSeed] = useState<number>(20261027);
  const [auditSampleList, setAuditSampleList] = useState<SampleAuditRow[]>([]);
  const [auditSavedLog, setAuditSavedLog] = useState(false);

  const generateStratifiedSample = () => {
    soundEngine.playProcessing();
    const acct = accounts.find((a) => a.id === selectedAuditAccount);
    const baseName = acct?.name || 'Kas Operasional';

    const generated: SampleAuditRow[] = [];
    const sampleDates = ['2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'];

    for (let i = 0; i < sampleCount; i++) {
      // Stratified deterministic logic using seed + index
      const pseudoRand = ((randomSeed * 9301 + 49297 + i * 233) % 233280) / 233280;
      let nominal = 0;
      let strata: SampleAuditRow['strata'] = 'Sedang (Rp5-15jt)';

      if (i < Math.ceil(sampleCount * 0.4)) {
        // High tier (40%)
        nominal = Math.round(16000000 + pseudoRand * 32000000);
        strata = 'Tinggi (>Rp15jt)';
      } else if (i < Math.ceil(sampleCount * 0.75)) {
        // Mid tier (35%)
        nominal = Math.round(5500000 + pseudoRand * 9000000);
        strata = 'Sedang (Rp5-15jt)';
      } else {
        // Low tier (25%)
        nominal = Math.round(500000 + pseudoRand * 4200000);
        strata = 'Rendah (<Rp5jt)';
      }

      generated.push({
        id: `SMPL-${i + 1}`,
        trxId: `TRX-${selectedAuditAccount.replace('#', '')}-${1000 + i}`,
        tanggal: sampleDates[i % sampleDates.length],
        nominal,
        strata,
        isDocChecked: i === 0 || i === 1,
        result: i === 0 ? 'Sesuai Bukti Fisik' : i === 1 ? 'Selisih Fisik / Bukti Kurang' : 'Belum Diperiksa',
        notes: i === 1 ? 'Ada kuitansi tetapi paraf kasir tidak tercantum' : '',
      });
    }

    setAuditSampleList(generated);
    setAuditSavedLog(false);
  };

  const handleToggleDocCheck = (id: string) => {
    soundEngine.playClick(900);
    setAuditSampleList((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, isDocChecked: !row.isDocChecked } : row
      )
    );
  };

  const handleUpdateAuditResult = (id: string, res: SampleAuditRow['result']) => {
    soundEngine.playClick(700);
    setAuditSampleList((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, result: res } : row
      )
    );
  };

  const handleSaveAuditSampleToLog = () => {
    soundEngine.playSuccess();
    setAuditSavedLog(true);
    const checkedCount = auditSampleList.filter((r) => r.isDocChecked).length;
    const issueCount = auditSampleList.filter((r) => r.result === 'Selisih Fisik / Bukti Kurang').length;

    if (onAppendAuditLog) {
      onAppendAuditLog(
        'Audit Sampel Intensif',
        selectedAuditAccount,
        `Selesai memeriksa ${checkedCount}/${auditSampleList.length} sampel terstratifikasi (Seed: ${randomSeed}). Temuan selisih/dokumen kurang: ${issueCount} transaksi.`
      );
    }
  };

  return (
    <div className="space-y-6 font-ui">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-[#031B15] to-[#0A2A22] rounded-3xl text-white border border-[#00B386]/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#84F8CA] text-2xl">shield</span>
            <h2 className="font-ui text-xl font-bold text-white">
              Pusat Kontrol Internal Koperasi
            </h2>
          </div>
          <p className="text-xs text-gray-300">
            Tata kelola berjenjang, otorisasi ganda transaksi besar, checklist wajib pengawas, dan audit sampel intensif.
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center p-1 bg-white/10 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveSubTab('matriks')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'matriks' ? 'bg-[#009770] text-white shadow-sm' : 'text-gray-300 hover:text-white'
            }`}
          >
            Matriks Hak Akses
          </button>
          <button
            onClick={() => setActiveSubTab('otorisasi_ganda')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'otorisasi_ganda' ? 'bg-[#009770] text-white shadow-sm' : 'text-gray-300 hover:text-white'
            }`}
          >
            Otorisasi Ganda
          </button>
          <button
            onClick={() => setActiveSubTab('checklist')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'checklist' ? 'bg-[#009770] text-white shadow-sm' : 'text-gray-300 hover:text-white'
            }`}
          >
            Daftar Periksa Tinjauan
          </button>
          <button
            onClick={() => setActiveSubTab('eskalasi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'eskalasi' ? 'bg-[#009770] text-white shadow-sm' : 'text-gray-300 hover:text-white'
            }`}
          >
            SOP Eskalasi
          </button>
          <button
            onClick={() => setActiveSubTab('audit_sampel')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'audit_sampel' ? 'bg-[#009770] text-white shadow-sm' : 'text-gray-300 hover:text-white'
            }`}
          >
            Audit Sampel
          </button>
        </div>
      </div>

      {/* 1. MATRIKS HAK AKSES */}
      {activeSubTab === 'matriks' && (
        <div className="p-6 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-ui font-bold text-base text-[#0A2A22]">
                Matriks Hak Akses Peran (Segregation of Duties)
              </h3>
              <p className="text-xs text-[#6B5A55]">
                Pemisahan fungsi pencatatan (Kasir), pengelolaan (Pengurus), pengawasan (Pengawas), dan pembinaan (Dinas).
              </p>
            </div>
            <span className="text-xs font-mono text-[#009770] bg-[#E0F4EE] px-3 py-1 rounded-full font-bold">
              Prinsip Four-Eyes &amp; UU PDP
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#F3D9CE]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8F4] border-b border-[#F3D9CE] font-semibold text-[#0A2A22]">
                <tr>
                  <th className="py-3 px-4">Peran Pengguna</th>
                  <th className="py-3 px-3 text-center">Unggah Kas</th>
                  <th className="py-3 px-3 text-center">Lihat Anomali</th>
                  <th className="py-3 px-3 text-center">Putuskan Kasus</th>
                  <th className="py-3 px-3 text-center">Buka Identitas</th>
                  <th className="py-3 px-3 text-center">Rilis Bahan RAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3D9CE]/60 font-ui text-[#6B5A55]">
                {matrix.map((row) => (
                  <tr key={row.role} className="hover:bg-gray-50/80">
                    <td className="py-3 px-4 font-semibold text-[#0A2A22]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-[#009770]">person</span>
                        <span>{row.label}</span>
                        {currentRole === row.role && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            Aktif
                          </span>
                        )}
                      </div>
                    </td>
                    {(['unggah_kas', 'lihat_anomali', 'putuskan_kasus', 'buka_identitas', 'rilis_bahan_rat'] as ActionType[]).map((action) => {
                      const isChecked = row.permissions[action];
                      return (
                        <td key={action} className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(row.role, action)}
                            className="w-4 h-4 rounded text-[#009770] focus:ring-[#009770] border-gray-300 cursor-pointer"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-[11px] text-[#6B5A55] italic">
            * Centang kotak untuk mengatur wewenang. Setiap modifikasi hak akses dicatat langsung ke dalam rantai hash audit append-only.
          </div>
        </div>
      )}

      {/* 2. OTORISASI GANDA (DUAL AUTHORIZATION) */}
      {activeSubTab === 'otorisasi_ganda' && (
        <div className="p-6 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-ui font-bold text-base text-[#0A2A22]">
                Persetujuan Berjenjang Transaksi Bernominal Besar
              </h3>
              <p className="text-xs text-[#6B5A55]">
                Transaksi melampaui batas ambang memerlukan dua tanda tangan otorisasi dari peran terpisah sebelum dieksekusi.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#6B5A55] font-semibold">Ambang Batas:</span>
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#0A2A22] bg-[#FFF8F4] px-3 py-1.5 rounded-xl border border-[#F3D9CE]">
                <span>Rp</span>
                <input
                  type="number"
                  value={dualAuthThreshold}
                  onChange={(e) => setDualAuthThreshold(Number(e.target.value) || 0)}
                  className="w-24 bg-transparent focus:outline-none text-[#009770]"
                />
              </div>
            </div>
          </div>

          {/* Role Switcher Simulator for Approval */}
          <div className="p-4 rounded-2xl bg-[#FFF8F4] border border-[#F3D9CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-[#0A2A22] block">Pengalih Peran Otorisasi (Simulasi Uji Alur):</span>
              <p className="text-[#6B5A55]">
                Pilih peran yang sedang menandatangani persetujuan saat ini:
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(['Pengurus', 'Pengawas', 'Pengawas Senior'] as RoleType[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setSimulatedActingRole(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    simulatedActingRole === r
                      ? 'bg-[#009770] text-white shadow-xs'
                      : 'bg-white border border-[#F3D9CE] text-[#6B5A55] hover:text-[#0A2A22]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Queue of Dual Auth Items */}
          <div className="space-y-3">
            <h4 className="font-ui font-semibold text-sm text-[#0A2A22]">
              Antrean Menunggu Otorisasi Ganda (&gt; Rp {new Intl.NumberFormat('id-ID').format(dualAuthThreshold)})
            </h4>

            <div className="space-y-3">
              {dualAuthQueue.map((item) => {
                const isComplete = item.status === 'Otorisasi Lengkap';
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-[#F3D9CE] bg-white hover:border-[#009770] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#0A2A22]">{item.id}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isComplete
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#0A2A22]">
                        Rp {new Intl.NumberFormat('id-ID').format(item.nominal)} &bull; {item.description}
                      </div>
                      <div className="text-[11px] text-[#6B5A55] flex flex-wrap items-center gap-3">
                        <span>Pemohon: {item.requester}</span>
                        {item.firstApprovalRole && (
                          <span className="text-[#009770]">
                            ✓ Ttd 1: {item.firstApprovalRole} ({item.firstApprovedAt})
                          </span>
                        )}
                        {item.secondApprovalRole && (
                          <span className="text-[#009770]">
                            ✓ Ttd 2: {item.secondApprovalRole} ({item.secondApprovedAt})
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      {!isComplete ? (
                        <button
                          onClick={() => handleApproveDualAuth(item)}
                          className="px-4 py-2 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-sm">verified</span>
                          <span>Tandatangani sebagai {simulatedActingRole}</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1 font-mono">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Sah Dieksekusi
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. DAFTAR PERIKSA TINJAUAN (MANDATORY CHECKLIST) */}
      {activeSubTab === 'checklist' && (
        <div className="p-6 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-ui font-bold text-base text-[#0A2A22]">
                Daftar Periksa Wajib Tinjauan Pengawas
              </h3>
              <p className="text-xs text-[#6B5A55]">
                Seluruh 4 butir checklist wajib diverifikasi sebelum keputusan pengawas dapat dikunci secara permanen.
              </p>
            </div>
            <div className="font-mono text-xs font-bold px-3 py-1 bg-gray-100 rounded-full text-gray-700">
              Kasus: {checklistCaseId}
            </div>
          </div>

          <div className="space-y-3 font-ui">
            {/* Checklist Item 1 */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-[#F3D9CE] bg-white hover:bg-[#FFF8F4] transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={checklistItems.docCheck}
                disabled={checklistLocked}
                onChange={() =>
                  setChecklistItems((p) => ({ ...p, docCheck: !p.docCheck }))
                }
                className="w-4 h-4 rounded text-[#009770] mt-0.5 focus:ring-[#009770]"
              />
              <div>
                <span className="text-xs font-bold text-[#0A2A22] block">
                  1. Cek Dokumen Pendukung Fisik
                </span>
                <span className="text-[11px] text-[#6B5A55]">
                  Kuitansi tanda terima, slip setoran/penarikan, atau nota asli telah diperiksa kelengkapan parafnya.
                </span>
              </div>
            </label>

            {/* Checklist Item 2 */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-[#F3D9CE] bg-white hover:bg-[#FFF8F4] transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={checklistItems.physicalCheck}
                disabled={checklistLocked}
                onChange={() =>
                  setChecklistItems((p) => ({ ...p, physicalCheck: !p.physicalCheck }))
                }
                className="w-4 h-4 rounded text-[#009770] mt-0.5 focus:ring-[#009770]"
              />
              <div>
                <span className="text-xs font-bold text-[#0A2A22] block">
                  2. Cek Bukti Fisik / Saldo Brankas
                </span>
                <span className="text-[11px] text-[#6B5A55]">
                  Pencocokan saldo kas fisik di brankas teller dengan saldo akhir buku jurnal berjalan.
                </span>
              </div>
            </label>

            {/* Checklist Item 3 */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-[#F3D9CE] bg-white hover:bg-[#FFF8F4] transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={checklistItems.clarificationRecorded}
                disabled={checklistLocked}
                onChange={() =>
                  setChecklistItems((p) => ({ ...p, clarificationRecorded: !p.clarificationRecorded }))
                }
                className="w-4 h-4 rounded text-[#009770] mt-0.5 focus:ring-[#009770]"
              />
              <div>
                <span className="text-xs font-bold text-[#0A2A22] block">
                  3. Klarifikasi &amp; Tanggapan Pihak Terkait (Hak Jawab)
                </span>
                <span className="text-[11px] text-[#6B5A55]">
                  Penjelasan kasir, pengelola rekening, atau anggota telah dimintakan keterangan dan dicatat.
                </span>
              </div>
            </label>

            {/* Checklist Item 4 */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-[#F3D9CE] bg-white hover:bg-[#FFF8F4] transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={checklistItems.reconciliationVerified}
                disabled={checklistLocked}
                onChange={() =>
                  setChecklistItems((p) => ({ ...p, reconciliationVerified: !p.reconciliationVerified }))
                }
                className="w-4 h-4 rounded text-[#009770] mt-0.5 focus:ring-[#009770]"
              />
              <div>
                <span className="text-xs font-bold text-[#0A2A22] block">
                  4. Rekonsiliasi Kas dengan Rekening Koran / Bank
                </span>
                <span className="text-[11px] text-[#6B5A55]">
                  Tidak ada selisih material antara pembukuan kas koperasi dengan mutasi rekening bank terlampir.
                </span>
              </div>
            </label>
          </div>

          <div className="space-y-3 pt-2">
            <input
              type="text"
              placeholder="Catatan hasil verifikasi bukti pengawas..."
              value={checklistNote}
              disabled={checklistLocked}
              onChange={(e) => setChecklistNote(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#F3D9CE] bg-[#FFF8F4] text-[#0A2A22] focus:outline-none focus:border-[#009770]"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-mono">
                {isChecklistComplete ? (
                  <span className="text-[#009770] font-bold">✓ 4 dari 4 checklist terpenuhi</span>
                ) : (
                  <span className="text-[#86513D] font-bold">
                    Peringatan: Seluruh 4 butir wajib dicentang sebelum keputusan dikunci.
                  </span>
                )}
              </span>

              <button
                onClick={handleLockDecision}
                disabled={!isChecklistComplete || checklistLocked}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isChecklistComplete && !checklistLocked
                    ? 'bg-[#009770] hover:bg-[#008260] text-white shadow-md cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-sm">lock</span>
                {checklistLocked ? 'Keputusan Terkunci ✓' : 'Kunci Keputusan Kasus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SOP ESKALASI RISIKO */}
      {activeSubTab === 'eskalasi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel Kuning SOP */}
          <div className="p-6 rounded-3xl bg-white border border-amber-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg">warning</span>
                </span>
                <h4 className="font-ui font-bold text-sm text-[#0A2A22]">
                  SOP Status Kuning (&ge; P90)
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono text-[10px] font-bold">
                Batas 48 Jam
              </span>
            </div>

            <p className="text-xs text-[#6B5A55] leading-relaxed">
              Transaksi dengan deviasi statistik moderat. Ditangani melalui jalur klarifikasi dokumen tanpa mengganggu operasional rutin.
            </p>

            <div className="space-y-2 text-xs font-ui text-[#0A2A22]">
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-1">
                <strong className="block text-amber-900">Langkah 1: Pemberitahuan</strong>
                <p className="text-[11px] text-[#6B5A55]">Kirim permintaan dokumen pendukung ke kasir/petugas pencatat.</p>
              </div>
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-1">
                <strong className="block text-amber-900">Langkah 2: Batas Waktu 48 Jam</strong>
                <p className="text-[11px] text-[#6B5A55]">Jika melewati batas 48 jam, sistem otomatis memberi lencana "Melewati 48 jam" dan menaikkan prioritas antrean.</p>
              </div>
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-1">
                <strong className="block text-amber-900">Langkah 3: Penyelesaian Wajar</strong>
                <p className="text-[11px] text-[#6B5A55]">Penutupan kasus setelah bukti kuitansi atau mutasi bank diunggah.</p>
              </div>
            </div>
          </div>

          {/* Panel Merah SOP */}
          <div className="p-6 rounded-3xl bg-white border border-rose-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg">error</span>
                </span>
                <h4 className="font-ui font-bold text-sm text-[#0A2A22]">
                  SOP Status Merah (&ge; P98)
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 font-mono text-[10px] font-bold">
                Pengawas Senior
              </span>
            </div>

            <p className="text-xs text-[#6B5A55] leading-relaxed">
              Transaksi pencilan ekstrem. Tidak ada pemblokiran otomatis oleh sistem; seluruh penanganan berada di bawah kendali manusia.
            </p>

            <div className="space-y-2 text-xs font-ui text-[#0A2A22]">
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-1">
                <strong className="block text-rose-900">Langkah 1: Eskalasi Pengawas Senior</strong>
                <p className="text-[11px] text-[#6B5A55]">Hanya Pengawas Senior yang berwenang menindaklanjuti dan mengunci temuan.</p>
              </div>
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-1">
                <strong className="block text-rose-900">Langkah 2: Audit Sampel Intensif</strong>
                <p className="text-[11px] text-[#6B5A55]">Lakukan penarikan sampel terstratifikasi acak pada akun bersangkutan untuk menguji konsistensi buku.</p>
              </div>
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-1">
                <strong className="block text-rose-900">Langkah 3: Batas Sanksi Eksternal</strong>
                <p className="text-[11px] text-[#6B5A55]">Sanksi atau tindakan organisasi hanya berlaku sah setelah RAT &amp; AD/ART di luar sistem SADAR.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. AUDIT SAMPEL INTENSIF */}
      {activeSubTab === 'audit_sampel' && (
        <div className="p-6 rounded-3xl bg-white border border-[#F3D9CE] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-ui font-bold text-base text-[#0A2A22]">
                Alat Audit Sampel Terstratifikasi Acak (Reproducible Sampling)
              </h3>
              <p className="text-xs text-[#6B5A55]">
                Pilih akun berisiko tinggi (terutama berstatus Merah), tentukan ukuran sampel dan seed acak untuk menghasilkan daftar pemeriksaan independen.
              </p>
            </div>

            <button
              onClick={generateStratifiedSample}
              className="px-5 py-2.5 rounded-xl bg-[#009770] hover:bg-[#008260] text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">shuffle</span>
              Hasilkan Sampel Acak
            </button>
          </div>

          {/* Configuration Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#FFF8F4] border border-[#F3D9CE]">
            <div>
              <label className="text-[11px] font-bold text-[#0A2A22] block mb-1">
                Pilih Akun Diperiksa:
              </label>
              <select
                value={selectedAuditAccount}
                onChange={(e) => setSelectedAuditAccount(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#F3D9CE] bg-white text-[#0A2A22] focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} - {a.name} ({a.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#0A2A22] block mb-1">
                Jumlah Sampel:
              </label>
              <input
                type="number"
                min={5}
                max={30}
                value={sampleCount}
                onChange={(e) => setSampleCount(Number(e.target.value) || 10)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#F3D9CE] bg-white text-[#0A2A22] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#0A2A22] block mb-1">
                Seed Acak (Reproducible Seed):
              </label>
              <input
                type="number"
                value={randomSeed}
                onChange={(e) => setRandomSeed(Number(e.target.value) || 20261027)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#F3D9CE] bg-white text-[#0A2A22] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Sample List Table */}
          {auditSampleList.length > 0 ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#0A2A22]">
                  Daftar {auditSampleList.length} Transaksi Sampel Terstratifikasi (Tier Tinggi, Sedang, Rendah)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveAuditSampleToLog}
                    disabled={auditSavedLog}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      auditSavedLog
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-[#009770] hover:bg-[#008260] text-white shadow-xs cursor-pointer'
                    }`}
                  >
                    {auditSavedLog ? 'Tercatat di Log Audit Hash ✓' : 'Rekam Hasil ke Log Audit'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#F3D9CE] bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF8F4] border-b border-[#F3D9CE] font-semibold text-[#0A2A22]">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">Cek</th>
                      <th className="py-2.5 px-3">ID Transaksi</th>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Nominal</th>
                      <th className="py-2.5 px-3">Strata Nominal</th>
                      <th className="py-2.5 px-3">Hasil Pemeriksaan</th>
                      <th className="py-2.5 px-3">Catatan Pengawas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3D9CE]/60">
                    {auditSampleList.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/80">
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={row.isDocChecked}
                            onChange={() => handleToggleDocCheck(row.id)}
                            className="w-4 h-4 rounded text-[#009770] focus:ring-[#009770]"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#0A2A22]">{row.trxId}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B5A55]">{row.tanggal}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#0A2A22]">
                          Rp {new Intl.NumberFormat('id-ID').format(row.nominal)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              row.strata.startsWith('Tinggi')
                                ? 'bg-rose-100 text-rose-800'
                                : row.strata.startsWith('Sedang')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {row.strata}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={row.result}
                            onChange={(e) => handleUpdateAuditResult(row.id, e.target.value as any)}
                            className="text-xs px-2 py-1 rounded-lg border border-[#F3D9CE] bg-white focus:outline-none"
                          >
                            <option value="Sesuai Bukti Fisik">Sesuai Bukti Fisik</option>
                            <option value="Selisih Fisik / Bukti Kurang">Selisih Fisik / Bukti Kurang</option>
                            <option value="Belum Diperiksa">Belum Diperiksa</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 font-ui text-[11px] text-[#6B5A55]">
                          {row.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-[#FFF8F4] rounded-2xl border border-dashed border-[#F3D9CE] space-y-2">
              <span className="material-symbols-outlined text-3xl text-[#009770]">playlist_add_check</span>
              <p className="text-xs text-[#6B5A55]">
                Pilih akun di atas dan klik <strong>"Hasilkan Sampel Acak"</strong> untuk memulai prosedur audit sampel intensif.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
