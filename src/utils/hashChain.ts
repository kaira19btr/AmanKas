/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Log Audit Berantai Hash (Append-only, Tamper-evident)
 * Berdasarkan prinsip rantai kriptografis SHA-256 lokal:
 * - Setiap entri mengikat hash rekaman sebelumnya (prevHash) + payload isi data.
 * - Rantai hash mendeteksi perubahan (tamper-evident); tidak mencegahnya,
 *   dan hanya berlaku pada perangkat ini.
 * - TIDAK MENGGUNAKAN istilah 'immutable' karena penyimpanan lokal dapat dimodifikasi secara fisik.
 */

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

export interface HashAuditEntry {
  id: string; // e.g. "AUD-2026-001"
  timestamp: string; // e.g. "2026-10-25 14:30"
  actor: string; // e.g. "Pengawas · Sari W."
  role: string; // e.g. "Pengawas KSP"
  action: string; // e.g. "Verifikasi Bukti Dokumen"
  target: string; // e.g. "Trx KOP-2026-012"
  reason: string; // e.g. "Kwitansi fisik sah terunggah"
  prevHash?: string; // Hash dari entri sebelumnya
  hash?: string; // Hash SHA-256 dari entri ini
  verificationStatus?: string;
  verified?: boolean;
}

/**
 * Computes a SHA-256 digest in hex string format using browser native Web Crypto API.
 */
export async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback simple 64-char hash if subtle crypto is restricted
      return fallbackHash(text);
    }
  }
  return fallbackHash(text);
}

function fallbackHash(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return (part1 + part2).repeat(4);
}

/**
 * Formats canonical payload string for hashing an audit entry.
 */
export function getEntryPayloadString(
  prevHash: string,
  entry: {
    id?: string;
    timestamp?: string;
    actor?: string;
    role?: string;
    action?: string;
    target?: string;
    reason?: string;
  }
): string {
  return `${prevHash}|${entry.id || ''}|${entry.timestamp || ''}|${entry.actor || ''}|${entry.role || ''}|${entry.action || ''}|${entry.target || ''}|${entry.reason || ''}`;
}

/**
 * Creates and appends a new hash-chained audit log entry.
 */
export async function createChainedAuditEntry(
  prevEntry: HashAuditEntry | null,
  data: {
    id?: string;
    actor: string;
    role: string;
    action: string;
    target: string;
    reason: string;
  }
): Promise<HashAuditEntry> {
  const prevHash = (prevEntry && prevEntry.hash) ? prevEntry.hash : GENESIS_HASH;
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const id = data.id || `AUD-${now.getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

  const payload = getEntryPayloadString(prevHash, {
    id,
    timestamp,
    actor: data.actor,
    role: data.role,
    action: data.action,
    target: data.target,
    reason: data.reason,
  });

  const hash = await sha256Hex(payload);

  return {
    id,
    timestamp,
    actor: data.actor,
    role: data.role,
    action: data.action,
    target: data.target,
    reason: data.reason,
    prevHash,
    hash,
    verificationStatus: 'Utuh (Sah)',
  };
}

export interface ChainVerificationResult {
  isChainValid: boolean;
  isValid: boolean;
  brokenIndex: number | null;
  brokenAtIndex: number | null;
  message: string;
  verifiedCount: number;
  expectedHash?: string;
  actualHash?: string;
}

/**
 * Verifies the integrity of the audit log hash chain.
 * Re-computes SHA-256 for each entry starting from genesis to the head.
 */
export async function verifyAuditChain(entries: HashAuditEntry[]): Promise<ChainVerificationResult> {
  if (!entries || entries.length === 0) {
    return {
      isChainValid: true,
      isValid: true,
      brokenIndex: null,
      brokenAtIndex: null,
      message: 'Log audit kosong. Rantai awal sah.',
      verifiedCount: 0,
    };
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expectedPrevHash = i === 0 ? GENESIS_HASH : entries[i - 1].hash || GENESIS_HASH;

    // 1. Check prevHash linkage
    if (entry.prevHash !== expectedPrevHash) {
      return {
        isChainValid: false,
        isValid: false,
        brokenIndex: i,
        brokenAtIndex: i,
        message: `Rantai terputus pada entri #${i + 1} (${entry.id}): Tautan prevHash tidak cocok dengan hash entri sebelumnya.`,
        verifiedCount: i,
        expectedHash: expectedPrevHash,
        actualHash: entry.prevHash,
      };
    }

    // 2. Re-compute current hash
    const payload = getEntryPayloadString(expectedPrevHash, entry);
    const recalculatedHash = await sha256Hex(payload);

    if (recalculatedHash !== entry.hash) {
      return {
        isChainValid: false,
        isValid: false,
        brokenIndex: i,
        brokenAtIndex: i,
        message: `Integritas rusak pada entri #${i + 1} (${entry.id}): Isi rekaman telah dimodifikasi (tampered). Hash tidak cocok.`,
        verifiedCount: i,
        expectedHash: recalculatedHash,
        actualHash: entry.hash,
      };
    }
  }

  return {
    isChainValid: true,
    isValid: true,
    brokenIndex: null,
    brokenAtIndex: null,
    message: `Rantai log audit utuh. Seluruh ${entries.length} rekaman terverifikasi sah melalui rantai hash SHA-256.`,
    verifiedCount: entries.length,
  };
}

/**
 * Simulates tampering on a clone of the audit log to demonstrate tamper-evident detection.
 * Modifies the action/reason of an entry without recalculating the cryptographic chain.
 */
export function simulateTamperOnChain(
  entries: HashAuditEntry[],
  targetIndex: number = 0
): HashAuditEntry[] {
  if (!entries || entries.length === 0) return [];
  const cloned = JSON.parse(JSON.stringify(entries)) as HashAuditEntry[];
  const idx = Math.min(Math.max(0, targetIndex), cloned.length - 1);
  const target = cloned[idx];

  // Tamper text payload secretly
  target.action = `${target.action} [DIREKAYASA SECARA ILEGAL]`;
  target.reason = 'Catatan diubah secara sepihak di database tanpa pembaruan hash kriptografis';
  target.verificationStatus = 'Dimodifikasi';

  return cloned;
}

export async function generateInitialChainedAuditLogs(rawLogs?: any[]): Promise<HashAuditEntry[]> {
  const seedDefs = (rawLogs && rawLogs.length > 0)
    ? rawLogs.map((l) => ({
        id: l.id,
        actor: l.actor,
        role: l.role || 'Pengawas',
        action: l.action,
        target: l.target,
        reason: l.reason,
      }))
    : [
    {
      id: 'AUD-2026-001',
      actor: 'Sistem Ingestion SADAR',
      role: 'Sistem Otomatis',
      action: 'Impor & Hashing CSV Buku Kas',
      target: 'Buku Kas & Simpan Pinjam Oktober 2026',
      reason: 'Inisialisasi dataset operasional kedaulatan lokal',
    },
    {
      id: 'AUD-2026-002',
      actor: 'Pengawas · Sari W.',
      role: 'Pengawas Senior KSP',
      action: 'Penetapan Ambang Adaptif P90 & P98',
      target: 'Konfigurasi Mesin Analisis KSP',
      reason: 'Penyesuaian ambang risiko sesuai distribusi empiris',
    },
    {
      id: 'AUD-2026-003',
      actor: 'Pengawas · Sari W.',
      role: 'Pengawas Senior KSP',
      action: 'Pemberian Catatan Klarifikasi Pihak Terkait',
      target: 'Trx KOP-2026-001 (#PJ-301 Pinjaman Anggota)',
      reason: 'Pencatatan hak klarifikasi pengurus sebelum pembahasan RAT',
    },
    {
      id: 'AUD-2026-004',
      actor: 'Pengurus · Budi Santoso',
      role: 'Ketua Pengurus KSP',
      action: 'Persetujuan Unggah Berkas RAT Agregat',
      target: 'Laporan Agregat Risiko Sidang RAT 2026',
      reason: 'Kepatuhan transparansi rapat anggota tahunan tanpa membuka identitas',
    },
  ];

  const results: HashAuditEntry[] = [];
  let prevEntry: HashAuditEntry | null = null;

  for (const def of seedDefs) {
    const entry = await createChainedAuditEntry(prevEntry, def);
    results.push(entry);
    prevEntry = entry;
  }

  return results;
}

/**
 * Appends a new audit log entry with SHA-256 hash chaining to an existing chain.
 */
export async function appendAuditLogWithHash(
  currentChain: HashAuditEntry[],
  newEntryData: {
    id?: string;
    timestamp?: string;
    actor: string;
    role: string;
    action: string;
    target: string;
    reason: string;
    verificationStatus?: any;
    verified?: boolean;
  }
): Promise<HashAuditEntry[]> {
  const lastEntry = currentChain.length > 0 ? currentChain[0] : null;
  const chained = await createChainedAuditEntry(lastEntry, newEntryData);
  return [chained, ...currentChain];
}
