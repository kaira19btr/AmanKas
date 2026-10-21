/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AccountStatus = 'Wajar' | 'Mencurigakan' | 'Anomali Kuat' | 'Data belum cukup' | 'Dikecualikan (Nominal Tetap)';

export interface Account {
  id: string; // e.g. "#K-104"
  name: string;
  description: string;
  isFixedAmount: boolean; // toggle for exclusion policy
  totalTrx: number;
  mad: number;
  actualDigitFrequencies: number[]; // [digit1%, ..., digit9%]
  actualDigitCounts: number[];
  status: AccountStatus;
  sampleValid: boolean;
  notes?: string;
}

export type TransactionStatus = 'Normal' | 'Perlu ditinjau' | 'Segera verifikasi';
export type DecisionStatus = 'Menunggu Keputusan' | 'Ditindaklanjuti' | 'Dinyatakan Wajar' | 'Menunggu Dokumen';

export interface Transaction {
  id: string; // e.g. "TRX-882194"
  timestamp: string; // "23:47:12"
  fullDate: string; // "2026-10-21"
  accountId: string; // "#K-104"
  accountName: string;
  memberId: string; // "#0421"
  memberName: string;
  memberNIK: string;
  memberAccountNo: string;
  description: string;
  amount: number;
  channel: string;
  isolationScore: number; // 0-100
  ruleScore: number; // 0-100
  finalScore: number; // 0-100
  status: TransactionStatus;
  decisionStatus: DecisionStatus;
  flagReasons: string[];
  parentAccountAnomalySensitive: boolean;
  notes?: string;
  decisionTime?: string;
  decisionBy?: string;
  isNew?: boolean; // for pulse highlight
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  reason: string;
  verificationStatus: string;
  verified: boolean;
}

export interface SupervisorNote {
  id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  isFinal?: boolean;
  author: string;
}
