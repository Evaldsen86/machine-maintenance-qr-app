import { InventoryPart } from '@/types';

export const roundMoney = (n: number): number => Math.round(n * 100) / 100;

/** Salgspris ud fra indkøb og avance-% (påslag på kostpris). */
export const saleFromPurchaseAndMargin = (purchase: number, marginPercent: number): number => {
  if (purchase <= 0) return 0;
  return roundMoney(purchase * (1 + marginPercent / 100));
};

/** Avance-% når indkøbs- og salgspris er kendt. */
export const marginFromPurchaseAndSale = (purchase: number, sale: number): number => {
  if (purchase <= 0) return 0;
  return roundMoney(((sale / purchase) - 1) * 100);
};

export const getPurchasePrice = (p: InventoryPart): number => p.purchasePrice ?? 0;

export const getMarginPercent = (p: InventoryPart): number => {
  if (p.marginPercent != null) return p.marginPercent;
  const pur = getPurchasePrice(p);
  if (pur > 0 && p.unitPrice > 0) return marginFromPurchaseAndSale(pur, p.unitPrice);
  return 0;
};

export const lineValuePurchase = (p: InventoryPart): number =>
  roundMoney(p.quantity * getPurchasePrice(p));

export const lineValueRetail = (p: InventoryPart): number =>
  roundMoney(p.quantity * (p.unitPrice ?? 0));

export const totalInventoryPurchaseValue = (parts: InventoryPart[]): number =>
  roundMoney(parts.reduce((s, p) => s + lineValuePurchase(p), 0));

export const totalInventoryRetailValue = (parts: InventoryPart[]): number =>
  roundMoney(parts.reduce((s, p) => s + lineValueRetail(p), 0));

/** Sortering: kategori → placering → navn (nemmere optælling og orden på lager). */
export const sortPartsForWarehouse = (parts: InventoryPart[]): InventoryPart[] => {
  return [...parts].sort((a, b) => {
    const catA = (a.category || '').toLocaleLowerCase('da-DK');
    const catB = (b.category || '').toLocaleLowerCase('da-DK');
    if (catA !== catB) return catA.localeCompare(catB, 'da-DK');
    const locA = (a.location || '').toLocaleLowerCase('da-DK');
    const locB = (b.location || '').toLocaleLowerCase('da-DK');
    if (locA !== locB) return locA.localeCompare(locB, 'da-DK');
    return a.name.localeCompare(b.name, 'da-DK');
  });
};
