/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Account,
  KoperasiTransaction,
  UmkmTransaction,
  CashReconciliationRecord,
  AuditLogEntry,
  KoperasiUnit,
  KoperasiAccountType,
  UmkmTransactionType,
  UmkmPaymentMethod,
} from '../types';
import { calculateBenford } from './benford';

// -------------------------------------------------------------
// 1. KOPERASI DATASET GENERATION
// -------------------------------------------------------------
export const KOPERASI_ACCOUNTS_SEED: Array<{
  id: string;
  name: KoperasiAccountType;
  description: string;
  isFixedAmount: boolean;
  notes: string;
}> = [
  {
    id: '#SP-101',
    name: 'Simpanan Pokok',
    description: 'Setoran Awal Masuk Keanggotaan KSP',
    isFixedAmount: true,
    notes: 'Nominal seragam per anggota Rp 500.000 saat pendaftaran. Pengecualian Benford aktif.',
  },
  {
    id: '#SW-102',
    name: 'Simpanan Wajib',
    description: 'Iuran Wajib Bulanan Anggota KSP',
    isFixedAmount: true,
    notes: 'Iuran rutin Rp 100.000 per bulan per anggota aktif.',
  },
  {
    id: '#SS-201',
    name: 'Simpanan Sukarela',
    description: 'Simpanan Tabungan Bebas Setor & Tarik',
    isFixedAmount: false,
    notes: 'Akun tabungan harian anggota dengan variasi nominal bebas.',
  },
  {
    id: '#PJ-301',
    name: 'Pinjaman Anggota',
    description: 'Penyaluran Pembiayaan & Kredit Anggota',
    isFixedAmount: false,
    notes: 'Penyaluran pinjaman modal kerja, konsumtif, dan darurat anggota.',
  },
  {
    id: '#AP-401',
    name: 'Angsuran Pinjaman',
    description: 'Pengembalian Pokok & Jasa Pinjaman',
    isFixedAmount: false,
    notes: 'Pembayaran cicilan berkala dari anggota peminjam.',
  },
  {
    id: '#KO-104',
    name: 'Kas Operasional',
    description: 'Buku Kas Tunai Teller & Brankas Kantor',
    isFixedAmount: false,
    notes: 'Kas likuid harian di loket teller cabang koperasi.',
  },
  {
    id: '#BO-501',
    name: 'Biaya Operasional',
    description: 'Beban Listrik, ATK, Honor & Perjalanan Dinas',
    isFixedAmount: false,
    notes: 'Pengeluaran beban operasional berkala pengurus dan manajemen.',
  },
];

const KOPERASI_MEMBERS = [
  { id: 'ANG-7F3A', name: 'Hendro Prayogo', masked: 'Hendro P***', isPihakTerkait: true, roleLabel: 'Pengurus' as const },
  { id: 'ANG-4D12', name: 'Nurhasanah Dewi', masked: 'Nurhasanah D***', isPihakTerkait: false },
  { id: 'ANG-9B21', name: 'Ahmad Fauzi', masked: 'Ahmad F***', isPihakTerkait: false },
  { id: 'ANG-3C88', name: 'Siti Rahmawati', masked: 'Siti R***', isPihakTerkait: true, roleLabel: 'Pengawas' as const },
  { id: 'ANG-1E05', name: 'Dewi Lestari', masked: 'Dewi L***', isPihakTerkait: false },
  { id: 'ANG-8A44', name: 'Ratna Sari (Kerabat)', masked: 'Ratna S***', isPihakTerkait: true, roleLabel: 'Afiliasi Keluarga' as const },
  { id: 'ANG-5F79', name: 'Joko Susanto', masked: 'Joko S***', isPihakTerkait: false },
  { id: 'ANG-2D60', name: 'Sri Wahyuni', masked: 'Sri W***', isPihakTerkait: false },
  { id: 'ANG-6B18', name: 'Bambang Kusuma', masked: 'Bambang K***', isPihakTerkait: false },
  { id: 'ANG-7A92', name: 'Eko Prasetyo', masked: 'Eko P***', isPihakTerkait: false },
];

const UNITS: KoperasiUnit[] = ['Cabang Utama', 'Cabang Barat', 'Cabang Timur'];

export function generateKoperasiInitialData() {
  const transactions: KoperasiTransaction[] = [];
  const baseDate = '2026-10-25';

  // Seed 48 realistic Koperasi transactions
  const seedConfigs = [
    // Pihak terkait loan outlier
    {
      id: 'KOP-2026-001',
      tanggal: `${baseDate} 19:45`,
      jam: '19:45',
      akun: 'Pinjaman Anggota' as KoperasiAccountType,
      accountId: '#PJ-301',
      member: KOPERASI_MEMBERS[0], // Hendro (Pengurus)
      jenisTransaksi: 'Pinjaman' as const,
      nominal: 85000000,
      petugas: 'Kredit-01 (Budi)',
      unit: 'Cabang Utama' as KoperasiUnit,
      statusDokumen: 'Tidak Ada' as const,
      isPihakTerkait: true,
      pihakTerkaitLabel: 'Pengurus' as const,
      selisihPolaAnggota: '+380% terhadap rata-rata pinjaman anggota umum (Rp 17,5 jt)',
      assignedSupervisor: 'Pengawas · Sari W.',
      ruleScore: 78,
      isolationScore: 88,
      finalScore: 83,
      status: 'Prioritas tinggi' as const,
      decisionStatus: 'Menunggu Keputusan' as const,
      flagReasons: [
        'Transaksi pihak terkait (Pengurus KSP) dengan nominal sangat signifikan',
        'Penyaluran di luar jam pelayanan kantor kas (19:45 WIB)',
        'Status dokumen pendukung (agunan/perjanjian) belum terlampir',
      ],
      catatan: 'Perlu konfirmasi persetujuan Rapat Pengurus dan kelengkapan berkas fisik jaminan.',
    },
    // Related party loan (Pengawas Siti)
    {
      id: 'KOP-2026-002',
      tanggal: `${baseDate} 14:10`,
      jam: '14:10',
      akun: 'Pinjaman Anggota' as KoperasiAccountType,
      accountId: '#PJ-301',
      member: KOPERASI_MEMBERS[3], // Siti (Pengawas)
      jenisTransaksi: 'Pinjaman' as const,
      nominal: 45000000,
      petugas: 'Kredit-02 (Rian)',
      unit: 'Cabang Barat' as KoperasiUnit,
      statusDokumen: 'Menunggu Verifikasi' as const,
      isPihakTerkait: true,
      pihakTerkaitLabel: 'Pengawas' as const,
      selisihPolaAnggota: '+157% terhadap plafon standar cabang barat',
      assignedSupervisor: 'Pengawas · Sari W.',
      ruleScore: 45,
      isolationScore: 55,
      finalScore: 50,
      status: 'Perlu ditinjau' as const,
      decisionStatus: 'Menunggu Keputusan' as const,
      flagReasons: [
        'Transaksi melibatkan jajaran Pengawas (hipotesis kerja benturan kepentingan)',
        'Verifikasi dokumen nota persetujuan belum final',
      ],
      catatan: 'Pemeriksaan berkas komite kredit cabang barat.',
    },
    // Related party family member
    {
      id: 'KOP-2026-003',
      tanggal: `${baseDate} 11:20`,
      jam: '11:20',
      akun: 'Pinjaman Anggota' as KoperasiAccountType,
      accountId: '#PJ-301',
      member: KOPERASI_MEMBERS[5], // Ratna (Afiliasi)
      jenisTransaksi: 'Pinjaman' as const,
      nominal: 60000000,
      petugas: 'Kredit-01 (Budi)',
      unit: 'Cabang Utama' as KoperasiUnit,
      statusDokumen: 'Lengkap' as const,
      isPihakTerkait: true,
      pihakTerkaitLabel: 'Afiliasi Keluarga' as const,
      selisihPolaAnggota: '+240% terhadap median tenor pinjaman',
      assignedSupervisor: 'Pengawas · Budi H.',
      ruleScore: 40,
      isolationScore: 60,
      finalScore: 50,
      status: 'Perlu ditinjau' as const,
      decisionStatus: 'Menunggu Keputusan' as const,
      flagReasons: [
        'Pihak terafiliasi dengan bendahara koperasi',
        'Plafon pinjaman melampaui batas kewenangan kantor unit',
      ],
      catatan: 'Dokumen legalitas ada, menunggu telaah komite audit internal.',
    },
    // Biaya Operasional without document
    {
      id: 'KOP-2026-004',
      tanggal: `${baseDate} 16:30`,
      jam: '16:30',
      akun: 'Biaya Operasional' as KoperasiAccountType,
      accountId: '#BO-501',
      member: KOPERASI_MEMBERS[0],
      jenisTransaksi: 'Kas Keluar' as const,
      nominal: 18500000,
      petugas: 'Kasir-01 (Dewi)',
      unit: 'Cabang Timur' as KoperasiUnit,
      statusDokumen: 'Tidak Ada' as const,
      isPihakTerkait: false,
      assignedSupervisor: 'Pengawas · Sari W.',
      ruleScore: 65,
      isolationScore: 70,
      finalScore: 67,
      status: 'Prioritas tinggi' as const,
      decisionStatus: 'Menunggu Keputusan' as const,
      flagReasons: [
        'Pengeluaran kas operasional > Rp 15 jt tanpa kwitansi/faktur fisik',
        'Lonjakan beban kas kantor cabang timur di luar tren mingguan',
      ],
      catatan: 'Kuitansi asli belum diserahkan ke kasir pusat.',
    },
    // Routine deposit (Wajar)
    {
      id: 'KOP-2026-005',
      tanggal: `${baseDate} 10:15`,
      jam: '10:15',
      akun: 'Simpanan Sukarela' as KoperasiAccountType,
      accountId: '#SS-201',
      member: KOPERASI_MEMBERS[1],
      jenisTransaksi: 'Simpanan' as const,
      nominal: 2500000,
      petugas: 'Teller-02 (Santi)',
      unit: 'Cabang Utama' as KoperasiUnit,
      statusDokumen: 'Lengkap' as const,
      isPihakTerkait: false,
      ruleScore: 10,
      isolationScore: 12,
      finalScore: 11,
      status: 'Normal' as const,
      decisionStatus: 'Wajar' as const,
      flagReasons: [],
      decisionTime: '10:30',
      decisionBy: 'Pengawas · Sari W.',
      catatan: 'Setoran rutin anggota kelompok tani binaan.',
    },
  ];

  // Fill in seed items
  for (const s of seedConfigs) {
    transactions.push({
      id: s.id,
      tanggal: s.tanggal,
      jam: s.jam,
      akun: s.akun,
      accountId: s.accountId,
      idAnggotaPseudonim: s.member.id,
      namaAnggotaMasked: s.member.masked,
      jenisTransaksi: s.jenisTransaksi,
      nominal: s.nominal,
      petugas: s.petugas,
      unit: s.unit,
      statusDokumen: s.statusDokumen,
      isPihakTerkait: s.isPihakTerkait,
      pihakTerkaitLabel: s.pihakTerkaitLabel,
      selisihPolaAnggota: s.selisihPolaAnggota,
      assignedSupervisor: s.assignedSupervisor,
      ruleScore: s.ruleScore,
      isolationScore: s.isolationScore,
      finalScore: s.finalScore,
      status: s.status,
      decisionStatus: s.decisionStatus,
      flagReasons: s.flagReasons,
      catatan: s.catatan,
      decisionTime: s.decisionTime,
      decisionBy: s.decisionBy,
    });
  }

  // Generate 45 additional realistic routine transactions across the 7 Koperasi accounts
  const additionalAccounts: KoperasiAccountType[] = [
    'Simpanan Pokok',
    'Simpanan Wajib',
    'Simpanan Sukarela',
    'Pinjaman Anggota',
    'Angsuran Pinjaman',
    'Kas Operasional',
    'Biaya Operasional',
  ];

  for (let i = 6; i <= 50; i++) {
    const acc = additionalAccounts[i % additionalAccounts.length];
    const unit = UNITS[i % UNITS.length];
    const member = KOPERASI_MEMBERS[i % KOPERASI_MEMBERS.length];
    const hour = 8 + (i % 8);
    const minute = (i * 7) % 60;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    let nominal = 500000;
    let jenis: 'Simpanan' | 'Pinjaman' | 'Angsuran' | 'Kas Masuk' | 'Kas Keluar' | 'Biaya' = 'Simpanan';
    let statusDokumen: 'Lengkap' | 'Tidak Ada' | 'Menunggu Verifikasi' = 'Lengkap';
    let isPihak = member.isPihakTerkait;

    if (acc === 'Simpanan Pokok') {
      nominal = 500000;
      jenis = 'Simpanan';
    } else if (acc === 'Simpanan Wajib') {
      nominal = 100000;
      jenis = 'Simpanan';
    } else if (acc === 'Simpanan Sukarela') {
      nominal = 250000 + (i * 150000) % 3500000;
      jenis = 'Simpanan';
    } else if (acc === 'Pinjaman Anggota') {
      nominal = 5000000 + (i * 2500000) % 25000000;
      jenis = 'Pinjaman';
      statusDokumen = i % 5 === 0 ? 'Menunggu Verifikasi' : 'Lengkap';
    } else if (acc === 'Angsuran Pinjaman') {
      nominal = 650000 + (i * 120000) % 2000000;
      jenis = 'Angsuran';
    } else if (acc === 'Kas Operasional') {
      nominal = 1200000 + (i * 350000) % 4500000;
      jenis = i % 2 === 0 ? 'Kas Masuk' : 'Kas Keluar';
    } else {
      nominal = 350000 + (i * 250000) % 2500000;
      jenis = 'Biaya';
    }

    const isAnomalous = i === 12 || i === 27;
    const finalScore = isAnomalous ? 72 : Math.max(5, (i * 3) % 35);
    const status = isAnomalous ? 'Prioritas tinggi' : finalScore > 30 ? 'Perlu ditinjau' : 'Normal';

    transactions.push({
      id: `KOP-2026-${i.toString().padStart(3, '0')}`,
      tanggal: `${baseDate} ${timeStr}`,
      jam: timeStr,
      akun: acc,
      accountId: KOPERASI_ACCOUNTS_SEED.find((a) => a.name === acc)?.id || '#KO-104',
      idAnggotaPseudonim: member.id,
      namaAnggotaMasked: member.masked,
      jenisTransaksi: jenis,
      nominal: nominal,
      petugas: `Teller-0${(i % 3) + 1}`,
      unit: unit,
      statusDokumen: statusDokumen,
      isPihakTerkait: isPihak,
      pihakTerkaitLabel: member.roleLabel,
      selisihPolaAnggota: isPihak ? `+${(i * 17) % 180}% variasi transaksi rutin` : undefined,
      assignedSupervisor: isAnomalous ? 'Pengawas · Sari W.' : undefined,
      ruleScore: isAnomalous ? 65 : finalScore,
      isolationScore: isAnomalous ? 75 : finalScore - 5,
      finalScore: finalScore,
      status: status,
      decisionStatus: isAnomalous ? 'Menunggu Keputusan' : 'Wajar',
      flagReasons: isAnomalous
        ? ['Selisih nominal di atas batas toleransi harian', 'Tinjauan sampel uji pengendalian internal']
        : [],
    });
  }

  // Build Koperasi Accounts with Benford metrics
  const accounts: Account[] = KOPERASI_ACCOUNTS_SEED.map((seed) => {
    const accTrx = transactions.filter((t) => t.akun === seed.name);
    const amounts = accTrx.map((t) => t.nominal);
    const benfordRes = calculateBenford(amounts, seed.isFixedAmount, 20);

    return {
      id: seed.id,
      name: seed.name,
      description: seed.description,
      isFixedAmount: seed.isFixedAmount,
      totalTrx: Math.max(accTrx.length, 320), // Cooperative books have established historical volume
      mad: Number(benfordRes.mad.toFixed(4)),
      chiSquare: Number(benfordRes.chiSquare.toFixed(2)),
      status: seed.isFixedAmount
        ? 'Dikecualikan (Nominal Tetap)'
        : benfordRes.mad > 0.015
        ? 'Kuning'
        : 'Hijau',
      sampleValid: true,
      actualDigitCounts: benfordRes.digitCounts,
      actualDigitFrequencies: benfordRes.digitFrequencies,
      medianAmount: amounts.length > 0 ? amounts[Math.floor(amounts.length / 2)] : 1500000,
      medianIntervalMin: 35,
      notes: seed.notes,
    };
  });

  const auditLogs: AuditLogEntry[] = [
    {
      id: 'AUD-KOP-001',
      timestamp: '09:15:20',
      actor: 'Pengawas · Sari W.',
      role: 'Pengawas',
      action: 'Peninjauan Indikator Risiko Pihak Terkait: KOP-2026-001',
      target: 'KOP-2026-001 (#PJ-301 Pinjaman Anggota)',
      reason: 'Permintaan berkas dokumen perjanjian kredit pengurus ke komite pengawas',
      verificationStatus: 'Tercatat Resmi',
      verified: true,
    },
    {
      id: 'AUD-KOP-002',
      timestamp: '08:00:00',
      actor: 'Sistem SADAR',
      role: 'Pengawas',
      action: 'Sinkronisasi Buku Kas Harian KSP Cabang Utama, Barat, Timur',
      target: 'Buku Kas & Simpan Pinjam CSV',
      reason: 'Verifikasi kepatuhan transaksi harian',
      verificationStatus: 'Tervalidasi',
      verified: true,
    },
  ];

  return { accounts, transactions, auditLogs };
}

// -------------------------------------------------------------
// 2. UMKM DATASET GENERATION
// -------------------------------------------------------------
export function generateUmkmInitialData() {
  const transactions: UmkmTransaction[] = [];
  const baseDate = '2026-10-25';

  const seedTrx: Array<Omit<UmkmTransaction, 'finalScore'> & { finalScore?: number }> = [
    // 1. Repeated void red flag
    {
      id: 'UMK-2026-001',
      tanggalJam: `${baseDate} 13:42`,
      jam: '13:42',
      tanggal: baseDate,
      jenis: 'void',
      nominal: 245000,
      metode: 'tunai',
      kasirShift: 'Kasir-01 (Shift 1)',
      kasirPseudonim: 'KASIR-01',
      adaStruk: false,
      tagPribadi: false,
      deskripsi: 'Pembatalan transaksi nota #N-8812 (Sembako paket besar)',
      ruleScore: 85,
      isolationScore: 78,
      volumeCukup: false, // UMKM has low daily volume; Red Flag is primary layer!
      status: 'Prioritas tinggi',
      decisionStatus: 'Menunggu Keputusan',
      flagReasons: [
        'Void berulang pada kasir yang sama (3x dalam 1 shift)',
        'Pembatalan transaksi tunai tanpa struk fisik tersimpan di laci',
      ],
      catatan: 'Periksa rekaman CCTV meja kasir laci kas.',
    },
    // 2. Out of hours discount/void
    {
      id: 'UMK-2026-002',
      tanggalJam: `${baseDate} 22:50`,
      jam: '22:50',
      tanggal: baseDate,
      jenis: 'diskon',
      nominal: 180000,
      metode: 'tunai',
      kasirShift: 'Kasir-02 (Shift 2)',
      kasirPseudonim: 'KASIR-02',
      adaStruk: true,
      tagPribadi: false,
      deskripsi: 'Diskon manual 50% di luar jam buka warung/toko',
      ruleScore: 75,
      isolationScore: 70,
      volumeCukup: false,
      status: 'Prioritas tinggi',
      decisionStatus: 'Menunggu Keputusan',
      flagReasons: [
        'Diskon manual diberikan pukul 22:50 (toko tutup pukul 21:00)',
        'Nominal diskon melebihi batas wewenang kasir standar (Rp 50.000)',
      ],
      catatan: 'Tanyakan ke staf kasir shift malam mengenai alasan diskon.',
    },
    // 3. Personal expense mixed in business QRIS/account
    {
      id: 'UMK-2026-003',
      tanggalJam: `${baseDate} 15:30`,
      jam: '15:30',
      tanggal: baseDate,
      jenis: 'pribadi',
      nominal: 1250000,
      metode: 'transfer',
      kasirShift: 'Kasir-01 (Shift 1)',
      kasirPseudonim: 'OWNER-01',
      adaStruk: true,
      tagPribadi: true,
      kategoriPribadi: 'Belanja Bulanan Supermarket Rumah Tangga',
      dipisahkanDariUsaha: false,
      deskripsi: 'Pembayaran Debit Bank BRI Merchant Toko di Supermarket Megamart',
      ruleScore: 80,
      isolationScore: 65,
      volumeCukup: false,
      status: 'Perlu ditinjau',
      decisionStatus: 'Menunggu Keputusan',
      flagReasons: [
        'Transaksi pribadi tercampur pada rekening bank operasional usaha',
        'Potensi distorsi laporan laba kotor toko dan arus kas bersih',
      ],
      catatan: 'Gunakan tombol "Pisahkan" agar tidak masuk perhitungan beban toko.',
    },
    // 4. Large cash transaction without receipt
    {
      id: 'UMK-2026-004',
      tanggalJam: `${baseDate} 17:15`,
      jam: '17:15',
      tanggal: baseDate,
      jenis: 'penjualan',
      nominal: 3500000,
      metode: 'tunai',
      kasirShift: 'Kasir-02 (Shift 2)',
      kasirPseudonim: 'KASIR-02',
      adaStruk: false,
      tagPribadi: false,
      deskripsi: 'Penjualan partai sembako tunai tanpa cetak struk POS',
      ruleScore: 70,
      isolationScore: 60,
      volumeCukup: false,
      status: 'Perlu ditinjau',
      decisionStatus: 'Menunggu Keputusan',
      flagReasons: [
        'Transaksi tunai nominal besar (Rp 3,5 jt) tanpa cetak struk sistem POS',
        'Risiko uang tidak masuk laci kas fisik secara tercatat',
      ],
      catatan: 'Cek kesesuaian fisik stok beras dan minyak di gudang.',
    },
    // 5. Normal QRIS sales
    {
      id: 'UMK-2026-005',
      tanggalJam: `${baseDate} 11:15`,
      jam: '11:15',
      tanggal: baseDate,
      jenis: 'penjualan',
      nominal: 125000,
      metode: 'qris',
      kasirShift: 'Kasir-01 (Shift 1)',
      kasirPseudonim: 'KASIR-01',
      adaStruk: true,
      tagPribadi: false,
      deskripsi: 'Pembelian makanan & minuman pelanggan via QRIS Dinamis',
      ruleScore: 5,
      isolationScore: 5,
      volumeCukup: false,
      status: 'Normal',
      decisionStatus: 'Wajar',
      flagReasons: [],
      decisionTime: '11:20',
      decisionBy: 'Pemilik · Warung Fiktif Bu Rina',
    },
    // 6. Another personal mixing item
    {
      id: 'UMK-2026-006',
      tanggalJam: `${baseDate} 08:30`,
      jam: '08:30',
      tanggal: baseDate,
      jenis: 'pribadi',
      nominal: 450000,
      metode: 'qris',
      kasirShift: 'Kasir-01 (Shift 1)',
      kasirPseudonim: 'OWNER-01',
      adaStruk: true,
      tagPribadi: true,
      kategoriPribadi: 'Servis Sepeda Motor Pribadi di Bengkel',
      dipisahkanDariUsaha: false,
      deskripsi: 'QRIS Usaha Toko dipakai untuk bayar montir servis motor pribadi',
      ruleScore: 75,
      isolationScore: 60,
      volumeCukup: false,
      status: 'Perlu ditinjau',
      decisionStatus: 'Menunggu Keputusan',
      flagReasons: [
        'Pencampuran pengeluaran pribadi kendaraan keluarga ke akun usaha',
      ],
      catatan: 'Disarankan dipisahkan dari pencatatan pembukuan toko.',
    },
  ];

  seedTrx.forEach((item) => {
    transactions.push({
      ...item,
      finalScore: item.finalScore ?? Math.round(item.ruleScore * 0.8 + (item.isolationScore || 50) * 0.2),
    });
  });

  // Additional 40 routine POS transactions
  const kinds: UmkmTransactionType[] = ['penjualan', 'penjualan', 'penjualan', 'pengeluaran', 'setoran', 'diskon'];
  const methods: UmkmPaymentMethod[] = ['tunai', 'qris', 'transfer', 'qris'];

  for (let i = 7; i <= 45; i++) {
    const k = kinds[i % kinds.length];
    const m = methods[i % methods.length];
    const shift = i % 2 === 0 ? 'Kasir-01 (Shift 1)' : 'Kasir-02 (Shift 2)';
    const hour = 8 + (i % 12);
    const min = (i * 11) % 60;
    const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    const nominal = k === 'pengeluaran' ? 75000 + (i * 25000) % 400000 : 35000 + (i * 18000) % 650000;

    const isFlagged = i === 14 || i === 29;
    const ruleScore = isFlagged ? 65 : Math.max(5, (i * 2) % 25);
    const finalScore = isFlagged ? 68 : Math.max(5, ruleScore);

    transactions.push({
      id: `UMK-2026-${i.toString().padStart(3, '0')}`,
      tanggalJam: `${baseDate} ${timeStr}`,
      jam: timeStr,
      tanggal: baseDate,
      jenis: k,
      nominal: nominal,
      metode: m,
      kasirShift: shift,
      kasirPseudonim: shift.startsWith('Kasir-01') ? 'KASIR-01' : 'KASIR-02',
      adaStruk: i % 4 !== 0,
      tagPribadi: false,
      deskripsi:
        k === 'penjualan'
          ? `Penjualan retail barang toko #${i}`
          : k === 'pengeluaran'
          ? `Beli kantong kresek & es batu toko #${i}`
          : `Setoran kasir #${i}`,
      ruleScore: ruleScore,
      isolationScore: 20,
      finalScore: finalScore,
      volumeCukup: false, // Low sample badge ("Volume belum cukup")
      status: isFlagged ? 'Prioritas tinggi' : 'Normal',
      decisionStatus: isFlagged ? 'Menunggu Keputusan' : 'Wajar',
      flagReasons: isFlagged ? ['Transaksi tanpa struk pada jam sibuk'] : [],
    });
  }

  // Daily Cash Reconciliation records (Sistem vs Kas Fisik Laci)
  const cashReconciliations: CashReconciliationRecord[] = [
    {
      id: 'REK-01',
      tanggal: '2026-10-25',
      shift: 'Shift 1 (08:00 - 15:00)',
      kasir: 'Kasir-01 (Dina)',
      kasSistem: 4850000,
      kasFisikInput: 4780000,
      selisih: -70000,
      status: 'Kurang',
      catatan: 'Selisih kurang Rp 70.000 saat serah terima uang kembalian receh.',
      waktuInput: '15:10',
    },
    {
      id: 'REK-02',
      tanggal: '2026-10-24',
      shift: 'Shift 2 (15:00 - 22:00)',
      kasir: 'Kasir-02 (Rian)',
      kasSistem: 5210000,
      kasFisikInput: 5210000,
      selisih: 0,
      status: 'Sesuai',
      catatan: 'Kas laci fisik pas dengan rekap struk penjualan POS.',
      waktuInput: '22:15',
    },
    {
      id: 'REK-03',
      tanggal: '2026-10-24',
      shift: 'Shift 1 (08:00 - 15:00)',
      kasir: 'Kasir-01 (Dina)',
      kasSistem: 4120000,
      kasFisikInput: 4145000,
      selisih: 25000,
      status: 'Lebih',
      catatan: 'Ada tip kembalian yang tidak diambil pembeli.',
      waktuInput: '15:05',
    },
  ];

  const auditLogs: AuditLogEntry[] = [
    {
      id: 'AUD-UMK-001',
      timestamp: '14:00:12',
      actor: 'Pemilik · Warung Fiktif Bu Rina',
      role: 'Pemilik UMKM',
      action: 'Pemisahan Transaksi Pribadi: UMK-2026-003',
      target: 'UMK-2026-003 (Belanja Megamart Rp 1.250.000)',
      reason: 'Dikeluarkan dari buku kas usaha toko agar laba bersih akurat',
      verificationStatus: 'Tercatat di Log Pribadi',
      verified: true,
    },
  ];

  return { transactions, cashReconciliations, auditLogs };
}
