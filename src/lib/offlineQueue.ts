/**
 * Offline Sync Queue using IndexedDB
 * Quản lý hàng đợi check-in/check-out khi mất kết nối mạng và đồng bộ lại với Supabase
 */
import { supabase } from './supabase';

export interface OfflineAction {
  id: string;
  type: 'checkin' | 'checkout';
  attendeeId: string;
  timestamp: string;
  synced: boolean;
}

const DB_NAME = 'pars-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'checkins';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function addToQueue(type: 'checkin' | 'checkout', attendeeId: string): Promise<OfflineAction> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const action: OfflineAction = {
      id: `${type}-${attendeeId}-${Date.now()}`,
      type,
      attendeeId,
      timestamp: new Date().toISOString(),
      synced: false,
    };
    const request = store.add(action);
    request.onsuccess = () => resolve(action);
    request.onerror = () => reject(request.error);
  });
}

export async function getQueue(): Promise<OfflineAction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function markSynced(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const data = getReq.result;
      if (data) {
        data.synced = true;
        const putReq = store.put(data);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      } else {
        resolve();
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function clearSynced(): Promise<void> {
  const db = await openDB();
  const queue = await getQueue();
  const syncedIds = queue.filter(item => item.synced).map(item => item.id);
  
  if (syncedIds.length === 0) return;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    let count = 0;
    syncedIds.forEach(id => {
      const req = store.delete(id);
      req.onsuccess = () => {
        count++;
        if (count === syncedIds.length) resolve();
      };
      req.onerror = () => reject(req.error);
    });
  });
}

export async function syncAll(): Promise<number> {
  const queue = await getQueue();
  const unsynced = queue.filter(item => !item.synced);
  if (unsynced.length === 0) return 0;
  
  let successCount = 0;
  for (const action of unsynced) {
    try {
      const isCheckedIn = action.type === 'checkin';
      const checkInTime = isCheckedIn ? action.timestamp.replace('T', ' ').substring(0, 16) : null;
      
      const { error } = await supabase
        .from('attendees')
        .update({
          is_checked_in: isCheckedIn,
          check_in_time: checkInTime
        })
        .eq('id', action.attendeeId);
        
      if (!error) {
        await markSynced(action.id);
        successCount++;
      } else {
        console.error(`Error syncing offline action ${action.id}:`, error);
      }
    } catch (err) {
      console.error(`Error syncing offline action ${action.id}:`, err);
    }
  }
  
  await clearSynced();
  return successCount;
}
