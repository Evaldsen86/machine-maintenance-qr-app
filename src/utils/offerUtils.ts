import { Offer } from '@/types';

/** Generer næste tilbudsnummer baseret på eksisterende tilbud */
export function getNextOfferNumber(existingOffers: Offer[]): string {
  const year = new Date().getFullYear();
  const prefix = `T-${year}-`;
  const sameYear = existingOffers.filter(o => {
    const on = o.offerNumber;
    return on && on.startsWith(prefix);
  });
  const numbers = sameYear
    .map(o => parseInt(o.offerNumber!.replace(prefix, ''), 10))
    .filter(n => !Number.isNaN(n));
  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

/** Migrer alle tilbud og tildel tilbudsnummer til dem der mangler */
export function migrateOffers(offers: Offer[]): Offer[] {
  const sorted = [...offers].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const byYear = new Map<number, number>();
  const numberMap = new Map<string, string>();
  sorted.forEach(offer => {
    if (!offer.offerNumber) {
      const year = new Date(offer.createdAt).getFullYear();
      const count = (byYear.get(year) || 0) + 1;
      byYear.set(year, count);
      numberMap.set(offer.id, `T-${year}-${String(count).padStart(4, '0')}`);
    }
  });
  return offers.map(offer => {
    let migrated = { ...offer };
    if (!migrated.items || !Array.isArray(migrated.items)) {
      migrated = {
        ...migrated,
        items: [{
          id: `item-${offer.id}-0`,
          description: offer.title,
          quantity: 1,
          unitPrice: offer.amount,
          totalPrice: offer.amount,
        }],
      };
    }
    if (!migrated.parts) migrated = { ...migrated, parts: [] };
    if (!migrated.offerNumber && numberMap.has(offer.id)) {
      migrated = { ...migrated, offerNumber: numberMap.get(offer.id)! };
    }
    return migrated;
  });
}
