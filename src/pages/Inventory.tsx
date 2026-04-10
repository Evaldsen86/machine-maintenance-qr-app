import React, { useState, useEffect, useMemo } from 'react';
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
import {
  getMarginPercent,
  getPurchasePrice,
  lineValuePurchase,
  lineValueRetail,
  marginFromPurchaseAndSale,
  saleFromPurchaseAndMargin,
  sortPartsForWarehouse,
  totalInventoryPurchaseValue,
  totalInventoryRetailValue,
} from '@/utils/inventoryCalculations';
import InventoryStocktake from '@/components/inventory/InventoryStocktake';
import InventoryLocationView from '@/components/inventory/InventoryLocationView';
import InventorySalesPeriod from '@/components/inventory/InventorySalesPeriod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryImport from '@/components/inventory/InventoryImport';

const Inventory: React.FC = () => {
  const { parts, saleLines, addPart, updatePart, deletePart, getLowStockParts, importBatch, refreshFromDb, searchPartsInDb, useIndexedDb } = useInventory();
  const { machines } = useMachines();
  const [showDialog, setShowDialog] = useState(false);
  const [editingPart, setEditingPart] = useState<InventoryPart | null>(null);
  const [name, setName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [minQuantity, setMinQuantity] = useState(0);
  const [unit, setUnit] = useState('stk');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [marginPercent, setMarginPercent] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('__all__');
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
    setPurchasePrice(0);
    setMarginPercent(0);
    setUnitPrice(0);
    setCategory('');
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
    setPurchasePrice(getPurchasePrice(part));
    setMarginPercent(getMarginPercent(part));
    setUnitPrice(part.unitPrice);
    setCategory(part.category || '');
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
      purchasePrice,
      marginPercent,
      unitPrice,
      category: category.trim() || undefined,
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

  const categoryOptions = useMemo(() => {
    const s = new Set<string>();
    parts.forEach(p => {
      if (p.category?.trim()) s.add(p.category.trim());
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'da-DK'));
  }, [parts]);

  const filteredParts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = useIndexedDb
      ? parts
      : parts.filter(p => {
          if (!q) return true;
          return (
            p.name.toLowerCase().includes(q) ||
            p.partNumber.toLowerCase().includes(q) ||
            (p.location || '').toLowerCase().includes(q) ||
            (p.category || '').toLowerCase().includes(q)
          );
        });
    const byCat =
      categoryFilter === '__all__'
        ? base
        : base.filter(p => (p.category || '').trim() === categoryFilter);
    return sortPartsForWarehouse(byCat);
  }, [parts, searchQuery, useIndexedDb, categoryFilter]);

  const lowStockParts = getLowStockParts();

  const totalPurchase = totalInventoryPurchaseValue(parts);
  const totalRetail = totalInventoryRetailValue(parts);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 page-container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Lagerbeholdning</h1>
          <p className="text-muted-foreground">
            Priser og placeringer, oversigt pr. lagerplads, og salg i valgfri periode (fra accepterede tilbud). Fanerne nedenfor samler det hele.
          </p>
        </div>

        <Tabs defaultValue="list" className="mb-6">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="list">Reservedele</TabsTrigger>
            <TabsTrigger value="locations">Placeringer</TabsTrigger>
            <TabsTrigger value="sales">Salg</TabsTrigger>
            <TabsTrigger value="stocktake">Optælling</TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </TabsTrigger>
          </TabsList>
          <TabsContent value="locations" className="mt-6">
            <InventoryLocationView parts={parts} />
          </TabsContent>
          <TabsContent value="sales" className="mt-6">
            <InventorySalesPeriod saleLines={saleLines} />
          </TabsContent>
          <TabsContent value="import" className="mt-6">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Værdi (indkøb)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{formatCurrency(totalPurchase)}</p>
              <p className="text-xs text-muted-foreground mt-1">Σ antal × indkøbspris for hele lageret</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Værdi (salgspris)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{formatCurrency(totalRetail)}</p>
              <p className="text-xs text-muted-foreground mt-1">Σ antal × salgspris (kundepris)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Liste-avance (kr.)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{formatCurrency(totalRetail - totalPurchase)}</p>
              <p className="text-xs text-muted-foreground mt-1">Salgsværdi minus indkøbsværdi (samme linjer)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Linjer i alt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{parts.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Antal varenumre på lagerlisten</p>
            </CardContent>
          </Card>
        </div>

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
                  {filteredParts.length} vist · {parts.length} i alt. Sorteret efter kategori og placering.
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Alle kategorier</SelectItem>
                    {categoryOptions.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Søg navn, nr., placering..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                  title="Søg på navn, artikelnummer, placering eller kategori"
                />
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tilføj reservedel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm min-w-[1100px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Kategori</th>
                    <th className="text-left p-3 font-medium">Placering</th>
                    <th className="text-left p-3 font-medium">Navn</th>
                    <th className="text-left p-3 font-medium">Artikelnr.</th>
                    <th className="text-right p-3 font-medium">Beholdn.</th>
                    <th className="text-right p-3 font-medium">Min.</th>
                    <th className="text-left p-3 font-medium">Enhed</th>
                    <th className="text-right p-3 font-medium">Indkøb</th>
                    <th className="text-right p-3 font-medium">Avance</th>
                    <th className="text-right p-3 font-medium">Salg</th>
                    <th className="text-right p-3 font-medium">Værdi indk.</th>
                    <th className="text-right p-3 font-medium">Værdi salg</th>
                    <th className="text-left p-3 font-medium">Maskiner</th>
                    <th className="w-24 p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParts.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="p-8 text-center text-muted-foreground">
                        Ingen reservedele. Tilføj den første.
                      </td>
                    </tr>
                  ) : (
                    filteredParts.map(part => (
                      <tr key={part.id} className="border-t hover:bg-muted/30">
                        <td className="p-3 text-muted-foreground max-w-[120px] truncate" title={part.category}>{part.category || '—'}</td>
                        <td className="p-3 font-mono text-xs max-w-[100px] truncate" title={part.location}>{part.location || '—'}</td>
                        <td className="p-3 font-medium">{part.name}</td>
                        <td className="p-3 text-muted-foreground">{part.partNumber}</td>
                        <td className="p-3 text-right">
                          <span className={part.quantity <= part.minQuantity ? 'text-amber-600 font-medium' : ''}>
                            {part.quantity}
                          </span>
                        </td>
                        <td className="p-3 text-right">{part.minQuantity}</td>
                        <td className="p-3">{part.unit || 'stk'}</td>
                        <td className="p-3 text-right tabular-nums">{formatCurrency(getPurchasePrice(part))}</td>
                        <td className="p-3 text-right tabular-nums">
                          {getPurchasePrice(part) > 0
                            ? `${getMarginPercent(part).toLocaleString('da-DK', { maximumFractionDigits: 1 })} %`
                            : '—'}
                        </td>
                        <td className="p-3 text-right tabular-nums">{formatCurrency(part.unitPrice)}</td>
                        <td className="p-3 text-right tabular-nums text-muted-foreground">{formatCurrency(lineValuePurchase(part))}</td>
                        <td className="p-3 text-right tabular-nums">{formatCurrency(lineValueRetail(part))}</td>
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

          <TabsContent value="stocktake" className="mt-6">
            <InventoryStocktake
              parts={parts}
              onApplyCount={(id, newQuantity) => updatePart(id, { quantity: newQuantity })}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
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
                <label className="text-sm font-medium">Kategori</label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Fx Hydraulik, A-reol"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Placering</label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Fx A-12-03" />
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-medium">Priser</p>
              <p className="text-xs text-muted-foreground">
                Indkøbspris er kostprisen. Avance er påslag i procent på indkøbet; salgsprisen er hvad kunden betaler (bruges i tilbud). Du kan også rette salgsprisen direkte — avancen beregnes om.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Indkøbspris</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={purchasePrice}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setPurchasePrice(v);
                      setUnitPrice(saleFromPurchaseAndMargin(v, marginPercent));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Avance %</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={marginPercent}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setMarginPercent(v);
                      setUnitPrice(saleFromPurchaseAndMargin(purchasePrice, v));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Salgspris (kunde)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setUnitPrice(v);
                      if (purchasePrice > 0) {
                        setMarginPercent(marginFromPurchaseAndSale(purchasePrice, v));
                      }
                    }}
                  />
                </div>
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
