import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { CameraIcon, FlipVertical } from 'lucide-react';

interface ScannerViewProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function ScannerView({ onScan, onClose }: ScannerViewProps) {
  const [manualInput, setManualInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const { toast } = useToast();
  const qrScannerId = 'qr-reader';

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(qrScannerId);
    
    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onScan(decodedText);
            html5QrCode.stop();
          },
          (errorMessage) => {
            console.error(errorMessage);
          }
        );
      } catch (err) {
        console.error('Error starting scanner:', err);
      }
    };

    startScanner();

    return () => {
      html5QrCode.stop().catch(console.error);
    };
  }, [onScan]);

  const handleScan = (data: string | null) => {
    if (data) {
      onScan(data);
    }
  };

  const handleError = (error: Error) => {
    console.error('Scanner error:', error);
    setCameraError(error.message);
    
    let errorMessage = 'Der opstod en fejl med kameraet';
    
    if (error.message.includes('Permission')) {
      errorMessage = 'Kameraadgang blev nægtet. Giv venligst tilladelse til at bruge kameraet.';
    } else if (error.message.includes('NotFound')) {
      errorMessage = 'Intet kamera fundet. Sørg for, at din enhed har et kamera.';
    } else if (error.message.includes('NotReadable')) {
      errorMessage = 'Kameraet er i brug af en anden app. Luk andre apps, der bruger kameraet.';
    }
    
    toast({
      title: 'Scanner Fejl',
      description: errorMessage,
      variant: 'destructive',
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput) {
      onScan(manualInput);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setCameraError(null);
    setIsLoading(true);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <Tabs defaultValue="scanner" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scanner">Scan QR</TabsTrigger>
          <TabsTrigger value="manual">Manuel Indtastning</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scanner" className="mt-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
            {isLoading && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 border-4 border-t-primary border-primary/30 rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Starter kamera...</p>
                </div>
              </div>
            )}
            
            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 p-4">
                <div className="flex flex-col items-center space-y-4 text-center">
                  <CameraIcon className="h-8 w-8 text-destructive" />
                  <p className="text-sm text-destructive">{cameraError}</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setCameraError(null);
                      setIsLoading(true);
                    }}
                  >
                    Prøv igen
                  </Button>
                </div>
              </div>
            ) : (
              <div id={qrScannerId} className="w-full" style={{ maxWidth: '500px', margin: '0 auto' }} />
            )}
          </div>
          
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleCamera}
              title={facingMode === 'environment' ? 'Skift til frontkamera' : 'Skift til bagkamera'}
            >
              <FlipVertical className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter QR code manually"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
            />
            <div className="flex space-x-2">
              <Button type="submit" disabled={!manualInput}>
                Submit
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
