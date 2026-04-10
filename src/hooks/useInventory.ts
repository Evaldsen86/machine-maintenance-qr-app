import { useState, useEffect, useCallback } from 'react';
import { InventoryPart, InventorySaleLine } from '@/types';
import * as invDb from '@/lib/inventoryDb';

const STORAGE_KEY = 'inventory_parts';
const SALES_KEY = 'inventory_sale_lines';

export type InventorySaleMeta = {
  unitSalePrice: number;
  lineTotal: number;
  partName: string;
  partNumber: string;
  offerId?: string;
};

export const useInventory = () => {
  const [parts, setParts] = useState<InventoryPart[]>([]);
  const [saleLines, setSaleLines] = useState<InventorySaleLine[]>([]);
  const [useIndexedDb, setUseIndexedDb] = useState(false);

  const persistSalesLs = useCallback((lines: InventorySaleLine[]) => {
    localStorage.setItem(SALES_KEY, JSON.stringify(lines));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const count = await invDb.getPartsCount();
        if (count > 0) {
          setUseIndexedDb(true);
          const all = await invDb.getAllParts();
          let sales = await invDb.getAllSaleLines();
          const fromLs = localStorage.getItem(SALES_KEY);
          if (sales.length === 0 && fromLs) {
            try {
              const parsed = JSON.parse(fromLs) as InventorySaleLine[];
              if (parsed.length > 0) {
                for (const line of parsed) {
                  await invDb.appendSaleLine(line);
                }
                localStorage.removeItem(SALES_KEY);
                sales = parsed;
              }
            } catch {
              /* ignore */
            }
          }
          if (!cancelled) {
            setParts(all);
            setSaleLines(sales.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)));
          }
          return;
        }
      } catch {
        // IndexedDB not available
      }
      const stored = localStorage.getItem(STORAGE_KEY);
      const salesRaw = localStorage.getItem(SALES_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as InventoryPart[];
          if (!cancelled) setParts(parsed);
        } catch {
          if (!cancelled) setParts([]);
        }
      }
      if (salesRaw) {
        try {
          const parsed = JSON.parse(salesRaw) as InventorySaleLine[];
          if (!cancelled) setSaleLines(parsed.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)));
        } catch {
          if (!cancelled) setSaleLines([]);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
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

  const recordSaleLine = useCallback(
    async (part: InventoryPart, amount: number, sale: InventorySaleMeta) => {
      if (amount <= 0) return;
      const line: InventorySaleLine = {
        id: `sale-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        occurredAt: new Date().toISOString(),
        inventoryPartId: part.id,
        partName: sale.partName,
        partNumber: sale.partNumber,
        quantity: amount,
        unitSalePrice: sale.unitSalePrice,
        lineTotal: sale.lineTotal,
        locationSnapshot: part.location,
        source: 'offer',
        offerId: sale.offerId,
      };
      if (useIndexedDb) {
        await invDb.appendSaleLine(line);
        setSaleLines(prev => [line, ...prev].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)));
      } else {
        setSaleLines(prev => {
          const next = [line, ...prev].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
          persistSalesLs(next);
          return next;
        });
      }
    },
    [useIndexedDb, persistSalesLs]
  );

  const importBatch = useCallback(async (newParts: InventoryPart[]) => {
    await invDb.putPartsBatch(newParts);
    setUseIndexedDb(true);
    const fromLs = localStorage.getItem(SALES_KEY);
    if (fromLs) {
      try {
        const parsed = JSON.parse(fromLs) as InventorySaleLine[];
        for (const line of parsed) {
          await invDb.appendSaleLine(line);
        }
        localStorage.removeItem(SALES_KEY);
        const merged = await invDb.getAllSaleLines();
        setSaleLines(merged.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)));
      } catch {
        /* ignore */
      }
    }
    if (newParts.length <= 1000) {
      setParts(prev => {
        const byId = new Map(prev.map(p => [p.id, p]));
        newParts.forEach(p => byId.set(p.id, p));
        return Array.from(byId.values());
      });
    } else {
      const recent = await invDb.getAllParts(500);
      setParts(recent);
    }
  }, []);

  const refreshFromDb = useCallback(async () => {
    const all = await invDb.getAllParts(5000);
    setParts(all);
    const sales = await invDb.getAllSaleLines();
    setSaleLines(sales.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)));
    if (all.length > 0) setUseIndexedDb(true);
  }, []);

  const searchPartsInDb = useCallback(async (query: string) => {
    const results = await invDb.searchParts(query, 200);
    setParts(results);
  }, []);

  const decreaseQuantity = useCallback(
    async (inventoryPartId: string, amount: number, sale?: InventorySaleMeta) => {
      if (useIndexedDb) {
        const part = await invDb.getPartById(inventoryPartId);
        if (!part) return;
        const newQty = Math.max(0, part.quantity - amount);
        const updated = { ...part, quantity: newQty };
        await invDb.putPart(updated);
        setParts(prev => prev.map(p => p.id === inventoryPartId ? updated : p));
        if (sale) await recordSaleLine(part, amount, sale);
      } else {
        const part = parts.find(p => p.id === inventoryPartId);
        if (!part) return;
        const newQty = Math.max(0, part.quantity - amount);
        updatePart(inventoryPartId, { quantity: newQty });
        if (sale) await recordSaleLine(part, amount, sale);
      }
    },
    [useIndexedDb, parts, updatePart, recordSaleLine]
  );

  return {
    parts,
    saleLines,
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
