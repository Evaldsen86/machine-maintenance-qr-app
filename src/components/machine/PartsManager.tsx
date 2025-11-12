import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Part } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

interface PartsManagerProps {
  parts: Part[];
  onPartsChange: (parts: Part[]) => void;
}

const PartsManager: React.FC<PartsManagerProps> = ({ parts, onPartsChange }) => {
  const [newPart, setNewPart] = useState<Partial<Part>>({
    name: '',
    partNumber: '',
    quantity: 1,
    unitPrice: 0
  });

  const handleAddPart = () => {
    if (!newPart.name || !newPart.partNumber) {
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Udfyld venligst alle felter.",
      });
      return;
    }

    const part: Part = {
      id: `part-${Date.now()}`,
      name: newPart.name,
      partNumber: newPart.partNumber,
      quantity: newPart.quantity || 1,
      unitPrice: newPart.unitPrice || 0,
      totalPrice: (newPart.quantity || 1) * (newPart.unitPrice || 0)
    };

    onPartsChange([...parts, part]);
    setNewPart({
      name: '',
      partNumber: '',
      quantity: 1,
      unitPrice: 0
    });

    toast({
      title: "Reservedel tilføjet",
      description: `${part.name} er blevet tilføjet.`,
    });
  };

  const handleRemovePart = (partId: string) => {
    onPartsChange(parts.filter(part => part.id !== partId));
  };

  const handleQuantityChange = (partId: string, quantity: number) => {
    onPartsChange(parts.map(part => {
      if (part.id === partId) {
        return {
          ...part,
          quantity,
          totalPrice: quantity * part.unitPrice
        };
      }
      return part;
    }));
  };

  const handlePriceChange = (partId: string, price: number) => {
    onPartsChange(parts.map(part => {
      if (part.id === partId) {
        return {
          ...part,
          unitPrice: price,
          totalPrice: price * part.quantity
        };
      }
      return part;
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservedele</CardTitle>
        <CardDescription>
          Tilføj reservedele brugt under arbejdet
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Navn</label>
            <Input
              value={newPart.name}
              onChange={(e) => setNewPart(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Indtast reservedelsnavn"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Artikelnummer</label>
            <Input
              value={newPart.partNumber}
              onChange={(e) => setNewPart(prev => ({ ...prev, partNumber: e.target.value }))}
              placeholder="Indtast artikelnummer"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Antal</label>
            <Input
              type="number"
              min="1"
              value={newPart.quantity}
              onChange={(e) => setNewPart(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Pris pr. stk.</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={newPart.unitPrice}
              onChange={(e) => setNewPart(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        </div>
        
        <Button 
          onClick={handleAddPart}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tilføj reservedel
        </Button>
        
        {parts.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Tilføjede reservedele</h3>
            <div className="space-y-2">
              {parts.map(part => (
                <div 
                  key={part.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{part.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {part.partNumber}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Antal:</label>
                      <Input
                        type="number"
                        min="1"
                        value={part.quantity}
                        onChange={(e) => handleQuantityChange(part.id, parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Pris:</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={part.unitPrice}
                        onChange={(e) => handlePriceChange(part.id, parseFloat(e.target.value) || 0)}
                        className="w-24"
                      />
                    </div>
                    
                    <div className="text-right min-w-[100px]">
                      <div className="font-medium">
                        {part.totalPrice.toLocaleString('da-DK', {
                          style: 'currency',
                          currency: 'DKK'
                        })}
                      </div>
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