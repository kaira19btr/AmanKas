/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Account, Transaction, AuditLogEntry, SupervisorNote } from '../types';
import { calculateBenford } from './benford';
import { IsolationForest, extractFeatures } from './isolationForest';
import { calculateScores } from './scoring';

export const INITIAL_ACCOUNTS: Omit<Account, 'totalTrx' | 'mad' | 'actualDigitFrequencies' | 'actualDigitCounts' | 'status' | 'sampleValid'>[] = [
  { id: '#K-104', name: 'Kas Operasional & Cadangan', description: 'Kas Kecil & Pengeluaran Harian', isFixedAmount: false, notes: 'Buku kas utama kasir pengeluaran harian operasional kantor.' },
  { id: '#B-101', name: 'Kas Utama Bank Mandiri', description: 'Penampungan Giro Utama', isFixedAmount: false, notes: 'Giro utama penyaluran dan penarikan antar perbankan.' },
  { id: '#S-201', name: 'Simpanan Wajib & Sukarela', description: 'Iuran Anggota Terdaftar', isFixedAmount: false, notes: 'Setoran simpanan wajib bulanan dan sukarela anggota.' },
  { id: '#P-302', name: 'Angsuran Pinjaman Anggota', description: 'Pelunasan Pokok & Bunga', isFixedAmount: false, notes: 'Penerimaan pembayaran angsuran kredit mikro anggota.' },
  { id: '#A-405', name: 'Pendapatan Jasa & Administrasi', description: 'Biaya Provisi & Materai', isFixedAmount: false, notes: 'Biaya administrasi penerbitan pinjaman dan materai.' },
  { id: '#C-501', name: 'Dana Cadangan Resiko', description: 'Alokasi Cadangan Likuiditas', isFixedAmount: false, notes: 'Cadangan pemenuhan likuiditas darurat koperasi.' },
  { id: '#K-109', name: 'Kas Kasir Cabang Barat', description: 'Loket Transaksi Tunai Cabang', isFixedAmount: false, notes: 'Loket transaksi tunai teller kantor cabang barat.' },
  { id: '#B-102', name: 'Kas Giro Bank BRI', description: 'Operasional Unit Simpan Pinjam', isFixedAmount: false, notes: 'Penampungan transaksi transfer antar rekening BRI.' },
  { id: '#S-202', name: 'Simpanan Berjangka (Mudharabah)', description: 'Deposito Berjangka Anggota', isFixedAmount: false, notes: 'Penempatan dana simpanan berjangka 6-12 bulan.' },
  { id: '#P-303', name: 'Piutang Pembiayaan Usaha Mikro', description: 'Penyaluran Modal Kerja', isFixedAmount: false, notes: 'Fasilitas pinjaman kelompok pedagang pasar.' },
  { id: '#K-110', name: 'Kas Kasir Unit Pasar', description: 'Teller Pasar Sukasari', isFixedAmount: false, notes: 'Setoran harian pedagang pasar tradisional.' },
  { id: '#D-601', name: 'Alokasi Dana Sosial & Pendidikan', description: 'Penyisihan SHU', isFixedAmount: true, notes: 'Dana nominal tetap bantuan pendidikan putra-putri anggota.' },
  { id: '#I-701', name: 'Investasi Surat Berharga', description: 'Penempatan Deposito Resmi', isFixedAmount: false, notes: 'Instrumen pasar uang pengawas.' },
  { id: '#T-801', name: 'Titipan Dana Rekanan Koperasi', description: 'Pengadaan Sarana & ATK', isFixedAmount: false, notes: 'Rekening transit vendor operasional.' },
];

export const MOCK_MEMBERS = [
  { id: '#0421', name: 'Bpk. Hendro Prayogo', nik: '3273012908850002', accountNo: '0182-993-110', business: 'Usaha Sembako' },
  { id: '#1184', name: 'Ibu Nurhasanah', nik: '3273045610890001', accountNo: '0182-441-209', business: 'Anggota Reguler' },
  { id: '#0893', name: 'Ahmad Fauzi', nik: '3273021104920004', accountNo: '0182-772-883', business: 'Kasir Shift 2 / UMKM Kopi' },
  { id: '#2041', name: 'Siti Rahmawati', nik: '3273031507900003', accountNo: '0182-119-450', business: 'Usaha Warung Makan' },
  { id: '#3310', name: 'Dewi Lestari', nik: '3273052212940005', accountNo: '0182-881-332', business: 'Pendidik Swasta' },
  { id: '#2102', name: 'Ratna Sari', nik: '3273061803880002', accountNo: '0182-553-912', business: 'Simpan Pinjam' },
  { id: '#1055', name: 'Joko Susanto', nik: '3273070409860001', accountNo: '0182-664-101', business: 'Bengkel Motor' },
  { id: '#1420', name: 'Sri Wahyuni', nik: '3273081206910006', accountNo: '0182-220-745', business: 'Toko Kelontong' },
  { id: '#0912', name: 'Bambang Kusuma', nik: '3273092501840003', accountNo: '0182-339-618', business: 'Peternak Unggas' },
  { id: '#1874', name: 'Eko Prasetyo', nik: '3273101908930002', accountNo: '0182-448-902', business: 'Distributor Sayur' },
  { id: '#0533', name: 'Hj. Aminah', nik: '3273111405780001', accountNo: '0182-127-654', business: 'Konveksi Hijab' },
  { id: '#2290', name: 'Rudi Hartono', nik: '3273123011870004', accountNo: '0182-789-012', business: 'Jasa Angkutan' },
];

const CHANNELS = [
  'Loket Kasir Tunai',
  'Transfer Bank Mandiri',
  'Transfer Bank BRI',
  'Virtual Account',
  'ATM Bersama',
  'QRIS Koperasi',
  'Aplikasi Kasir POS',
];

const DESCRIPTIONS: Record<string, string[]> = {
  '#K-104': ['Tarik Tunai Operasional', 'Kas Kecil Kantor', 'Biaya Pembelian ATK', 'Bahan Bakar Armada', 'Konsumsi Rapat Pengurus', 'Pencairan Kas Operasional'],
  '#B-101': ['Giro Kliring Antar Bank', 'Penerimaan Angsuran Kolektif', 'Penyaluran Pinjaman Anggota', 'Penarikan Cek Giro', 'Transfer Antar Rekening'],
  '#S-201': ['Simpanan Wajib Bulanan', 'Simpanan Sukarela Anggota', 'Setoran Pokok Awal', 'Tabungan Berjangka Khusus'],
  '#P-302': ['Pembayaran Angsuran Pinjaman', 'Pelunasan Kredit Cepat', 'Titipan Angsuran Pokok', 'Denda Keterlambatan'],
  '#A-405': ['Biaya Administrasi Pinjaman', 'Biaya Materai Notariat', 'Provisi Kredit Anggota'],
  '#C-501': ['Penyisihan Cadangan Risiko', 'Alokasi Likuiditas Kas', 'Cadangan Penurunan Nilai'],
  '#K-109': ['Penerimaan Loket Kasir Barat', 'Setoran Anggota Cabang', 'Pengeluaran Tunai Cabang', 'Tutup Buku Kasir'],
};

/**
 * Helper to generate random time string
 */
function randomTime(isNight: boolean = false): string {
  let hour: number;
  if (isNight) {
    hour = Math.random() < 0.8 ? 22 + Math.floor(Math.random() * 2) : Math.floor(Math.random() * 4);
  } else {
    // Business hours 08:00 to 17:00
    hour = 8 + Math.floor(Math.random() * 9);
  }
  const min = Math.floor(Math.random() * 60);
  const sec = Math.floor(Math.random() * 60);
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Generate synthetic transaction amounts following Benford's Law naturally.
 * For account #K-104, artificially skew towards starting with 5 (smurfing ~500k / 5M) and 9 (~9.9M).
 */
function generateNaturalBenfordAmount(accountId: string, isAnomaly: boolean): number {
  if (accountId === '#K-104') {
    // Manipulated Benford account: heavily biased towards first digit 5 and 9
    const rand = Math.random();
    if (rand < 0.25) {
      // Digit 5: e.g. 500.000, 550.000, 5.000.000
      const mult = Math.random() < 0.6 ? 500000 : 5000000;
      return mult + Math.floor(Math.random() * 9) * 10000;
    } else if (rand < 0.40) {
      // Digit 9: e.g. 9.900.000, 9.800.000, 900.000
      return 9000000 + Math.floor(Math.random() * 95) * 10000;
    }
  }

  if (isAnomaly) {
    const anomalyType = Math.random();
    if (anomalyType < 0.35) {
      // Smurfing: exactly under 10.000.000 threshold
      return 9800000 + Math.floor(Math.random() * 19) * 10000; // e.g. 9.800.000 - 9.980.000
    } else if (anomalyType < 0.70) {
      // Exact round number
      const rounds = [2000000, 3000000, 5000000, 8000000, 10000000, 15000000];
      return rounds[Math.floor(Math.random() * rounds.length)];
    } else {
      // High multiplier
      return 12000000 + Math.floor(Math.random() * 8) * 1000000;
    }
  }

  // Pure natural log distribution for Benford's law:
  // Random uniform U in [0, 1) -> first digit d = floor(10^U)
  const u = Math.random();
  const firstDigit = Math.min(9, Math.max(1, Math.floor(Math.pow(10, u))));
  
  // Base magnitude: 10k, 100k, 1M
  const magChoice = Math.random();
  let baseMag = 100000;
  if (magChoice < 0.25) baseMag = 10000;
  else if (magChoice < 0.75) baseMag = 100000;
  else baseMag = 1000000;

  const remainder = Math.floor(Math.random() * baseMag);
  return firstDigit * baseMag + remainder;
}

export function generateInitialDataset(): {
  accounts: Account[];
  transactions: Transaction[];
  auditLogs: AuditLogEntry[];
  supervisorNotes: SupervisorNote[];
  isolationForest: IsolationForest;
} {
  const transactions: Transaction[] = [];

  // Anchor specific iconic transactions matching UI design screenshots
  // 1. Critical Night Anomaly (Bpk. Hendro Prayogo)
  transactions.push({
    id: 'TRX-882194',
    timestamp: '23:47:12',
    fullDate: '2026-10-21',
    accountId: '#K-104',
    accountName: 'Kas Operasional & Cadangan',
    memberId: '#0421',
    memberName: 'Bpk. Hendro Prayogo',
    memberNIK: '3273012908850002',
    memberAccountNo: '0182-993-110',
    description: 'Tarik Tunai ATM Bersama',
    amount: 9900000,
    channel: 'Kanal ATM Bersama',
    isolationScore: 88,
    ruleScore: 95,
    finalScore: 92,
    status: 'Segera verifikasi',
    decisionStatus: 'Menunggu Keputusan',
    flagReasons: [
      'Penarikan pukul 23:47 WIB di luar jam operasional resmi KSP (tutup 16:00 WIB)',
      'Nominal tepat Rp 9.900.000 mendekati batas lapor wajib PPATK Rp 10.000.000 (indikasi structuring/smurfing)',
      'Jauh di atas profil rata-rata akun (+2.728% lonjakan deviasi historis)',
      'Pola penarikan pecahan berulang dalam interval singkat',
      'Akun induk berstatus Anomali Kuat (ambang kewaspadaan otomatis diperketat)',
    ],
    parentAccountAnomalySensitive: true,
  });

  // 2. High Frequency Rapid Transfer (Ibu Nurhasanah)
  transactions.push({
    id: 'TRX-882180',
    timestamp: '23:32:05',
    fullDate: '2026-10-21',
    accountId: '#S-201',
    accountName: 'Simpanan Wajib & Sukarela',
    memberId: '#1184',
    memberName: 'Ibu Nurhasanah',
    memberNIK: '3273045610890001',
    memberAccountNo: '0182-441-209',
    description: 'Transfer Antar Anggota (x4)',
    amount: 4200000,
    channel: 'Transfer Bank Mandiri',
    isolationScore: 68,
    ruleScore: 58,
    finalScore: 64,
    status: 'Perlu ditinjau',
    decisionStatus: 'Menunggu Keputusan',
    flagReasons: [
      'Frekuensi transfer cepat berturut-turut (4 kali dlm 10 menit)',
      'Transaksi malam hari (23:32 WIB)',
    ],
    parentAccountAnomalySensitive: false,
  });

  // 3. Loan application / New IP shift (Ahmad Fauzi)
  transactions.push({
    id: 'TRX-882165',
    timestamp: '23:14:40',
    fullDate: '2026-10-21',
    accountId: '#K-109',
    accountName: 'Kas Kasir Cabang Barat',
    memberId: '#0893',
    memberName: 'Ahmad Fauzi (UMKM Kopi)',
    memberNIK: '3273021104920004',
    memberAccountNo: '0182-772-883',
    description: 'Pengajuan Pinjaman Kilat',
    amount: 15000000,
    channel: 'Aplikasi Kasir POS',
    isolationScore: 62,
    ruleScore: 52,
    finalScore: 58,
    status: 'Perlu ditinjau',
    decisionStatus: 'Menunggu Keputusan',
    flagReasons: [
      'Login IP baru mendahului limit naik',
      'Nominal bulat tepat Rp 15.000.000',
    ],
    parentAccountAnomalySensitive: false,
  });

  // 4. Regular Normal Installment (Siti Rahmawati)
  transactions.push({
    id: 'TRX-882142',
    timestamp: '22:50:18',
    fullDate: '2026-10-21',
    accountId: '#P-302',
    accountName: 'Angsuran Pinjaman Anggota',
    memberId: '#2041',
    memberName: 'Siti Rahmawati',
    memberNIK: '3273031507900003',
    memberAccountNo: '0182-119-450',
    description: 'Pembayaran Angsuran Bulanan',
    amount: 750000,
    channel: 'Loket Kasir Tunai',
    isolationScore: 6,
    ruleScore: 0,
    finalScore: 4,
    status: 'Normal',
    decisionStatus: 'Dinyatakan Wajar',
    flagReasons: ['Jadwal tepat waktu reguler', 'Pola transaksi selaras dengan profil historis operasional'],
    parentAccountAnomalySensitive: false,
  });

  // 5. Normal Dues (Dewi Lestari)
  transactions.push({
    id: 'TRX-882130',
    timestamp: '22:38:00',
    fullDate: '2026-10-21',
    accountId: '#S-201',
    accountName: 'Simpanan Wajib & Sukarela',
    memberId: '#3310',
    memberName: 'Dewi Lestari',
    memberNIK: '3273052212940005',
    memberAccountNo: '0182-881-332',
    description: 'Simpanan Wajib & Sukarela',
    amount: 1000000,
    channel: 'Virtual Account',
    isolationScore: 4,
    ruleScore: 0,
    finalScore: 2,
    status: 'Normal',
    decisionStatus: 'Dinyatakan Wajar',
    flagReasons: ['Setoran melalui VA Bank Mandiri', 'Pola transaksi selaras dengan profil historis operasional'],
    parentAccountAnomalySensitive: false,
  });

  // 6. Round Number Critical Alert (Ratna Sari)
  transactions.push({
    id: 'TRX-882101',
    timestamp: '21:05:00',
    fullDate: '2026-10-21',
    accountId: '#B-101',
    accountName: 'Kas Utama Bank Mandiri',
    memberId: '#2102',
    memberName: 'Ratna Sari',
    memberNIK: '3273061803880002',
    memberAccountNo: '0182-553-912',
    description: 'Tarik Tunai Cek Giro',
    amount: 5000000,
    channel: 'Transfer Bank Mandiri',
    isolationScore: 82,
    ruleScore: 90,
    finalScore: 88,
    status: 'Segera verifikasi',
    decisionStatus: 'Menunggu Keputusan',
    flagReasons: [
      'Nominal bulat tepat Rp 5.000.000',
      'Pola repetitif penarikan tunai',
    ],
    parentAccountAnomalySensitive: false,
  });

  // Now generate remaining ~1,494 transactions across the 14 accounts
  // Target: total ~1,500 transactions, around 3% anomalies (~45 anomalies total)
  const remainingCount = 1494;
  const numAnomalies = Math.round(remainingCount * 0.03); // ~45

  // Pre-calculate anomaly indices
  const anomalyIndices = new Set<number>();
  while (anomalyIndices.size < numAnomalies) {
    anomalyIndices.add(Math.floor(Math.random() * remainingCount));
  }

  for (let i = 0; i < remainingCount; i++) {
    const isAnomaly = anomalyIndices.has(i);
    // Pick an account, with #K-104 getting healthy distribution of transactions
    const accountTemplate = INITIAL_ACCOUNTS[Math.floor(Math.random() * INITIAL_ACCOUNTS.length)];
    const member = MOCK_MEMBERS[Math.floor(Math.random() * MOCK_MEMBERS.length)];
    const channel = CHANNELS[Math.floor(Math.random() * CHANNELS.length)];

    const descList = DESCRIPTIONS[accountTemplate.id] || ['Pencatatan Transaksi Operasional', 'Setoran Buku Kas'];
    const description = descList[Math.floor(Math.random() * descList.length)];

    const isNight = isAnomaly && Math.random() < 0.6;
    const timeStr = randomTime(isNight);
    const amount = generateNaturalBenfordAmount(accountTemplate.id, isAnomaly);

    const trxId = `TRX-${(882000 - i).toString().padStart(6, '0')}`;

    // Temporary scores, will refine through isolation forest model
    transactions.push({
      id: trxId,
      timestamp: timeStr,
      fullDate: '2026-10-21',
      accountId: accountTemplate.id,
      accountName: accountTemplate.name,
      memberId: member.id,
      memberName: member.name,
      memberNIK: member.nik,
      memberAccountNo: member.accountNo,
      description,
      amount,
      channel,
      isolationScore: 10,
      ruleScore: 0,
      finalScore: 10,
      status: 'Normal',
      decisionStatus: 'Menunggu Keputusan',
      flagReasons: [],
      parentAccountAnomalySensitive: accountTemplate.id === '#K-104',
    });
  }

  // 1. Train Isolation Forest on transaction feature vectors
  // First calculate account averages and standard deviations
  const accountStats: Record<string, { avg: number; std: number }> = {};
  for (const acc of INITIAL_ACCOUNTS) {
    const accAmounts = transactions.filter(t => t.accountId === acc.id).map(t => t.amount);
    const avg = accAmounts.length ? accAmounts.reduce((a, b) => a + b, 0) / accAmounts.length : 1000000;
    const variance = accAmounts.length ? accAmounts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / accAmounts.length : 500000;
    accountStats[acc.id] = { avg, std: Math.sqrt(variance) };
  }

  const featureVectors: number[][] = transactions.map(t => {
    const stats = accountStats[t.accountId] || { avg: 1000000, std: 500000 };
    return extractFeatures(t.amount, t.timestamp, stats.avg, stats.std, 0);
  });

  const isolationForest = new IsolationForest(35, 128);
  isolationForest.fit(featureVectors);

  // 2. Score all transactions using Isolation Forest and Rules
  for (let idx = 0; idx < transactions.length; idx++) {
    const t = transactions[idx];
    // Keep our 6 hardcoded iconic anchor transactions fixed
    if (idx < 6) continue;

    const stats = accountStats[t.accountId] || { avg: 1000000, std: 500000 };
    const fVec = featureVectors[idx];
    const isoScore = isolationForest.score(fVec);

    const parentStatus = t.accountId === '#K-104' ? 'Anomali Kuat' : 'Wajar';
    const breakdown = calculateScores({
      amount: t.amount,
      timeStr: t.timestamp,
      accountAvgAmount: stats.avg,
      parentAccountStatus: parentStatus,
      burstFactor: fVec[3],
      isolationScore: isoScore,
    });

    t.isolationScore = breakdown.isolationScore;
    t.ruleScore = breakdown.ruleScore;
    t.finalScore = breakdown.finalScore;
    t.status = breakdown.status;
    t.flagReasons = breakdown.flagReasons;
    t.parentAccountAnomalySensitive = breakdown.isParentSensitive;

    if (t.status === 'Normal') {
      t.decisionStatus = 'Dinyatakan Wajar';
    } else {
      // randomly set some older ones as already decided
      t.decisionStatus = Math.random() < 0.25 ? 'Ditindaklanjuti' : 'Menunggu Keputusan';
    }
  }

  // 3. Build Account Summaries with Benford's Law
  const accounts: Account[] = INITIAL_ACCOUNTS.map(tmpl => {
    const accTrx = transactions.filter(t => t.accountId === tmpl.id);
    const amounts = accTrx.map(t => t.amount);
    const benford = calculateBenford(amounts, tmpl.isFixedAmount);

    return {
      ...tmpl,
      totalTrx: accTrx.length,
      mad: Number(benford.mad.toFixed(4)),
      actualDigitFrequencies: benford.digitFrequencies,
      actualDigitCounts: benford.digitCounts,
      status: benford.status,
      sampleValid: benford.totalValid >= 30,
    };
  });

  // Ensure #K-104 displays prominent Nigrini anomaly with MAD ~0.0384
  const k104 = accounts.find(a => a.id === '#K-104');
  if (k104) {
    k104.status = 'Anomali Kuat';
    if (k104.mad < 0.03) k104.mad = 0.0384;
  }

  // Ensure #P-302 and #K-109 show Mencurigakan, others Wajar (giving 11 healthy accounts out of 14)
  const p302 = accounts.find(a => a.id === '#P-302');
  if (p302) {
    p302.status = 'Mencurigakan';
    p302.mad = 0.0168;
  }
  const k109 = accounts.find(a => a.id === '#K-109');
  if (k109) {
    k109.status = 'Mencurigakan';
    k109.mad = 0.0159;
  }

  // Initial audit log entries
  const auditLogs: AuditLogEntry[] = [
    {
      id: 'AUD-001',
      timestamp: '23:51:10',
      actor: 'Sari Wulandari',
      role: 'Bendahara Utama',
      action: 'Buka Masking Nama & NIK',
      target: 'Anggota #0421 (Bpk. Hendro P.)',
      reason: 'Investigasi Penarikan Jam 23:47 (Skor Anomali 92)',
      verificationStatus: 'Disetujui PIN OTP',
      verified: true,
    },
    {
      id: 'AUD-002',
      timestamp: '21:14:02',
      actor: 'Ahmad Fauzi',
      role: 'Kasir Shift 2',
      action: 'Akses Buku Kasir Cabang Barat',
      target: 'Kas Operasional #K-109',
      reason: 'Rekonsiliasi Tutup Kas Harian',
      verificationStatus: 'Valid',
      verified: true,
    },
    {
      id: 'AUD-003',
      timestamp: '17:30:45',
      actor: 'Bambang Irawan',
      role: 'Ketua Pengawas',
      action: 'Unduh Laporan Benford',
      target: 'Akun Kas Operasional (#K-104)',
      reason: 'Persiapan Sidang Pengurus Bulanan',
      verificationStatus: 'Enkripsi PDF',
      verified: true,
    },
    {
      id: 'AUD-004',
      timestamp: '14:05:12',
      actor: 'Sistem AmanKas',
      role: 'AI Engine Daemon',
      action: 'Audit Algoritmik Benford',
      target: '1.248 Transaksi Buku Kas',
      reason: 'Pemindaian Rutin 24 Jam',
      verificationStatus: 'Sukses',
      verified: true,
    },
  ];

  // Initial Supervisor Notes
  const supervisorNotes: SupervisorNote[] = [
    {
      id: 'NOTE-01',
      date: '15 Des 2024',
      time: '14:30 WIB',
      title: 'Penetapan Verifikasi RAT',
      description: 'Ketua Pengawas Bambang I. dan Bendahara Sari W. menandatangani berkas integritas penutupan tahun buku.',
      isFinal: true,
      author: 'Bambang Irawan',
    },
    {
      id: 'NOTE-02',
      date: '08 Des 2024',
      time: '10:15 WIB',
      title: 'Audit Lapangan Kasir Barat',
      description: 'Pemeriksaan fisik brankas cabang barat menunjukkan saldo akurat Rp 42.500.000, SOP cut-off diperbarui.',
      author: 'Sari Wulandari',
    },
    {
      id: 'NOTE-03',
      date: '01 Des 2024',
      time: '09:00 WIB',
      title: 'Rekomendasi Pembaruan SOP Kasir',
      description: 'Penerapan verifikasi ganda (two-man rule) untuk penarikan tunai simpanan > Rp 20.000.000.',
      author: 'Bambang Irawan',
    },
  ];

  return { accounts, transactions, auditLogs, supervisorNotes, isolationForest };
}

/**
 * Generates a single new transaction for the live stream (every 3-6s).
 */
export function generateStreamingTransaction(
  accounts: Account[],
  isolationForest: IsolationForest
): Transaction {
  const isAnomaly = Math.random() < 0.15; // occasional anomaly in the live stream
  const account = accounts[Math.floor(Math.random() * accounts.length)];
  const member = MOCK_MEMBERS[Math.floor(Math.random() * MOCK_MEMBERS.length)];
  const channel = CHANNELS[Math.floor(Math.random() * CHANNELS.length)];
  const descList = DESCRIPTIONS[account.id] || ['Pencatatan Kas Masuk', 'Setoran Reguler Anggota'];
  const description = descList[Math.floor(Math.random() * descList.length)];

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  const amount = generateNaturalBenfordAmount(account.id, isAnomaly);

  const fVec = extractFeatures(amount, timeStr, 1500000, 750000, isAnomaly ? 0.8 : 0);
  const isoScore = isolationForest.score(fVec);

  const breakdown = calculateScores({
    amount,
    timeStr,
    accountAvgAmount: 1500000,
    parentAccountStatus: account.status,
    burstFactor: fVec[3],
    isolationScore: isoScore,
  });

  const randomId = Math.floor(100000 + Math.random() * 900000);

  return {
    id: `TRX-${randomId}`,
    timestamp: timeStr,
    fullDate: now.toISOString().split('T')[0],
    accountId: account.id,
    accountName: account.name,
    memberId: member.id,
    memberName: member.name,
    memberNIK: member.nik,
    memberAccountNo: member.accountNo,
    description,
    amount,
    channel,
    isolationScore: breakdown.isolationScore,
    ruleScore: breakdown.ruleScore,
    finalScore: breakdown.finalScore,
    status: breakdown.status,
    decisionStatus: 'Menunggu Keputusan',
    flagReasons: breakdown.flagReasons,
    parentAccountAnomalySensitive: breakdown.isParentSensitive,
    isNew: true,
  };
}
