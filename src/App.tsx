/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SadarText } from './components/SadarText';
import { SettingsModal } from './components/SettingsModal';
import { LoginPage } from './views/LoginPage';
import { LandingPage } from './views/LandingPage';
import { ValidationLabView } from './views/ValidationLabView';

// Dedicated Koperasi Views
import { KoperasiLiveMonitoringView } from './views/koperasi/KoperasiLiveMonitoringView';
import { KoperasiAccountHealthView } from './views/koperasi/KoperasiAccountHealthView';
import { RelatedPartyView } from './views/koperasi/RelatedPartyView';
import { KoperasiReviewQueueView } from './views/koperasi/KoperasiReviewQueueView';
import { RatReportView } from './views/koperasi/RatReportView';
import { KoperasiDataSourcesPrivacyView } from './views/koperasi/KoperasiDataSourcesPrivacyView';
import { InternalControlCenterView } from './views/koperasi/InternalControlCenterView';

// Dedicated UMKM Views
import { BusinessHomeView } from './views/umkm/BusinessHomeView';
import { CashierVarianceView } from './views/umkm/CashierVarianceView';
import { PersonalMixingView } from './views/umkm/PersonalMixingView';
import { OwnerAlertsView } from './views/umkm/OwnerAlertsView';
import { CashflowReadinessView } from './views/umkm/CashflowReadinessView';
import { RaporKasView } from './views/umkm/RaporKasView';
import { PrivacyConsentView } from './views/umkm/PrivacyConsentView';

// Shared Cross-Mode & Dinas Views
import { DataPreparationView } from './views/DataPreparationView';
import { IndicatorCenterView } from './views/IndicatorCenterView';
import { DinasKoperasiView } from './views/dinas/DinasKoperasiView';

// Mode-Specific Seed Datasets & Shared Engine
import {
  generateKoperasiInitialData,
  generateUmkmInitialData,
} from './utils/modeDatasets';
import {
  AppMode,
  UserRole,
  ActiveTab,
  DecisionStatus,
  SystemWeights,
  RuleConfig,
  UmkmConsent,
  CashReconciliationRecord,
  Account,
  KoperasiTransaction,
  UmkmTransaction,
  AuditLogEntry,
} from './types';
import { calculateBenford } from './utils/benford';
import {
  loadAllFromIndexedDB,
  saveToIndexedDB,
  clearAllIndexedDB,
} from './utils/indexedDB';
import {
  appendAuditLogWithHash,
  generateInitialChainedAuditLogs,
} from './utils/hashChain';

export type ViewMode = 'landing' | 'login' | 'dashboard';

const initialRuleConfig: RuleConfig = {
  duplicateTransactions: { enabled: true, maxHours: 2 },
  offHoursTransactions: { enabled: true, startHour: 8, endHour: 17 },
  roundAmounts: { enabled: true, minAmount: 1000000 },
  missingDocuments: { enabled: true },
  accountDeviation: { enabled: true },
};

export default function App() {
  // Navigation View: 'landing' | 'login' | 'dashboard'
  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // App Mode State: 'koperasi' | 'umkm'
  const [mode, setMode] = useState<AppMode>('koperasi');

  // Active Role State: 'Pengawas' | 'Pengurus' | 'Pemilik UMKM'
  const [userRole, setUserRole] = useState<UserRole>('Pengawas');

  // Active Tab State (defaults contextually per mode)
  const [activeTab, setActiveTab] = useState<ActiveTab>('pemantauan_langsung');

  // Preferences & Common State
  const [isMasked, setIsMasked] = useState<boolean>(true);
  const [streamingActive, setStreamingActive] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Dynamic Feedback Weights for the Shared Analytical Engine
  const [systemWeights, setSystemWeights] = useState<SystemWeights>({
    ruleWeight: 50,
    anomalyWeight: 50,
    calibratedCount: 0,
  });

  const [adaptiveThresholdEnabled, setAdaptiveThresholdEnabled] = useState<boolean>(false);
  const [minVolumeThreshold, setMinVolumeThreshold] = useState<number>(300);
  const [ruleConfig, setRuleConfig] = useState<RuleConfig>(initialRuleConfig);
  const [retentionDays, setRetentionDays] = useState<number>(1825);

  // =========================================================================
  // SEPARATE IN-MEMORY & INDEXEDDB PERSISTED DATASETS
  // =========================================================================
  const initialKoperasiRef = useRef(generateKoperasiInitialData());
  const [koperasiAccounts, setKoperasiAccounts] = useState<Account[]>(initialKoperasiRef.current.accounts);
  const [koperasiTransactions, setKoperasiTransactions] = useState<KoperasiTransaction[]>(
    initialKoperasiRef.current.transactions
  );
  const [koperasiAuditLogs, setKoperasiAuditLogs] = useState<AuditLogEntry[]>([]);
  const [selectedKoperasiTrx, setSelectedKoperasiTrx] = useState<KoperasiTransaction | null>(null);

  const initialUmkmRef = useRef(generateUmkmInitialData());
  const [umkmTransactions, setUmkmTransactions] = useState<UmkmTransaction[]>(initialUmkmRef.current.transactions);
  const [umkmReconciliations, setUmkmReconciliations] = useState<CashReconciliationRecord[]>(
    initialUmkmRef.current.cashReconciliations
  );
  const [umkmAuditLogs, setUmkmAuditLogs] = useState<AuditLogEntry[]>(initialUmkmRef.current.auditLogs);
  const [umkmConsent, setUmkmConsent] = useState<UmkmConsent>({
    optInConsent: false,
    shareCashFlowWithLender: false,
    shareRevoked: false,
    lenderShareToken: null,
  });

  // Load from IndexedDB on startup or generate initial hash-chained logs
  useEffect(() => {
    let isMounted = true;
    async function initDb() {
      try {
        const persisted = await loadAllFromIndexedDB();
        if (!isMounted) return;

        if (persisted.koperasiTransactions && persisted.koperasiTransactions.length > 0) {
          setKoperasiTransactions(persisted.koperasiTransactions);
        } else {
          saveToIndexedDB('koperasi_transactions', initialKoperasiRef.current.transactions);
        }

        if (persisted.umkmTransactions && persisted.umkmTransactions.length > 0) {
          setUmkmTransactions(persisted.umkmTransactions);
        } else {
          saveToIndexedDB('umkm_transactions', initialUmkmRef.current.transactions);
        }

        if (persisted.auditLogs && persisted.auditLogs.length > 0) {
          setKoperasiAuditLogs(persisted.auditLogs);
        } else {
          // Initialize cryptographic hash chain
          const chained = await generateInitialChainedAuditLogs(initialKoperasiRef.current.auditLogs);
          if (isMounted) {
            setKoperasiAuditLogs(chained);
            saveToIndexedDB('audit_logs', chained);
          }
        }

        if (persisted.umkmReconciliations && persisted.umkmReconciliations.length > 0) {
          setUmkmReconciliations(persisted.umkmReconciliations);
        }
      } catch (err) {
        console.warn('IndexedDB initial load fallback:', err);
      }
    }
    initDb();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute empirical P90 and P98 thresholds from currently loaded dataset
  const { actualP90, actualP98 } = useMemo(() => {
    const list = mode === 'koperasi' ? koperasiTransactions : umkmTransactions;
    if (!list || list.length === 0) {
      return { actualP90: 42, actualP98: 78 };
    }
    const scores = list.map((t) => t.finalScore).sort((a, b) => a - b);
    const p90Index = Math.floor(0.90 * (scores.length - 1));
    const p98Index = Math.floor(0.98 * (scores.length - 1));
    return {
      actualP90: scores[p90Index] ?? 42,
      actualP98: scores[p98Index] ?? 78,
    };
  }, [mode, koperasiTransactions, umkmTransactions]);

  // Switch Mode Handler (Perilaku Pengalih Mode)
  const handleToggleMode = (newMode: AppMode) => {
    if (newMode === mode) return;

    setMode(newMode);
    if (newMode === 'umkm') {
      setUserRole('Pemilik UMKM');
      setActiveTab('beranda_usaha');
      setRetentionDays(90);
    } else {
      setUserRole('Pengawas');
      setActiveTab('pemantauan_langsung');
      setRetentionDays(1825);
    }
  };

  // Live Stream Simulation for active mode
  const nextKopSeqRef = useRef<number>(100);
  const nextUmkSeqRef = useRef<number>(100);

  useEffect(() => {
    if (!streamingActive) return;

    const intervalTime = Math.floor(4000 + Math.random() * 2500);
    const interval = setInterval(() => {
      const nowStr = new Date().toTimeString().slice(0, 5);

      if (mode === 'koperasi') {
        nextKopSeqRef.current += 1;
        const uniqueId = `KOP-2026-${Date.now().toString().slice(-4)}${nextKopSeqRef.current}`;
        const accountsList = ['Simpanan Sukarela', 'Angsuran Pinjaman', 'Kas Operasional'] as const;
        const randomAcc = accountsList[Math.floor(Math.random() * accountsList.length)];
        const unitsList = ['Cabang Utama', 'Cabang Barat', 'Cabang Timur'] as const;
        const randomUnit = unitsList[Math.floor(Math.random() * unitsList.length)];
        const amount = 350000 + Math.floor(Math.random() * 3500000);

        const newTrx: KoperasiTransaction = {
          id: uniqueId,
          tanggal: `2026-10-25 ${nowStr}`,
          jam: nowStr,
          akun: randomAcc,
          accountId: '#SS-201',
          idAnggotaPseudonim: `ANG-${Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase()}`,
          namaAnggotaMasked: 'Anggota Baru***',
          jenisTransaksi: randomAcc.includes('Simpanan') ? 'Simpanan' : 'Angsuran',
          nominal: amount,
          petugas: 'Teller-01',
          unit: randomUnit,
          statusDokumen: 'Lengkap',
          isPihakTerkait: false,
          ruleScore: 12,
          isolationScore: 15,
          finalScore: 13,
          status: 'Hijau · Risiko rendah',
          decisionStatus: 'Wajar',
          flagReasons: [],
        };

        setKoperasiTransactions((prev) => {
          const seen = new Set<string>([uniqueId]);
          const deduped = prev.filter((trx) => {
            if (seen.has(trx.id)) return false;
            seen.add(trx.id);
            return true;
          });
          const nextList = [newTrx, ...deduped.slice(0, 199)];
          saveToIndexedDB('koperasi_transactions', nextList);
          return nextList;
        });
      } else {
        nextUmkSeqRef.current += 1;
        const uniqueId = `UMK-2026-${Date.now().toString().slice(-4)}${nextUmkSeqRef.current}`;
        const amount = 25000 + Math.floor(Math.random() * 250000);
        const newTrx: UmkmTransaction = {
          id: uniqueId,
          tanggalJam: `2026-10-25 ${nowStr}`,
          jam: nowStr,
          tanggal: '2026-10-25',
          jenis: 'penjualan',
          nominal: amount,
          metode: Math.random() > 0.4 ? 'qris' : 'tunai',
          kasirShift: 'Kasir-01 (Shift 1)',
          kasirPseudonim: 'KASIR-01',
          adaStruk: true,
          tagPribadi: false,
          deskripsi: 'Penjualan retail kasir kas laci',
          ruleScore: 8,
          isolationScore: 10,
          finalScore: 9,
          volumeCukup: false,
          status: 'Hijau · Risiko rendah',
          decisionStatus: 'Wajar',
          flagReasons: [],
        };

        setUmkmTransactions((prev) => {
          const seen = new Set<string>([uniqueId]);
          const deduped = prev.filter((trx) => {
            if (seen.has(trx.id)) return false;
            seen.add(trx.id);
            return true;
          });
          const nextList = [newTrx, ...deduped.slice(0, 199)];
          saveToIndexedDB('umkm_transactions', nextList);
          return nextList;
        });
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [streamingActive, mode]);

  // Log action with SHA-256 hash chaining (append-only, tamper-evident)
  const handleLogAuditAction = async (action: string, target: string, reason: string) => {
    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const rawEntry = {
      id: `AUD-KOP-${Date.now().toString().slice(-4)}`,
      timestamp: nowStr,
      actor: userRole,
      role: userRole,
      action,
      target,
      reason,
      verificationStatus: 'Tercatat Resmi',
      verified: true,
    };

    const updatedChain = await appendAuditLogWithHash(koperasiAuditLogs, rawEntry);
    setKoperasiAuditLogs(updatedChain);
    saveToIndexedDB('audit_logs', updatedChain);
  };

  // Koperasi Decision Maker (with dynamic feedback weights calibration & hash chaining)
  const handleMakeKoperasiDecision = async (
    trxId: string,
    decision: DecisionStatus,
    note: string,
    tanggapan?: string
  ) => {
    const nowStr = new Date().toTimeString().slice(0, 8);
    const targetTrx = koperasiTransactions.find((t) => t.id === trxId);

    const updated = koperasiTransactions.map((t) => {
      if (t.id === trxId) {
        return {
          ...t,
          decisionStatus: decision,
          catatan: note || t.catatan,
          tanggapanPihakTerkait: tanggapan !== undefined ? tanggapan : t.tanggapanPihakTerkait,
          decisionTime: nowStr,
          decisionBy: userRole,
        };
      }
      return t;
    });

    setKoperasiTransactions(updated);
    saveToIndexedDB('koperasi_transactions', updated);

    // Calibrate shared system weights
    setSystemWeights((prev) => {
      let nextRuleWeight = prev.ruleWeight;
      if (decision === 'Wajar') {
        nextRuleWeight = Math.max(20, nextRuleWeight - 2);
      } else if (decision === 'Perlu pemeriksaan lanjut') {
        nextRuleWeight = Math.min(80, nextRuleWeight + 2);
      }
      return {
        ruleWeight: nextRuleWeight,
        anomalyWeight: 100 - nextRuleWeight,
        calibratedCount: prev.calibratedCount + 1,
      };
    });

    // Append to tamper-evident audit log with SHA-256 chaining
    const rawLog: Omit<AuditLogEntry, 'hash'> = {
      id: `AUD-KOP-${Date.now().toString().slice(-4)}`,
      timestamp: nowStr,
      actor: userRole,
      role: userRole,
      action: `Keputusan Pengawas: ${decision}`,
      target: `${trxId} (${targetTrx?.akun || ''})`,
      reason: note || (tanggapan ? `Klarifikasi: "${tanggapan}"` : `Keputusan ${decision} oleh pengawas internal`),
      verificationStatus: 'Tercatat Resmi',
      verified: true,
    };
    const updatedChain = await appendAuditLogWithHash(koperasiAuditLogs, rawLog);
    setKoperasiAuditLogs(updatedChain);
    saveToIndexedDB('audit_logs', updatedChain);
  };

  // UMKM Decision Maker
  const handleMakeUmkmDecision = (trxId: string, decision: DecisionStatus, note: string) => {
    const nowStr = new Date().toTimeString().slice(0, 8);
    const updated = umkmTransactions.map((t) => {
      if (t.id === trxId) {
        return {
          ...t,
          decisionStatus: decision,
          catatan: note || t.catatan,
          decisionTime: nowStr,
          decisionBy: 'Pemilik · Warung Fiktif Bu Rina',
        };
      }
      return t;
    });

    setUmkmTransactions(updated);
    saveToIndexedDB('umkm_transactions', updated);

    const newLog: AuditLogEntry = {
      id: `AUD-UMK-${Date.now().toString().slice(-4)}`,
      timestamp: nowStr,
      actor: 'Pemilik · Warung Fiktif Bu Rina',
      role: 'Pemilik UMKM',
      action: `Tindakan Pemilik Usaha: ${decision}`,
      target: trxId,
      reason: note || `Tindakan ${decision} pada peringatan kasir`,
      verificationStatus: 'Tercatat Mandiri',
      verified: true,
    };
    setUmkmAuditLogs((prev) => [newLog, ...prev]);
  };

  // UMKM Separate Personal Transaction Handler
  const handleSeparateUmkmTransaction = (trxId: string) => {
    const updated = umkmTransactions.map((t) => {
      if (t.id === trxId) {
        return {
          ...t,
          dipisahkanDariUsaha: !t.dipisahkanDariUsaha,
        };
      }
      return t;
    });

    setUmkmTransactions(updated);
    saveToIndexedDB('umkm_transactions', updated);

    const nowStr = new Date().toTimeString().slice(0, 8);
    setUmkmAuditLogs((prev) => [
      {
        id: `AUD-UMK-${Date.now().toString().slice(-4)}`,
        timestamp: nowStr,
        actor: 'Pemilik · Warung Fiktif Bu Rina',
        role: 'Pemilik UMKM',
        action: 'Pemisahan Kas Pribadi dari Usaha',
        target: trxId,
        reason: 'Pemisahan beban rumah tangga dari pencatatan toko',
        verificationStatus: 'Tersimpan',
        verified: true,
      },
      ...prev,
    ]);
  };

  // UMKM Toggle Personal Tag
  const handleToggleUmkmPersonalTag = (trxId: string) => {
    setUmkmTransactions((prev) =>
      prev.map((t) => {
        if (t.id === trxId) {
          return { ...t, tagPribadi: !t.tagPribadi };
        }
        return t;
      })
    );
  };

  // Add Cash Reconciliation Record
  const handleAddReconciliation = (rec: CashReconciliationRecord) => {
    const nextList = [rec, ...umkmReconciliations];
    setUmkmReconciliations(nextList);
    saveToIndexedDB('umkm_reconciliations', nextList);

    const nowStr = new Date().toTimeString().slice(0, 8);
    setUmkmAuditLogs((prev) => [
      {
        id: `AUD-UMK-${Date.now().toString().slice(-4)}`,
        timestamp: nowStr,
        actor: 'Pemilik · Warung Fiktif Bu Rina',
        role: 'Pemilik UMKM',
        action: `Rekonsiliasi Kas Laci: ${rec.shift}`,
        target: `Selisih: Rp ${rec.selisih.toLocaleString('id-ID')}`,
        reason: rec.catatan,
        verificationStatus: 'Tercatat',
        verified: true,
      },
      ...prev,
    ]);
  };

  // Toggle Account Exclusion (Benford fixed amount)
  const handleToggleAccountExclusion = (accountId: string) => {
    setKoperasiAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) {
          const nextFixed = !acc.isFixedAmount;
          const accTrx = koperasiTransactions
            .filter((t) => t.akun === acc.name)
            .map((t) => t.nominal);
          const b = calculateBenford(accTrx, nextFixed, 20);
          return {
            ...acc,
            isFixedAmount: nextFixed,
            status: nextFixed ? 'Dikecualikan (Nominal Tetap)' : b.status,
          };
        }
        return acc;
      })
    );
  };

  // Clear data handler (Purges IndexedDB completely)
  const handleClearData = async () => {
    await clearAllIndexedDB();
    if (mode === 'koperasi') {
      setKoperasiTransactions([]);
    } else {
      setUmkmTransactions([]);
      setUmkmReconciliations([]);
    }
  };

  // Calculate critical alerts for current mode
  const criticalCount =
    mode === 'koperasi'
      ? koperasiTransactions.filter(
          (t) => (t.status.includes('Merah') || t.status === 'Prioritas tinggi') && t.decisionStatus === 'Menunggu Keputusan'
        ).length
      : umkmTransactions.filter(
          (t) => (t.status.includes('Merah') || t.status === 'Prioritas tinggi') && t.decisionStatus === 'Menunggu Keputusan'
        ).length;

  const pendingReviewCount =
    mode === 'koperasi'
      ? koperasiTransactions.filter((t) => t.decisionStatus === 'Menunggu Keputusan').length
      : umkmTransactions.filter((t) => t.decisionStatus === 'Menunggu Keputusan').length;

  // Recent high priority alerts for header
  const recentAlerts = useMemo(() => {
    if (mode === 'koperasi') {
      return koperasiTransactions
        .filter((t) => t.status.includes('Merah') || t.status === 'Prioritas tinggi')
        .slice(0, 5)
        .map((t) => ({
          id: t.id,
          finalScore: t.finalScore,
          status: t.status,
          jam: t.jam,
          nominal: t.nominal,
          deskripsi: `${t.akun} (${t.idAnggotaPseudonim})`,
        }));
    } else {
      return umkmTransactions
        .filter((t) => t.status.includes('Merah') || t.status === 'Prioritas tinggi')
        .slice(0, 5)
        .map((t) => ({
          id: t.id,
          finalScore: t.finalScore,
          status: t.status,
          jam: t.jam,
          nominal: t.nominal,
          deskripsi: t.deskripsi,
        }));
    }
  }, [mode, koperasiTransactions, umkmTransactions]);

  // 1. Primary Landing Page
  if (currentView === 'landing') {
    return (
      <LandingPage
        onEnterDashboard={(targetTab) => {
          if (targetTab) {
            if (targetTab === 'pemantauan') setActiveTab(mode === 'koperasi' ? 'pemantauan_langsung' : 'beranda_usaha');
            else if (targetTab === 'kesehatan') setActiveTab(mode === 'koperasi' ? 'kesehatan_akun' : 'kasir_selisih_kas');
            else if (targetTab === 'antrean') setActiveTab(mode === 'koperasi' ? 'antrean_pengawas' : 'peringatan_saya');
            else if (targetTab === 'sumber_data') setActiveTab(mode === 'koperasi' ? 'sumber_data_privasi' : 'izin_data_saya');
            else if (targetTab === 'laporan') setActiveTab(mode === 'koperasi' ? 'bahan_rat' : 'arus_kas_kesiapan');
            else if (targetTab === 'lab') setActiveTab('lab_validasi');
            else setActiveTab(targetTab);
          }
          setIsAuthenticated(true);
          setCurrentView('dashboard');
        }}
        onNavigateToLogin={() => setCurrentView('login')}
        transactions={koperasiTransactions as any}
        currentMode={mode}
        onToggleMode={handleToggleMode}
      />
    );
  }

  // 2. Staff Authentication Page
  if (currentView === 'login') {
    return (
      <LoginPage
        onLoginSuccess={(role) => {
          if (role) {
            if (role.toLowerCase().includes('pengawas')) {
              setMode('koperasi');
              setUserRole('Pengawas');
              setActiveTab('pemantauan_langsung');
            } else if (role.toLowerCase().includes('pemilik')) {
              setMode('umkm');
              setUserRole('Pemilik UMKM');
              setActiveTab('beranda_usaha');
            } else {
              setMode('koperasi');
              setUserRole('Pengurus');
              setActiveTab('pemantauan_langsung');
            }
          }
          setIsAuthenticated(true);
          setCurrentView('dashboard');
        }}
        onDirectToLanding={() => setCurrentView('landing')}
      />
    );
  }

  // 3. Operational Dual-Mode Interactive Dashboard
  return (
    <div className="min-h-screen text-[#0A2A22] antialiased flex flex-col justify-between selection:bg-[#009770] selection:text-white bg-[#FFF8F4]">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingReviewCount={pendingReviewCount}
        criticalCount={criticalCount}
        mode={mode}
        onLogout={() => {
          setIsAuthenticated(false);
          setCurrentView('login');
        }}
        onNavigateToLanding={() => setCurrentView('landing')}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. Top Header Utility Bar */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        recentAlerts={recentAlerts}
        onSelectAlert={(id) => {
          if (mode === 'koperasi') {
            const match = koperasiTransactions.find((t) => t.id === id);
            if (match) setSelectedKoperasiTrx(match);
            setActiveTab('antrean_pengawas');
          } else {
            setActiveTab('peringatan_saya');
          }
        }}
        isMasked={isMasked}
        setIsMasked={setIsMasked}
        streamingActive={streamingActive}
        setStreamingActive={setStreamingActive}
        onNavigateToLanding={() => setCurrentView('landing')}
        mode={mode}
        onToggleMode={handleToggleMode}
        role={userRole}
        onSelectRole={setUserRole}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 3. Main Content Canvas */}
      <main className="ml-64 pt-20 pb-12 px-8 min-h-screen flex-1">
        <div className="max-w-[1440px] mx-auto transition-all duration-200">
          {/* =========================================================
             A. MODE KOPERASI ROUTES
             ========================================================= */}
          {mode === 'koperasi' && (
            <>
              {/* Special Dinas Koperasi View when role is selected */}
              {userRole === 'Dinas Koperasi' ? (
                <DinasKoperasiView onAppendAuditLog={handleLogAuditAction} />
              ) : userRole === 'Anggota (RAT)' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#E0F4EE] border border-[#009770]/30 text-xs text-[#0A2A22] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#009770]">verified_user</span>
                    <span>
                      <strong>Mode Akses Anggota (RAT):</strong> Anda melihat laporan agregat tahunan yang telah diverifikasi dan disetujui pengawas tanpa akses ke data mentah atau antrean penelaahan transaksi internal.
                    </span>
                  </div>
                  <RatReportView
                    transactions={koperasiTransactions}
                    accounts={koperasiAccounts}
                    onLogAuditAction={handleLogAuditAction}
                  />
                </div>
              ) : (
                <>
                  {activeTab === 'pemantauan_langsung' && (
                    <KoperasiLiveMonitoringView
                      transactions={koperasiTransactions}
                      onSelectTransaction={(trx) => {
                        setSelectedKoperasiTrx(trx);
                        setActiveTab('antrean_pengawas');
                      }}
                      onNavigateToQueue={() => setActiveTab('antrean_pengawas')}
                      onNavigateToHealth={() => setActiveTab('kesehatan_akun')}
                      isMasked={isMasked}
                      streamingActive={streamingActive}
                      setStreamingActive={setStreamingActive}
                    />
                  )}

                  {activeTab === 'kesehatan_akun' && (
                    <KoperasiAccountHealthView
                      accounts={koperasiAccounts}
                      transactions={koperasiTransactions}
                      onToggleAccountExclusion={handleToggleAccountExclusion}
                      onNavigateToQueueWithAccount={(accName) => {
                        const match = koperasiTransactions.find((t) => t.akun === accName && t.status !== 'Normal');
                        if (match) setSelectedKoperasiTrx(match);
                        setActiveTab('antrean_pengawas');
                      }}
                    />
                  )}

                  {activeTab === 'pihak_terkait' && (
                    <RelatedPartyView
                      transactions={koperasiTransactions}
                      onSelectTransaction={(trx) => {
                        setSelectedKoperasiTrx(trx);
                        setActiveTab('antrean_pengawas');
                      }}
                      onMakeDecision={handleMakeKoperasiDecision}
                      isMasked={isMasked}
                    />
                  )}

                  {activeTab === 'antrean_pengawas' && (
                    <KoperasiReviewQueueView
                      transactions={koperasiTransactions}
                      selectedTransaction={selectedKoperasiTrx}
                      onSelectTransaction={setSelectedKoperasiTrx}
                      onMakeDecision={handleMakeKoperasiDecision}
                      systemWeights={systemWeights}
                      isMasked={isMasked}
                    />
                  )}

                  {activeTab === 'kontrol_internal' && (
                    <InternalControlCenterView
                      accounts={koperasiAccounts}
                      transactions={koperasiTransactions}
                      currentRole={userRole}
                      onAppendAuditLog={handleLogAuditAction}
                    />
                  )}

                  {activeTab === 'persiapan_data' && (
                    <DataPreparationView mode="koperasi" />
                  )}

                  {activeTab === 'pusat_indikator' && (
                    <IndicatorCenterView mode="koperasi" onNavigateToTab={setActiveTab} />
                  )}

                  {activeTab === 'bahan_rat' && (
                    <RatReportView
                      transactions={koperasiTransactions}
                      accounts={koperasiAccounts}
                      onLogAuditAction={handleLogAuditAction}
                    />
                  )}

                  {activeTab === 'sumber_data_privasi' && (
                    <KoperasiDataSourcesPrivacyView
                      auditLogs={koperasiAuditLogs}
                      retentionDays={retentionDays}
                      onUpdateRetentionDays={setRetentionDays}
                      onClearData={handleClearData}
                      isMasked={isMasked}
                      setIsMasked={setIsMasked}
                      onLogAuditAction={handleLogAuditAction}
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* =========================================================
             B. MODE UMKM ROUTES
             ========================================================= */}
          {mode === 'umkm' && (
            <>
              {activeTab === 'beranda_usaha' && (
                <BusinessHomeView
                  transactions={umkmTransactions}
                  onNavigateToVariance={() => setActiveTab('kasir_selisih_kas')}
                  onNavigateToMixing={() => setActiveTab('pencampuran_uang')}
                  onNavigateToAlerts={() => setActiveTab('peringatan_saya')}
                  onNavigateToReadiness={() => setActiveTab('rapor_kas')}
                />
              )}

              {(activeTab === 'rapor_kas' || activeTab === 'arus_kas_kesiapan') && (
                <RaporKasView
                  transactions={umkmTransactions}
                  umkmConsent={umkmConsent}
                  onUpdateConsent={(up) => setUmkmConsent((prev) => ({ ...prev, ...up }))}
                />
              )}

              {activeTab === 'kasir_selisih_kas' && (
                <CashierVarianceView
                  transactions={umkmTransactions}
                  reconciliations={umkmReconciliations}
                  onAddReconciliation={handleAddReconciliation}
                />
              )}

              {activeTab === 'pencampuran_uang' && (
                <PersonalMixingView
                  transactions={umkmTransactions}
                  onTogglePersonalTag={handleToggleUmkmPersonalTag}
                  onSeparateFromBusiness={handleSeparateUmkmTransaction}
                />
              )}

              {activeTab === 'peringatan_saya' && (
                <OwnerAlertsView
                  transactions={umkmTransactions}
                  onMakeDecision={handleMakeUmkmDecision}
                />
              )}

              {activeTab === 'persiapan_data' && (
                <DataPreparationView mode="umkm" />
              )}

              {activeTab === 'pusat_indikator' && (
                <IndicatorCenterView mode="umkm" onNavigateToTab={setActiveTab} />
              )}

              {activeTab === 'izin_data_saya' && (
                <PrivacyConsentView
                  umkmConsent={umkmConsent}
                  onUpdateConsent={(up) => setUmkmConsent((prev) => ({ ...prev, ...up }))}
                  retentionDays={retentionDays}
                  onUpdateRetentionDays={setRetentionDays}
                  onClearData={handleClearData}
                  auditLogs={umkmAuditLogs}
                  onAddAuditLog={(entry) =>
                    setUmkmAuditLogs((prev) => [
                      { ...entry, id: `AUD-UMK-${Date.now().toString().slice(-4)}` },
                      ...prev,
                    ])
                  }
                />
              )}
            </>
          )}

          {/* =========================================================
             C. SHARED BOTTOM ROUTE: Lab Validasi
             ========================================================= */}
          {activeTab === 'lab_validasi' && <ValidationLabView />}
        </div>
      </main>

      {/* 4. Global Institutional Footer */}
      <footer className="ml-64 px-8 py-3.5 border-t border-[#00B386]/25 bg-[#031B15]/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between text-xs font-mono-tabular text-gray-300 gap-2 no-print">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#84F8CA] radar-pulse-green" />
          <span className="inline-flex items-center gap-1.5">
            <SadarText variant="dark" className="text-sm font-black" />
            <span>&bull; Sistem Analitik Deteksi Anomali dan Rapor Kas</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-center text-gray-300 font-sans text-[11px]">
          <span className="text-[#84F8CA] font-bold">Prinsip Sistem:</span>
          <span>
            <SadarText variant="dark" className="text-xs font-bold mr-1 inline-flex" /> adalah alat bantu pengendalian internal: bukan alat penindakan dan bukan pengganti auditor.
          </span>
        </div>
        <div className="flex items-center gap-3 text-gray-400">
          <span className="inline-flex items-center gap-1">
            <SadarText variant="dark" className="text-xs font-black" />
            <span className="text-[#84F8CA]">v2.1</span>
          </span>
          <span>&bull;</span>
          <span>UU 27/2022 Terpatuhi</span>
        </div>
      </footer>

      {/* Settings Modal (Aturan Red-Flag & Ambang Batas) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        ruleConfig={ruleConfig}
        onUpdateRuleConfig={setRuleConfig}
        systemWeights={systemWeights}
        onUpdateSystemWeights={setSystemWeights}
        adaptiveThresholdEnabled={adaptiveThresholdEnabled}
        onToggleAdaptiveThreshold={setAdaptiveThresholdEnabled}
        minVolumeThreshold={minVolumeThreshold}
        onUpdateMinVolumeThreshold={setMinVolumeThreshold}
        actualP90={actualP90}
        actualP98={actualP98}
      />
    </div>
  );
}
