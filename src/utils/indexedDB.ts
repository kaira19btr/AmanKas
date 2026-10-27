/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Local-First IndexedDB Storage Utility for SADAR
 *
 * All financial transactions, owner decisions, audit logs, and settings
 * are stored strictly inside the user's browser client storage.
 * NO FINANCIAL DATA IS EVER SENT OUTSIDE THE DEVICE.
 */

const DB_NAME = 'sadar_offline_db';
const DB_VERSION = 1;

export const STORES = {
  KOPERASI_TRX: 'koperasi_transactions',
  UMKM_TRX: 'umkm_transactions',
  AUDIT_LOGS: 'audit_logs',
  UMKM_RECONCILIATION: 'umkm_reconciliations',
  SETTINGS: 'app_settings',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not available in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves an array of items to a specific store.
 */
export async function saveToIndexedDB<T extends { id: string }>(
  storeName: StoreName,
  items: T[]
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    // Clear existing to sync fresh state
    store.clear();

    for (const item of items) {
      store.put(item);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`[SADAR IndexedDB] Failed to save to ${storeName}:`, err);
  }
}

/**
 * Loads all items from a specific store.
 */
export async function loadFromIndexedDB<T>(storeName: StoreName): Promise<T[] | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result as T[];
        resolve(result && result.length > 0 ? result : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[SADAR IndexedDB] Failed to load from ${storeName}:`, err);
    return null;
  }
}

/**
 * Saves a single key-value preference or setting.
 */
export async function saveSetting(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.SETTINGS, 'readwrite');
    const store = tx.objectStore(STORES.SETTINGS);
    store.put({ id: key, value });
  } catch (err) {
    console.warn(`[SADAR IndexedDB] Failed to save setting ${key}:`, err);
  }
}

/**
 * Loads a single key-value preference or setting.
 */
export async function loadSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.SETTINGS, 'readonly');
    const store = tx.objectStore(STORES.SETTINGS);
    const request = store.get(key);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result && 'value' in request.result) {
          resolve(request.result.value as T);
        } else {
          resolve(defaultValue);
        }
      };
      request.onerror = () => resolve(defaultValue);
    });
  } catch {
    return defaultValue;
  }
}

/**
 * Completely purges all data from local IndexedDB storage.
 */
export async function clearAllIndexedDB(): Promise<void> {
  try {
    const db = await openDB();
    const storeNames = Object.values(STORES);
    const tx = db.transaction(storeNames, 'readwrite');

    storeNames.forEach((s) => {
      if (db.objectStoreNames.contains(s)) {
        tx.objectStore(s).clear();
      }
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[SADAR IndexedDB] Failed to clear stores:', err);
  }
}

/**
 * Loads all primary collections simultaneously on initial app mount.
 */
export async function loadAllFromIndexedDB(): Promise<{
  koperasiTransactions: any[] | null;
  umkmTransactions: any[] | null;
  auditLogs: any[] | null;
  umkmReconciliations: any[] | null;
}> {
  try {
    const [koperasiTransactions, umkmTransactions, auditLogs, umkmReconciliations] = await Promise.all([
      loadFromIndexedDB(STORES.KOPERASI_TRX),
      loadFromIndexedDB(STORES.UMKM_TRX),
      loadFromIndexedDB(STORES.AUDIT_LOGS),
      loadFromIndexedDB(STORES.UMKM_RECONCILIATION),
    ]);
    return {
      koperasiTransactions,
      umkmTransactions,
      auditLogs,
      umkmReconciliations,
    };
  } catch {
    return {
      koperasiTransactions: null,
      umkmTransactions: null,
      auditLogs: null,
      umkmReconciliations: null,
    };
  }
}

