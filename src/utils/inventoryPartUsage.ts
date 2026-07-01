import { Part, TimeEntry } from '@/types';
import { shouldRestoreInventoryOnDelete } from '@/utils/timeEntryUtils';

export type InventoryQuantityChange = {
  inventoryPartId: string;
  delta: number;
};

/** Beregn nettoændring i lagerforbrug mellem to reservedelslister. */
export const diffPartInventoryUsage = (
  before: Part[] = [],
  after: Part[] = []
): InventoryQuantityChange[] => {
  const sumByInventoryId = (parts: Part[]) => {
    const map = new Map<string, number>();
    for (const part of parts) {
      if (!part.inventoryPartId) continue;
      map.set(
        part.inventoryPartId,
        (map.get(part.inventoryPartId) || 0) + part.quantity
      );
    }
    return map;
  };

  const beforeMap = sumByInventoryId(before);
  const afterMap = sumByInventoryId(after);
  const allIds = new Set([...beforeMap.keys(), ...afterMap.keys()]);
  const changes: InventoryQuantityChange[] = [];

  for (const inventoryPartId of allIds) {
    const delta = (afterMap.get(inventoryPartId) || 0) - (beforeMap.get(inventoryPartId) || 0);
    if (delta !== 0) {
      changes.push({ inventoryPartId, delta });
    }
  }

  return changes;
};

export const applyInventoryQuantityChanges = async (
  changes: InventoryQuantityChange[],
  changeQuantity: (inventoryPartId: string, delta: number) => Promise<void>
) => {
  for (const { inventoryPartId, delta } of changes) {
    await changeQuantity(inventoryPartId, delta);
  }
};

/** Return reservedele to stock when a completed time entry is deleted. */
export const restoreInventoryForDeletedTimeEntry = async (
  entry: TimeEntry,
  changeQuantity: (inventoryPartId: string, delta: number) => Promise<void>
) => {
  if (!shouldRestoreInventoryOnDelete(entry)) return;
  await applyInventoryQuantityChanges(
    diffPartInventoryUsage(entry.partsUsed, []),
    changeQuantity
  );
};
