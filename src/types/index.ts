/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppMode = 'koperasi' | 'umkm';

export type UserRole =
  | 'Pengawas'
  | 'Pengurus'
  | 'Pengawas Senior'
  | 'Dinas Koperasi'
  | 'Anggota (RAT)'
  | 'Kasir'
  | 'Pemilik UMKM';

// Koperasi Navigation Tabs
export type KoperasiActiveTab =
  | 'pemantauan_langsung'
  | 'kesehatan_akun'
  | 'pihak_terkait'
  | 'antrean_pengawas'
  | 'kontrol_internal'
  | 'persiapan_data'
  | 'pusat_indikator'
  | 'bahan_rat'
  | 'sumber_data_privasi'
  | 'lab_validasi'
  | 'dinas_koperasi';

// UMKM Navigation Tabs
export type UmkmActiveTab =
  | 'beranda_usaha'
  | 'rapor_kas'
  | 'kasir_selisih_kas'
  | 'pencampuran_uang'
  | 'peringatan_saya'
  | 'persiapan_data'
  | 'pusat_indikator'
  | 'arus_kas_kesiapan'
  | 'izin_data_saya'
  | 'lab_validasi';

export type LegacyTab = 'pemantauan' | 'kesehatan' | 'antrean' | 'sumber_data' | 'laporan' | 'lab';

export type ActiveTab = KoperasiActiveTab | UmkmActiveTab | LegacyTab;

export type StandardRiskStatus =
  | 'Hijau · Risiko rendah'
  | 'Kuning · Risiko sedang (≥ P90)'
  | 'Merah · Risiko tinggi (≥ P98)'
  | 'Volume belum cukup'
  | 'Dikecualikan (Nominal Tetap)';

export type AccountStatus =
  | StandardRiskStatus
  | 'Hijau'
  | 'Kuning'
  | 'Merah'
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
  mad: number; // Nigrini Mean Absolute Deviation (worst of 1st and 2nd)
  chiSquare: number; // Chi-Square statistic
  status: AccountStatus;
  sampleValid: boolean;
  actualDigitFrequencies: number[]; // First digit [1..9] frequencies (0..1)
  actualDigitCounts: number[];
  secondDigitFrequencies?: number[]; // Second digit [0..9] frequencies (0..1)
  secondDigitCounts?: number[];
  madFirstDigit?: number;
  madSecondDigit?: number;
  conformityFirst?: string;
  conformitySecond?: string;
  medianAmount: number;
  medianIntervalMin: number;
  notes?: string;
}

export type TransactionStatus =
  | StandardRiskStatus
  | 'Normal'
  | 'Perlu ditinjau'
  | 'Prioritas tinggi'
  | 'Segera verifikasi';

export type DecisionStatus =
  | 'Menunggu Keputusan'
  | 'Wajar'
  | 'Perlu dokumen pendukung'
  | 'Perlu pemeriksaan lanjut'
  | 'Dinyatakan Wajar'
  | 'Ditindaklanjuti';

/**
 * Standardizes display labels to exact essay specifications:
 * - "Hijau · Risiko rendah"
 * - "Kuning · Risiko sedang (≥ P90)"
 * - "Merah · Risiko tinggi (≥ P98)"
 * - "Volume belum cukup"
 * - "Dikecualikan (Nominal Tetap)"
 */
export function formatRiskStatus(status: string | undefined): StandardRiskStatus {
  if (!status) return 'Hijau · Risiko rendah';
  if (status.includes('Merah') || status === 'Prioritas tinggi' || status === 'Anomali Kuat') {
    return 'Merah · Risiko tinggi (≥ P98)';
  }
  if (status.includes('Kuning') || status === 'Perlu ditinjau' || status === 'Segera verifikasi' || status === 'Mencurigakan') {
    return 'Kuning · Risiko sedang (≥ P90)';
  }
  if (status.includes('Volume')) {
    return 'Volume belum cukup';
  }
  if (status.includes('Dikecualikan')) {
    return 'Dikecualikan (Nominal Tetap)';
  }
  return 'Hijau · Risiko rendah';
}

export function getRiskBadgeClasses(status: string | undefined): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  const norm = formatRiskStatus(status);
  switch (norm) {
    case 'Merah · Risiko tinggi (≥ P98)':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-200',
        icon: 'error',
      };
    case 'Kuning · Risiko sedang (≥ P90)':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        icon: 'warning',
      };
    case 'Volume belum cukup':
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-200',
        icon: 'info',
      };
    case 'Dikecualikan (Nominal Tetap)':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
        icon: 'lock',
      };
    default:
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        icon: 'check_circle',
      };
  }
}

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
  tanggapanPihakTerkait?: string;
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
  tanggapanPihakTerkait?: string; // Hak klarifikasi pihak terkait sebelum pembahasan RAT
  isOverdue48h?: boolean; // Melewati batas waktu peninjauan 48 jam
  hoursRemaining48h?: number; // Sisa jam menuju batas 48 jam
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
  tanggapanPihakTerkait?: string; // Hak klarifikasi kasir/staf
  isOverdue48h?: boolean;
  hoursRemaining48h?: number;
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
  prevHash?: string;
  hash?: string;
  verificationStatus?: string;
  verified?: boolean;
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
  f1ScoreStd?: number;
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
