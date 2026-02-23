import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceItem } from '@/types';
import { formatDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/currencyUtils';

interface InvoicePreviewProps {
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  vat: number;
  total: number;
  notes?: string;
  title?: string;
  description?: string;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  customerName,
  invoiceDate,
  dueDate,
  items,
  subtotal,
  vat,
  total,
  notes,
  title = 'Fakturaforhåndsvisning',
  description = 'Sådan vil fakturaen se ud baseret på valgte registreringer',
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Til</div>
            <div className="font-medium">{customerName || 'Kunde'}</div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Fakturadato</span>
              <span>{formatDate(invoiceDate)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Forfaldsdato</span>
              <span>{formatDate(dueDate)}</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr,80px,120px,120px] gap-3 bg-muted/50 px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
            <div>Beskrivelse</div>
            <div className="text-right">Antal</div>
            <div className="text-right">Enhed</div>
            <div className="text-right">Beløb</div>
          </div>
          <div className="divide-y">
            {items.map(item => (
              <div key={item.id} className="grid grid-cols-[1fr,80px,120px,120px] gap-3 px-4 py-3 text-sm">
                <div>
                  <div className="font-medium">{item.description || 'Uden beskrivelse'}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.type === 'time' ? 'Tidsregistrering' : item.type === 'service' ? 'Arbejde' : 'Reservedel'}
                  </div>
                </div>
                <div className="text-right">
                  {item.quantity.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </div>
                <div className="text-right">{formatCurrency(item.unitPrice)}</div>
                <div className="text-right font-medium">{formatCurrency(item.totalPrice)}</div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                Vælg tidsregistreringer for at se fakturalinjer.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm md:items-end">
          <div className="flex w-full max-w-xs items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex w-full max-w-xs items-center justify-between">
            <span className="text-muted-foreground">Moms</span>
            <span>{formatCurrency(vat)}</span>
          </div>
          <div className="flex w-full max-w-xs items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {notes && (
          <div className="text-sm text-muted-foreground">
            <div className="font-medium text-foreground">Noter</div>
            <div>{notes}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoicePreview;
