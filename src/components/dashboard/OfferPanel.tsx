import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency } from '@/utils/currencyUtils';
import { Offer, OfferItem, OfferPart, OfferStatus, Task } from '@/types';
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Truck, Package, FileText, PlayCircle, Printer, Download } from 'lucide-react';
import { useMachines } from '@/hooks/useMachines';
import { useInventory } from '@/hooks/useInventory';
import { useInvoices } from '@/hooks/useInvoices';
import { InvoiceItem } from '@/types';
import { generateOfferPdf } from '@/utils/offerPdf';
import { printOffer } from '@/utils/printOfferUtils';
import { getNextOfferNumber, migrateOffers } from '@/utils/offerUtils';

const storageKey = 'offers';

const statusLabels: Record<OfferStatus, string> = {
  draft: 'Kladde',
  sent: 'Sendt',
  accepted: 'Accepteret',
  rejected: 'Afvist',
};

const statusVariants: Record<OfferStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: 'outline',
  sent: 'secondary',
  accepted: 'default',
  rejected: 'destructive',
};

const getDefaultValidUntil = () => {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
};

const migrateOffer = (offer: Offer): Offer => {
  let migrated = offer;
  if (!offer.items || !Array.isArray(offer.items)) {
    migrated = {
      ...offer,
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
  return migrated;
};

interface OfferPanelProps {
  addTask?: (machineId: string, task: Task) => void;
}

const OfferPanel: React.FC<OfferPanelProps> = ({ addTask: addTaskProp }) => {
  const navigate = useNavigate();
  const { machines, addTask: addTaskFromHook } = useMachines();
  const addTask = addTaskProp ?? addTaskFromHook;
  const { parts: inventoryParts, decreaseQuantity } = useInventory();
  const { addInvoice, invoices } = useInvoices();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState(getDefaultValidUntil());
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<OfferStatus>('draft');
  const [machineId, setMachineId] = useState('');
  const [items, setItems] = useState<OfferItem[]>([{ id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  const [parts, setParts] = useState<OfferPart[]>([]);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);
  const [offerToConvert, setOfferToConvert] = useState<Offer | null>(null);
  const [selectedMachineForProject, setSelectedMachineForProject] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Offer[];
        setOffers(migrateOffers(parsed));
      } catch {
        setOffers([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(offers));
  }, [offers]);

  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
  }, [offers]);

  const totalFromItems = (itemsList: OfferItem[]) => {
    return itemsList.reduce((sum, item) => sum + (item.totalPrice ?? item.quantity * item.unitPrice), 0);
  };

  const totalFromParts = (partsList: OfferPart[]) => {
    return partsList.reduce((sum, p) => sum + (p.totalPrice ?? p.quantity * p.unitPrice), 0);
  };

  const resetForm = () => {
    setCustomerName('');
    setTitle('');
    setValidUntil(getDefaultValidUntil());
    setNotes('');
    setStatus('draft');
    setMachineId('');
    setItems([{ id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
    setParts([]);
    setEditingOffer(null);
  };

  const openEditDialog = (offer: Offer) => {
    const migrated = migrateOffer(offer);
    setEditingOffer(migrated);
    setCustomerName(migrated.customerName);
    setTitle(migrated.title);
    setValidUntil(migrated.validUntil.slice(0, 10));
    setNotes(migrated.notes || '');
    setStatus(migrated.status);
    setMachineId(migrated.machineId || '');
    setItems(migrated.items.length ? migrated.items : [{ id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
    setParts(migrated.parts || []);
    setShowEditDialog(true);
  };

  const addPartFromInventory = (invPart: { id: string; name: string; partNumber: string; unitPrice: number }) => {
    if (parts.some(p => p.inventoryPartId === invPart.id)) {
      toast({ variant: "destructive", title: "Allerede tilføjet", description: "Denne reservedel er allerede i tilbuddet." });
      return;
    }
    const newPart: OfferPart = {
      id: `op-${Date.now()}`,
      inventoryPartId: invPart.id,
      name: invPart.name,
      partNumber: invPart.partNumber,
      quantity: 1,
      unitPrice: invPart.unitPrice,
      totalPrice: invPart.unitPrice,
    };
    setParts(prev => [...prev, newPart]);
  };

  const addCustomPart = () => {
    setParts(prev => [...prev, {
      id: `op-${Date.now()}`,
      name: '',
      partNumber: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    }]);
  };

  const updatePart = (index: number, field: keyof OfferPart, value: string | number) => {
    setParts(prev => {
      const next = [...prev];
      const p = { ...next[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') p.totalPrice = p.quantity * p.unitPrice;
      next[index] = p;
      return next;
    });
  };

  const removePart = (index: number) => setParts(prev => prev.filter((_, i) => i !== index));

  const addItem = () => {
    setItems(prev => [...prev, { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  };

  const updateItem = (index: number, field: keyof OfferItem, value: string | number) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        item.totalPrice = item.quantity * item.unitPrice;
      }
      next[index] = item;
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveOffer = () => {
    const validItems = items.filter(i => i.description.trim());
    if (!customerName.trim() || !title.trim()) {
      toast({
        variant: "destructive",
        title: "Udfyld manglende felter",
        description: "Angiv kunde og titel for tilbuddet.",
      });
      return;
    }
    if (validItems.length === 0 && parts.length === 0) {
      toast({
        variant: "destructive",
        title: "Tilføj indhold",
        description: "Tilføj mindst én linje eller reservedel.",
      });
      return;
    }

    const validParts = parts.filter(p => p.name.trim());
    const total = totalFromItems(validItems) + totalFromParts(validParts);
    const machine = machineId ? machines.find(m => m.id === machineId) : undefined;

    const justAccepted = status === 'accepted' && (!editingOffer || editingOffer.status !== 'accepted');

    if (editingOffer) {
      const updated: Offer = {
        ...editingOffer,
        title: title.trim(),
        customerName: customerName.trim(),
        amount: total,
        status,
        validUntil: new Date(validUntil).toISOString(),
        updatedAt: new Date().toISOString(),
        notes: notes.trim() || undefined,
        machineId: machineId || undefined,
        machineName: machine?.name,
        items: validItems.map((i, idx) => ({ ...i, id: i.id || `item-${idx}` })),
        parts: validParts.map((p, idx) => ({ ...p, id: p.id || `op-${idx}` })),
      };
      setOffers(prev => prev.map(o => o.id === editingOffer.id ? updated : o));
      if (justAccepted) {
        validParts.forEach(p => {
          if (p.inventoryPartId) decreaseQuantity(p.inventoryPartId, p.quantity);
        });
      }
      toast({ title: "Tilbud opdateret", description: `Tilbuddet til ${updated.customerName} er gemt.` });
    } else {
      const newOffer: Offer = {
        id: `offer-${Date.now()}`,
        offerNumber: getNextOfferNumber(offers),
        title: title.trim(),
        customerName: customerName.trim(),
        amount: total,
        status,
        validUntil: new Date(validUntil).toISOString(),
        createdAt: new Date().toISOString(),
        notes: notes.trim() || undefined,
        machineId: machineId || undefined,
        machineName: machine?.name,
        items: validItems.map((i, idx) => ({ ...i, id: i.id || `item-${idx}` })),
        parts: validParts.map((p, idx) => ({ ...p, id: p.id || `op-${idx}` })),
      };
      setOffers(prev => [newOffer, ...prev]);
      if (justAccepted) {
        validParts.forEach(p => {
          if (p.inventoryPartId) decreaseQuantity(p.inventoryPartId, p.quantity);
        });
      }
      toast({ title: "Tilbud oprettet", description: `Tilbuddet til ${newOffer.customerName} er gemt.` });
    }

    resetForm();
    setShowEditDialog(false);
  };

  const handleAddOffer = () => {
    setEditingOffer(null);
    resetForm();
    setItems([{ id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
    setParts([]);
    setShowEditDialog(true);
  };

  const handleDeleteOffer = (offerId: string) => {
    setOffers(prev => prev.filter(offer => offer.id !== offerId));
    toast({ title: "Tilbud slettet", description: "Tilbuddet er blevet fjernet." });
  };

  const openCreateProjectDialog = (offer: Offer) => {
    const migrated = migrateOffer(offer);
    if (migrated.machineId && machines.some(m => m.id === migrated.machineId)) {
      createProjectFromOffer(migrated, migrated.machineId);
      return;
    }
    setOfferToConvert(migrated);
    setShowCreateProjectDialog(true);
  };

  const createProjectFromOffer = (offerOrNull: Offer | null, selectedMachineId: string) => {
    const source = offerOrNull ?? offerToConvert;
    if (!source) return;
    const offer = migrateOffer(source);
    const machine = machines.find(m => m.id === selectedMachineId);
    if (!machine) {
      toast({ variant: "destructive", title: "Fejl", description: "Vælg en maskine." });
      return;
    }

    const itemsTotal = totalFromItems(offer.items || []);
    const partsTotal = totalFromParts(offer.parts || []);
    const totalAmount = itemsTotal + partsTotal;
    const hourlyRate = 750;
    const estimatedHours = itemsTotal > 0 ? Math.max(1, Math.round(totalAmount / hourlyRate)) : 2;

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: offer.title,
      description: offer.notes || `Projekt fra tilbud til ${offer.customerName}`,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      equipmentType: (machine.equipment?.[0]?.type as Task['equipmentType']) || 'truck',
      customerName: offer.customerName,
      hourlyRate,
      estimatedHours,
      offerId: offer.id,
    };

    addTask(machine.id, newTask);
    setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, taskId: newTask.id } : o));
    setShowCreateProjectDialog(false);
    setOfferToConvert(null);
    setSelectedMachineForProject('');

    toast({
      title: "Projekt oprettet",
      description: `Tilbuddet er nu et igangværende projekt. Du kan tildele det til en tekniker under Opgaver.`,
    });
    navigate('/dashboard?tab=tasks');
  };

  const canEditOffer = (offer: Offer) => offer.status === 'draft' || offer.status === 'sent';

  const customerSuggestions = useMemo(() => {
    const names = new Set<string>();
    offers.forEach(o => o.customerName?.trim() && names.add(o.customerName.trim()));
    invoices.forEach(inv => inv.customerName?.trim() && names.add(inv.customerName.trim()));
    return Array.from(names).sort();
  }, [offers, invoices]);

  const createInvoiceFromOffer = (offer: Offer) => {
    const migrated = migrateOffer(offer);
    const items: InvoiceItem[] = [];
    (migrated.items || []).forEach((item, i) => {
      if (item.description.trim()) {
        items.push({
          id: `item-${offer.id}-${i}`,
          type: 'service',
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice ?? item.quantity * item.unitPrice,
        });
      }
    });
    (migrated.parts || []).forEach((p, i) => {
      items.push({
        id: `part-${offer.id}-${i}`,
        type: 'part',
        description: p.name,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        totalPrice: p.totalPrice ?? p.quantity * p.unitPrice,
      });
    });
    const subtotal = items.reduce((s, i) => s + (i.totalPrice ?? 0), 0);
    const vat = subtotal * 0.25;
    const total = subtotal + vat;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const inv = addInvoice({
      customerId: 'default',
      customerName: offer.customerName,
      date: new Date().toISOString(),
      dueDate: dueDate.toISOString(),
      status: 'draft',
      items,
      subtotal,
      vat,
      total,
      notes: offer.notes,
      offerId: offer.id,
      machineId: offer.machineId,
    });
    setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, invoiceId: inv.id } : o));
    toast({
      title: "Faktura oprettet",
      description: `Fakturaen er gemt. Gå til Fakturaer for at downloade PDF.`,
    });
    navigate('/invoices');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Tilbud</CardTitle>
          <CardDescription>Opret og rediger tilbud. Tilføj linjer og kobl til maskiner.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={handleAddOffer}>
            <Plus className="h-4 w-4 mr-2" />
            Opret nyt tilbud
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tilbud</CardTitle>
          <CardDescription>Oversigt over gemte tilbud. Klik på Rediger for at tilføje flere linjer eller ændre.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedOffers.length === 0 && (
            <div className="text-sm text-muted-foreground">Ingen tilbud endnu.</div>
          )}
          {sortedOffers.map(offer => (
            <div key={offer.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium truncate">{offer.title}</span>
                  {offer.offerNumber && (
                    <span className="text-xs text-muted-foreground font-mono">{offer.offerNumber}</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground truncate">{offer.customerName}</div>
                {offer.machineName && offer.machineId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/machine/${offer.machineId}`)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    {offer.machineName}
                  </button>
                )}
                <div className="text-sm">
                  Gyldig til {new Date(offer.validUntil).toLocaleDateString('da-DK')}
                </div>
                {offer.notes && (
                  <div className="text-sm text-muted-foreground">{offer.notes}</div>
                )}
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <Badge variant={statusVariants[offer.status]}>
                  {statusLabels[offer.status]}
                </Badge>
                <div className="font-semibold">{formatCurrency(offer.amount)}</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generateOfferPdf(migrateOffer(offer))}
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!printOffer(migrateOffer(offer))) {
                        toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke åbne udskriftsvindue." });
                      }
                    }}
                    title="Udskriv"
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Udskriv
                  </Button>
                  {offer.status === 'accepted' && !offer.taskId && (
                    <Button size="sm" variant="secondary" onClick={() => openCreateProjectDialog(offer)}>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Opret projekt
                    </Button>
                  )}
                  {offer.status === 'accepted' && offer.taskId && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard?tab=tasks')}>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Se projekt
                    </Button>
                  )}
                  {offer.status === 'accepted' && !offer.invoiceId && (
                    <Button size="sm" onClick={() => createInvoiceFromOffer(offer)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Opret faktura
                    </Button>
                  )}
                  {offer.invoiceId && (
                    <Button variant="outline" size="sm" onClick={() => navigate('/invoices')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Se faktura
                    </Button>
                  )}
                  {canEditOffer(offer) && (
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(offer)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Rediger
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteOffer(offer.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Slet
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOffer ? 'Rediger tilbud' : 'Nyt tilbud'}</DialogTitle>
            <DialogDescription>
              {editingOffer ? 'Tilføj ekstra linjer eller ændre oplysninger.' : 'Udfyld felterne og tilføj linjer.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kunde</label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Søg eller indtast kundenavn"
                  list="customer-suggestions"
                  className="w-full"
                />
                <datalist id="customer-suggestions">
                  {customerSuggestions.map(name => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Titel</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tilbudstitel" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Maskine (valgfrit)</label>
              <Select value={machineId || 'none'} onValueChange={(v) => setMachineId(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg maskine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen maskine</SelectItem>
                  {machines.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Gyldig til</label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={(value: OfferStatus) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Kladde</SelectItem>
                  <SelectItem value="sent">Sendt</SelectItem>
                  <SelectItem value="accepted">Accepteret</SelectItem>
                  <SelectItem value="rejected">Afvist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Linjer</label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tilføj linje
                </Button>
              </div>
              <div className="space-y-2 rounded-lg border p-3">
                {items.map((item, index) => (
                  <div key={item.id} className="grid gap-2 grid-cols-1 sm:grid-cols-[1fr,70px,90px,90px,auto] items-end">
                    <Input
                      placeholder="Beskrivelse"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Antal"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Pris"
                      value={item.unitPrice || ''}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                    <div className="text-sm font-medium py-2">
                      {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="text-right font-semibold">
                Linjer: {formatCurrency(totalFromItems(items.filter(i => i.description.trim())))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Reservedele
                </label>
                <div className="flex gap-2">
                  {inventoryParts.length > 0 && (
                    <Select key={parts.length} value="__none__" onValueChange={(id) => {
                      if (id === '__none__') return;
                      const p = inventoryParts.find(x => x.id === id);
                      if (p) addPartFromInventory(p);
                    }}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Vælg fra lager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Vælg fra lager</SelectItem>
                        {inventoryParts.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.partNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={addCustomPart}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tilføj manuelt
                  </Button>
                </div>
              </div>
              {parts.length > 0 && (
                <div className="space-y-2 rounded-lg border p-3">
                  {parts.map((part, index) => (
                    <div key={part.id} className="grid gap-2 grid-cols-1 sm:grid-cols-[1fr,80px,70px,90px,90px,auto] items-end">
                      <Input
                        placeholder="Navn"
                        value={part.name}
                        onChange={(e) => updatePart(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Art.nr"
                        value={part.partNumber}
                        onChange={(e) => updatePart(index, 'partNumber', e.target.value)}
                      />
                      <Input
                        type="number"
                        min="1"
                        placeholder="Antal"
                        value={part.quantity || ''}
                        onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Pris"
                        value={part.unitPrice || ''}
                        onChange={(e) => updatePart(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                      <div className="text-sm font-medium py-2">
                        {formatCurrency((part.quantity || 0) * (part.unitPrice || 0))}
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePart(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="text-right text-sm text-muted-foreground">
                    Reservedele: {formatCurrency(totalFromParts(parts))}
                  </div>
                </div>
              )}
              <div className="text-right font-semibold">
                Total: {formatCurrency(totalFromItems(items.filter(i => i.description.trim())) + totalFromParts(parts))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Noter</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tilføj noter til tilbuddet..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); resetForm(); }}>
              Annuller
            </Button>
            <Button onClick={handleSaveOffer}>
              {editingOffer ? 'Gem ændringer' : 'Opret tilbud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateProjectDialog} onOpenChange={(open) => !open && (setShowCreateProjectDialog(false), setOfferToConvert(null), setSelectedMachineForProject(''))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opret projekt fra tilbud</DialogTitle>
            <DialogDescription>
              Projektet vises under Opgaver, hvor du kan tildele en tekniker og justere timer/reservedele hvis det grove estimat afviger fra det faktiske.
            </DialogDescription>
          </DialogHeader>
          {offerToConvert && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 bg-muted/50">
                <div className="font-medium">{offerToConvert.title}</div>
                <div className="text-sm text-muted-foreground">{offerToConvert.customerName}</div>
              </div>
              {!offerToConvert.machineId ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vælg maskine</label>
                    <Select value={selectedMachineForProject} onValueChange={setSelectedMachineForProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vælg maskine til projekt" />
                      </SelectTrigger>
                      <SelectContent>
                        {machines.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setShowCreateProjectDialog(false); setOfferToConvert(null); setSelectedMachineForProject(''); }}>
                      Annuller
                    </Button>
                    <Button onClick={() => selectedMachineForProject && createProjectFromOffer(null, selectedMachineForProject)} disabled={!selectedMachineForProject}>
                      Opret projekt
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setShowCreateProjectDialog(false); setOfferToConvert(null); }}>
                    Annuller
                  </Button>
                  <Button onClick={() => createProjectFromOffer(null, offerToConvert.machineId)}>
                    Opret projekt
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfferPanel;
