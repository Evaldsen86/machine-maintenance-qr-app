import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { toast } from 'react-hot-toast';
import { machineService } from '../../lib/supabase';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../constants';
import QRCode from 'qrcode';

interface MachineQRSectionProps {
  machineId: string;
  machineName: string;
}

export default function MachineQRSection({ machineId, machineName }: MachineQRSectionProps) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    generateQRCode();
  }, [machineId]);

  const generateQRCode = async () => {
    try {
      setIsLoading(true);
      
      // Get QR data from Supabase
      const qrData = await machineService.generateQRCode(machineId);
      
      // Generate QR code image
      const qrImageUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300
      });
      
      setQrImage(qrImageUrl);
      setRetryCount(0);
    } catch (error) {
      console.error('QR generation error:', error);
      
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(generateQRCode, 1000 * (retryCount + 1));
      } else {
        toast.error(ERROR_MESSAGES.QR_CODE_GENERATION_FAILED);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (!qrImage) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups for this site.');
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${machineName}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            img { max-width: 300px; }
            h2 { margin-top: 20px; }
          </style>
        </head>
        <body>
          <img src="${qrImage}" alt="QR Code for ${machineName}" />
          <h2>${machineName}</h2>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
  };

  const handleDownload = () => {
    if (!qrImage) return;
    
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `qr-code-${machineName.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!qrImage) return;
    
    try {
      if (navigator.share) {
        const blob = await (await fetch(qrImage)).blob();
        const file = new File([blob], `qr-code-${machineName}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `QR Code for ${machineName}`,
          text: `Scan this QR code to access information about ${machineName}`,
          files: [file]
        });
      } else {
        // Fallback for browsers that don't support the Web Share API
        const shareUrl = window.location.href;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share QR code');
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">QR Code</h3>
      
      <div className="flex flex-col items-center gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : qrImage ? (
          <>
            <img src={qrImage} alt={`QR Code for ${machineName}`} className="max-w-full h-auto" />
            <div className="flex gap-2 mt-4">
              <Button onClick={handlePrint} variant="outline">Print</Button>
              <Button onClick={handleDownload} variant="outline">Download</Button>
              <Button onClick={handleShare} variant="outline">Share</Button>
            </div>
          </>
        ) : (
          <div className="text-center p-4">
            <p className="text-red-500">Failed to generate QR code</p>
            <Button onClick={generateQRCode} variant="outline" className="mt-2">Retry</Button>
          </div>
        )}
      </div>
    </Card>
  );
}
