import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Download, Printer, Share2, Settings2 } from 'lucide-react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { machineOperations, type Machine } from '@/lib/supabase';

interface MachineQRSectionProps {
  machineId: number;
  machineName: string;
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

export const MachineQRSection: React.FC<MachineQRSectionProps> = ({ machineId, machineName }) => {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false);
  const [qrOptions, setQrOptions] = useState<QRCodeOptions>({
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
  const MAX_RETRIES = 3;

  const generateQRCode = async (options: QRCodeOptions = qrOptions) => {
    try {
      setLoading(true);
      const qrData = JSON.stringify({
        id: machineId,
        name: machineName,
        timestamp: new Date().toISOString(),
        version: '1.0',
        type: 'machine',
      });

      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: options.width,
        margin: options.margin,
        errorCorrectionLevel: options.errorCorrectionLevel,
        color: options.color,
      });
      
      // Save QR options to Supabase
      await machineOperations.updateMachine(machineId, {
        qr_data: options
      });
      
      setQrImage(qrDataUrl);
      setRetryCount(0);
    } catch (error) {
      console.error('Error generating QR code:', error);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => generateQRCode(options), 1000 * (retryCount + 1));
      } else {
        toast({
          title: 'Fejl ved generering af QR-kode',
          description: 'Kunne ikke generere QR-koden efter flere forsøg. Prøv venligst igen senere.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadMachineData = async () => {
      try {
        const machine = await machineOperations.getMachine(machineId);
        if (machine.qr_data) {
          setQrOptions(machine.qr_data);
        }
        generateQRCode(machine.qr_data || qrOptions);
      } catch (error) {
        console.error('Error loading machine data:', error);
        generateQRCode();
      }
    };
    
    loadMachineData();
  }, [machineId, machineName]);

  const handlePrint = () => {
    if (!qrImage) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Kunne ikke åbne print vindue',
        description: 'Tillad venligst pop-up vinduer for denne side',
        variant: 'destructive',
      });
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${machineName}</title>
          <style>
            body { 
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .container {
              text-align: center;
              padding: 20px;
            }
            img { 
              max-width: 80%; 
              height: auto;
              margin: 20px 0;
            }
            h1 { 
              margin-bottom: 10px;
              color: #333;
            }
            .info {
              color: #666;
              margin-bottom: 20px;
            }
            @media print {
              body { margin: 0; }
              .container { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${machineName}</h1>
            <div class="info">Machine ID: ${machineId}</div>
            <img src="${qrImage}" alt="QR Code" />
            <div class="info">Generated: ${new Date().toLocaleString()}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    if (!qrImage) return;
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `qr-code-${machineName.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'QR-kode downloadet',
      description: 'QR-koden er gemt på din enhed',
    });
  };

  const handleShare = async () => {
    if (!qrImage) return;
    try {
      const blob = await fetch(qrImage).then(r => r.blob());
      const file = new File([blob], `qr-code-${machineName}.png`, { type: 'image/png' });
      
      if (navigator.share) {
        await navigator.share({
          title: `QR-kode for ${machineName}`,
          files: [file],
        });
      } else {
        toast({
          title: 'Deling ikke understøttet',
          description: 'Din enhed understøtter ikke deling',
          variant: 'destructive',
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: 'Fejl ved deling',
          description: 'Kunne ikke dele QR-koden',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCustomize = (newOptions: Partial<QRCodeOptions>) => {
    const updatedOptions = { ...qrOptions, ...newOptions };
    setQrOptions(updatedOptions);
    generateQRCode(updatedOptions);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR-kode</CardTitle>
        <CardDescription>Scan QR-koden for at få hurtig adgang til maskinen</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {loading ? (
          <div className="w-[300px] h-[300px] animate-pulse bg-muted rounded-lg" />
        ) : qrImage ? (
          <img src={qrImage} alt="QR Code" className="w-[300px] h-[300px]" />
        ) : (
          <div className="w-[300px] h-[300px] flex items-center justify-center bg-muted rounded-lg">
            Kunne ikke generere QR-kode
          </div>
        )}
        
        <div className="flex gap-2">
          <Button onClick={handlePrint} disabled={!qrImage}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleDownload} disabled={!qrImage}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button onClick={handleShare} disabled={!qrImage}>
            <Share2 className="mr-2 h-4 w-4" />
            Del
          </Button>
          <Dialog open={showCustomizeDialog} onOpenChange={setShowCustomizeDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings2 className="mr-2 h-4 w-4" />
                Tilpas
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tilpas QR-kode</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Størrelse</Label>
                  <Slider
                    value={[qrOptions.width]}
                    onValueChange={([value]) => handleCustomize({ width: value })}
                    min={200}
                    max={400}
                    step={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Margin</Label>
                  <Slider
                    value={[qrOptions.margin]}
                    onValueChange={([value]) => handleCustomize({ margin: value })}
                    min={0}
                    max={4}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Farve</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={qrOptions.color.dark}
                      onChange={(e) => handleCustomize({
                        color: { ...qrOptions.color, dark: e.target.value }
                      })}
                      className="w-12 h-12"
                    />
                    <Input
                      type="color"
                      value={qrOptions.color.light}
                      onChange={(e) => handleCustomize({
                        color: { ...qrOptions.color, light: e.target.value }
                      })}
                      className="w-12 h-12"
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default MachineQRSection;
