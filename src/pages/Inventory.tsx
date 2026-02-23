import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useInventory } from '@/hooks/useInventory';
import { useMachines } from '@/hooks/useMachines';
import { InventoryPart } from '@/types';
import { formatCurrency } from '@/utils/currencyUtils';
import { Package, Plus, Edit, Trash2, AlertTriangle, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryImport from '@/components/inventory/InventoryImport';

const Inventory: React.FC = () => {
  const { parts, addPart, updatePart, deletePart, getLowStockParts, importBatch, refreshFromDb, searchPartsInDb, useIndexedDb } = useInventory();
  const { machines } = useMachines();
  const [showDialog, setShowDialog] = useState(false);
  const [editingPart, setEditingPart] = useState<InventoryPart | null>(null);
  const [name, setName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [minQuantity, setMinQuantity] = useState(0);
  const [unit, setUnit] = useState('stk');
  const [unitPrice, setUnitPrice] = useState(0);
  const [location, setLocation] = useState('');
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    if (!useIndexedDb) return;
    if (searchQuery.trim().length >= 2) {
      searchPartsInDb(searchQuery.trim());
    } else if (searchQuery.trim().length === 0) {
      refreshFromDb();
    }
  }, [searchQuery, useIndexedDb, searchPartsInDb, refreshFromDb]);

  const resetForm = () => {
    setName('');
    setPartNumber('');
    setQuantity(0);
    setMinQuantity(0);
    setUnit('stk');
    setUnitPrice(0);
    setLocation('');
    setSelectedMachineIds([]);
    setEditingPart(null);
  };

  const openAddDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (part: InventoryPart) => {
    setEditingPart(part);
    setName(part.name);
    setPartNumber(part.partNumber);
    setQuantity(part.quantity);
    setMinQuantity(part.minQuantity);
    setUnit(part.unit || 'stk');
    setUnitPrice(part.unitPrice);
    setLocation(part.location || '');
    setSelectedMachineIds(part.machineIds || []);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!name.trim() || !partNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Udfyld felter",
        description: "Navn og artikelnummer er påkrævet.",
      });
      return;
    }

    const partData = {
      name: name.trim(),
      partNumber: partNumber.trim(),
      quantity,
      minQuantity,
      unit,
      unitPrice,
      location: location.trim() || undefined,
      machineIds: selectedMachineIds,
    };

    if (editingPart) {
      updatePart(editingPart.id, partData);
      toast({ title: "Reservedel opdateret", description: `${name} er opdateret.` });
    } else {
      addPart(partData);
      toast({ title: "Reservedel tilføjet", description: `${name} er tilføjet til lageret.` });
    }

    setShowDialog(false);
    resetForm();
  };

  const handleDelete = (part: InventoryPart) => {
    if (window.confirm(`Er du sikker på at du vil slette ${part.name}?`)) {
      deletePart(part.id);
      toast({ title: "Reservedel slettet", description: `${part.name} er fjernet.` });
    }
  };

  const toggleMachine = (machineId: string) => {
    setSelectedMachineIds(prev =>
      prev.includes(machineId) ? prev.filter(id => id !== machineId) : [...prev, machineId]
    );
  };

  const filteredParts = useIndexedDb
    ? parts
    : parts.filter(
        p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.partNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
  const lowStockParts = getLowStockParts();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 page-container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Lagerbeholdning</h1>
          <p className="text-muted-foreground">
            Oversigt over reservedele. Import fra Nextgen Atom eller tilføj manuelt.
          </p>
        </div>

        <Tabs defaultValue="list" className="mb-6">
          <TabsList>
            <TabsTrigger value="list">Reservedele</TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="h-4 w-4 mr-2" />
              Import fra Nextgen Atom
            </TabsTrigger>
          </TabsList>
          <TabsContent value="import">
            <InventoryImport
              onImport={async (batch) => {
                await importBatch(batch);
              }}
            />
            <Button variant="outline" className="mt-4" onClick={refreshFromDb}>
              Opdater liste
            </Button>
          </TabsContent>
          <TabsContent value="list" className="mt-6">

        {lowStockParts.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                Lav beholdning
              </CardTitle>
              <CardDescription>
                {lowStockParts.length} reservedel{lowStockParts.length !== 1 ? 'er' : ''} har beholdning på eller under minimum.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lowStockParts.map(p => (
                  <Badge key={p.id} variant="outline" className="bg-amber-100">
                    {p.name}: {p.quantity} {p.unit}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Reservedele
                </CardTitle>
                <CardDescription>
                  {parts.length} dele i lageret. Søg og filtrer for at finde dele.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Søg navn eller reservedelsnr..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                  title="Søg på navn eller artikelnummer"
                />
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tilføj reservedel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Navn</th>
                    <th className="text-left p-3 font-medium">Artikelnummer</th>
                    <th className="text-right p-3 font-medium">Beholdning</th>
                    <th className="text-right p-3 font-medium">Min.</th>
                    <th className="text-left p-3 font-medium">Enhed</th>
                    <th className="text-right p-3 font-medium">Pris</th>
                    <th className="text-left p-3 font-medium">Maskiner</th>
                    <th className="w-24 p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        Ingen reservedele. Tilføj den første.
                      </td>
                    </tr>
                  ) : (
                    filteredParts.map(part => (
                      <tr key={part.id} className="border-t hover:bg-muted/30">
                        <td className="p-3 font-medium">{part.name}</td>
                        <td className="p-3 text-muted-foreground">{part.partNumber}</td>
                        <td className="p-3 text-right">
                          <span className={part.quantity <= part.minQuantity ? 'text-amber-600 font-medium' : ''}>
                            {part.quantity}
                          </span>
                        </td>
                        <td className="p-3 text-right">{part.minQuantity}</td>
                        <td className="p-3">{part.unit || 'stk'}</td>
                        <td className="p-3 text-right">{formatCurrency(part.unitPrice)}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {(part.machineIds || []).map(mid => {
                              const m = machines.find(x => x.id === mid);
                              return m ? (
                                <Badge key={mid} variant="secondary" className="text-xs">
                                  {m.name}
                                </Badge>
                              ) : null;
                            })}
                            {(!part.machineIds || part.machineIds.length === 0) && (
                              <span className="text-muted-foreground text-xs">Alle</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(part)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(part)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPart ? 'Rediger reservedel' : 'Tilføj reservedel'}</DialogTitle>
            <DialogDescription>
              {editingPart ? 'Opdater reservedelens oplysninger.' : 'Tilføj en ny reservedel til lageret.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Navn</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Reservedelsnavn" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Artikelnummer</label>
                <Input value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="Art.nr." />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Beholdning</label>
                <Input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum</label>
                <Input
                  type="number"
                  min="0"
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Enhed</label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stk">stk</SelectItem>
                    <SelectItem value="liter">liter</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="pakke">pakke</SelectItem>
                    <SelectItem value="sæt">sæt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pris pr. enhed</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Placering</label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lagerplacering" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Kob til maskiner</label>
              <p className="text-xs text-muted-foreground">Vælg maskiner denne del bruges til. Tom = alle maskiner.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {machines.map(m => (
                  <Badge
                    key={m.id}
                    variant={selectedMachineIds.includes(m.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleMachine(m.id)}
                  >
                    {m.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
              Annuller
            </Button>
            <Button onClick={handleSave}>
              {editingPart ? 'Gem ændringer' : 'Tilføj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
