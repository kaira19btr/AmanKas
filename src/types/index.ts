/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppMode = 'koperasi' | 'umkm';

export type UserRole = 'Pengawas' | 'Pengurus' | 'Pemilik UMKM';

// Koperasi Navigation Tabs
export type KoperasiActiveTab =
  | 'pemantauan_langsung'
  | 'kesehatan_akun'
  | 'pihak_terkait'
  | 'antrean_pengawas'
  | 'bahan_rat'
  | 'sumber_data_privasi'
  | 'lab_validasi';

// UMKM Navigation Tabs
export type UmkmActiveTab =
  | 'beranda_usaha'
  | 'kasir_selisih_kas'
  | 'pencampuran_uang'
  | 'peringatan_saya'
  | 'arus_kas_kesiapan'
  | 'izin_data_saya'
  | 'lab_validasi';

export type LegacyTab = 'pemantauan' | 'kesehatan' | 'antrean' | 'sumber_data' | 'laporan' | 'lab';

export type ActiveTab = KoperasiActiveTab | UmkmActiveTab | LegacyTab;

export type AccountStatus =
  | 'Hijau'
  | 'Kuning'
  | 'Merah'
  | 'Volume belum cukup'
  | 'Dikecualikan (Nominal Tetap)'
  | 'Wajar'
  | 'Mencurigakan'
  | 'Anomali Kuat';

export interface Account {
  id: string; // e.g. "#K-104" or "#U-01"
  name: string;
  description: string;
  type?: string;
  isFixedAmount: boolean; // toggle for exclusion policy (angsuran, iuran, harga baku)
  totalTrx: number;
  mad: number; // Nigrini Mean Absolute Deviation
  chiSquare: number; // Chi-Square statistic
  status: AccountStatus;
  sampleValid: boolean;
  actualDigitFrequencies: number[]; // [digit1%, ..., digit9%]
  actualDigitCounts: number[];
  medianAmount: number;
  medianIntervalMin: number;
  notes?: string;
}

export type TransactionStatus = 'Normal' | 'Perlu ditinjau' | 'Prioritas tinggi' | 'Segera verifikasi';

export type DecisionStatus =
  | 'Menunggu Keputusan'
  | 'Wajar'
  | 'Perlu dokumen pendukung'
  | 'Perlu pemeriksaan lanjut'
  | 'Dinyatakan Wajar'
  | 'Ditindaklanjuti';

export interface AttributionFactors {
  nominalDeltaMedianPct?: number;
  hourDeltaMedian?: number;
  intervalDeltaMedianMin?: number;
  nominalDeviation?: number;
  hourDeviation?: number;
  intervalDeviation?: number;
  ruleContribution?: number;
  anomalyContribution?: number;
}

export interface CorrectionEntry {
  timestamp: string;
  actor: string;
  role: string;
  prevDecision?: DecisionStatus;
  previousDecision?: DecisionStatus;
  newDecision: DecisionStatus;
  reason: string;
}

export interface Transaction {
  id: string;
  timestamp: string;
  fullDate: string;
  accountId: string;
  accountName: string;
  memberPseudonym?: string;
  memberRealName?: string;
  memberName: string;
  memberId: string;
  memberNIK?: string;
  memberAccountNo?: string;
  description: string;
  amount: number;
  channel?: string;
  isolationScore: number;
  anomalyScore?: number;
  ruleScore: number;
  finalScore: number;
  status: TransactionStatus;
  decisionStatus: DecisionStatus;
  flagReasons: string[];
  attribution?: AttributionFactors;
  dataLimitations?: string;
  dataLimitation?: string;
  parentAccountAnomalySensitive?: boolean;
  notes?: string;
  decisionTime?: string;
  decisionBy?: string;
  decisionRole?: string;
  correctionHistory?: CorrectionEntry[];
  relatedTransactions?: Array<{
    id: string;
    timestamp: string;
    amount: number;
    description: string;
    status: TransactionStatus;
  }>;
  isNew?: boolean;
  injectedPatternType?: string;
}

// -------------------------------------------------------------
// DEDICATED KOPERASI DATA MODEL
// -------------------------------------------------------------
export type KoperasiAccountType =
  | 'Simpanan Pokok'
  | 'Simpanan Wajib'
  | 'Simpanan Sukarela'
  | 'Pinjaman Anggota'
  | 'Angsuran Pinjaman'
  | 'Kas Operasional'
  | 'Biaya Operasional';

export type KoperasiUnit = 'Cabang Utama' | 'Cabang Barat' | 'Cabang Timur';

export interface KoperasiTransaction {
  id: string; // e.g. "KOP-2026-081"
  tanggal: string; // "2026-10-25 09:15"
  jam: string; // "09:15"
  akun: KoperasiAccountType;
  accountId: string; // "#K-104", "#P-302", etc.
  idAnggotaPseudonim: string; // e.g. "ANG-7F3A"
  namaAnggotaMasked: string; // e.g. "Hendro P***"
  jenisTransaksi: 'Simpanan' | 'Pinjaman' | 'Angsuran' | 'Kas Masuk' | 'Kas Keluar' | 'Biaya';
  nominal: number;
  petugas: string; // e.g. "Teller-1 (Dewi)", "Kredit (Budi)"
  unit: KoperasiUnit;
  statusDokumen: 'Lengkap' | 'Tidak Ada' | 'Menunggu Verifikasi';
  isPihakTerkait: boolean; // Menandai keterlibatan pengurus / pengawas
  pihakTerkaitLabel?: 'Pengurus' | 'Pengawas' | 'Afiliasi Keluarga';
  selisihPolaAnggota?: string; // e.g. "+310% dari rata-rata plafon pinjaman reguler"
  assignedSupervisor?: string; // e.g. "Pengawas · Sari W."
  ruleScore: number; // 0-100
  isolationScore: number; // 0-100
  finalScore: number; // 0-100
  status: TransactionStatus;
  decisionStatus: DecisionStatus;
  flagReasons: string[];
  catatan?: string;
  decisionTime?: string;
  decisionBy?: string;
  correctionHistory?: CorrectionEntry[];
}

// -------------------------------------------------------------
// DEDICATED UMKM DATA MODEL
// -------------------------------------------------------------
export type UmkmTransactionType =
  | 'penjualan'
  | 'retur'
  | 'void'
  | 'diskon'
  | 'pengeluaran'
  | 'setoran'
  | 'pribadi';

export type UmkmPaymentMethod = 'tunai' | 'qris' | 'transfer';

export interface UmkmTransaction {
  id: string; // e.g. "UMK-8819"
  tanggalJam: string; // "2026-10-25 14:22"
  jam: string; // "14:22"
  tanggal: string; // "2026-10-25"
  jenis: UmkmTransactionType;
  nominal: number;
  metode: UmkmPaymentMethod;
  kasirShift: string; // e.g. "Kasir-01 (Shift 1)", "Kasir-02 (Shift 2)"
  kasirPseudonim: string; // e.g. "KASIR-01"
  adaStruk: boolean;
  tagPribadi: boolean; // Transaksi pribadi pada akun usaha
  kategoriPribadi?: string; // e.g. "Belanja Dapur Pribadi", "Servis Motor", "SPP Sekolah"
  dipisahkanDariUsaha?: boolean; // Flag if user separated it
  deskripsi: string;
  ruleScore: number;
  isolationScore?: number;
  finalScore: number;
  volumeCukup: boolean; // Red flags are primary; Benford & Isolation Forest only activate if volume is sufficient
  status: TransactionStatus;
  decisionStatus: DecisionStatus;
  flagReasons: string[];
  catatan?: string;
  decisionTime?: string;
  decisionBy?: string;
  correctionHistory?: CorrectionEntry[];
}

export interface CashReconciliationRecord {
  id: string;
  tanggal: string;
  shift: string;
  kasir: string;
  kasSistem: number;
  kasFisikInput: number;
  selisih: number;
  status: 'Sesuai' | 'Kurang' | 'Lebih';
  catatan: string;
  waktuInput: string;
}

export interface RuleConfig {
  [key: string]: any;
}

export interface SystemWeights {
  ruleWeight: number; // Default 50
  anomalyWeight: number; // Default 50
  calibratedCount: number;
  adaptiveThresholdEnabled?: boolean;
  minVolumeThreshold?: number;
  percentileP90?: number;
  percentileP98?: number;
}

export interface UmkmConsent {
  optInConsent: boolean;
  enabled?: boolean;
  shareCashFlowWithLender: boolean;
  lenderShareToken: string | null;
  sharingToken?: string | null;
  shareRevoked: boolean;
  consentDate?: string;
  revokeDate?: string;
  revocationTimestamp?: string | null;
  lenderName?: string;
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

export interface ValidationSyntheticConfig {
  transactionCount: number;
  injectedPercent?: number;
  injectedPatternRate?: number;
  seed: number;
  repetitions: number;
}

export interface MetricStats {
  mean: number;
  std: number;
}

export interface ValidationAblationResult {
  configName?: string;
  configuration?: string;
  precision: MetricStats | number;
  precisionStd?: number;
  recall: MetricStats | number;
  recallStd?: number;
  f1Score?: MetricStats | number;
  f1?: MetricStats | number;
  f1Std?: number;
  falsePositiveRate?: MetricStats | number;
  fpr?: MetricStats | number;
  fprStd?: number;
  alertsPerThousand?: MetricStats | number;
  alertsPer1000?: MetricStats | number;
  alertsPerThousandStd?: number;
  notes?: string;
}
