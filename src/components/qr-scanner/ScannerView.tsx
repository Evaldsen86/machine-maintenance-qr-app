import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff } from 'lucide-react';

interface ScannerViewProps {
  onScan: (result: string) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const startScanner = async () => {
    try {
      setIsScanning(true);
      const codeReader = new BrowserQRCodeReader();
      
      // Check for camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setHasPermission(true);
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream

      if (videoRef.current) {
        controlsRef.current = await codeReader.decodeFromVideoDevice(
          undefined, // Use default camera
          videoRef.current,
          (result) => {
            if (result) {
              try {
                const data = JSON.parse(result.getText());
                onScan(data);
                stopScanner();
              } catch (error) {
                toast({
                  title: 'Ugyldig QR-kode',
                  description: 'QR-koden indeholder ikke gyldig maskineinformation',
                  variant: 'destructive',
                });
              }
            }
          }
        );
      }
    } catch (error) {
      console.error('Scanner error:', error);
      setHasPermission(false);
      setIsScanning(false);
      
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast({
          title: 'Kamera adgang nægtet',
          description: 'Giv venligst tilladelse til at bruge kameraet for at scanne QR-koder',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Scanner fejl',
          description: 'Kunne ikke starte QR-scanner. Prøv at genindlæse siden',
          variant: 'destructive',
        });
      }
    }
  };

  const stopScanner = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden bg-muted">
        {isScanning ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Kamera er slukket
          </div>
        )}
      </div>

      <Button
        onClick={isScanning ? stopScanner : startScanner}
        variant={isScanning ? "destructive" : "default"}
        className="w-full max-w-md"
      >
        {isScanning ? (
          <>
            <CameraOff className="mr-2 h-4 w-4" />
            Stop Scanner
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            Start Scanner
          </>
        )}
      </Button>

      {hasPermission === false && (
        <p className="text-sm text-destructive text-center max-w-md">
          Kamera adgang er nægtet. Tjek venligst dine browser-indstillinger og giv tilladelse til at bruge kameraet.
        </p>
      )}
    </div>
  );
};
