import { openDB, DBPersistence, IDBPDatabase } from 'idb';
import { InventoryPart } from '@/types';

const DB_NAME = 'machine-qr-inventory';
const DB_VERSION = 1;
const STORE_NAME = 'parts';

let dbPromise: Promise<IDBPDatabase> | null = null;

export const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('partNumber', 'partNumber', { unique: false });
          store.createIndex('name', 'name', { unique: false });
        }
      },
    });
  }
  return dbPromise;
};

export const getAllParts = async (limit = 5000): Promise<InventoryPart[]> => {
  const db = await getDb();
  const all = await db.getAll(STORE_NAME);
  return limit > 0 ? all.slice(0, limit) : all;
};

export const getPartById = async (id: string): Promise<InventoryPart | undefined> => {
  const db = await getDb();
  return db.get(STORE_NAME, id);
};

export const searchParts = async (query: string, limit = 100): Promise<InventoryPart[]> => {
  const db = await getDb();
  const all = await db.getAll(STORE_NAME);
  const q = query.toLowerCase();
  return all
    .filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.partNumber?.toLowerCase().includes(q)
    )
    .slice(0, limit);
};

export const putPart = async (part: InventoryPart): Promise<void> => {
  const db = await getDb();
  await db.put(STORE_NAME, part);
};

export const putPartsBatch = async (parts: InventoryPart[]): Promise<void> => {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const part of parts) {
    await tx.store.put(part);
  }
  await tx.done;
};

export const deletePart = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
};

export const getPartsCount = async (): Promise<number> => {
  const db = await getDb();
  return db.count(STORE_NAME);
};
