
import React from 'react';
import { Button } from "@/components/ui/button";
import { QrCode, X } from 'lucide-react';

interface ScannerHeaderProps {
  onClose: () => void;
}

const ScannerHeader: React.FC<ScannerHeaderProps> = ({ onClose }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h3 className="text-xl font-semibold flex items-center">
        <QrCode className="mr-2 h-5 w-5" />
        QR-Scanner
      </h3>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default ScannerHeader;
