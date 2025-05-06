import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Download, Printer, Share2 } from 'lucide-react';
import QRCode from 'qrcode';

interface MachineQRSectionProps {
  machineId: number;
  machineName: string;
}

export const MachineQRSection: React.FC<MachineQRSectionProps> = ({ machineId, machineName }) => {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setLoading(true);
        // Create a more detailed QR code data object
        const qrData = JSON.stringify({
          id: machineId,
          name: machineName,
          timestamp: new Date().toISOString(),
        });

        const qrDataUrl = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrImage(qrDataUrl);
        setRetryCount(0); // Reset retry count on success
      } catch (error) {
        console.error('Error generating QR code:', error);
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => generateQRCode(), 1000); // Retry after 1 second
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

    generateQRCode();
  }, [machineId, machineName, retryCount]);

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
            }
            img { max-width: 80%; height: auto; }
            h1 { font-family: Arial, sans-serif; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${machineName}</h1>
          <img src="${qrImage}" alt="QR Code" />
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
        </div>
      </CardContent>
    </Card>
  );
};
