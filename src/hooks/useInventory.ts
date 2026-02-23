import { useState, useEffect, useCallback } from 'react';
import { InventoryPart } from '@/types';
import * as invDb from '@/lib/inventoryDb';

const STORAGE_KEY = 'inventory_parts';

export const useInventory = () => {
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [useIndexedDb, setUseIndexedDb] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const count = await invDb.getPartsCount();
        if (count > 0) {
          setUseIndexedDb(true);
          const all = await invDb.getAllParts();
          if (!cancelled) setParts(all);
          return;
        }
      } catch {
        // IndexedDB not available
      }
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as InventoryPart[];
          if (!cancelled) setParts(parsed);
        } catch {
          if (!cancelled) setParts([]);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const persistPart = useCallback(async (part: InventoryPart) => {
    if (useIndexedDb) {
      await invDb.putPart(part);
    } else {
      setParts(prev => {
        const next = prev.some(p => p.id === part.id)
          ? prev.map(p => p.id === part.id ? part : p)
          : [part, ...prev];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, [useIndexedDb]);

  const addPart = useCallback((part: Omit<InventoryPart, 'id'>) => {
    const newPart: InventoryPart = {
      ...part,
      id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
    setParts(prev => {
      const next = [newPart, ...prev];
      if (!useIndexedDb) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    if (useIndexedDb) invDb.putPart(newPart);
    return newPart;
  }, [useIndexedDb]);

  const updatePart = useCallback((id: string, updates: Partial<InventoryPart>) => {
    setParts(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      if (!useIndexedDb) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (useIndexedDb) {
        const updated = next.find(p => p.id === id);
        if (updated) invDb.putPart(updated);
      }
      return next;
    });
  }, [useIndexedDb]);

  const deletePart = useCallback((id: string) => {
    setParts(prev => {
      const next = prev.filter(p => p.id !== id);
      if (!useIndexedDb) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (useIndexedDb) invDb.deletePart(id);
      return next;
    });
  }, [useIndexedDb]);

  const getPartById = useCallback((id: string) => {
    return parts.find(p => p.id === id);
  }, [parts]);

  const getPartsByMachine = useCallback((machineId: string) => {
    return parts.filter(p => p.machineIds?.includes(machineId));
  }, [parts]);

  const getLowStockParts = useCallback(() => {
    return parts.filter(p => p.quantity <= p.minQuantity);
  }, [parts]);

  const importBatch = useCallback(async (newParts: InventoryPart[]) => {
    await invDb.putPartsBatch(newParts);
    setUseIndexedDb(true);
    if (newParts.length <= 1000) {
      setParts(prev => {
        const byId = new Map(prev.map(p => [p.id, p]));
        newParts.forEach(p => byId.set(p.id, p));
        return Array.from(byId.values());
      });
    } else {
      const count = await invDb.getPartsCount();
      const recent = await invDb.getAllParts(500);
      setParts(recent);
    }
  }, []);

  const refreshFromDb = useCallback(async () => {
    const all = await invDb.getAllParts(5000);
    setParts(all);
    if (all.length > 0) setUseIndexedDb(true);
  }, []);

  const searchPartsInDb = useCallback(async (query: string) => {
    const results = await invDb.searchParts(query, 200);
    setParts(results);
  }, []);

  const decreaseQuantity = useCallback(async (inventoryPartId: string, amount: number) => {
    if (useIndexedDb) {
      const part = await invDb.getPartById(inventoryPartId);
      if (!part) return;
      const newQty = Math.max(0, part.quantity - amount);
      const updated = { ...part, quantity: newQty };
      await invDb.putPart(updated);
      setParts(prev => prev.map(p => p.id === inventoryPartId ? updated : p));
    } else {
      const part = parts.find(p => p.id === inventoryPartId);
      if (!part) return;
      const newQty = Math.max(0, part.quantity - amount);
      updatePart(inventoryPartId, { quantity: newQty });
    }
  }, [useIndexedDb, parts, updatePart]);

  return {
    parts,
    setParts,
    addPart,
    updatePart,
    deletePart,
    getPartById,
    getPartsByMachine,
    getLowStockParts,
    importBatch,
    refreshFromDb,
    searchPartsInDb,
    decreaseQuantity,
    useIndexedDb,
  };
};
