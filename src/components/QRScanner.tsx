import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScannerHeader from './qr-scanner/ScannerHeader';
import { ScannerView } from './qr-scanner/ScannerView';
import ManualEntryView from './qr-scanner/ManualEntryView';
import { useQRScanner } from './qr-scanner/useQRScanner';

interface QRScannerProps {
  onClose: () => void;
  onScan?: (data: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onClose, onScan }) => {
  const { selectedTab, setSelectedTab, handleScan, machines } = useQRScanner(onClose, onScan);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden animate-scale-in">
        <ScannerHeader onClose={() => onClose()} />
        
        <Tabs 
          defaultValue="scan" 
          value={selectedTab} 
          onValueChange={setSelectedTab}
          className="p-4"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="scan">Scan QR</TabsTrigger>
            <TabsTrigger value="manual">Manuel Indtastning</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scan" className="space-y-4">
            <ScannerView onScan={handleScan} />
          </TabsContent>
          
          <TabsContent value="manual">
            <ManualEntryView onScan={handleScan} machines={machines} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QRScanner;
