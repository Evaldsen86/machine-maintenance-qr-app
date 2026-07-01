import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Part, InventoryPart } from '@/types';
import { Plus, Trash2, Search, Package } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { cn } from '@/lib/utils';

interface PartsManagerProps {
  parts: Part[];
  onPartsChange: (parts: Part[]) => void;
  machineId?: string;
}

const PartsManager: React.FC<PartsManagerProps> = ({ parts, onPartsChange, machineId }) => {
  const { parts: inventoryParts } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedInventoryPart, setSelectedInventoryPart] = useState<InventoryPart | null>(null);
  const [addQuantity, setAddQuantity] = useState(1);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualPart, setManualPart] = useState<Partial<Part>>({
    name: '',
    partNumber: '',
    quantity: 1,
    unitPrice: 0,
  });
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) return [];

    const matches = inventoryParts.filter(
      (p) =>
        p.partNumber?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    );

    if (machineId) {
      return [...matches].sort((a, b) => {
        const aLinked = a.machineIds?.includes(machineId) ? 1 : 0;
        const bLinked = b.machineIds?.includes(machineId) ? 1 : 0;
        return bLinked - aLinked || a.name.localeCompare(b.name, 'da-DK', { sensitivity: 'base' });
      });
    }

    return matches.sort((a, b) =>
      a.name.localeCompare(b.name, 'da-DK', { sensitivity: 'base' })
    );
  }, [inventoryParts, searchQuery, machineId]);

  const showSearchResults = searchFocused && searchQuery.trim().length > 0;

  const getUsedQuantity = (inventoryPartId: string) =>
    parts
      .filter((p) => p.inventoryPartId === inventoryPartId)
      .reduce((sum, p) => sum + p.quantity, 0);

  const getAvailableQuantity = (invPart: InventoryPart) =>
    Math.max(0, invPart.quantity - getUsedQuantity(invPart.id));

  const handleSelectInventoryPart = (invPart: InventoryPart) => {
    setSelectedInventoryPart(invPart);
    setAddQuantity(1);
    setSearchFocused(false);
    setSearchQuery('');
  };

  const handleAddFromInventory = () => {
    if (!selectedInventoryPart) {
      toast({
        variant: 'destructive',
        title: 'Ingen reservedel valgt',
        description: 'Søg og vælg en reservedel fra lageret.',
      });
      return;
    }

    const available = getAvailableQuantity(selectedInventoryPart);
    if (addQuantity <= 0) {
      toast({
        variant: 'destructive',
        title: 'Ugyldigt antal',
        description: 'Antal skal være større end 0.',
      });
      return;
    }
    if (addQuantity > available) {
      toast({
        variant: 'destructive',
        title: 'Ikke nok på lager',
        description: `Der er kun ${available} ${selectedInventoryPart.unit} tilgængelige på lager.`,
      });
      return;
    }

    const existing = parts.find((p) => p.inventoryPartId === selectedInventoryPart.id);
    if (existing) {
      onPartsChange(
        parts.map((p) =>
          p.inventoryPartId === selectedInventoryPart.id
            ? {
                ...p,
                quantity: p.quantity + addQuantity,
                totalPrice: (p.quantity + addQuantity) * p.unitPrice,
              }
            : p
        )
      );
    } else {
      const part: Part = {
        id: `part-${Date.now()}`,
        inventoryPartId: selectedInventoryPart.id,
        name: selectedInventoryPart.name,
        partNumber: selectedInventoryPart.partNumber,
        quantity: addQuantity,
        unitPrice: selectedInventoryPart.unitPrice,
        totalPrice: addQuantity * selectedInventoryPart.unitPrice,
      };
      onPartsChange([...parts, part]);
    }

    setSelectedInventoryPart(null);
    setAddQuantity(1);

    toast({
      title: 'Reservedel tilføjet',
      description: `${selectedInventoryPart.name} er tilføjet fra lageret.`,
    });
  };

  const handleAddManualPart = () => {
    if (!manualPart.name || !manualPart.partNumber) {
      toast({
        variant: 'destructive',
        title: 'Fejl',
        description: 'Udfyld navn og artikelnummer.',
      });
      return;
    }

    const part: Part = {
      id: `part-${Date.now()}`,
      name: manualPart.name,
      partNumber: manualPart.partNumber,
      quantity: manualPart.quantity || 1,
      unitPrice: manualPart.unitPrice || 0,
      totalPrice: (manualPart.quantity || 1) * (manualPart.unitPrice || 0),
    };

    onPartsChange([...parts, part]);
    setManualPart({ name: '', partNumber: '', quantity: 1, unitPrice: 0 });
    setShowManualEntry(false);

    toast({
      title: 'Reservedel tilføjet',
      description: `${part.name} er blevet tilføjet (ikke fra lager).`,
    });
  };

  const handleRemovePart = (partId: string) => {
    onPartsChange(parts.filter((part) => part.id !== partId));
  };

  const handleQuantityChange = (partId: string, quantity: number) => {
    const part = parts.find((p) => p.id === partId);
    if (!part) return;

    if (part.inventoryPartId) {
      const invPart = inventoryParts.find((p) => p.id === part.inventoryPartId);
      if (invPart) {
        const usedElsewhere = parts
          .filter((p) => p.inventoryPartId === part.inventoryPartId && p.id !== partId)
          .reduce((sum, p) => sum + p.quantity, 0);
        const maxAllowed = invPart.quantity - usedElsewhere;
        if (quantity > maxAllowed) {
          toast({
            variant: 'destructive',
            title: 'Ikke nok på lager',
            description: `Der er kun ${maxAllowed} ${invPart.unit} tilgængelige på lager.`,
          });
          return;
        }
      }
    }

    onPartsChange(
      parts.map((p) =>
        p.id === partId
          ? { ...p, quantity, totalPrice: quantity * p.unitPrice }
          : p
      )
    );
  };

  const handlePriceChange = (partId: string, price: number) => {
    onPartsChange(
      parts.map((part) =>
        part.id === partId
          ? { ...part, unitPrice: price, totalPrice: price * part.quantity }
          : part
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Reservedele
        </CardTitle>
        <CardDescription>
          Søg efter varenummer eller navn i lageret
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {inventoryParts.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-3">
            Ingen reservedele i lageret endnu. Tilføj varer under Lager, eller brug manuel indtastning nedenfor.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2" ref={searchRef}>
              <label className="text-sm font-medium">Søg i lager</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="Varenummer, artikelnr. eller navn..."
                  className="pl-9"
                />
                {showSearchResults && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-[280px] overflow-y-auto">
                    {searchResults.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        Ingen reservedele fundet
                      </p>
                    ) : (
                      searchResults.slice(0, 50).map((invPart) => {
                        const available = getAvailableQuantity(invPart);
                        return (
                          <button
                            key={invPart.id}
                            type="button"
                            onClick={() => handleSelectInventoryPart(invPart)}
                            className="flex w-full flex-col items-start gap-1 border-b px-3 py-2 text-left last:border-b-0 hover:bg-accent"
                          >
                            <div className="flex w-full items-center justify-between gap-2">
                              <span className="font-medium text-sm">{invPart.name}</span>
                              <Badge
                                variant={available > 0 ? 'secondary' : 'destructive'}
                                className="text-xs shrink-0"
                              >
                                {available} {invPart.unit}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Varenr: {invPart.partNumber}
                              {invPart.location ? ` · ${invPart.location}` : ''}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedInventoryPart && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                <div>
                  <div className="font-medium">{selectedInventoryPart.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Varenr: {selectedInventoryPart.partNumber} ·{' '}
                    {getAvailableQuantity(selectedInventoryPart)} {selectedInventoryPart.unit} tilgængelige
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Pris:{' '}
                    {selectedInventoryPart.unitPrice.toLocaleString('da-DK', {
                      style: 'currency',
                      currency: 'DKK',
                    })}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="space-y-1 flex-1">
                    <label className="text-sm font-medium">Antal</label>
                    <Input
                      type="number"
                      min="1"
                      max={getAvailableQuantity(selectedInventoryPart)}
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button onClick={handleAddFromInventory} className="flex-1 sm:flex-none">
                      <Plus className="h-4 w-4 mr-2" />
                      Tilføj
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedInventoryPart(null)}
                    >
                      Annuller
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setShowManualEntry((v) => !v)}
        >
          {showManualEntry ? 'Skjul manuel indtastning' : 'Tilføj manuelt (uden lager)'}
        </Button>

        {showManualEntry && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Navn</label>
              <Input
                value={manualPart.name}
                onChange={(e) => setManualPart((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Reservedelsnavn"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Artikelnummer</label>
              <Input
                value={manualPart.partNumber}
                onChange={(e) => setManualPart((prev) => ({ ...prev, partNumber: e.target.value }))}
                placeholder="Artikelnummer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Antal</label>
              <Input
                type="number"
                min="1"
                value={manualPart.quantity}
                onChange={(e) =>
                  setManualPart((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pris pr. stk.</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={manualPart.unitPrice}
                onChange={(e) =>
                  setManualPart((prev) => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={handleAddManualPart} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Tilføj manuelt
              </Button>
            </div>
          </div>
        )}

        {parts.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Tilføjede reservedele</h3>
            <div className="space-y-2">
              {parts.map((part) => (
                <div
                  key={part.id}
                  className={cn(
                    'flex flex-col gap-3 p-3 border rounded-lg sm:flex-row sm:items-center sm:justify-between'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{part.name}</span>
                      {part.inventoryPartId ? (
                        <Badge variant="outline" className="text-xs">
                          Fra lager
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Manuel
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Varenr: {part.partNumber}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm whitespace-nowrap">Antal:</label>
                      <Input
                        type="number"
                        min="1"
                        value={part.quantity}
                        onChange={(e) =>
                          handleQuantityChange(part.id, parseInt(e.target.value) || 1)
                        }
                        className="w-20"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm whitespace-nowrap">Pris:</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={part.unitPrice}
                        onChange={(e) =>
                          handlePriceChange(part.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-24"
                      />
                    </div>

                    <div className="text-right min-w-[90px] font-medium">
                      {part.totalPrice.toLocaleString('da-DK', {
                        style: 'currency',
                        currency: 'DKK',
                      })}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePart(part.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PartsManager;
