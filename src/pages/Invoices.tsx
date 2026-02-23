import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useInvoices } from '@/hooks/useInvoices';
import { formatCurrency } from '@/utils/currencyUtils';
import { formatDate } from '@/utils/dateUtils';
import { generateInvoicePdf } from '@/utils/invoicePdf';
import { Invoice } from '@/types';
import { FileText, Download, Search, Eye } from 'lucide-react';
import InvoicePreview from '@/components/invoice/InvoicePreview';

const statusLabels: Record<string, string> = {
  draft: 'Kladde',
  sent: 'Sendt',
  paid: 'Betalt',
  overdue: 'Forfaldet',
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: 'outline',
  sent: 'secondary',
  paid: 'default',
  overdue: 'destructive',
};

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const { invoices } = useInvoices();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const filteredInvoices = useMemo(() => {
    let result = invoices;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        inv =>
          inv.customerName.toLowerCase().includes(q) ||
          inv.id.toLowerCase().includes(q) ||
          formatDate(inv.date).toLowerCase().includes(q) ||
          inv.date.includes(q.replace(/\./g, '-').replace(/\//g, '-'))
      );
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter(inv => new Date(inv.date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(inv => new Date(inv.date) <= to);
    }

    return result;
  }, [invoices, searchQuery, dateFrom, dateTo]);

  const openView = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setShowViewDialog(true);
  };

  const handleDownloadPdf = (inv: Invoice) => {
    generateInvoicePdf(inv);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 page-container py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Fakturaer</h1>
            <p className="text-muted-foreground">
              Oversigt over alle fakturaer. Download PDF eller se detaljer.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard?tab=offers')}>
              <FileText className="h-4 w-4 mr-2" />
              Til tilbud
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Fakturaarkiv
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søg kunde, fakturanr eller dato..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="max-w-[140px]"
                    title="Fra dato"
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="max-w-[140px]"
                    title="Til dato"
                  />
                  {(dateFrom || dateTo) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setDateFrom(''); setDateTo(''); }}
                    >
                      Ryd dato
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <CardDescription>
              {dateFrom || dateTo || searchQuery ? (
                <>
                  {filteredInvoices.length} af {invoices.length} faktura{invoices.length !== 1 ? 'er' : ''}
                </>
              ) : (
                <>
                  {invoices.length} faktura{invoices.length !== 1 ? 'er' : ''} i arkivet
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen fakturaer endnu.</p>
                <p className="text-sm mt-1">
                  Opret en faktura fra et accepteret tilbud eller fra en godkendt opgave.
                </p>
                <Button className="mt-4" onClick={() => navigate('/dashboard?tab=offers')}>
                  Gå til tilbud
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInvoices.map(inv => (
                  <div
                    key={inv.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted/30"
                  >
                    <div>
                      <div className="font-medium">{inv.customerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {inv.id} · {formatDate(inv.date)}
                      </div>
                      {inv.offerId && (
                        <div className="text-xs text-muted-foreground mt-1">Fra tilbud</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={statusVariants[inv.status] || 'outline'}>
                        {statusLabels[inv.status] || inv.status}
                      </Badge>
                      <span className="font-semibold">{formatCurrency(inv.total)}</span>
                      <Button variant="ghost" size="sm" onClick={() => openView(inv)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Se
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(inv)}>
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Faktura {selectedInvoice?.id}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <InvoicePreview
                customerName={selectedInvoice.customerName}
                invoiceDate={selectedInvoice.date}
                dueDate={selectedInvoice.dueDate}
                items={selectedInvoice.items}
                subtotal={selectedInvoice.subtotal}
                vat={selectedInvoice.vat}
                total={selectedInvoice.total}
                notes={selectedInvoice.notes}
                title=""
                description=""
              />
              <Button onClick={() => handleDownloadPdf(selectedInvoice)} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
