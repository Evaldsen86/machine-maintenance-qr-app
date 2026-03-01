import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { TimeEntry, Part, Invoice, InvoiceItem } from '@/types';
import { formatDate, addDays } from '@/utils/dateUtils';
import { Download, FileText } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import InvoicePreview from './InvoicePreview';

interface InvoiceGeneratorProps {
  timeEntries: TimeEntry[];
  customerId: string;
  customerName: string;
  onInvoiceGenerated?: (invoice: Invoice) => void;
}

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  timeEntries,
  customerId,
  customerName,
  onInvoiceGenerated
}) => {
  const { user } = useAuth();
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState<number>(750);
  const [vatRate, setVatRate] = useState<number>(25);
  const [notes, setNotes] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(formatDate(addDays(new Date(), 14).toISOString()));

  const buildInvoiceItems = (entries: TimeEntry[]) => {
    const items: InvoiceItem[] = [];

    entries.forEach(entry => {
      if (entry.duration) {
        const hours = entry.duration / 60;
        items.push({
          id: `time-${entry.id}`,
          type: 'time',
          description: entry.description,
          quantity: hours,
          unitPrice: hourlyRate,
          totalPrice: hours * hourlyRate,
          timeEntryId: entry.id
        });
      }

      if (entry.partsUsed) {
        entry.partsUsed.forEach(part => {
          items.push({
            id: `part-${part.id}`,
            type: 'part',
            description: part.name,
            quantity: part.quantity,
            unitPrice: part.unitPrice,
            totalPrice: part.totalPrice,
            partId: part.id
          });
        });
      }
    });

    return items;
  };

  const handleGenerateInvoice = () => {
    if (selectedEntries.length === 0) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Vælg venligst mindst én tidsregistrering.",
      });
      return;
    }

    const selectedTimeEntries = timeEntries.filter(entry => selectedEntries.includes(entry.id));
    const items = buildInvoiceItems(selectedTimeEntries);
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const vat = subtotal * (vatRate / 100);
    const total = subtotal + vat;

    const invoice: Invoice = {
      id: `invoice-${Date.now()}`,
      customerId,
      customerName,
      date: new Date().toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      status: 'draft',
      items,
      subtotal,
      vat,
      total,
      notes
    };

    if (onInvoiceGenerated) {
      onInvoiceGenerated(invoice);
    }

    toast({
      title: "Faktura genereret",
      description: "Fakturaen er blevet genereret og klar til download.",
    });
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Here you would typically generate a PDF using a library like jsPDF
    // For now, we'll just show a toast
    toast({
      title: "Faktura downloadet",
      description: "Fakturaen er blevet downloadet som PDF.",
    });
  };

  const selectedTimeEntries = timeEntries.filter(entry => selectedEntries.includes(entry.id));
  const previewItems = buildInvoiceItems(selectedTimeEntries);
  const previewSubtotal = previewItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const previewVat = previewSubtotal * (vatRate / 100);
  const previewTotal = previewSubtotal + previewVat;
  const previewInvoiceDate = new Date().toISOString();
  const previewDueDate = (() => {
    const parsed = new Date(dueDate);
    return Number.isNaN(parsed.getTime()) ? previewInvoiceDate : parsed.toISOString();
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generer faktura</CardTitle>
        <CardDescription>
          Vælg tidsregistreringer og generer en faktura for {customerName}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Timepris</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Moms (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={vatRate}
              onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Forfaldsdato</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Noter</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tilføj eventuelle noter til fakturaen..."
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Vælg tidsregistreringer</h3>
          <div className="space-y-2">
            {timeEntries
              .filter(entry => entry.status === 'completed' || entry.status === 'approved')
              .map(entry => (
                <div 
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedEntries.includes(entry.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEntries([...selectedEntries, entry.id]);
                        } else {
                          setSelectedEntries(selectedEntries.filter(id => id !== entry.id));
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <div>
                      <div className="font-medium">
                        {formatDate(entry.startTime)}
                        {entry.endTime && ` - ${formatDate(entry.endTime)}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {entry.duration && `${entry.duration / 60} timer`}
                      </div>
                      <div className="text-sm mt-1">{entry.description}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency((entry.duration || 0) / 60 * hourlyRate)}
                    </div>
                    {entry.partsUsed && entry.partsUsed.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        + {entry.partsUsed.length} reservedel{entry.partsUsed.length !== 1 ? 'er' : ''}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <InvoicePreview
          customerName={customerName}
          invoiceDate={previewInvoiceDate}
          dueDate={previewDueDate}
          items={previewItems}
          subtotal={previewSubtotal}
          vat={previewVat}
          total={previewTotal}
          notes={notes}
          description="Sådan vil fakturaen se ud, når opgaven er færdig"
        />

        <Button 
          onClick={handleGenerateInvoice}
          className="w-full"
          disabled={selectedEntries.length === 0}
        >
          <FileText className="h-4 w-4 mr-2" />
          Generer faktura
        </Button>
      </CardContent>
    </Card>
  );
};

export default InvoiceGenerator; 