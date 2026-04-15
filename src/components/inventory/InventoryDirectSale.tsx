import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { InventoryPart } from '@/types';
import { addDays, formatDate } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/currencyUtils';
import { useInvoices } from '@/hooks/useInvoices';
import { ReceiptText } from 'lucide-react';

interface InventoryDirectSaleProps {
  parts: InventoryPart[];
  onSellPart: (part: InventoryPart, quantity: number, unitSalePrice: number) => Promise<void>;
}

const InventoryDirectSale: React.FC<InventoryDirectSaleProps> = ({ parts, onSellPart }) => {
  const { addInvoice } = useInvoices();
  const [customerName, setCustomerName] = useState('');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitSalePrice, setUnitSalePrice] = useState(0);
  const [dueDate, setDueDate] = useState<string>(formatDate(addDays(new Date().toISOString(), 14)));
  const [notes, setNotes] = useState('');
  const [createInvoice, setCreateInvoice] = useState(true);
  const [saving, setSaving] = useState(false);

  const sellableParts = useMemo(
    () =>
      [...parts]
        .filter(part => part.quantity > 0)
        .sort((a, b) => a.name.localeCompare(b.name, 'da-DK', { sensitivity: 'base' })),
    [parts]
  );

  const selectedPart = useMemo(
    () => sellableParts.find(part => part.id === selectedPartId),
    [sellableParts, selectedPartId]
  );

  const lineTotal = useMemo(() => quantity * unitSalePrice, [quantity, unitSalePrice]);
  const vatAmount = 0;
  const totalWithVat = lineTotal;

  const handlePartChange = (partId: string) => {
    setSelectedPartId(partId);
    const part = sellableParts.find(p => p.id === partId);
    if (part) {
      setUnitSalePrice(part.unitPrice);
      setQuantity(1);
    }
  };

  const handleSell = async () => {
    if (!customerName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Kunde mangler',
        description: 'Angiv kundenavn før salget gemmes.',
      });
      return;
    }
    if (!selectedPart) {
      toast({
        variant: 'destructive',
        title: 'Reservedel mangler',
        description: 'Vælg en reservedel der skal sælges.',
      });
      return;
    }
    if (quantity <= 0) {
      toast({
        variant: 'destructive',
        title: 'Ugyldigt antal',
        description: 'Antal skal være større end 0.',
      });
      return;
    }
    if (quantity > selectedPart.quantity) {
      toast({
        variant: 'destructive',
        title: 'Ikke nok på lager',
        description: `Der er kun ${selectedPart.quantity} ${selectedPart.unit} på lager.`,
      });
      return;
    }
    if (unitSalePrice < 0) {
      toast({
        variant: 'destructive',
        title: 'Ugyldig pris',
        description: 'Pris må ikke være negativ.',
      });
      return;
    }

    setSaving(true);
    try {
      await onSellPart(selectedPart, quantity, unitSalePrice);

      let invoiceId: string | undefined;
      if (createInvoice) {
        const parsedDueDate = new Date(dueDate);
        const invoice = addInvoice({
          customerId: `direct-${Date.now()}`,
          customerName: customerName.trim(),
          date: new Date().toISOString(),
          dueDate: Number.isNaN(parsedDueDate.getTime())
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            : parsedDueDate.toISOString(),
          status: 'draft',
          items: [
            {
              id: `part-${selectedPart.id}-${Date.now()}`,
              type: 'part',
              description: `${selectedPart.name} (${selectedPart.partNumber})`,
              quantity,
              unitPrice: unitSalePrice,
              totalPrice: lineTotal,
              partId: selectedPart.id,
            },
          ],
          subtotal: lineTotal,
          vat: vatAmount,
          total: totalWithVat,
          notes: notes.trim() || undefined,
        });
        invoiceId = invoice.id;
      }

      toast({
        title: createInvoice ? 'Salg og faktura oprettet' : 'Salg registreret',
        description: createInvoice && invoiceId
          ? `Salget er registreret og faktura ${invoiceId} er oprettet som kladde.`
          : 'Salget er registreret og lageret er opdateret.',
      });

      setSelectedPartId('');
      setQuantity(1);
      setUnitSalePrice(0);
      setCustomerName('');
      setNotes('');
      setCreateInvoice(true);
      setDueDate(formatDate(addDays(new Date().toISOString(), 14)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="h-5 w-5" />
          Direkte salg fra lager
        </CardTitle>
        <CardDescription>
          Sælg enkelt-reservedele direkte til kunde og opret faktura som kladde ved behov.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Kundenavn</label>
            <Input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Fx Nuuk Transport"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reservedel</label>
            <Select value={selectedPartId} onValueChange={handlePartChange}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg reservedel" />
              </SelectTrigger>
              <SelectContent>
                {sellableParts.map(part => (
                  <SelectItem key={part.id} value={part.id}>
                    {part.name} · {part.partNumber} · {part.quantity} {part.unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Antal</label>
            <Input
              type="number"
              min={1}
              max={selectedPart?.quantity || undefined}
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value, 10) || 1)}
            />
            {selectedPart && (
              <p className="text-xs text-muted-foreground">
                På lager: {selectedPart.quantity} {selectedPart.unit}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Pris pr. enhed</label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={unitSalePrice}
              onChange={e => setUnitSalePrice(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Moms</label>
            <Input
              value="Ingen moms (Grønland)"
              disabled
            />
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <p className="font-medium">Prisoversigt</p>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatCurrency(lineTotal)}</span>
          </div>
          <div className="flex items-center justify-between font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(totalWithVat)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={createInvoice}
              onChange={e => setCreateInvoice(e.target.checked)}
              className="h-4 w-4"
            />
            Opret faktura som kladde
          </label>
        </div>

        {createInvoice && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Forfaldsdato</label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Noter på faktura</label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="min-h-[90px]"
                placeholder="Fx Rekvisition, reference eller anden note"
              />
            </div>
          </div>
        )}

        <Button onClick={handleSell} disabled={saving || !selectedPart}>
          Registrer salg
        </Button>
      </CardContent>
    </Card>
  );
};

export default InventoryDirectSale;
