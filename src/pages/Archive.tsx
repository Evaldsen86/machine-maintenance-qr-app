import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvoices } from '@/hooks/useInvoices';
import { formatCurrency } from '@/utils/currencyUtils';
import { formatDate } from '@/utils/dateUtils';
import { generateInvoicePdf } from '@/utils/invoicePdf';
import { generateOfferPdf } from '@/utils/offerPdf';
import { printOffer } from '@/utils/printOfferUtils';
import { migrateOffers } from '@/utils/offerUtils';
import { Offer, Invoice } from '@/types';
import { FileText, Download, Search, Archive as ArchiveIcon, Truck, Printer, Link2 } from 'lucide-react';

const OFFERS_STORAGE_KEY = 'offers';

const offerStatusLabels: Record<string, string> = {
  draft: 'Kladde',
  sent: 'Sendt',
  accepted: 'Accepteret',
  rejected: 'Afvist',
};

const invoiceStatusLabels: Record<string, string> = {
  draft: 'Kladde',
  sent: 'Sendt',
  paid: 'Betalt',
  overdue: 'Forfaldet',
};

const Archive: React.FC = () => {
  const navigate = useNavigate();
  const { invoices } = useInvoices();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    const stored = localStorage.getItem(OFFERS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Offer[];
        setOffers(migrateOffers(parsed));
      } catch {
        setOffers([]);
      }
    }
  }, []);

  const q = searchQuery.toLowerCase().trim();

  const filteredOffers = useMemo(() => {
    if (!q) return offers;
    return offers.filter(o =>
      (o.offerNumber?.toLowerCase().includes(q)) ||
      o.customerName.toLowerCase().includes(q) ||
      o.title.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      formatDate(o.createdAt).toLowerCase().includes(q)
    );
  }, [offers, q]);

  const filteredInvoices = useMemo(() => {
    if (!q) return invoices;
    return invoices.filter(inv =>
      inv.customerName.toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q) ||
      formatDate(inv.date).toLowerCase().includes(q)
    );
  }, [invoices, q]);

  const getOfferById = (id: string) => offers.find(o => o.id === id);
  const getInvoiceByOffer = (offerId: string) => invoices.find(inv => inv.offerId === offerId);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 page-container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArchiveIcon className="h-7 w-7" />
            Arkiv
          </h1>
          <p className="text-muted-foreground mt-1">
            Søg og find tidligere tilbud og fakturaer. Se koblingen mellem tilbud, opgaver og fakturaer.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>Historik</CardTitle>
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søg tilbudsnr, kunde, titel eller fakturanr..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <CardDescription>
              {offers.length} tilbud · {invoices.length} fakturaer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Tilbud & Fakturaer</TabsTrigger>
                <TabsTrigger value="offers">Kun tilbud</TabsTrigger>
                <TabsTrigger value="invoices">Kun fakturaer</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6 space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Tilbud</h3>
                  {filteredOffers.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">Ingen tilbud matcher søgningen.</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredOffers.map(offer => {
                        const inv = getInvoiceByOffer(offer.id);
                        return (
                          <div
                            key={offer.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted/30"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-medium flex items-center gap-2 min-w-0">
                                <span className="truncate">{offer.title}</span>
                                {offer.offerNumber && (
                                  <span className="text-xs font-mono text-muted-foreground">{offer.offerNumber}</span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">{offer.customerName}</div>
                              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                {offer.taskId && (
                                  <Badge variant="outline" className="text-xs">
                                    <Link2 className="h-3 w-3 mr-1" />
                                    Koblet til opgave
                                  </Badge>
                                )}
                                {inv && (
                                  <Badge variant="outline" className="text-xs">
                                    <FileText className="h-3 w-3 mr-1" />
                                    Faktura {inv.id}
                                  </Badge>
                                )}
                                {offer.machineName && (
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Truck className="h-3 w-3" />
                                    {offer.machineName}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                              <Badge variant="outline">{offerStatusLabels[offer.status] || offer.status}</Badge>
                              <span className="font-semibold whitespace-nowrap">{formatCurrency(offer.amount)}</span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(offer.createdAt)}</span>
                              <Button variant="ghost" size="sm" onClick={() => generateOfferPdf(offer)} title="Download PDF">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => printOffer(offer)} title="Udskriv">
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium mb-3">Fakturaer</h3>
                  {filteredInvoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">Ingen fakturaer matcher søgningen.</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredInvoices.map(inv => {
                        const offer = inv.offerId ? getOfferById(inv.offerId) : null;
                        return (
                          <div
                            key={inv.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted/30"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{inv.customerName}</div>
                              <div className="text-sm text-muted-foreground">{inv.id} · {formatDate(inv.date)}</div>
                              {offer && (
                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Link2 className="h-3 w-3" />
                                  Fra tilbud {offer.offerNumber || offer.id}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant="outline">{invoiceStatusLabels[inv.status] || inv.status}</Badge>
                              <span className="font-semibold">{formatCurrency(inv.total)}</span>
                              <Button variant="ghost" size="sm" onClick={() => generateInvoicePdf(inv)} title="Download PDF">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="offers" className="mt-6">
                {filteredOffers.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen tilbud matcher søgningen.</p>
                    <Button className="mt-4" variant="outline" onClick={() => navigate('/dashboard?tab=offers')}>
                      Gå til tilbud
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredOffers.map(offer => (
                      <div
                        key={offer.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted/30"
                      >
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {offer.title}
                            {offer.offerNumber && (
                              <span className="text-xs font-mono text-muted-foreground">{offer.offerNumber}</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{offer.customerName} · {formatDate(offer.createdAt)}</div>
                          {offer.taskId && (
                            <div className="text-xs mt-1">Koblet til opgave</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{offerStatusLabels[offer.status]}</Badge>
                          <span className="font-semibold">{formatCurrency(offer.amount)}</span>
                          <Button variant="ghost" size="sm" onClick={() => generateOfferPdf(offer)}>PDF</Button>
                          <Button variant="ghost" size="sm" onClick={() => printOffer(offer)}>Udskriv</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="invoices" className="mt-6">
                {filteredInvoices.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Ingen fakturaer matcher søgningen.</p>
                    <Button className="mt-4" variant="outline" onClick={() => navigate('/invoices')}>
                      Gå til fakturaer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredInvoices.map(inv => {
                      const offer = inv.offerId ? getOfferById(inv.offerId) : null;
                      return (
                        <div
                          key={inv.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 hover:bg-muted/30"
                        >
                          <div>
                            <div className="font-medium">{inv.customerName}</div>
                            <div className="text-sm text-muted-foreground">{inv.id} · {formatDate(inv.date)}</div>
                            {offer && (
                              <div className="text-xs text-muted-foreground mt-1">Fra tilbud {offer.offerNumber || offer.id}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{invoiceStatusLabels[inv.status]}</Badge>
                            <span className="font-semibold">{formatCurrency(inv.total)}</span>
                            <Button variant="ghost" size="sm" onClick={() => generateInvoicePdf(inv)}>PDF</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Archive;
