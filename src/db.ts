import { openDB } from 'idb';

const DB_NAME = 'machineHistoryDB';
const DB_VERSION = 1;

export const initDB = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('machines')) {
        const machineStore = db.createObjectStore('machines', { keyPath: 'id', autoIncrement: true });
        machineStore.createIndex('name', 'name');
      }
      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        historyStore.createIndex('machineId', 'machineId');
        historyStore.createIndex('date', 'date');
      }
    },
  });
  return db;
};

export const addMachine = async (name: string, location: string) => {
  const db = await initDB();
  return db.add('machines', { name, location });
};

export const getMachines = async () => {
  const db = await initDB();
  return db.getAll('machines');
};

export const addHistory = async (machineId: number, description: string, date: Date) => {
  const db = await initDB();
  return db.add('history', { machineId, description, date });
};

export const getHistoryByMachineId = async (machineId: number) => {
  const db = await initDB();
  const tx = db.transaction('history', 'readonly');
  const index = tx.store.index('machineId');
  return index.getAll(machineId);
}; 