import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Download, Printer, Share2, Settings2, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
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
import { machineService, type Machine } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

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
  format: 'png' | 'svg' | 'pdf';
  includeLogo: boolean;
  logoSize: number;
  logoUrl?: string;
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
    format: 'png',
    includeLogo: false,
    logoSize: 50,
  });
  const MAX_RETRIES = 3;

  const validateLogoUrl = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) return false;
      
      const contentType = response.headers.get('content-type');
      return contentType?.startsWith('image/') || false;
    } catch {
      return false;
    }
  };

  const generateQRCode = async (options: QRCodeOptions = qrOptions) => {
    try {
      setLoading(true);
      
      // Validate logo URL if included
      if (options.includeLogo && options.logoUrl) {
        const isValidLogo = await validateLogoUrl(options.logoUrl);
        if (!isValidLogo) {
          toast({
            title: 'Ugyldigt logo',
            description: 'Logo URL er ikke et gyldigt billede',
            variant: 'destructive',
          });
          return;
        }
      }

      const qrData = JSON.stringify({
        id: machineId,
        name: machineName,
        version: '1.0',
        type: 'machine',
        timestamp: new Date().toISOString(),
        metadata: {
          format: options.format,
          errorCorrectionLevel: options.errorCorrectionLevel,
          hasLogo: options.includeLogo
        }
      });

      let qrDataUrl: string;
      
      if (options.format === 'svg') {
        qrDataUrl = await QRCode.toString(qrData, {
          type: 'svg',
          width: options.width,
          margin: options.margin,
          errorCorrectionLevel: options.errorCorrectionLevel,
          color: {
            dark: options.color.dark,
            light: options.color.light,
          },
        });
      } else {
        qrDataUrl = await QRCode.toDataURL(qrData, {
          width: options.width,
          margin: options.margin,
          errorCorrectionLevel: options.errorCorrectionLevel,
          color: {
            dark: options.color.dark,
            light: options.color.light,
          },
        });
      }

      // Add logo if enabled
      if (options.includeLogo && options.logoUrl) {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not get canvas context');

          // Load QR code image
          const qrImage = new Image();
          await new Promise((resolve, reject) => {
            qrImage.onload = resolve;
            qrImage.onerror = reject;
            qrImage.src = qrDataUrl;
          });

          // Set canvas size
          canvas.width = qrImage.width;
          canvas.height = qrImage.height;

          // Draw QR code
          ctx.drawImage(qrImage, 0, 0);

          // Load and draw logo
          const logo = new Image();
          await new Promise((resolve, reject) => {
            logo.onload = resolve;
            logo.onerror = reject;
            logo.src = options.logoUrl!;
          });

          // Calculate logo size and position
          const logoSize = (canvas.width * options.logoSize) / 100;
          const logoX = (canvas.width - logoSize) / 2;
          const logoY = (canvas.height - logoSize) / 2;

          // Draw white background for logo
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);

          // Draw logo
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

          // Convert back to data URL
          qrDataUrl = canvas.toDataURL('image/png');
        } catch (error) {
          console.error('Error adding logo to QR code:', error);
          toast({
            title: 'Fejl ved tilføjelse af logo',
            description: 'Kunne ikke tilføje logo til QR-koden',
            variant: 'destructive',
          });
        }
      }
      
      // Save QR options to Supabase
      await machineService.updateMachine(machineId, {
        qr_data: {
          ...options,
          format: options.format || 'png',
          includeLogo: options.includeLogo || false,
          logoSize: options.logoSize || 50,
        }
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
        const machine = await machineService.getMachineById(machineId);
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
              max-width: 800px;
              margin: 0 auto;
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
            .metadata {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              margin: 20px 0;
              text-align: left;
            }
            .metadata-item {
              padding: 10px;
              background: #f5f5f5;
              border-radius: 4px;
            }
            .metadata-label {
              font-weight: bold;
              color: #333;
            }
            .metadata-value {
              color: #666;
            }
            @media print {
              body { margin: 0; }
              .container { padding: 0; }
              .metadata {
                break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${machineName}</h1>
            <div class="info">Machine ID: ${machineId}</div>
            ${qrOptions.format === 'svg' ? qrImage : `<img src="${qrImage}" alt="QR Code" />`}
            <div class="metadata">
              <div class="metadata-item">
                <div class="metadata-label">Format</div>
                <div class="metadata-value">${qrOptions.format.toUpperCase()}</div>
              </div>
              <div class="metadata-item">
                <div class="metadata-label">Fejlkorrektion</div>
                <div class="metadata-value">${qrOptions.errorCorrectionLevel}</div>
              </div>
              <div class="metadata-item">
                <div class="metadata-label">Størrelse</div>
                <div class="metadata-value">${qrOptions.width}px</div>
              </div>
              <div class="metadata-item">
                <div class="metadata-label">Logo</div>
                <div class="metadata-value">${qrOptions.includeLogo ? 'Ja' : 'Nej'}</div>
              </div>
            </div>
            <div class="info">Genereret: ${new Date().toLocaleString()}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = async () => {
    if (!qrImage) return;
    
    let blob: Blob;
    let filename: string;
    let mimeType: string;
    
    if (qrOptions.format === 'svg') {
      blob = new Blob([qrImage], { type: 'image/svg+xml' });
      filename = `qr-code-${machineName.toLowerCase().replace(/\s+/g, '-')}.svg`;
      mimeType = 'image/svg+xml';
    } else if (qrOptions.format === 'pdf') {
      // Dynamisk import af jsPDF
      const jsPDFModule = await import('jspdf');
      const { jsPDF } = jsPDFModule;
      const doc = new jsPDF();
      doc.addImage(qrImage, 'PNG', 10, 10, 190, 190);
      blob = doc.output('blob');
      filename = `qr-code-${machineName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      mimeType = 'application/pdf';
    } else {
      blob = new Blob([qrImage], { type: 'image/png' });
      filename = `qr-code-${machineName.toLowerCase().replace(/\s+/g, '-')}.png`;
      mimeType = 'image/png';
    }
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.type = mimeType;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    toast({
      title: 'QR-kode downloadet',
      description: 'QR-koden er gemt på din enhed',
    });
  };

  const handleShare = async () => {
    if (!qrImage) return;
    try {
      let blob: Blob;
      let filename: string;
      
      if (qrOptions.format === 'svg') {
        blob = new Blob([qrImage], { type: 'image/svg+xml' });
        filename = `qr-code-${machineName}.svg`;
      } else {
        blob = await fetch(qrImage).then(r => r.blob());
        filename = `qr-code-${machineName}.${qrOptions.format}`;
      }
      
      const file = new File([blob], filename, { type: blob.type });
      
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
          qrOptions.format === 'svg' ? (
            <div 
              className={cn(
                "w-[300px] h-[300px] overflow-auto max-h-[90vh]",
              )}
              dangerouslySetInnerHTML={{ __html: qrImage }}
            />
          ) : (
            <img src={qrImage} alt="QR Code" className="w-[300px] h-[300px]" />
          )
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
            <DialogContent className={cn(
              "overflow-auto max-h-[90vh]",
            )}>
              <DialogHeader>
                <DialogTitle>Tilpas QR-kode</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general">Generelt</TabsTrigger>
                  <TabsTrigger value="appearance">Udseende</TabsTrigger>
                  <TabsTrigger value="advanced">Avanceret</TabsTrigger>
                </TabsList>
                <TabsContent value="general" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select
                      value={qrOptions.format}
                      onValueChange={(value: 'png' | 'svg' | 'pdf') =>
                        handleCustomize({ format: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vælg format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="svg">SVG</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                </TabsContent>
                <TabsContent value="appearance" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fejlkorrektion</Label>
                    <Select
                      value={qrOptions.errorCorrectionLevel}
                      onValueChange={(value: 'L' | 'M' | 'Q' | 'H') =>
                        handleCustomize({ errorCorrectionLevel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vælg fejlkorrektion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Lav (7%)</SelectItem>
                        <SelectItem value="M">Medium (15%)</SelectItem>
                        <SelectItem value="Q">Kvart (25%)</SelectItem>
                        <SelectItem value="H">Høj (30%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Farver</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Mørk</Label>
                        <Input
                          type="color"
                          value={qrOptions.color.dark}
                          onChange={(e) =>
                            handleCustomize({
                              color: { ...qrOptions.color, dark: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Lys</Label>
                        <Input
                          type="color"
                          value={qrOptions.color.light}
                          onChange={(e) =>
                            handleCustomize({
                              color: { ...qrOptions.color, light: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="advanced" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-logo"
                      checked={qrOptions.includeLogo}
                      onCheckedChange={(checked) =>
                        handleCustomize({ includeLogo: checked })
                      }
                    />
                    <Label htmlFor="include-logo">Inkluder logo</Label>
                  </div>
                  {qrOptions.includeLogo && (
                    <>
                      <div className="space-y-2">
                        <Label>Logo URL</Label>
                        <Input
                          type="url"
                          value={qrOptions.logoUrl || ''}
                          onChange={(e) =>
                            handleCustomize({ logoUrl: e.target.value })
                          }
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Logo størrelse</Label>
                        <Slider
                          value={[qrOptions.logoSize]}
                          onValueChange={([value]) =>
                            handleCustomize({ logoSize: value })
                          }
                          min={30}
                          max={100}
                          step={5}
                        />
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default MachineQRSection;
