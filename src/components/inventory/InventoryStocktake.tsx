import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InventoryPart } from '@/types';
import { sortPartsForWarehouse } from '@/utils/inventoryCalculations';
import { ClipboardList } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface InventoryStocktakeProps {
  parts: InventoryPart[];
  onApplyCount: (id: string, newQuantity: number) => void;
}

const InventoryStocktake: React.FC<InventoryStocktakeProps> = ({ parts, onApplyCount }) => {
  const sorted = useMemo(() => sortPartsForWarehouse(parts), [parts]);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const setCount = (id: string, value: string) => {
    setDraft(prev => ({ ...prev, [id]: value }));
  };

  const parseCount = (raw: string): number | null => {
    const t = raw.trim();
    if (t === '') return null;
    const n = Number(t.replace(',', '.'));
    if (Number.isNaN(n) || n < 0) return null;
    return Math.floor(n);
  };

  const applyAll = () => {
    let applied = 0;
    for (const p of sorted) {
      const raw = draft[p.id];
      if (raw === undefined || raw.trim() === '') continue;
      const n = parseCount(raw);
      if (n === null) {
        toast({
          variant: 'destructive',
          title: 'Ugyldigt tal',
          description: `Ret optælling for ${p.name} (kun hele tal ≥ 0).`,
        });
        return;
      }
      if (n !== p.quantity) {
        onApplyCount(p.id, n);
        applied++;
      }
    }
    if (applied === 0) {
      toast({ title: 'Ingen ændringer', description: 'Udfyld optalt antal der hvor det afviger fra systemet.' });
      return;
    }
    toast({ title: 'Optælling gemt', description: `${applied} linje${applied !== 1 ? 'r' : ''} er opdateret.` });
    setDraft({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Optælling
        </CardTitle>
        <CardDescription>
          Listen er sorteret efter kategori og placering. Indtast optalt antal hvor det afviger fra forventet, og gem.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Kategori</th>
                <th className="text-left p-3 font-medium">Placering</th>
                <th className="text-left p-3 font-medium">Navn</th>
                <th className="text-left p-3 font-medium">Art.nr.</th>
                <th className="text-right p-3 font-medium">Forventet</th>
                <th className="text-right p-3 font-medium w-28">Optalt</th>
                <th className="text-right p-3 font-medium">Diff.</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Ingen reservedele at tælle.
                  </td>
                </tr>
              ) : (
                sorted.map(part => {
                  const raw = draft[part.id] ?? '';
                  const parsed = parseCount(raw);
                  const diff =
                    parsed !== null && parsed !== part.quantity ? parsed - part.quantity : null;
                  return (
                    <tr key={part.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground">{part.category || '—'}</td>
                      <td className="p-3 font-mono text-xs">{part.location || '—'}</td>
                      <td className="p-3 font-medium">{part.name}</td>
                      <td className="p-3 text-muted-foreground">{part.partNumber}</td>
                      <td className="p-3 text-right">{part.quantity}</td>
                      <td className="p-3 text-right">
                        <Input
                          className="h-8 text-right"
                          inputMode="numeric"
                          placeholder="—"
                          value={raw}
                          onChange={e => setCount(part.id, e.target.value)}
                        />
                      </td>
                      <td className="p-3 text-right">
                        {diff === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className={diff === 0 ? 'text-muted-foreground' : diff > 0 ? 'text-green-700' : 'text-amber-800'}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={applyAll} disabled={sorted.length === 0}>
            Anvend optælling
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryStocktake;
