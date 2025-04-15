import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { machineService } from '@/lib/supabase';
import { QrScanner } from '@yudiel/react-qr-scanner';

interface QRCodeManagerProps {
  machineId: string;
  onScan?: (data: any) => void;
}

export const QRCodeManager: React.FC<QRCodeManagerProps> = ({ machineId, onScan }) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    generateQRCode();
  }, [machineId]);

  const generateQRCode = async () => {
    try {
      const qrData = await machineService.generateQRCode(machineId);
      // Convert the QR data to a string
      const qrString = JSON.stringify(qrData);
      setQrCode(qrString);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate QR code',
        variant: 'destructive',
      });
    }
  };

  const handleScan = async (result: string | null) => {
    if (!result) return;

    try {
      const qrData = JSON.parse(result);
      const validatedMachine = await machineService.validateQRCode(qrData);
      
      if (onScan) {
        onScan(validatedMachine);
      }

      toast({
        title: 'Success',
        description: 'QR code scanned successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Invalid QR code',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleError = (error: Error) => {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    });
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {qrCode && (
          <div className="flex flex-col items-center space-y-2">
            <h3 className="text-lg font-semibold">Machine QR Code</h3>
            <div className="p-4 bg-white rounded-lg">
              {/* Here you would use your preferred QR code generation library */}
              {/* For example, using qrcode.react: */}
              {/* <QRCode value={qrCode} size={200} /> */}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                // Implement download functionality
                const blob = new Blob([qrCode], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `machine-${machineId}-qr.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              Download QR Code
            </Button>
          </div>
        )}

        <div className="flex flex-col items-center space-y-2">
          <Button
            variant={isScanning ? "destructive" : "default"}
            onClick={() => setIsScanning(!isScanning)}
          >
            {isScanning ? "Stop Scanning" : "Start Scanning"}
          </Button>

          {isScanning && (
            <div className="w-full max-w-sm">
              <QrScanner
                onDecode={handleScan}
                onError={handleError}
                constraints={{ facingMode: 'environment' }}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}; 