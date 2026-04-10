import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InventoryPart } from '@/types';
import {
  getPurchasePrice,
  lineValuePurchase,
  lineValueRetail,
  roundMoney,
} from '@/utils/inventoryCalculations';
import { formatCurrency } from '@/utils/currencyUtils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, MapPin } from 'lucide-react';

const normalizeLoc = (p: InventoryPart): string => {
  const t = (p.location || '').trim();
  return t || '__none__';
};

const labelLoc = (key: string) => (key === '__none__' ? 'Uden placering' : key);

const sortLocationKeys = (keys: string[]): string[] =>
  [...keys].sort((a, b) => {
    if (a === '__none__' && b !== '__none__') return 1;
    if (b === '__none__' && a !== '__none__') return -1;
    return a.localeCompare(b, 'da-DK', { numeric: true, sensitivity: 'base' });
  });

interface InventoryLocationViewProps {
  parts: InventoryPart[];
}

const InventoryLocationView: React.FC<InventoryLocationViewProps> = ({ parts }) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const setLocOpen = (key: string, v: boolean) => setOpen(prev => ({ ...prev, [key]: v }));

  const groups = useMemo(() => {
    const m = new Map<string, InventoryPart[]>();
    for (const p of parts) {
      const k = normalizeLoc(p);
      const arr = m.get(k) ?? [];
      arr.push(p);
      m.set(k, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.name.localeCompare(b.name, 'da-DK'));
    }
    return m;
  }, [parts]);

  const sortedKeys = useMemo(() => sortLocationKeys(Array.from(groups.keys())), [groups]);

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    sortedKeys.forEach(k => {
      next[k] = true;
    });
    setOpen(next);
  };

  const collapseAll = () => setOpen({});

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Placeringer
            </CardTitle>
            <CardDescription>
              Grupperet efter lagerplads — se hvad der ligger hvor, og værdi pr. placering.
            </CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={expandAll}>
              Udvid alle
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={collapseAll}>
              Luk alle
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen reservedele endnu.</p>
        ) : (
          sortedKeys.map(key => {
            const rows = groups.get(key) ?? [];
            const purchaseSum = roundMoney(rows.reduce((s, p) => s + lineValuePurchase(p), 0));
            const retailSum = roundMoney(rows.reduce((s, p) => s + lineValueRetail(p), 0));
            const isOpen = open[key] ?? false;
            return (
              <Collapsible key={key} open={isOpen} onOpenChange={v => setLocOpen(key, v)}>
                <div className="rounded-lg border bg-card">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        {isOpen ? (
                          <ChevronDown className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{labelLoc(key)}</p>
                          <p className="text-sm text-muted-foreground">
                            {rows.length} varelinje{rows.length !== 1 ? 'r' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm shrink-0 space-y-0.5">
                        <p>
                          <span className="text-muted-foreground">Indkøb: </span>
                          <span className="font-medium tabular-nums">{formatCurrency(purchaseSum)}</span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Salg: </span>
                          <span className="font-medium tabular-nums">{formatCurrency(retailSum)}</span>
                        </p>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t px-2 pb-2 overflow-x-auto">
                      <table className="w-full text-sm min-w-[560px]">
                        <thead>
                          <tr className="text-left text-muted-foreground border-b">
                            <th className="p-2 font-medium">Navn</th>
                            <th className="p-2 font-medium">Art.nr.</th>
                            <th className="p-2 font-medium">Kategori</th>
                            <th className="p-2 font-medium text-right">Antal</th>
                            <th className="p-2 font-medium text-right">Indkøb</th>
                            <th className="p-2 font-medium text-right">Værdi indk.</th>
                            <th className="p-2 font-medium text-right">Værdi salg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map(p => (
                            <tr key={p.id} className="border-b border-muted/50 last:border-0">
                              <td className="p-2 font-medium">{p.name}</td>
                              <td className="p-2 text-muted-foreground">{p.partNumber}</td>
                              <td className="p-2 text-muted-foreground">{p.category || '—'}</td>
                              <td className="p-2 text-right tabular-nums">{p.quantity}</td>
                              <td className="p-2 text-right tabular-nums">{formatCurrency(getPurchasePrice(p))}</td>
                              <td className="p-2 text-right tabular-nums text-muted-foreground">
                                {formatCurrency(lineValuePurchase(p))}
                              </td>
                              <td className="p-2 text-right tabular-nums">{formatCurrency(lineValueRetail(p))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryLocationView;
