/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { LiveMonitoringView } from './views/LiveMonitoringView';
import { AccountHealthView } from './views/AccountHealthView';
import { ReviewQueueView } from './views/ReviewQueueView';
import { DataSourcesPrivacyView } from './views/DataSourcesPrivacyView';
import { IntegrityReportView } from './views/IntegrityReportView';
import { LoginPage } from './views/LoginPage';
import { LandingPage } from './views/LandingPage';
import {
  generateInitialDataset,
  generateStreamingTransaction,
} from './utils/dataGenerator';
import { Transaction, Account, AuditLogEntry, SupervisorNote, DecisionStatus } from './types';
import { calculateBenford } from './utils/benford';

export type ViewMode = 'landing' | 'login' | 'dashboard';

export default function App() {
  // Navigation View Mode State: 'landing' (default landing page) | 'login' (staff auth) | 'dashboard' (5 applet screens)
  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Initialize state once in memory
  const initialDataRef = useRef(generateInitialDataset());
  const [accounts, setAccounts] = useState<Account[]>(initialDataRef.current.accounts);
  const [transactions, setTransactions] = useState<Transaction[]>(initialDataRef.current.transactions);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(initialDataRef.current.auditLogs);
  const [supervisorNotes] = useState<SupervisorNote[]>(initialDataRef.current.supervisorNotes);
  const isolationForestRef = useRef(initialDataRef.current.isolationForest);

  // App navigation & preferences state
  const [activeTab, setActiveTab] = useState<ActiveTab>('pemantauan');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isMasked, setIsMasked] = useState<boolean>(true);
  const [streamingActive, setStreamingActive] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Learned feedback dictionary: accountId -> discount points when marked "Ternyata wajar"
  const [learnedDiscounts, setLearnedDiscounts] = useState<Record<string, number>>({});

  // Live Stream Interval: every 3.5 to 5.5 seconds generates a new transaction
  useEffect(() => {
    if (!streamingActive) return;

    const intervalTime = Math.floor(3500 + Math.random() * 2000);
    const interval = setInterval(() => {
      const newTrx = generateStreamingTransaction(accounts, isolationForestRef.current);

      // Check if this account has learned fair discounts from verifier decisions
      const discount = learnedDiscounts[newTrx.accountId] || 0;
      if (discount > 0) {
        newTrx.finalScore = Math.max(5, newTrx.finalScore - discount);
        if (newTrx.finalScore <= 40) {
          newTrx.status = 'Normal';
          newTrx.decisionStatus = 'Dinyatakan Wajar';
        }
      }

      setTransactions((prev) => [newTrx, ...prev]);

      // Periodically refresh Benford calculation for the affected account
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) => {
          if (acc.id === newTrx.accountId) {
            const accAmounts = [newTrx.amount, ...transactions.filter((t) => t.accountId === acc.id).map((t) => t.amount)];
            const b = calculateBenford(accAmounts, acc.isFixedAmount);
            return {
              ...acc,
              totalTrx: acc.totalTrx + 1,
              mad: Number(b.mad.toFixed(4)),
              actualDigitCounts: b.digitCounts,
              actualDigitFrequencies: b.digitFrequencies,
              status: acc.id === '#K-104' && !acc.isFixedAmount ? 'Anomali Kuat' : b.status,
            };
          }
          return acc;
        })
      );
    }, intervalTime);

    return () => clearInterval(interval);
  }, [streamingActive, isAuthenticated, accounts, transactions, learnedDiscounts]);

  // Handler for verifier human-in-the-loop decisions
  const handleMakeDecision = (trxId: string, decision: DecisionStatus, note: string) => {
    const targetTrx = transactions.find((t) => t.id === trxId);
    if (!targetTrx) return;

    const nowStr = new Date().toTimeString().slice(0, 8);

    // Update transactions state
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === trxId) {
          return {
            ...t,
            decisionStatus: decision,
            notes: note || t.notes,
            decisionTime: nowStr,
            decisionBy: 'Bendahara Sari W.',
          };
        }
        return t;
      })
    );

    // If decision is "Dinyatakan Wajar", learn from this feedback:
    if (decision === 'Dinyatakan Wajar') {
      setLearnedDiscounts((prev) => ({
        ...prev,
        [targetTrx.accountId]: (prev[targetTrx.accountId] || 0) + 25,
      }));
    }

    // Record to persistent in-memory audit log
    const newLog: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: nowStr,
      actor: 'Sari Wulandari',
      role: 'Bendahara Utama',
      action: `Keputusan Audit: ${decision}`,
      target: `${targetTrx.id} (${targetTrx.accountName})`,
      reason: note || (decision === 'Dinyatakan Wajar' ? 'Verifikasi konfirmasi operasional wajar' : 'Tindakan verifikasi pengurus'),
      verificationStatus: 'Disetujui Otoritas',
      verified: true,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Keep active selection in sync
    setSelectedTransaction((prev) => (prev?.id === trxId ? { ...prev, decisionStatus: decision } : prev));
  };

  // Handler for Benford account exclusion toggle
  const handleToggleAccountExclusion = (accountId: string) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) {
          const nextFixed = !acc.isFixedAmount;
          const accTrx = transactions.filter((t) => t.accountId === acc.id).map((t) => t.amount);
          const b = calculateBenford(accTrx, nextFixed);
          return {
            ...acc,
            isFixedAmount: nextFixed,
            status: nextFixed ? 'Dikecualikan (Nominal Tetap)' : acc.id === '#K-104' ? 'Anomali Kuat' : b.status,
          };
        }
        return acc;
      })
    );

    const targetAcc = accounts.find((a) => a.id === accountId);
    const nowStr = new Date().toTimeString().slice(0, 8);
    setAuditLogs((prev) => [
      {
        id: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: nowStr,
        actor: 'Sari Wulandari',
        role: 'Bendahara Utama',
        action: 'Ubah Kebijakan Pengecualian Benford',
        target: `${accountId} - ${targetAcc?.name}`,
        reason: 'Penyesuaian Akun Nominal Baku/Tetap Koperasi',
        verificationStatus: 'Disetujui Otoritas',
        verified: true,
      },
      ...prev,
    ]);
  };

  // Handler for adding new audit logs
  const handleAddAuditLog = (entry: Omit<AuditLogEntry, 'id'>) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `AUD-${Date.now().toString().slice(-4)}`,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Handler for importing new external transactions (CSV/XLSX)
  const handleImportTransactions = (newTrxs: Transaction[]) => {
    setTransactions((prev) => [...newTrxs, ...prev]);
  };

  // Global search filtering
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.memberName.toLowerCase().includes(q) ||
        t.memberNIK.includes(q) ||
        t.accountName.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
    );
  }, [transactions, searchQuery]);

  // Counts for sidebar badges
  const pendingReviewCount = transactions.filter(
    (t) => t.status === 'Perlu ditinjau' && t.decisionStatus === 'Menunggu Keputusan'
  ).length;
  const criticalCount = transactions.filter(
    (t) => t.status === 'Segera verifikasi' && t.decisionStatus === 'Menunggu Keputusan'
  ).length;

  // 1. Primary Landing Page View
  if (currentView === 'landing') {
    return (
      <LandingPage
        onEnterDashboard={(targetTab) => {
          if (targetTab) setActiveTab(targetTab);
          setIsAuthenticated(true);
          setCurrentView('dashboard');
        }}
        onNavigateToLogin={() => setCurrentView('login')}
        transactions={transactions}
      />
    );
  }

  // 2. Staff Authentication View (Login Page with animated logo & role selector)
  if (currentView === 'login') {
    return (
      <LoginPage
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          setCurrentView('dashboard');
        }}
        onDirectToLanding={() => {
          setCurrentView('landing');
        }}
      />
    );
  }

  // 3. Operational 5-Screen Interactive Dashboard
  return (
    <div className="min-h-screen text-[#0A2A22] antialiased flex flex-col justify-between selection:bg-[#009770] selection:text-white">
      {/* 1. Left Sidebar Navigation with Logout and Back-to-Landing */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingReviewCount={pendingReviewCount}
        criticalCount={criticalCount}
        onLogout={() => {
          setIsAuthenticated(false);
          setCurrentView('login');
        }}
        onNavigateToLanding={() => setCurrentView('landing')}
      />

      {/* 2. Top Header Utility Bar */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        recentAlerts={transactions.filter((t) => t.status === 'Segera verifikasi').slice(0, 5)}
        onSelectTransaction={(trx) => {
          setSelectedTransaction(trx);
          setActiveTab('antrean');
        }}
        isMasked={isMasked}
        setIsMasked={setIsMasked}
        streamingActive={streamingActive}
        setStreamingActive={setStreamingActive}
        onNavigateToLanding={() => setCurrentView('landing')}
      />

      {/* 3. Main Content Canvas */}
      <main className="ml-60 pt-20 pb-12 px-8 min-h-screen flex-1">
        <div className="max-w-[1440px] mx-auto">
          {activeTab === 'pemantauan' && (
            <LiveMonitoringView
              transactions={filteredTransactions}
              accounts={accounts}
              onSelectTransaction={(trx) => {
                setSelectedTransaction(trx);
                setActiveTab('antrean');
              }}
              onNavigateToQueue={() => setActiveTab('antrean')}
              onNavigateToAccounts={() => setActiveTab('kesehatan')}
              isMasked={isMasked}
              streamingActive={streamingActive}
              setStreamingActive={setStreamingActive}
            />
          )}

          {activeTab === 'kesehatan' && (
            <AccountHealthView
              accounts={accounts}
              transactions={transactions}
              onToggleAccountExclusion={handleToggleAccountExclusion}
              onNavigateToQueueWithAccount={(accountId) => {
                const match = transactions.find((t) => t.accountId === accountId && t.status !== 'Normal');
                if (match) setSelectedTransaction(match);
                setActiveTab('antrean');
              }}
            />
          )}

          {activeTab === 'antrean' && (
            <ReviewQueueView
              transactions={filteredTransactions}
              accounts={accounts}
              selectedTransaction={selectedTransaction}
              onSelectTransaction={setSelectedTransaction}
              onMakeDecision={handleMakeDecision}
              isMasked={isMasked}
            />
          )}

          {activeTab === 'sumber_data' && (
            <DataSourcesPrivacyView
              accounts={accounts}
              auditLogs={auditLogs}
              onAddAuditLog={handleAddAuditLog}
              onImportTransactions={handleImportTransactions}
              isMasked={isMasked}
              setIsMasked={setIsMasked}
              isolationForest={isolationForestRef.current}
            />
          )}

          {activeTab === 'laporan' && (
            <IntegrityReportView
              accounts={accounts}
              transactions={transactions}
              supervisorNotes={supervisorNotes}
            />
          )}
        </div>
      </main>

      {/* 4. Global Institutional Footer */}
      <footer className="ml-60 px-8 py-3.5 border-t border-[#F3D9CE] bg-white/70 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between text-xs font-mono-tabular text-[#6B5A55] gap-2 no-print">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#009770] radar-pulse-green" />
          <span>
            <strong>Data simulasi untuk demonstrasi</strong> · KSP Mitra Sejahtera (Demo)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>AmanKas v1.4</span>
          <span>•</span>
          <span>Protokol Audit Standar Kemenkop-UKM &amp; UU PDP No. 27/2022</span>
          <span>•</span>
          <span>Enkripsi AES-256 Terverifikasi</span>
        </div>
      </footer>
    </div>
  );
}
