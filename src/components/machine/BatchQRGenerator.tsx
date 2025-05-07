import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Download, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import { Machine } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import JSZip from 'jszip';

interface BatchQRGeneratorProps {
  machines: Machine[];
}

interface QRCodeOptions {
  width: number;
  margin: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  color: {
    dark: string;
    light: string;
  };
}

export const BatchQRGenerator: React.FC<BatchQRGeneratorProps> = ({ machines }) => {
  const [selectedMachines, setSelectedMachines] = useState<Set<string>>(new Set());
  const [qrOptions, setQrOptions] = useState<QRCodeOptions>({
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
  const [generatedQRCodes, setGeneratedQRCodes] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);

  const handleMachineSelect = (machineId: string) => {
    const newSelected = new Set(selectedMachines);
    if (newSelected.has(machineId)) {
      newSelected.delete(machineId);
    } else {
      newSelected.add(machineId);
    }
    setSelectedMachines(newSelected);
  };

  const generateQRCodes = async () => {
    if (selectedMachines.size === 0) {
      toast({
        title: 'Ingen maskiner valgt',
        description: 'Vælg mindst én maskine for at generere QR-koder',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const newQRCodes = new Map(generatedQRCodes);

    try {
      for (const machineId of selectedMachines) {
        const machine = machines.find(m => m.id.toString() === machineId);
        if (!machine) continue;

        const qrData = JSON.stringify({
          id: machine.id,
          name: machine.name,
          timestamp: new Date().toISOString(),
          version: '1.0',
          type: 'machine',
        });

        const qrDataUrl = await QRCode.toDataURL(qrData, {
          width: qrOptions.width,
          margin: qrOptions.margin,
          errorCorrectionLevel: qrOptions.errorCorrectionLevel,
          color: qrOptions.color,
        });

        newQRCodes.set(machineId, qrDataUrl);
      }

      setGeneratedQRCodes(newQRCodes);
      toast({
        title: 'QR-koder genereret',
        description: `${selectedMachines.size} QR-koder blev genereret`,
      });
    } catch (error) {
      console.error('Error generating QR codes:', error);
      toast({
        title: 'Fejl ved generering',
        description: 'Der opstod en fejl under generering af QR-koder',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (generatedQRCodes.size === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Kunne ikke åbne print vindue',
        description: 'Tillad venligst pop-up vinduer for denne side',
        variant: 'destructive',
      });
      return;
    }

    const qrCodesHtml = Array.from(generatedQRCodes.entries())
      .map(([machineId, qrImage]) => {
        const machine = machines.find(m => m.id.toString() === machineId);
        return `
          <div class="qr-code-container">
            <h2>${machine?.name || 'Unknown Machine'}</h2>
            <div class="info">Machine ID: ${machineId}</div>
            <img src="${qrImage}" alt="QR Code" />
            <div class="info">Generated: ${new Date().toLocaleString()}</div>
          </div>
        `;
      })
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Codes</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .qr-code-container {
              page-break-inside: avoid;
              margin-bottom: 30px;
              text-align: center;
            }
            img {
              max-width: 300px;
              height: auto;
              margin: 10px 0;
            }
            h2 {
              margin: 0 0 10px 0;
              color: #333;
            }
            .info {
              color: #666;
              margin: 5px 0;
            }
            @media print {
              body { padding: 0; }
              .qr-code-container { margin-bottom: 20px; }
            }
          </style>
        </head>
        <body>
          ${qrCodesHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = async () => {
    if (generatedQRCodes.size === 0) return;

    try {
      const zip = new JSZip();

      for (const [machineId, qrImage] of generatedQRCodes.entries()) {
        const machine = machines.find(m => m.id.toString() === machineId);
        const fileName = `qr-code-${machine?.name.toLowerCase().replace(/\s+/g, '-') || machineId}.png`;
        
        // Convert base64 to blob
        const response = await fetch(qrImage);
        const blob = await response.blob();
        
        zip.file(fileName, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'machine-qr-codes.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'QR-koder downloadet',
        description: 'Alle QR-koder er gemt i en zip-fil',
      });
    } catch (error) {
      console.error('Error downloading QR codes:', error);
      toast({
        title: 'Fejl ved download',
        description: 'Der opstod en fejl under download af QR-koder',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch QR-kode generering</CardTitle>
        <CardDescription>Generer QR-koder for flere maskiner på én gang</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Vælg maskiner</Label>
          <div className="grid grid-cols-2 gap-2">
            {machines.map((machine) => (
              <div key={machine.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`machine-${machine.id}`}
                  checked={selectedMachines.has(machine.id.toString())}
                  onCheckedChange={() => handleMachineSelect(machine.id.toString())}
                />
                <Label htmlFor={`machine-${machine.id}`}>{machine.name}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>QR-kode indstillinger</Label>
          <Select
            value={qrOptions.errorCorrectionLevel}
            onValueChange={(value: 'L' | 'M' | 'Q' | 'H') =>
              setQrOptions({ ...qrOptions, errorCorrectionLevel: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Fejlkorrektion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="L">Lav (7%)</SelectItem>
              <SelectItem value="M">Medium (15%)</SelectItem>
              <SelectItem value="Q">Kvart (25%)</SelectItem>
              <SelectItem value="H">Høj (30%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={generateQRCodes}
            disabled={selectedMachines.size === 0 || loading}
          >
            {loading ? 'Genererer...' : 'Generer QR-koder'}
          </Button>
          <Button
            onClick={handlePrint}
            disabled={generatedQRCodes.size === 0}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print alle
          </Button>
          <Button
            onClick={handleDownload}
            disabled={generatedQRCodes.size === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Download alle
          </Button>
        </div>

        {generatedQRCodes.size > 0 && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              {generatedQRCodes.size} QR-koder genereret
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 