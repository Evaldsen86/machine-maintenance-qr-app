import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { Upload, FileSpreadsheet } from 'lucide-react';
import { InventoryPart } from '@/types';

const BATCH_SIZE = 5000;

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === ',' && !inQuotes) || c === ';') {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
};

const defaultColumns = ['name', 'partNumber', 'quantity', 'minQuantity', 'unit', 'unitPrice', 'location'];

interface InventoryImportProps {
  onImport: (parts: InventoryPart[]) => Promise<void>;
}

const InventoryImport: React.FC<InventoryImportProps> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.csv') && !f.name.endsWith('.txt')) {
      toast({
        variant: "destructive",
        title: "Forkert filtype",
        description: "Vælg en CSV-fil (fx fra Nextgen Atom export).",
      });
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      const text = (reader.result as string).split('\n')[0] || '';
      const cols = parseCsvLine(text);
      setHeaders(cols);
      const map: Record<string, string> = {};
      cols.forEach((h, i) => {
        const lower = h.toLowerCase();
        if (lower.includes('navn') || lower.includes('name')) map[h] = 'name';
        else if (lower.includes('art') || lower.includes('part') || lower.includes('nummer')) map[h] = 'partNumber';
        else if (lower.includes('antal') || lower.includes('quantity') || lower.includes('beholdning')) map[h] = 'quantity';
        else if (lower.includes('min') || lower.includes('minimum')) map[h] = 'minQuantity';
        else if (lower.includes('enhed') || lower.includes('unit')) map[h] = 'unit';
        else if (lower.includes('pris') || lower.includes('price')) map[h] = 'unitPrice';
        else if (lower.includes('placering') || lower.includes('location')) map[h] = 'location';
      });
      setColumnMap(map);
    };
    reader.readAsText(f, 'UTF-8');
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setProgress(0);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      const headerLine = lines[0];
      const dataLines = lines.slice(1);
      const headerCols = parseCsvLine(headerLine);

      const parts: InventoryPart[] = [];
      const getValByField = (row: string[], field: string) => {
        const header = Object.keys(columnMap).find(k => columnMap[k] === field);
        if (!header) return '';
        const idx = headerCols.indexOf(header);
        return idx >= 0 ? row[idx]?.trim() || '' : '';
      };

      for (let i = 0; i < dataLines.length; i++) {
        const row = parseCsvLine(dataLines[i]);
        let name = getValByField(row, 'name');
        let partNumber = getValByField(row, 'partNumber');
        if (!name && !partNumber) {
          name = row[0] || '';
          partNumber = row[1] || row[0] || String(i);
        }
        if (!name && !partNumber) continue;

        const quantity = parseFloat(getValByField(row, 'quantity') || '0') || 0;
        const minQuantity = parseFloat(getValByField(row, 'minQuantity') || '0') || 0;
        const unitPrice = parseFloat(getValByField(row, 'unitPrice') || '0') || 0;
        const unit = getValByField(row, 'unit') || 'stk';
        const location = getValByField(row, 'location') || '';

        parts.push({
          id: `inv-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`,
          name: name || partNumber || 'Ukendt',
          partNumber: partNumber || name || String(i),
          quantity,
          minQuantity,
          unit,
          unitPrice,
          location: location || undefined,
          machineIds: [],
        });
      }

      for (let i = 0; i < parts.length; i += BATCH_SIZE) {
        const batch = parts.slice(i, i + BATCH_SIZE);
        await onImport(batch);
        setProgress(Math.round(((i + batch.length) / parts.length) * 100));
      }

      toast({
        title: "Import fuldført",
        description: `${parts.length} reservedele er importeret fra ${file.name}.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Import fejlede",
        description: String(err),
      });
    } finally {
      setImporting(false);
      setProgress(100);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Import fra Nextgen Atom
        </CardTitle>
        <CardDescription>
          Eksporter data fra Nextgen Atom som CSV og vælg filen her. Du kan importere store mængder (fx 14 mio. dele) – importen kører i batches.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Vælg CSV-fil</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileSelect}
            className="block w-full text-sm"
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Valgt: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {headers.length > 0 && (
          <div className="space-y-2">
            <Label>Kolonnemapping</Label>
            <p className="text-xs text-muted-foreground">
              Knyt hver kolonne til et felt. Systemet har forsøgt at gætte baseret på kolonnenavne.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {headers.slice(0, 15).map(h => (
                <div key={h} className="flex items-center gap-2">
                  <span className="text-sm truncate max-w-[120px]">{h}</span>
                  <Select
                    value={columnMap[h] || '__none__'}
                    onValueChange={(v) => setColumnMap(prev => ({ ...prev, [h]: v === '__none__' ? '' : v }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Vælg felt" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Spring over —</SelectItem>
                      <SelectItem value="name">Navn</SelectItem>
                      <SelectItem value="partNumber">Artikelnummer</SelectItem>
                      <SelectItem value="quantity">Beholdning</SelectItem>
                      <SelectItem value="minQuantity">Minimum</SelectItem>
                      <SelectItem value="unit">Enhed</SelectItem>
                      <SelectItem value="unitPrice">Pris</SelectItem>
                      <SelectItem value="location">Placering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {headers.length > 15 && (
              <p className="text-xs text-muted-foreground">+ {headers.length - 15} flere kolonner</p>
            )}
          </div>
        )}

        {importing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">Importerer... {progress}%</p>
          </div>
        )}

        <Button
          onClick={handleImport}
          disabled={!file || importing}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {importing ? 'Importerer...' : 'Start import'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default InventoryImport;
