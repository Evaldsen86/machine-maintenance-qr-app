import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventorySaleLine } from '@/types';
import { formatCurrency } from '@/utils/currencyUtils';
import { roundMoney } from '@/utils/inventoryCalculations';
import { CalendarRange } from 'lucide-react';

function toLocalDayBounds(fromYmd: string, toYmd: string): { start: number; end: number } {
  const start = new Date(fromYmd + 'T00:00:00').getTime();
  const end = new Date(toYmd + 'T23:59:59.999').getTime();
  return { start, end };
}

function inPeriod(iso: string, fromYmd: string, toYmd: string): boolean {
  const t = new Date(iso).getTime();
  const { start, end } = toLocalDayBounds(fromYmd, toYmd);
  return t >= start && t <= end;
}

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfMonthYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

interface InventorySalesPeriodProps {
  saleLines: InventorySaleLine[];
}

const InventorySalesPeriod: React.FC<InventorySalesPeriodProps> = ({ saleLines }) => {
  const [from, setFrom] = useState(startOfMonthYmd);
  const [to, setTo] = useState(todayYmd);

  const filtered = useMemo(
    () => saleLines.filter(s => inPeriod(s.occurredAt, from, to)),
    [saleLines, from, to]
  );

  const totals = useMemo(() => {
    const qty = filtered.reduce((s, l) => s + l.quantity, 0);
    const revenue = roundMoney(filtered.reduce((s, l) => s + l.lineTotal, 0));
    return { qty, revenue, lines: filtered.length };
  }, [filtered]);

  const sortedRows = useMemo(
    () => [...filtered].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    [filtered]
  );

  const preset = (kind: 'today' | 'week' | 'month' | 'prevMonth') => {
    const t = todayYmd();
    if (kind === 'today') {
      setFrom(t);
      setTo(t);
      return;
    }
    if (kind === 'week') {
      setFrom(addDaysYmd(t, -6));
      setTo(t);
      return;
    }
    if (kind === 'month') {
      setFrom(startOfMonthYmd());
      setTo(t);
      return;
    }
    const d = new Date();
    const firstThis = new Date(d.getFullYear(), d.getMonth(), 1);
    const lastPrev = new Date(firstThis.getTime() - 86400000);
    const firstPrev = new Date(lastPrev.getFullYear(), lastPrev.getMonth(), 1);
    const fy = firstPrev.getFullYear();
    const fm = String(firstPrev.getMonth() + 1).padStart(2, '0');
    const fd = String(firstPrev.getDate()).padStart(2, '0');
    const ly = lastPrev.getFullYear();
    const lm = String(lastPrev.getMonth() + 1).padStart(2, '0');
    const ld = String(lastPrev.getDate()).padStart(2, '0');
    setFrom(`${fy}-${fm}-${fd}`);
    setTo(`${ly}-${lm}-${ld}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5" />
          Salg pr. periode
        </CardTitle>
        <CardDescription>
          Oplysninger fra accepterede tilbud med reservedele fra lager. Vælg datointerval — kun linjer i perioden vises.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => preset('today')}>
              I dag
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => preset('week')}>
              Sidste 7 dage
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => preset('month')}>
              Denne måned
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => preset('prevMonth')}>
              Forrige måned
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Fra</label>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-[160px]" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Til</label>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-[160px]" />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Solgt (antal)</p>
            <p className="text-2xl font-semibold tabular-nums">{totals.qty}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Omsætning</p>
            <p className="text-2xl font-semibold tabular-nums">{formatCurrency(totals.revenue)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Antal poster</p>
            <p className="text-2xl font-semibold tabular-nums">{totals.lines}</p>
          </div>
        </div>

        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Dato</th>
                <th className="text-left p-3 font-medium">Vare</th>
                <th className="text-left p-3 font-medium">Art.nr.</th>
                <th className="text-left p-3 font-medium">Placering (ved salg)</th>
                <th className="text-right p-3 font-medium">Antal</th>
                <th className="text-right p-3 font-medium">Pris</th>
                <th className="text-right p-3 font-medium">Linje</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Ingen salg i valgt periode. Salg registreres når et tilbud med lager-reservedele sættes til accepteret.
                  </td>
                </tr>
              ) : (
                sortedRows.map(row => {
                  const d = new Date(row.occurredAt);
                  const dateStr = d.toLocaleString('da-DK', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <tr key={row.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 whitespace-nowrap text-muted-foreground">{dateStr}</td>
                      <td className="p-3 font-medium">{row.partName}</td>
                      <td className="p-3 text-muted-foreground">{row.partNumber}</td>
                      <td className="p-3 font-mono text-xs">{row.locationSnapshot || '—'}</td>
                      <td className="p-3 text-right tabular-nums">{row.quantity}</td>
                      <td className="p-3 text-right tabular-nums">{formatCurrency(row.unitSalePrice)}</td>
                      <td className="p-3 text-right tabular-nums font-medium">{formatCurrency(row.lineTotal)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventorySalesPeriod;
